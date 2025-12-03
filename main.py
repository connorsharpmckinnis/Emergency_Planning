from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import uvicorn
import os
import shutil
from pathlib import Path
from generator import generate_scenario_data, generate_response_plan, generate_prompt_suggestion, EmergencyScenario
from schemas import DraftResponsePlan
import agents
import generator
import manage_knowledge
from datetime import datetime
from pathlib import Path
import json


app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

# Create saved_scenarios directory if it doesn't exist
SAVED_SCENARIOS_DIR = Path("saved_scenarios")
SAVED_SCENARIOS_DIR.mkdir(exist_ok=True)

class ScenarioRequest(BaseModel):
    topic: str

class PlanRequest(BaseModel):
    scenario_context: str

class SaveScenarioRequest(BaseModel):
    scenario: dict

@app.get("/")
async def read_root():
    return FileResponse('static/index.html')

@app.post("/generate")
async def generate_scenario(request: ScenarioRequest):
    try:
        scenario = generate_scenario_data(request.topic)
        return scenario
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-plan")
async def generate_plan(request: PlanRequest):
    try:
        plan = generate_response_plan(request.scenario_context)
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-prompt-suggestion")
async def generate_prompt_suggestion_endpoint():
    try:
        prompt = generate_prompt_suggestion()
        return {"prompt": prompt}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/prompts")
async def get_prompts():
    """Return current prompt configuration"""
    try:
        prompts_file = Path("prompts.json")
        if not prompts_file.exists():
            raise HTTPException(status_code=404, detail="Prompts configuration file not found")
        
        with open(prompts_file, "r") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Invalid JSON in prompts.json: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/prompts")
async def update_prompts(prompts: dict):
    """Update prompt configuration"""
    try:
        # Save to file
        with open("prompts.json", "w") as f:
            json.dump(prompts, f, indent=2)
        
        # Reload prompts in agents module
        import agents
        agents.PROMPTS = agents.load_prompts()
        agents.reload_specialists()
        
        # Reload prompts in generator module
        import generator
        generator.PROMPTS = generator.load_prompts()
        
        return {"status": "success", "message": "Prompts updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/save-scenario")
async def save_scenario(request: SaveScenarioRequest):
    try:
        # Generate filename with timestamp
        hazard_type = request.scenario.get('metadata', {}).get('hazard_type', 'scenario')
        # Clean hazard type for filename
        clean_hazard = hazard_type.replace(' ', '_').replace('/', '_').lower()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"scenario_{clean_hazard}_{timestamp}.json"
        
        # Save to file
        filepath = SAVED_SCENARIOS_DIR / filename
        with open(filepath, 'w') as f:
            json.dump(request.scenario, f, indent=2)
        
        return JSONResponse({
            "success": True,
            "filename": filename,
            "path": str(filepath)
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Vector Store Management Endpoints ---

@app.get("/api/vector-stores/{domain}/files")
async def list_vector_store_files(domain: str):
    try:
        files = manage_knowledge.list_files_in_store(domain)
        return files
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vector-stores/{domain}/files")
async def upload_vector_store_file(domain: str, file: UploadFile = File(...)):
    try:
        # Save uploaded file temporarily
        temp_dir = Path("temp_uploads")
        temp_dir.mkdir(exist_ok=True)
        temp_path = temp_dir / file.filename
        
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Upload to vector store
        result = manage_knowledge.upload_file_to_store(
            domain=domain,
            file_path=str(temp_path),
            display_name=file.filename
        )
        
        # Clean up temp file
        os.remove(temp_path)
        
        return result
    except Exception as e:
        # Clean up temp file if it exists
        if 'temp_path' in locals() and temp_path.exists():
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/vector-stores/{domain}/files/{file_id:path}")
async def delete_vector_store_file(domain: str, file_id: str):
    try:
        # file_id might contain slashes (files/...), so we use :path in route
        success = manage_knowledge.delete_file_from_store(domain, file_id)
        if success:
            return {"status": "success", "message": "File deleted"}
        else:
            raise HTTPException(status_code=404, detail="File not found or delete failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/")
async def read_index():
    return FileResponse('static/index.html')

