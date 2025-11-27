import os
from google import genai
import inspect
import dotenv

dotenv.load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

print("Inspecting client.file_search_stores.import_file:")
try:
    print(inspect.signature(client.file_search_stores.import_file))
except Exception as e:
    print(f"Error inspecting: {e}")
