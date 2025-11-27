from google.genai import types
import inspect

print("Inspecting types.Tool:")
try:
    print(inspect.signature(types.Tool))
    print(types.Tool.model_fields.keys())
except Exception as e:
    print(f"Error inspecting: {e}")
    print(dir(types.Tool))
