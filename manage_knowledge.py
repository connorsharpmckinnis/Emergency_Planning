import os
import glob
import time
from google import genai
from google.genai import types
import dotenv

dotenv.load_dotenv()

def manage_knowledge_base():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY not set.")
        return

    client = genai.Client(api_key=api_key)
    
    base_dir = "knowledge_base"
    domains = ["fire", "police", "medical", "utilities", "transport"]
    
    # Store mapping of domain -> vector_store_name
    store_mapping = {}

    for domain in domains:
        domain_dir = os.path.join(base_dir, domain)
        if not os.path.exists(domain_dir):
            print(f"Skipping {domain}: Directory not found.")
            continue
            
        files = glob.glob(os.path.join(domain_dir, "*.txt")) + \
                glob.glob(os.path.join(domain_dir, "*.pdf")) + \
                glob.glob(os.path.join(domain_dir, "*.md"))
                
        if not files:
            print(f"No files found for {domain}.")
            continue
            
        print(f"\nProcessing {domain} ({len(files)} files)...")
        
        try:
            # 1. Create a new vector store (FileSearchStore)
            # Note: SDK might expose this as client.vector_stores or client.file_search_stores
            # Based on previous error 'Client' object has no attribute 'vector_stores', 
            # and the 'file_search_stores' attribute seen in dir(client), we use that.
            
            vector_store_name = f"Apex {domain.capitalize()} Store"
            
            # Check if we can list and find existing, or just create new.
            # For simplicity in this script, we create new.
            
            vector_store = client.file_search_stores.create(
                config=types.CreateFileSearchStoreConfig(
                    display_name=vector_store_name
                )
            )
            print(f"  Created File Search Store: {vector_store.name}")
            
            # 2. Upload files and add to vector store
            batch_files = []
            for file_path in files:
                print(f"  Uploading {os.path.basename(file_path)}...")
                
                # Upload file using the standard files API first
                uploaded_file = client.files.upload(file=file_path)
                
                # Wait for file to be active? Usually upload returns active file or processing.
                # For text files it's fast.
                batch_files.append(uploaded_file)
                
            # 3. Import files into the store
            for f in batch_files:
                print(f"  Importing {f.name} into store...")
                # The SDK likely has an import_file method on file_search_stores
                client.file_search_stores.import_file(
                    file_search_store_name=vector_store.name,
                    file_name=f.name
                )
            
            print(f"  Added {len(batch_files)} files to store.")
            store_mapping[domain] = vector_store.name
            
        except Exception as e:
            print(f"  Error processing {domain}: {e}")

    # Save mapping to a file so agents can read it
    with open("vector_store_mapping.json", "w") as f:
        import json
        json.dump(store_mapping, f, indent=2)
        print("\nSaved vector store mapping to vector_store_mapping.json")

if __name__ == "__main__":
    manage_knowledge_base()
