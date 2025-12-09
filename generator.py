import os
import json
from google import genai
from google.genai import types
from schemas import EmergencyScenario, CascadingEffect, ThoughtSummary, DraftResponsePlan
from agents import consult_specialist
from datetime import datetime
import dotenv

dotenv.load_dotenv()

# Load prompts configuration
def load_prompts():
    """Load prompts from prompts.json"""
    if os.path.exists("prompts.json"):
        with open("prompts.json", "r") as f:
            return json.load(f)
    return {}

PROMPTS = load_prompts()
TEMPERATURE = 1.7
MODEL_ID = "gemini-2.5-flash-lite"



def generate_scenario_data(topic: str) -> EmergencyScenario:
    """
    Generates an emergency scenario based on the provided topic using Gemini as an orchestrator.
    """
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

    # Define the tool for the orchestrator
    tools = [consult_specialist]

    # Get orchestrator prompt from config or use fallback
    orchestrator_prompt_template = PROMPTS.get("orchestrator_prompt", """
    You are the Orchestrator for an Emergency Scenario Generator for the Town of Apex, NC, USA. Apex is a suburban town outside in Wake County with a population of 80,000 people. It has a primarily suburban makeup with a small but active downtown center.
    Your goal is to create a comprehensive emergency scenario based on the topic: "{topic}".

    1. First, outline the core scenario (Metadata and Narrative).
    2. Then, identify which specialist domains (fire, police, medical, utilities, transport) would be most impacted.
    3. Use the `consult_specialist` tool to get detailed cascading effects from at least 2-3 relevant specialists.
    4. Finally, aggregate everything into a single EmergencyScenario object.
    
    Ensure the final output matches the EmergencyScenario schema.
    """)
    
    # Dynamically build the list of specialists for the prompt
    specialists_config = PROMPTS.get("specialists", {})
    specialist_list_str = ""
    for domain, config in specialists_config.items():
        display_name = config.get("display_name", domain.capitalize())
        description = config.get("description", "")
        specialist_list_str += f"- {display_name} ({domain}): {description}\n"
        
    # Format the orchestrator prompt with the specialist list if the placeholder exists
    if "{specialist_list}" in orchestrator_prompt_template:
        orchestrator_prompt = orchestrator_prompt_template.format(specialist_list=specialist_list_str)
    else:
        orchestrator_prompt = orchestrator_prompt_template
    
    # Debug: Print full orchestrator prompt to verify loading and injection
    print(f"[ORCHESTRATOR] Full Prompt:\n{orchestrator_prompt}")
    
    # Initial prompt to get the base scenario and decide on specialists
    prompt = f"""{orchestrator_prompt}
 
     Topic: {topic}
     """

    # We use models.generate_content with manual history management for full control
    # This allows us to:
    # 1. Handle multi-turn tool calling loops
    # 2. Extract thoughts from responses
    # 3. Enforce JSON schema only at the final turn (avoiding conflicts with tool calling)
    
    
    # Stage 1: Let the orchestrator call specialist tools to gather cascading effects
    # We do NOT set response_schema here so it can freely call tools
    
    response = client.models.generate_content(
        model=MODEL_ID,
        contents=prompt,
        config=types.GenerateContentConfig(
            tools=tools,
            thinking_config=types.ThinkingConfig(
                include_thoughts=True
            ),
            temperature=TEMPERATURE,
        )
    )

    # Handle tool calls loop
    # We'll collect the cascading effects manually
    cascading_effects = []
    thoughts = []  # Collect thought summaries
    
    # Validate initial response
    if not response.candidates or not response.candidates[0].content.parts:
        print(f"ERROR: Empty initial response from model")
        print(f"Response: {response}")
        raise ValueError(f"Model returned empty response. Finish reason: {response.candidates[0].finish_reason if response.candidates else 'No candidates'}")
    
    # Simple loop to handle up to 5 turns of tool calls
    current_response = response
    history = [types.Content(role="user", parts=[types.Part(text=prompt)])]
    
    # Add the first model response to history
    history.append(current_response.candidates[0].content)
    
    # Extract thoughts from the first response
    for part in current_response.candidates[0].content.parts:
        # Capture explicit thoughts (thinking models) or regular text (standard models reasoning)
        if part.thought:
            thoughts.append(ThoughtSummary(content=part.text))
        elif part.text and not part.function_call:
            # For standard models, text before tool calls is effectively "thinking"
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
                 model=MODEL_ID,
                 contents=history,
                 config=types.GenerateContentConfig(
                     tools=tools,
                     thinking_config=types.ThinkingConfig(
                         include_thoughts=True
                     ),
                     temperature=TEMPERATURE,
                 )
             )
             history.append(current_response.candidates[0].content)
             
             # Check for empty response
             if not current_response.candidates[0].content.parts:
                 print(f"WARNING: Empty response in tool loop, stopping")
                 break
             
             # Extract thoughts from this response
             for part in current_response.candidates[0].content.parts:
                 if part.thought:
                     thoughts.append(ThoughtSummary(content=part.text))
                 elif part.text and not part.function_call:
                     thoughts.append(ThoughtSummary(content=part.text))
        else:
            break

    # Stage 2: Final Aggregation
    # Now we ask the model to produce the final JSON, incorporating the tool results (which are in history)
    # IMPORTANT: Include the original orchestrator prompt so writing style carries through
    final_prompt = f"""
    {orchestrator_prompt}
    
    Based on the topic "{topic}" and the specialist consultations above, generate the final full EmergencyScenario JSON.
    Ensure you include all cascading effects provided by the specialists.
    Write the narrative and description fields following your role and style as the Emergency Management Orchestrator.
    """
    
    history.append(types.Content(role="user", parts=[types.Part(text=final_prompt)]))
    
    final_response = client.models.generate_content(
        model=MODEL_ID,
        contents=history,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=EmergencyScenario,
            thinking_config=types.ThinkingConfig(
                include_thoughts=True
            ),
            temperature=TEMPERATURE,
        )
    )
    
    # Extract final thoughts
    for part in final_response.candidates[0].content.parts:
        if part.thought:
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

    prompt = f"""
    You are an expert Emergency Response Planner for Apex, NC.
    
    Based on the following emergency scenario description, create a detailed Draft Response Plan.
    
    Scenario Context:
    {scenario_context}
    
    Generate a DraftResponsePlan object with specific objectives, tasks, and resource notes.
    """

    response = client.models.generate_content(
        model=MODEL_ID,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=DraftResponsePlan,
            thinking_config=types.ThinkingConfig(
                include_thoughts=True
            ),
            temperature=TEMPERATURE,
        )
    )
    
    return DraftResponsePlan.model_validate_json(response.text)

def generate_prompt_suggestion() -> str:
    """
    Generates a creative emergency scenario prompt suggestion.
    """
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

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
        model=MODEL_ID,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=TEMPERATURE,
        )
    )
    
    return response.text.strip()
