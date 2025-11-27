import os
import time
from generator import generate_scenario_data
import dotenv
from google.genai import errors

dotenv.load_dotenv()

def verify_multi_agent():
    print("Starting multi-agent verification...")
    
    if not os.environ.get("GEMINI_API_KEY"):
        print("Error: GEMINI_API_KEY not set.")
        return

    topic = "Wildfire approaching a residential area"
    print(f"Generating scenario for topic: '{topic}'")
    
            scenario = generate_scenario_data(topic)
            print("\nGeneration Successful!")
            print(f"Title: {scenario.metadata.hazard_type} in {scenario.metadata.location}")
            print(f"Cascading Effects Count: {len(scenario.cascading_effects)}")
            
            fire_effect_found = False
            for i, effect in enumerate(scenario.cascading_effects):
                print(f"  Effect {i+1} ({effect.author}): {effect.cause} -> {effect.effect}")
                if "Fire" in str(effect.author):
                    fire_effect_found = True
                    # Check if retrieval was likely used (heuristic)
                    if "Station" in effect.effect or "Protocol" in effect.effect or "Community Park" in effect.effect:
                        print("    [Retrieval Check] Fire agent likely used vector store data!")
                    else:
                        print("    [Retrieval Check] No obvious retrieval markers found (this is okay, retrieval is probabilistic).")
                
            if len(scenario.cascading_effects) > 0:
                print("\nSUCCESS: Multi-agent system generated cascading effects.")
            else:
                print("\nWARNING: No cascading effects generated. Check orchestrator logic.")
            return
            
        except errors.ClientError as e:
            if e.code == 429:
                print(f"Rate limit hit. Waiting 30 seconds before retry {attempt + 1}/{max_retries}...")
                time.sleep(30)
            else:
                print(f"\nERROR: Generation failed: {e}")
                raise e
        except Exception as e:
            print(f"\nERROR: Generation failed: {e}")
            import traceback
            traceback.print_exc()
            return

if __name__ == "__main__":
    verify_multi_agent()
