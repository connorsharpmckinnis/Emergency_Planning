from google.genai import types
import inspect
import dotenv
import os

def debug_config():
    print("Inspecting types.ImportFileConfig:")
    try:
        print(inspect.signature(types.ImportFileConfig))
        print(types.ImportFileConfig.model_fields.keys())
    except Exception as e:
        print(f"Error inspecting: {e}")
        # Fallback: print dir
        print(dir(types.ImportFileConfig))

def debug_filesearch():
    print("Inspecting types.FileSearch:")
    try:
        print(inspect.signature(types.FileSearch))
        print(types.FileSearch.model_fields.keys())
    except Exception as e:
        print(f"Error inspecting: {e}")
        print(dir(types.FileSearch))

def debug_method():
    dotenv.load_dotenv()
    api_key = os.environ.get("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)

    print("Inspecting client.file_search_stores.import_file:")
    try:
        print(inspect.signature(client.file_search_stores.import_file))
    except Exception as e:
        print(f"Error inspecting: {e}")


def debug_prompt():
    from generator import generate_prompt_suggestion
    import dotenv

    dotenv.load_dotenv()

    try:
        print("Testing generate_prompt_suggestion()...")
        prompt = generate_prompt_suggestion()
        print(f"Success! Generated prompt: {prompt}")
    except Exception as e:
        print(f"Error: {e}")


def debug_retrieval():
    print("Inspecting types.Retrieval:")
    try:
        print(inspect.signature(types.Retrieval))
        print(types.Retrieval.model_fields.keys())
    except Exception as e:
        print(f"Error inspecting: {e}")
        print(dir(types.Retrieval))

def debug_sdk():
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


def debug_tool():
    print("Inspecting types.Tool:")
    try:
        print(inspect.signature(types.Tool))
        print(types.Tool.model_fields.keys())
    except Exception as e:
        print(f"Error inspecting: {e}")
        print(dir(types.Tool))
