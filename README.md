# Emergency Scenario Generator

An AI-powered multi-agent system for generating realistic emergency scenarios and response plans for the Town of Apex, NC. Built with Google's Gemini AI, this tool uses specialized agents to analyze cascading effects across multiple domains (fire, police, medical, utilities, and transport).

## 🌟 Features

### 1. **Multi-Agent Scenario Generation**

- **Orchestrator AI**: Coordinates specialist agents to create comprehensive emergency scenarios
- **Specialist Agents**: Domain-specific AI agents for:
  - 🔥 **Fire**: Fire suppression, search and rescue, hazardous materials
  - 👮 **Police**: Public order, traffic control, crime prevention
  - 🏥 **Medical**: Triaging, hospital capacity, public health
  - ⚡ **Utilities**: Power, water, gas, telecommunications infrastructure
  - 🚗 **Transport**: Road networks, public transit, logistics
- **Cascading Effects Analysis**: Identifies secondary and tertiary impacts across interconnected systems
- **Narrative Generation**: Creates immersive, realistic scenario narratives with timelines

### 2. **Response Planning**

- Generate detailed draft response plans from scenario descriptions
- Structured task breakdown with priorities and dependencies
- Resource allocation recommendations
- Confidence scoring for plan reliability

### 3. **Knowledge Base Management (RAG)**

- **Vector Store Integration**: Upload domain-specific documents (PDFs, TXT, MD) to enhance agent knowledge
- **File Search**: Agents can retrieve relevant information from uploaded documents
- **Per-Domain Knowledge**: Separate knowledge bases for each specialist domain
- **Document Management UI**: Upload, view, and delete knowledge base files

### 4. **Configurable AI Prompts**

- **Admin Interface**: Web-based configuration for all AI prompts
- **Orchestrator Customization**: Modify the main coordinator's behavior
- **Specialist Customization**: Configure individual agent prompts and behaviors
- **Base Prompt Templates**: Shared templates across all specialists
- **Hot Reload**: Changes take effect immediately without server restart

### 5. **Export & Persistence**

- **JSON Export**: Save scenarios in structured JSON format
- **PDF Export**: Generate professional PDF reports with full scenario details
- **Scenario History**: All generated scenarios saved with timestamps
- **Automated Naming**: Files named by hazard type and generation time

### 6. **Interactive Web Interface**

- **Modern UI**: Clean, responsive design with glassmorphism effects
- **Real-time Generation**: Live updates during scenario generation
- **Thinking Transparency**: View orchestrator's reasoning process
- **AI Prompt Suggestions**: Generate creative scenario ideas with one click
- **Multi-tab Interface**: Separate views for generation, planning, and administration

## 🏗️ Architecture

### Multi-Agent System

```
User Input → Orchestrator AI
                ↓
    ┌───────────┼───────────┐
    ↓           ↓           ↓
Fire Agent  Police Agent  Medical Agent
    ↓           ↓           ↓
Utilities Agent  Transport Agent
    ↓           ↓           ↓
    └───────────┼───────────┘
                ↓
    Aggregated Scenario with
    Cascading Effects
```

### Technology Stack

- **Backend**: FastAPI (Python)
- **AI**: Google Gemini 2.5 Flash Lite
- **Vector Store**: Google File Search API
- **PDF Generation**: Playwright (headless browser)
- **Frontend**: Vanilla JavaScript with modern CSS
- **Package Management**: uv (fast Python package manager)

### Key Components

- `main.py`: FastAPI server with REST API endpoints
- `generator.py`: Orchestrator logic and scenario generation
- `agents.py`: Specialist agent implementations
- `manage_knowledge.py`: Vector store and RAG management
- `schemas.py`: Pydantic models for structured data
- `prompts.json`: Configurable AI prompts
- `static/`: Web interface (HTML, CSS, JavaScript)

## 🚀 Setup

### Prerequisites

- Python 3.11+
- Google Gemini API key

### Installation

1.  **Install `uv`** (if not already installed):

    ```bash
    curl -LsSf https://astral.sh/uv/install.sh | sh
    ```

2.  **Install dependencies**:

    ```bash
    uv sync
    ```

3.  **Environment Variables**:
    Create a `.env` file with your Gemini API key:
    ```
    GEMINI_API_KEY=your_api_key_here
    ```

### Running the Server

Start the application:

```bash
.venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Then open your browser to: [http://localhost:8000](http://localhost:8000)

## 📖 Usage

### Generating Scenarios

1. Navigate to the **Disaster Generator** tab
2. Enter an emergency scenario (e.g., "Category 4 Hurricane hitting Apex")
   - Or click the ✨ button for AI-generated suggestions
3. Click **Generate Scenario**
4. View the generated scenario with:
   - Narrative summary and timeline
   - Metadata (location, severity, hazard type)
   - Cascading effects from specialist agents
   - Orchestrator reasoning (optional view)
5. Export as JSON or PDF, or generate a response plan

### Creating Response Plans

1. Navigate to the **Response Planner** tab
2. Paste a scenario description or JSON
3. Click **Generate Plan**
4. Review the structured response plan with objectives, tasks, and resources

### Managing Knowledge Base

1. Navigate to the **Admin** tab
2. Scroll to **Vector Store Knowledge Base**
3. Select a domain (fire, police, medical, utilities, transport)
4. Upload relevant documents (PDFs, TXT, MD files)
5. Agents will automatically use this knowledge when generating effects

### Customizing AI Behavior

1. Navigate to the **Admin** tab
2. Modify the **Orchestrator Prompt** to change coordination behavior
3. Edit **Specialist Agent Configuration**:
   - Update the base prompt (shared by all specialists)
   - Customize individual specialist descriptions
   - Add custom prompts for specific domains
4. Click **Save** to apply changes immediately

## 📁 Project Structure

```
Emergency_Planning/
├── main.py                      # FastAPI server
├── generator.py                 # Scenario generation logic
├── agents.py                    # Specialist agents
├── manage_knowledge.py          # Vector store management
├── schemas.py                   # Data models
├── prompts.json                 # AI prompt configuration
├── vector_store_mapping.json    # Domain → vector store mapping
├── static/                      # Web interface
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   ├── ui_styles.css
│   └── admin_styles.css
├── saved_scenarios/             # Generated scenarios
├── knowledge_base/              # Uploaded documents
└── temp_uploads/                # Temporary file storage
```

## 🔮 Future Development Plan

### Short-term Enhancements (v1.1)

- [ ] **Multi-scenario Comparison**: Side-by-side comparison of multiple scenarios
- [ ] **Severity Scoring**: Automated severity assessment based on cascading effects
- [ ] **Export Templates**: Customizable PDF templates for different audiences
- [ ] **Scenario Variants**: Generate multiple variations of the same base scenario
- [ ] **Agent Collaboration**: Enable specialists to consult each other during generation

### Medium-term Features (v1.2)

- [ ] **Historical Data Integration**: Learn from past emergency responses
- [ ] **Weather API Integration**: Real-time weather data for scenario realism
- [ ] **GIS Mapping**: Visual map overlays showing affected areas
- [ ] **Resource Database**: Track actual Apex resources (vehicles, personnel, equipment)
- [ ] **Timeline Visualization**: Interactive timeline with branching possibilities
- [ ] **Stakeholder Notifications**: Automated alerts to relevant departments

### Long-term Vision (v2.0)

- [ ] **Real-time Monitoring**: Integration with IoT sensors and emergency systems
- [ ] **Predictive Analytics**: ML models for probability estimation
- [ ] **Training Simulator**: Interactive scenario walkthroughs for training
- [ ] **Multi-jurisdiction Support**: Expand beyond Apex to regional coordination
- [ ] **Mobile App**: Field access for emergency responders
- [ ] **API for External Systems**: Integration with existing emergency management software
- [ ] **Collaborative Planning**: Multi-user scenario editing and planning
- [ ] **After-Action Reports**: Automated report generation post-incident

### Research & Innovation

- [ ] **Agent Memory**: Persistent memory across scenarios for learning
- [ ] **Uncertainty Quantification**: Better confidence intervals for predictions
- [ ] **Explainable AI**: Enhanced transparency in agent decision-making
- [ ] **Multi-modal Input**: Image/video analysis for scenario generation
- [ ] **Federated Learning**: Privacy-preserving knowledge sharing across municipalities

## 🤝 Contributing

This project is designed for the Town of Apex, NC. For questions or contributions, please contact the development team.

## 📄 License

Internal use for Town of Apex emergency management purposes.

---

**Built with ❤️ using Google Gemini AI**
