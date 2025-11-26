from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from generator import generate_scenario_data
from schemas import EmergencyScenario
import os

app = FastAPI()

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

class GenerateRequest(BaseModel):
    topic: str

@app.post("/generate", response_model=EmergencyScenario)
async def generate_scenario(request: GenerateRequest):
    try:
        scenario = generate_scenario_data(request.topic)
        return scenario
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def read_index():
    return FileResponse('static/index.html')
