from google.genai import types
import inspect

print("Inspecting types.FileSearch:")
try:
    print(inspect.signature(types.FileSearch))
    print(types.FileSearch.model_fields.keys())
except Exception as e:
    print(f"Error inspecting: {e}")
    print(dir(types.FileSearch))
