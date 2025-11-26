import os
from google import genai
import dotenv

dotenv.load_dotenv()

def list_models():
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    models = client.models.list()
    for model in models:
        print(model.name)

if __name__ == "__main__":
    list_models()
