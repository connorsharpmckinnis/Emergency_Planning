import os
from google import genai
import dotenv

dotenv.load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("API Key not found")
else:
    client = genai.Client(api_key=api_key)
    print("Client attributes:")
    print(dir(client))
    
    if hasattr(client, 'vector_stores'):
        print("\nclient.vector_stores exists!")
    else:
        print("\nclient.vector_stores does NOT exist.")
        
    if hasattr(client, 'corpora'):
        print("client.corpora exists!")
