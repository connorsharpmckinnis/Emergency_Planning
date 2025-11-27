import os
from google import genai
from google.genai import types
from schemas import CascadingEffect
import dotenv

dotenv.load_dotenv()

class SpecialistAgent:
    def __init__(self, domain: str, description: str):
        self.domain = domain
        self.description = description
        self.client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

    def generate_cascading_effect(self, scenario_context: str) -> CascadingEffect:
        """
        Generates a cascading effect relevant to the agent's domain based on the scenario context.
        """
        prompt = f"""
        You are an expert in {self.domain}. {self.description}
        
        Based on the following emergency scenario context, identify a specific cascading effect 
        that would likely occur within your domain.
        
        Scenario Context:
        {scenario_context}
        
        Generate a single detailed CascadingEffect object.
        """

        system_prompt = "You are an expert in emergency management for the town of Apex, NC, USA. You write in a friendly, professional way. Apex NC is a suburban town with a population of 80,000 people, with a small but dynamic downtown area."
        
        response = self.client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                response_schema=CascadingEffect,
            ),
        )

        return CascadingEffect.model_validate_json(response.text)

# Define available specialists
specialists = {
    "fire": SpecialistAgent("Fire & Rescue", "Focus on fire suppression, search and rescue, and hazardous materials."),
    "police": SpecialistAgent("Law Enforcement", "Focus on public order, traffic control, and crime prevention."),
    "medical": SpecialistAgent("Medical Services", "Focus on triaging, hospital capacity, and public health."),
    "utilities": SpecialistAgent("Utilities", "Focus on power, water, gas, and telecommunications infrastructure."),
    "transport": SpecialistAgent("Transportation", "Focus on road networks, public transit, and logistics."),
}

def consult_specialist(domain: str, scenario_context: str) -> CascadingEffect:
    """
    Consults a specialist agent to get a cascading effect.
    """
    agent = specialists.get(domain)
    if not agent:
        raise ValueError(f"Unknown specialist domain: {domain}")
    
    effect = agent.generate_cascading_effect(scenario_context)
    effect.author = f"{agent.domain} Agent"
    return effect
