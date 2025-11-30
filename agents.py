import os
import json
from google import genai
from google.genai import types
from schemas import CascadingEffect
import dotenv

dotenv.load_dotenv()

# Load vector store mapping if it exists
VECTOR_STORE_MAPPING = {}
if os.path.exists("vector_store_mapping.json"):
    with open("vector_store_mapping.json", "r") as f:
        VECTOR_STORE_MAPPING = json.load(f)

class SpecialistAgent:
    def __init__(self, domain: str, description: str):
        self.domain = domain
        self.description = description
        self.client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
        self.vector_store_name = VECTOR_STORE_MAPPING.get(domain)

    def generate_cascading_effect(self, scenario_context: str) -> CascadingEffect:
        """
        Generates a cascading effect relevant to the agent's domain based on the scenario context.
        """
        prompt = f"""
        You are an expert in {self.domain}. {self.description}
        
        Based on the following emergency scenario context, identify a specific cascading effect 
        that would likely occur within your domain. If it is reasonable, feel free to instigate a 'new' emergency that could be caused by the cascading effect, for instance a flood causing an electrical fire at a critical facility.
        
        Scenario Context:
        {scenario_context}
        
        Generate a single detailed CascadingEffect object.
        """

        system_prompt = "You are an expert in emergency management for the town of Apex, NC, USA. You write in a friendly, professional way. Apex NC is a suburban town with a population of 80,000 people, with a small but dynamic downtown area."
        
        if self.vector_store_name:
            print(f"[{self.domain}] Using vector store: {self.vector_store_name}")
            # Add retrieval tool configuration
            # Correct configuration for File Search uses the file_search field
            tools = [
                types.Tool(
                    file_search=types.FileSearch(
                        file_search_store_names=[self.vector_store_name]
                    )
                )
            ]
            # Update prompt to encourage using retrieved info
            prompt += "\n\nUse the available retrieval tool to find specific information about Apex's infrastructure, protocols, or resources relevant to this effect."

        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            response_schema=CascadingEffect,
        )

        if self.vector_store_name:
             config.tools = [types.Tool(file_search=types.FileSearch(file_search_store_names=[self.vector_store_name]))]

        response = self.client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt,
            config=config,
        )

        if not response.text:
            print(f"[{self.domain}] Warning: Empty response from model. Candidates: {response.candidates}")
            # Fallback or raise error
            raise ValueError("Empty response from model")

        response_text = response.text.strip()
        
        # Robust JSON extraction
        import re
        match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if match:
            response_text = match.group(0)
        
        return CascadingEffect.model_validate_json(response_text)

# Define available specialists
specialists = {
    "fire": SpecialistAgent("fire", "Focus on fire suppression, search and rescue, and hazardous materials."),
    "police": SpecialistAgent("police", "Focus on public order, traffic control, and crime prevention."),
    "medical": SpecialistAgent("medical", "Focus on triaging, hospital capacity, and public health."),
    "utilities": SpecialistAgent("utilities", "Focus on power, water, gas, and telecommunications infrastructure."),
    "transport": SpecialistAgent("transport", "Focus on road networks, public transit, and logistics."),
}

def consult_specialist(domain: str, scenario_context: str) -> CascadingEffect:
    """
    Consults a specialist agent to get a cascading effect.
    """
    agent = specialists.get(domain)
    if not agent:
        raise ValueError(f"Unknown specialist domain: {domain}")
    
    effect = agent.generate_cascading_effect(scenario_context)
    effect.author = f"{agent.domain.capitalize()} Agent"
    return effect
