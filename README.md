# Emergency Scenario Generator

## Setup

1.  **Install `uv`** (if not already installed):

    ```bash
    curl -LsSf https://astral.sh/uv/install.sh | sh
    ```

2.  **Install dependencies**:

    ```bash
    uv sync
    ```

3.  **Environment Variables**:
    Ensure you have a `.env` file with your Gemini API key:
    ```
    GEMINI_API_KEY=your_api_key_here
    ```

## Running the Server

To start the application, run:

```bash
.venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Then open your browser to: [http://localhost:8000](http://localhost:8000)
