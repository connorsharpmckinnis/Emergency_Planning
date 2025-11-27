import requests
import json
import sys

def verify_planner():
    print("Starting Response Planner verification...")
    
    # Define a sample scenario context
    scenario_context = """
    Scenario: Category 4 Hurricane hitting Apex, NC.
    Impact: Widespread power outages, flooding in low-lying areas, downed trees blocking major roads.
    Casualties: Minor injuries reported, no fatalities yet.
    Status: Eye of the storm passing over, high winds expected to return shortly.
    """
    
    url = "http://localhost:8000/generate-plan"
    payload = {"scenario_context": scenario_context}
    
    try:
        print(f"Requesting response plan for context: {scenario_context.strip()[:50]}...")
        response = requests.post(url, json=payload)
        response.raise_for_status()
        
        plan = response.json()
        
        # Basic validation
        if not plan.get("objectives"):
            raise ValueError("Plan missing objectives")
        if not plan.get("tasks"):
            raise ValueError("Plan missing tasks")
            
        print("\nGeneration Successful!")
        print(f"Objectives Count: {len(plan['objectives'])}")
        print(f"Tasks Count: {len(plan['tasks'])}")
        
        print("\nSample Objectives:")
        for obj in plan['objectives'][:3]:
            print(f"- {obj}")
            
        print("\nSample Tasks:")
        for task in plan['tasks'][:3]:
            # Handle potential missing fields gracefully for verification
            priority = task.get('priority', 'N/A')
            owner = task.get('assigned_to', task.get('owner', 'N/A'))
            print(f"- [{priority}] {task['description']} (Owner: {owner})")
            
        print("\nSUCCESS: Response Planner endpoint is working.")
        
    except Exception as e:
        print(f"\nERROR: Verification failed: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response content: {e.response.text}")
        sys.exit(1)

if __name__ == "__main__":
    verify_planner()
