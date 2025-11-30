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

# Load prompts configuration
def load_prompts():
    """Load prompts from prompts.json"""
    if os.path.exists("prompts.json"):
        with open("prompts.json", "r") as f:
            return json.load(f)
    # Return empty dict if file doesn't exist (will use fallback prompts)
    return {}

PROMPTS = load_prompts()

class SpecialistAgent:
    def __init__(self, domain: str, description: str, display_name: str = None, base_prompt: str = None, system_instruction: str = None):
        self.domain = domain
        self.description = description
        self.display_name = display_name or domain.capitalize()
        self.base_prompt = base_prompt
        self.system_instruction = system_instruction
        self.client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
        self.vector_store_name = VECTOR_STORE_MAPPING.get(domain)

    def generate_cascading_effect(self, scenario_context: str) -> CascadingEffect:
        """
        Generates a cascading effect relevant to the agent's domain based on the scenario context.
        """
        # Use base_prompt from initialization or fallback to hardcoded
        if self.base_prompt:
            prompt_template = self.base_prompt
        else:
            prompt_template = """Based on the following emergency scenario context, identify a specific cascading effect 
that would likely occur within your domain. If it is reasonable, feel free to instigate a 'new' emergency that could be caused by the cascading effect, for instance a flood causing an electrical fire at a critical facility.

Scenario Context:
{scenario_context}

Generate a single detailed CascadingEffect object."""
        
        prompt = f"""
        You are an expert in {self.display_name}. {self.description}
        
        {prompt_template.format(scenario_context=scenario_context)}
        """

        # Use system_instruction from initialization or fallback
        system_prompt = self.system_instruction or "You are an expert in emergency management for the town of Apex, NC, USA. You write in a friendly, professional way. Apex NC is a suburban town with a population of 80,000 people, with a small but dynamic downtown area."
        
        if self.vector_store_name:
            print(f"[{self.domain}] Using vector store: {self.vector_store_name}")
            # Update prompt to encourage using retrieved info
            retrieval_prompt = PROMPTS.get("specialist_retrieval_prompt", "\n\nUse the available retrieval tool to find specific information about Apex's infrastructure, protocols, or resources relevant to this effect.")
            prompt += retrieval_prompt

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

# Define available specialists using loaded prompts
def create_specialists():
    """Create specialist agents from prompts configuration"""
    specialist_configs = PROMPTS.get("specialists", {
        "fire": {"description": "Focus on fire suppression, search and rescue, and hazardous materials."},
        "police": {"description": "Focus on public order, traffic control, and crime prevention."},
        "medical": {"description": "Focus on triaging, hospital capacity, and public health."},
        "utilities": {"description": "Focus on power, water, gas, and telecommunications infrastructure."},
        "transport": {"description": "Focus on road networks, public transit, and logistics."},
    })
    
    base_prompt = PROMPTS.get("specialist_base_prompt")
    system_instruction = PROMPTS.get("system_instruction")
    
    return {
        domain: SpecialistAgent(
            domain=domain,
            description=config.get("description", ""),
            display_name=config.get("display_name"),
            base_prompt=config.get("custom_prompt") or base_prompt,
            system_instruction=system_instruction
        )
        for domain, config in specialist_configs.items()
    }

specialists = create_specialists()

def reload_specialists():
    """Reload specialists after prompts have been updated"""
    global specialists
    specialists = create_specialists()

def consult_specialist(domain: str, scenario_context: str) -> CascadingEffect:
    """
    Consults a specialist agent to get a cascading effect.
    """
    agent = specialists.get(domain)
    if not agent:
        raise ValueError(f"Unknown specialist domain: {domain}")
    
    effect = agent.generate_cascading_effect(scenario_context)
    effect.author = f"{agent.display_name} Agent"
    return effect
