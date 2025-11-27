from google.genai import types
import inspect

print("Inspecting types.ImportFileConfig:")
try:
    print(inspect.signature(types.ImportFileConfig))
    print(types.ImportFileConfig.model_fields.keys())
except Exception as e:
    print(f"Error inspecting: {e}")
    # Fallback: print dir
    print(dir(types.ImportFileConfig))
