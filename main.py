from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from generator import generate_scenario_data, generate_response_plan

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

class ScenarioRequest(BaseModel):
    topic: str

class PlanRequest(BaseModel):
    scenario_context: str

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

@app.get("/")
async def read_index():
    return FileResponse('static/index.html')
