from google.genai import types
import inspect

print("Inspecting types.Retrieval:")
try:
    print(inspect.signature(types.Retrieval))
    print(types.Retrieval.model_fields.keys())
except Exception as e:
    print(f"Error inspecting: {e}")
    print(dir(types.Retrieval))
