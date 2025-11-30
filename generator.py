import os
from google import genai
from google.genai import types
from schemas import EmergencyScenario, CascadingEffect, ThoughtSummary, DraftResponsePlan
from agents import consult_specialist
import dotenv

dotenv.load_dotenv()

def generate_scenario_data(topic: str) -> EmergencyScenario:
    """
    Generates an emergency scenario based on the provided topic using Gemini as an orchestrator.
    """
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

    # Define the tool for the orchestrator
    tools = [consult_specialist]

    # Initial prompt to get the base scenario and decide on specialists
    prompt = f"""
    You are the Orchestrator for an Emergency Scenario Generator for the Town of Apex, NC, USA. Apex is a suburban town outside in Wake County with a population of 80,000 people. It has a primarily suburban makeup with a small but active downtown center.
    Your goal is to create a comprehensive emergency scenario based on the topic: "{topic}".

    1. First, outline the core scenario (Metadata and Narrative).
    2. Then, identify which specialist domains (fire, police, medical, utilities, transport) would be most impacted.
    3. Use the `consult_specialist` tool to get detailed cascading effects from at least 2-3 relevant specialists.
    4. Finally, aggregate everything into a single EmergencyScenario object.
    
    Ensure the final output matches the EmergencyScenario schema.
    """

    # We need a multi-turn conversation to handle tool calls
    chat = client.chats.create(
        model="gemini-2.5-flash",
        config=types.GenerateContentConfig(
            tools=tools,
            response_mime_type="application/json",
            response_schema=EmergencyScenario
        )
    )

    # Send the initial prompt
    # Note: With the current SDK and "response_schema" set, the model might try to output JSON immediately 
    # instead of calling tools if we are not careful. 
    # However, "automatic_function_calling" is not strictly default in the simplest `generate_content` 
    # but `chats.create` handles history.
    # A better approach for strict JSON + Tools is to let the model call tools first, 
    # then force JSON in the final turn. 
    # But `response_schema` is often global for the request.
    
    # Let's try a slightly different approach: 
    # We will NOT enforce the schema on the FIRST turn to allow tool calling text/thought process,
    # OR we rely on the model to use the tool BEFORE producing the final JSON.
    
    # Actually, the user asked for a loop. Let's implement a manual loop for better control 
    # and to ensure we get the JSON at the end.
    
    # Re-initializing client for manual control without chat helper for now to be explicit
    
    model_id = "gemini-2.5-flash"
    
    # Step 1: Orchestrator Plan & Tool Calls
    # We ask for a list of specialists to call first, or we let it call them.
    # To simplify, let's use the `generate_content` with tools and see if it returns a function call.
    
    # We can't easily mix "force JSON schema" and "function calling" in a single turn if the schema doesn't include the function call.
    # So we will do this in two stages.
    
    # Stage 1: Get the core scenario and decide on specialists (Natural Language or structured tool calls)
    # Let's ask it to call tools.
    
    response = client.models.generate_content(
        model=model_id,
        contents=prompt,
        config=types.GenerateContentConfig(
            tools=tools,
            thinking_config=types.ThinkingConfig(
                include_thoughts=True
            )
            # We do NOT set response_schema here so it can call tools
        )
    )

    # Handle tool calls loop
    # We'll collect the cascading effects manually
    cascading_effects = []
    thoughts = []  # Collect thought summaries
    
    # Simple loop to handle up to 5 turns of tool calls
    current_response = response
    history = [types.Content(role="user", parts=[types.Part(text=prompt)])]
    
    # Add the first model response to history
    history.append(current_response.candidates[0].content)
    
    # Extract thoughts from the first response
    for part in current_response.candidates[0].content.parts:
        if part.thought and part.text:
            thoughts.append(ThoughtSummary(content=part.text))

    while True:
        # Check if there are function calls
        function_calls = []
        for part in current_response.candidates[0].content.parts:
            if part.function_call:
                function_calls.append(part.function_call)
        
        if not function_calls:
            # No more tools, we are done with the gathering phase.
            break
            
        # Execute tools
        tool_outputs = []
        for call in function_calls:
            if call.name == "consult_specialist":
                domain = call.args["domain"]
                context = call.args["scenario_context"]
                try:
                    effect = consult_specialist(domain, context)
                    # We store the effect object to add to the final list, 
                    # but we also need to return the result to the model so it knows.
                    cascading_effects.append(effect)
                    tool_outputs.append(
                        types.Part.from_function_response(
                            name=call.name,
                            response={"result": effect.model_dump()}
                        )
                    )
                except Exception as e:
                     tool_outputs.append(
                        types.Part.from_function_response(
                            name=call.name,
                            response={"error": str(e)}
                        )
                    )

        # Send tool outputs back to model
        if tool_outputs:
             # Create the user message with tool outputs
             tool_response_content = types.Content(role="user", parts=tool_outputs)
             history.append(tool_response_content)
             
             # Generate next response
             current_response = client.models.generate_content(
                 model=model_id,
                 contents=history,
                 config=types.GenerateContentConfig(
                     tools=tools,
                     thinking_config=types.ThinkingConfig(
                         include_thoughts=True
                     )
                 )
             )
             history.append(current_response.candidates[0].content)
             
             # Extract thoughts from this response
             for part in current_response.candidates[0].content.parts:
                 if part.thought and part.text:
                     thoughts.append(ThoughtSummary(content=part.text))
        else:
            break

    # Stage 2: Final Aggregation
    # Now we ask the model to produce the final JSON, incorporating the tool results (which are in history)
    final_prompt = """
    Based on the initial topic and the specialist consultations above, generate the final full EmergencyScenario JSON.
    Ensure you include the cascading effects provided by the specialists.
    """
    
    history.append(types.Content(role="user", parts=[types.Part(text=final_prompt)]))
    
    final_response = client.models.generate_content(
        model=model_id,
        contents=history,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=EmergencyScenario,
            thinking_config=types.ThinkingConfig(
                include_thoughts=True
            )
        )
    )
    
    # Extract final thoughts
    for part in final_response.candidates[0].content.parts:
        if part.thought and part.text:
            thoughts.append(ThoughtSummary(content=part.text))

    scenario = EmergencyScenario.model_validate_json(final_response.text)
    # Inject the collected thoughts
    scenario.thoughts = thoughts
    return scenario

def generate_response_plan(scenario_context: str) -> DraftResponsePlan:
    """
    Generates a draft response plan based on the provided scenario context.
    """
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    model_id = "gemini-2.5-flash"

    prompt = f"""
    You are an expert Emergency Response Planner for Apex, NC.
    
    Based on the following emergency scenario description, create a detailed Draft Response Plan.
    
    Scenario Context:
    {scenario_context}
    
    Generate a DraftResponsePlan object with specific objectives, tasks, and resource notes.
    """

    response = client.models.generate_content(
        model=model_id,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=DraftResponsePlan,
            thinking_config=types.ThinkingConfig(
                include_thoughts=True
            )
        )
    )
    
    return DraftResponsePlan.model_validate_json(response.text)

def generate_prompt_suggestion() -> str:
    """
    Generates a creative emergency scenario prompt suggestion.
    """
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    model_id = "gemini-2.5-flash"

    prompt = """
    Generate a creative, detailed, and realistic emergency scenario prompt for the town of Apex, NC.
    The prompt should be 1-2 sentences long and describe a specific hazard or event.
    Examples:
    - "A Category 3 hurricane stalling over the region causing massive flooding in downtown Apex."
    - "A freight train derailment near the center of town releasing a cloud of hazardous chemicals."
    - "A cyberattack on the municipal water treatment plant causing a shutdown of water services."
    
    Output ONLY the prompt text, nothing else.
    """

    response = client.models.generate_content(
        model=model_id,
        contents=prompt
    )
    
    return response.text.strip()
