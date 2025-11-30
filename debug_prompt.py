from generator import generate_prompt_suggestion
import dotenv

dotenv.load_dotenv()

try:
    print("Testing generate_prompt_suggestion()...")
    prompt = generate_prompt_suggestion()
    print(f"Success! Generated prompt: {prompt}")
except Exception as e:
    print(f"Error: {e}")
