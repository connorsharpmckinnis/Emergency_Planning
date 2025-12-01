from generator import generate_scenario_data
import agents

# Force reload to ensure we have the latest state as if the server was running
agents.PROMPTS = agents.load_prompts()
agents.reload_specialists()

print("--- Generating Scenario ---")
# Use a topic that strongly implies IT involvement
scenario = generate_scenario_data("Massive cyberattack on city infrastructure")
print("--- Generation Complete ---")
