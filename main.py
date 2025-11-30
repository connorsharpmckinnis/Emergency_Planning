from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from generator import generate_scenario_data, generate_response_plan, generate_prompt_suggestion
from schemas import EmergencyScenario
import json
import os
from datetime import datetime
from pathlib import Path

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

@app.post("/export-pdf")
async def export_pdf(request: SaveScenarioRequest):
    try:
        import traceback
        from playwright.async_api import async_playwright
        
        print("Starting PDF export...")
        
        # Generate filename
        hazard_type = request.scenario.get('metadata', {}).get('hazard_type', 'scenario')
        clean_hazard = hazard_type.replace(' ', '_').replace('/', '_').lower()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"scenario_{clean_hazard}_{timestamp}.pdf"
        filepath = SAVED_SCENARIOS_DIR / filename
        
        print(f"PDF will be saved to: {filepath}")
        
        async with async_playwright() as p:
            print("Launching browser...")
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            print("Navigating to app...")
            await page.goto("http://localhost:8000")
            
            print("Waiting for page load...")
            await page.wait_for_load_state("networkidle")
            
            print("Injecting scenario data...")
            scenario_json = json.dumps(request.scenario)
            
            # Populate all the DOM elements with scenario data
            await page.evaluate(f"""
                const data = {scenario_json};
                
                // Title and Badges
                document.getElementById('scenarioTitle').textContent = data.metadata.hazard_type + ' in ' + data.metadata.location;
                
                const badgesContainer = document.getElementById('scenarioBadges');
                badgesContainer.innerHTML = '';
                if (data.metadata.severity) {{
                    const severityBadge = document.createElement('span');
                    severityBadge.className = 'badge severity-' + data.metadata.severity.toLowerCase();
                    severityBadge.textContent = data.metadata.severity;
                    badgesContainer.appendChild(severityBadge);
                }}
                if (data.metadata.season) {{
                    const seasonBadge = document.createElement('span');
                    seasonBadge.className = 'badge info';
                    seasonBadge.textContent = data.metadata.season;
                    badgesContainer.appendChild(seasonBadge);
                }}
                
                // Narrative Summary
                document.getElementById('narrativeSummary').textContent = data.narrative.summary;
                
                // Timeline Events
                const timelineContainer = document.getElementById('narrativeTimeline');
                timelineContainer.innerHTML = '';
                data.narrative.events.forEach(event => {{
                    const item = document.createElement('div');
                    item.className = 'timeline-item';
                    item.innerHTML = '<div class="timeline-timestamp">' + event.timestamp + '</div><div class="timeline-description">' + event.description + '</div>';
                    timelineContainer.appendChild(item);
                }});
                
                // Metadata Cards
                document.getElementById('metaLocation').textContent = data.metadata.location;
                document.getElementById('metaSeason').textContent = data.metadata.season || 'N/A';
                document.getElementById('metaSeverity').textContent = data.metadata.severity || 'N/A';
                document.getElementById('metaHazard').textContent = data.metadata.hazard_type;
                
                // Cascading Effects
                const effectsList = document.getElementById('effectsList');
                effectsList.innerHTML = '';
                data.cascading_effects.forEach((effect, index) => {{
                    const card = document.createElement('div');
                    card.className = 'effect-card';
                    
                    const probability = effect.probability !== null && effect.probability !== undefined 
                        ? '<div class="effect-field"><div class="effect-field-label">Probability</div><div class="effect-probability"><div class="probability-bar"><div class="probability-fill" style="width: ' + (effect.probability * 100) + '%"></div></div><span>' + (effect.probability * 100).toFixed(0) + '%</span></div></div>' 
                        : '';
                    
                    const systemTags = effect.impacted_systems.map(sys => '<span class="system-tag">' + sys + '</span>').join('');
                    
                    card.innerHTML = '<div class="effect-header"><div class="effect-number">' + (index + 1) + '</div>' + (effect.author ? '<div class="effect-author">' + effect.author + '</div>' : '') + '</div><div class="effect-field"><div class="effect-field-label">Cause</div><div class="effect-field-value">' + effect.cause + '</div></div><div class="effect-field"><div class="effect-field-label">Effect</div><div class="effect-field-value">' + effect.effect + '</div></div><div class="effect-field"><div class="effect-field-label">Impacted Systems</div><div class="effect-systems">' + systemTags + '</div></div>' + probability;
                    effectsList.appendChild(card);
                }});
                
                // Show results, hide input
                document.getElementById('results').classList.remove('hidden');
                document.querySelector('.input-group').style.display = 'none';
                
                // Hide debug and thinking sections
                const thinkingFooter = document.getElementById('thinkingFooter');
                if (thinkingFooter) thinkingFooter.style.display = 'none';
                const debugFooter = document.getElementById('debugFooter');
                if (debugFooter) debugFooter.style.display = 'none';
                
                // Hide action buttons
                const actionButtons = document.querySelector('.action-buttons');
                if (actionButtons) actionButtons.style.display = 'none';
            """)
            
            print("Waiting for rendering...")
            await page.wait_for_timeout(2000)
            
            print("Generating PDF...")
            await page.pdf(
                path=str(filepath), 
                format="A4",
                print_background=True,
                margin={
                    'top': '0.5in',
                    'right': '0.5in',
                    'bottom': '0.5in',
                    'left': '0.5in'
                },
                prefer_css_page_size=False
            )
            
            print("Closing browser...")
            await browser.close()
        
        print(f"PDF generated successfully: {filename}")
        return FileResponse(
            filepath,
            media_type="application/pdf",
            filename=filename
        )
    except Exception as e:
        import traceback
        error_detail = f"PDF generation failed: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=error_detail)

@app.get("/")
async def read_index():
    return FileResponse('static/index.html')

