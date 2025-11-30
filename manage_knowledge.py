import os
import glob
import time
import json
from google import genai
from google.genai import types
import dotenv

dotenv.load_dotenv()

# Initialize client
api_key = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

MAPPING_FILE = "vector_store_mapping.json"

def load_mapping():
    if os.path.exists(MAPPING_FILE):
        with open(MAPPING_FILE, "r") as f:
            return json.load(f)
    return {}

def save_mapping(mapping):
    with open(MAPPING_FILE, "w") as f:
        json.dump(mapping, f, indent=2)

def get_or_create_vector_store(domain: str) -> str:
    """
    Ensures a vector store exists for the given domain.
    Returns the vector store name (ID).
    """
    mapping = load_mapping()
    if domain in mapping:
        return mapping[domain]
    
    # Create new store
    store_name = f"Apex {domain.capitalize()} Store"
    print(f"Creating new vector store for {domain}: {store_name}")
    
    try:
        vector_store = client.file_search_stores.create(
            config=types.CreateFileSearchStoreConfig(
                display_name=store_name
            )
        )
        
        # Save to mapping
        mapping[domain] = vector_store.name
        save_mapping(mapping)
        return vector_store.name
    except Exception as e:
        print(f"Error creating vector store: {e}")
        raise e

def list_files_in_store(domain: str):
    """
    Lists files in the vector store for the given domain.
    """
    mapping = load_mapping()
    if domain not in mapping:
        return []
    
    store_name = mapping[domain]
    files = []
    
    try:
        # List files in the store using the documents accessor
        # The argument is 'parent', not 'file_search_store_name'
        pager = client.file_search_stores.documents.list(parent=store_name)
        
        for f in pager:
            # Get details for each file to show display name
            # The list endpoint might return minimal info, let's see what we get
            files.append({
                "name": f.name, # This is the resource ID (files/...)
                "display_name": f.display_name if hasattr(f, 'display_name') else "Unknown",
                "uri": f.uri if hasattr(f, 'uri') else "",
                "create_time": str(f.create_time) if hasattr(f, 'create_time') else ""
            })
            
        return files
    except Exception as e:
        print(f"Error listing files: {e}")
        return []

def upload_file_to_store(domain: str, file_path: str, display_name: str = None):
    """
    Uploads a file and adds it to the domain's vector store.
    """
    store_name = get_or_create_vector_store(domain)
    
    try:
        print(f"Uploading {display_name} to {store_name}...")
        
        # 1. Upload file
        uploaded_file = client.files.upload(
            file=file_path,
            config=types.UploadFileConfig(display_name=display_name)
        )
        
        # Wait for processing if needed (usually fast for text/pdf)
        while uploaded_file.state.name == "PROCESSING":
            time.sleep(1)
            uploaded_file = client.files.get(name=uploaded_file.name)
            
        if uploaded_file.state.name == "FAILED":
            raise Exception("File upload failed processing")

        # 2. Import into store
        client.file_search_stores.import_file(
            file_search_store_name=store_name,
            file_name=uploaded_file.name
        )
        
        return {
            "name": uploaded_file.name,
            "display_name": uploaded_file.display_name,
            "uri": uploaded_file.uri
        }
        
    except Exception as e:
        print(f"Error uploading file: {e}")
        raise e

def delete_file_from_store(domain: str, file_name: str):
    """
    Removes a file from the vector store and deletes the file resource.
    file_name is the resource ID (files/...)
    """
    mapping = load_mapping()
    if domain not in mapping:
        return
        
    store_name = mapping[domain]
    
    try:
        # Delete from store using documents accessor
        # The name format for deletion is likely the full resource name of the document in the store
        # which is usually {store_name}/files/{file_id}
        # But wait, the 'name' attribute of the listed document IS likely that full path.
        # Let's assume file_name passed here is the file resource name (files/...)
        # We need to construct the document resource name.
        
        # Actually, looking at the list output, f.name might be the document name.
        # But let's check what we passed to delete_file_from_store.
        # In app.js we passed `file.name`.
        # If `list_files_in_store` returns `f.name` as the file resource (files/...), 
        # then we need to know the document resource name to delete it from the store.
        
        # Extract file ID (works whether input is files/ID or full document path)
        file_id = file_name.split('/')[-1]
        
        # Delete from store using documents accessor
        client.file_search_stores.documents.delete(
            name=f"{store_name}/files/{file_id}"
        )
        
        # Delete the file resource itself
        client.files.delete(name=f"files/{file_id}")
        
        return True
    except Exception as e:
        print(f"Error deleting file: {e}")
        raise e
