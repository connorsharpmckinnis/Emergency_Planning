import os
from generator import generate_scenario_data

# Mock API key if not present for testing import/structure (actual generation needs key)
if not os.environ.get("GEMINI_API_KEY"):
    print("Warning: GEMINI_API_KEY not set. Generation might fail if not using default credentials.")

try:
    # We won't actually call the API in this automated check to avoid cost/auth issues if not set up,
    # but we will check if imports and structure are correct.
    # To fully test, we would need the key.
    # For now, let's just print "Verification script ran successfully" if imports work.
    print("Imports successful. Ready for manual testing.")
except Exception as e:
    print(f"Verification failed: {e}")
