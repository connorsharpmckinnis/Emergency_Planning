import agents
import json

print("Loading agents module...")
print(f"Agents found in specialists dict: {list(agents.specialists.keys())}")

# Check if 'it' is present
if 'it' in agents.specialists:
    print("SUCCESS: 'it' agent is present.")
else:
    print("FAILURE: 'it' agent is MISSING.")

# Check prompts content
print(f"Prompts keys: {list(agents.PROMPTS.keys())}")
if 'specialists' in agents.PROMPTS:
    print(f"Specialists in PROMPTS: {list(agents.PROMPTS['specialists'].keys())}")
else:
    print("specialists key missing from PROMPTS")
