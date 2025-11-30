# Code Quality Analysis & Simplification Opportunities

**Generated:** 2025-11-30  
**Purpose:** Identify redundant, duplicitous, or unnecessarily complex code that could be simplified or consolidated

---

## Executive Summary

This analysis identifies **23 major areas** for code simplification and consolidation across the Emergency Planning codebase. The primary issues are:

1. **CSS fragmentation** across 3 separate files with overlapping styles
2. **Duplicate DOM manipulation** patterns in JavaScript
3. **Repetitive button handling** code with nearly identical error handling
4. **Unused debug files** cluttering the project
5. **Duplicate route handlers** in main.py
6. **Hardcoded specialist configuration** in multiple places

**Estimated Complexity Reduction:** 30-40% fewer lines of code with improved maintainability

---

## 🎨 CSS Issues (HIGH PRIORITY)

### Issue #1: Three Separate CSS Files with Overlapping Concerns

**Files:** `style.css`, `ui_styles.css`, `admin_styles.css`

**Problem:**

- **617 lines** in `style.css` (base styles)
- **486 lines** in `ui_styles.css` (UI components)
- **343 lines** in `admin_styles.css` (admin panel)
- Total: **1,446 lines** of CSS across 3 files

**Specific Overlaps:**

1. **Badge Styles Duplicated:**

   - `style.css` lines 261-285: Badge definitions
   - `ui_styles.css` uses badges but doesn't redefine (good)
   - Could consolidate all badge variants in one place

2. **Button Styles Scattered:**

   - `style.css` lines 108-230: Base button, icon-btn, loading states
   - `ui_styles.css` lines 37-88: action-btn variants (save-btn, export-btn, draft-btn)
   - `admin_styles.css` lines 305-342: secondary-btn, primary-btn
   - **All three files define button styles!**

3. **Card Styles Duplicated:**

   - `style.css` lines 300-314: `.card` base
   - `ui_styles.css` lines 161-175: `.metadata-card`
   - `ui_styles.css` lines 223-234: `.effect-card`
   - `admin_styles.css` lines 84-95: `.specialist-card`

4. **Thinking/Debug Footer Nearly Identical:**
   - `ui_styles.css` lines 327-388: `.thinking-footer` and `.thinking-toggle`
   - `ui_styles.css` lines 397-485: `.debug-footer` and `.debug-toggle`
   - **99% identical code**, only color differences

**Recommendation:**

```
Consolidate into 2 files:
- base.css (variables, resets, utilities, base components)
- components.css (all specialized components)

OR use a single styles.css with clear sections:
/* Variables */
/* Reset & Base */
/* Layout */
/* Components - Buttons */
/* Components - Cards */
/* Components - Forms */
/* Page-specific - Generator */
/* Page-specific - Admin */
```

**Estimated Savings:** 200-300 lines of CSS

---

### Issue #2: Duplicate Animation Definitions

**Files:** `style.css`

**Problem:**

- `@keyframes spin` defined **THREE TIMES** (lines 197, 218, 612)
- `@keyframes fadeIn` defined **TWICE** (lines 603, 241 as `.result-section`)

**Recommendation:**
Move all keyframe animations to a single section at the top or bottom of the CSS file.

**Estimated Savings:** 20 lines

---

### Issue #3: Redundant Color Definitions

**Files:** `ui_styles.css`

**Problem:**
Hardcoded colors throughout instead of using CSS variables:

- `#667eea` appears 8+ times (could be `--primary-purple`)
- `#f7fafc`, `#e2e8f0`, `#1a202c` repeated throughout
- White/light theme colors mixed with dark theme in `style.css`

**Recommendation:**
Extend `:root` variables to include all colors used in ui_styles.css:

```css
:root {
  /* Existing dark theme */
  --bg-color: #0f172a;

  /* Add light theme colors */
  --light-bg: #f7fafc;
  --light-border: #e2e8f0;
  --light-text: #1a202c;
  --purple-primary: #667eea;
  --purple-dark: #764ba2;
}
```

**Estimated Savings:** Improved maintainability, easier theming

---

## 📜 JavaScript Issues (HIGH PRIORITY)

### Issue #4: Repetitive Button Click Handlers with Identical Error Handling

**File:** `app.js`

**Problem:**
Lines 96-120, 128-157, 162-208, 213-240, 285-315, 320-360 all follow this pattern:

```javascript
button.addEventListener('click', async () => {
    try {
        button.disabled = true;
        button.textContent = 'Loading...';

        const response = await fetch('/endpoint', {...});
        if (!response.ok) throw new Error('Failed');

        // Do something with response

    } catch (error) {
        console.error('Error:', error);
        alert('Failed to do thing. Please try again.');
    } finally {
        button.disabled = false;
        button.innerHTML = 'Original Text';
    }
});
```

**Recommendation:**
Create a reusable async button handler:

```javascript
async function handleAsyncButton(button, endpoint, options = {}) {
  const originalContent = button.innerHTML;
  const loadingText = options.loadingText || "Loading...";

  try {
    button.disabled = true;
    button.textContent = loadingText;

    const response = await fetch(endpoint, {
      method: options.method || "POST",
      headers: options.headers || { "Content-Type": "application/json" },
      body: options.body,
    });

    if (!response.ok) throw new Error(options.errorMessage || "Request failed");

    return await (options.responseType === "blob"
      ? response.blob()
      : response.json());
  } catch (error) {
    console.error("Error:", error);
    alert(options.errorMessage || "Operation failed. Please try again.");
    throw error;
  } finally {
    button.disabled = false;
    button.innerHTML = originalContent;
  }
}

// Usage:
saveJsonBtn.addEventListener("click", async () => {
  const result = await handleAsyncButton(saveJsonBtn, "/save-scenario", {
    body: JSON.stringify({ scenario: currentScenarioData }),
    loadingText: "Saving...",
    errorMessage: "Failed to save scenario",
  });
  alert(`Scenario saved successfully as ${result.filename}`);
});
```

**Estimated Savings:** 150+ lines, much cleaner code

---

### Issue #5: Duplicate DOM Rendering Logic

**File:** `app.js`

**Problem:**

1. **Badge creation** (lines 590-602): Creates badges in `renderScenario()`
2. **PDF export** in `main.py` (lines 212-223): Recreates same badge logic in Python/JS template string
3. **Effect card rendering** (lines 629-669): Complex HTML string building
4. **Timeline rendering** (lines 610-618): Similar pattern

**Recommendation:**
Create reusable template functions:

```javascript
function createBadge(type, text) {
  const badge = document.createElement("span");
  badge.className = `badge ${type}`;
  badge.textContent = text;
  return badge;
}

function createEffectCard(effect, index) {
  const template = document.getElementById("effect-card-template");
  const card = template.content.cloneNode(true);
  // Populate card...
  return card;
}
```

Use HTML `<template>` tags in index.html for complex structures instead of building HTML strings in JavaScript.

**Estimated Savings:** 100+ lines, better separation of concerns

---

### Issue #6: Duplicate Emoji Mapping

**File:** `app.js`

**Problem:**
Lines 260-266: Emoji mapping for specialists
This same mapping exists conceptually in the UI and could be centralized.

**Recommendation:**
Move to a configuration object at the top of the file:

```javascript
const SPECIALIST_CONFIG = {
  fire: { emoji: "🔥", label: "Fire" },
  police: { emoji: "👮", label: "Police" },
  medical: { emoji: "🏥", label: "Medical" },
  utilities: { emoji: "⚡", label: "Utilities" },
  transport: { emoji: "🚗", label: "Transport" },
};
```

Use this everywhere instead of recreating the mapping.

---

### Issue #7: File Manager Object Could Be a Class

**File:** `app.js` lines 363-576

**Problem:**
214 lines of object literal with methods. This is essentially a class but written in old-style object notation.

**Recommendation:**
Convert to ES6 class:

```javascript
class FileManager {
  constructor(containerSelector) {
    this.currentDomain = "fire";
    this.container = document.getElementById(containerSelector);
    this.init();
  }

  async init() {
    /* ... */
  }
  async loadFiles() {
    /* ... */
  }
  // etc.
}

const fileManager = new FileManager("domainTabsContainer");
```

**Benefits:** Better encapsulation, easier testing, clearer structure

---

### Issue #8: Duplicate Fetch Error Handling

**File:** `app.js`

**Problem:**
Every fetch call has:

```javascript
if (!response.ok) throw new Error("Generation failed");
```

**Recommendation:**
Create a wrapper:

```javascript
async function apiFetch(endpoint, options = {}) {
  const response = await fetch(endpoint, options);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Request to ${endpoint} failed`);
  }
  return response;
}
```

---

## 🐍 Python Backend Issues

### Issue #9: Duplicate Route Handler for Root

**File:** `main.py`

**Problem:**

- Line 36: `@app.get("/")` → `read_root()`
- Line 309: `@app.get("/")` → `read_index()`

**Both return the same thing!** The second one overrides the first.

**Recommendation:**
Delete lines 308-310. Keep only the first one.

**Estimated Savings:** 3 lines, removes confusion

---

### Issue #10: Repetitive Try-Except Blocks in API Endpoints

**File:** `main.py`

**Problem:**
Lines 40-45, 48-53, 56-61, 64-76, 79-97, etc. all follow:

```python
try:
    # do something
    return result
except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
```

**Recommendation:**
Use FastAPI dependency injection or a decorator:

```python
from functools import wraps

def handle_errors(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            raise  # Re-raise HTTP exceptions
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    return wrapper

@app.post("/generate")
@handle_errors
async def generate_scenario(request: ScenarioRequest):
    scenario = generate_scenario_data(request.topic)
    return scenario
```

**Estimated Savings:** 50+ lines

---

### Issue #11: Hardcoded Specialist Domains

**Files:** `agents.py`, `app.js`, `generator.py`

**Problem:**
Specialist domains hardcoded in multiple places:

- `agents.py` lines 101-107: Fallback specialist config
- `app.js` line 260-266: Emoji mapping
- `generator.py` line 39: Comment mentions domains

**Recommendation:**
Create a single source of truth:

```python
# config.py
SPECIALIST_DOMAINS = {
    "fire": {
        "display_name": "Fire",
        "emoji": "🔥",
        "description": "Focus on fire suppression, search and rescue, and hazardous materials."
    },
    # etc.
}
```

Import this everywhere. Update `prompts.json` to be the single source, and load it in both Python and JavaScript.

---

### Issue #12: Duplicate Prompt Loading Logic

**Files:** `agents.py`, `generator.py`

**Problem:**

- `agents.py` lines 17-23: `load_prompts()` function
- `generator.py` lines 13-18: Identical `load_prompts()` function

**Recommendation:**
Move to a shared `config.py` or `utils.py`:

```python
# utils.py
import json
import os

def load_prompts():
    """Load prompts from prompts.json"""
    if os.path.exists("prompts.json"):
        with open("prompts.json", "r") as f:
            return json.load(f)
    return {}

PROMPTS = load_prompts()
```

Import from both files:

```python
from utils import PROMPTS, load_prompts
```

**Estimated Savings:** 10 lines, single source of truth

---

### Issue #13: Massive PDF Export Function

**File:** `main.py` lines 173-306

**Problem:**
134 lines in a single function with:

- Playwright setup
- DOM manipulation via JavaScript string
- PDF generation
- File handling
- Error handling

**Recommendation:**
Split into smaller functions:

```python
def generate_pdf_filename(scenario_data):
    """Generate filename from scenario metadata"""
    # ...

def inject_scenario_into_page(page, scenario_data):
    """Inject scenario data into page DOM"""
    # ...

async def export_pdf(request: SaveScenarioRequest):
    filename = generate_pdf_filename(request.scenario)
    filepath = SAVED_SCENARIOS_DIR / filename

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("http://localhost:8000")
        await inject_scenario_into_page(page, request.scenario)
        await page.pdf(path=str(filepath), ...)
        await browser.close()

    return FileResponse(filepath, ...)
```

**Estimated Savings:** Better readability, easier testing

---

### Issue #14: Duplicate Scenario Data Injection

**File:** `main.py` lines 204-274

**Problem:**
The JavaScript code injected for PDF export (lines 204-274) duplicates the rendering logic from `app.js` `renderScenario()` function.

**Recommendation:**
Extract the rendering logic into a shared function in `app.js`, then call it from both places:

```javascript
// app.js
window.renderScenarioForExport = function(data) {
    // Shared rendering logic
};

// main.py PDF export
await page.evaluate(f"window.renderScenarioForExport({scenario_json})")
```

**Estimated Savings:** 70 lines, single source of truth for rendering

---

## 🗂️ File Organization Issues

### Issue #15: Unused Debug Files

**Files:** `debug_*.py` (7 files)

**Problem:**
Seven debug files that appear to be one-off scripts for testing:

- `debug_config.py`
- `debug_filesearch.py`
- `debug_method.py`
- `debug_prompt.py`
- `debug_retrieval.py`
- `debug_sdk.py`
- `debug_tool.py`

**Recommendation:**

1. Move to a `debug/` or `scripts/` folder
2. Or delete if no longer needed
3. Add to `.gitignore` if they're temporary

**Estimated Savings:** Cleaner project root

---

### Issue #16: Verify Scripts Could Be Consolidated

**Files:** `verify.py`, `verify_agents.py`, `verify_planner.py`

**Problem:**
Three separate verification scripts. Could be subcommands of a single script.

**Recommendation:**

```python
# verify.py
import argparse

def verify_agents():
    # ...

def verify_planner():
    # ...

def verify_basic():
    # ...

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('component', choices=['agents', 'planner', 'basic'])
    args = parser.parse_args()

    if args.component == 'agents':
        verify_agents()
    # etc.
```

Usage: `python verify.py agents`

---

## 🏗️ Architecture Issues

### Issue #17: Generator.py Orchestrator Logic is Complex

**File:** `generator.py` lines 23-219

**Problem:**
197 lines in a single function `generate_scenario_data()` with:

- Tool calling loop
- History management
- Thought extraction
- Multiple response stages

**Recommendation:**
Break into smaller functions:

```python
def generate_scenario_data(topic: str) -> EmergencyScenario:
    client = create_client()
    orchestrator_prompt = build_orchestrator_prompt(topic)

    # Stage 1: Gather specialist insights
    cascading_effects, thoughts = gather_specialist_effects(client, orchestrator_prompt)

    # Stage 2: Aggregate into final scenario
    scenario = aggregate_scenario(client, topic, cascading_effects, thoughts)

    return scenario

def gather_specialist_effects(client, prompt):
    """Handle tool calling loop to consult specialists"""
    # Lines 79-184

def aggregate_scenario(client, topic, effects, thoughts):
    """Generate final scenario JSON"""
    # Lines 186-219
```

**Estimated Savings:** Better testability, clearer flow

---

### Issue #18: Specialist Agent Prompt Building is Verbose

**File:** `agents.py` lines 37-96

**Problem:**
Complex prompt building with multiple conditionals and string formatting.

**Recommendation:**
Use a template engine or cleaner string formatting:

```python
from string import Template

SPECIALIST_PROMPT_TEMPLATE = Template("""
You are an expert in $display_name. $description

$base_prompt

$retrieval_prompt
""")

def generate_cascading_effect(self, scenario_context: str):
    prompt = SPECIALIST_PROMPT_TEMPLATE.substitute(
        display_name=self.display_name,
        description=self.description,
        base_prompt=self.base_prompt.format(scenario_context=scenario_context),
        retrieval_prompt=self.get_retrieval_prompt()
    )
    # ...
```

---

## 🔧 Minor Issues & Code Smells

### Issue #19: Magic Numbers and Strings

**Files:** Multiple

**Problem:**

- `app.js` line 32: `3000` (thinking message interval)
- `app.js` line 77: `300` (transition delay)
- `app.js` line 235: `100` (tab switch delay)
- `main.py` line 277: `2000` (PDF render wait)
- Port `8000` hardcoded in multiple places

**Recommendation:**
Create constants:

```javascript
// app.js
const CONFIG = {
  THINKING_MESSAGE_INTERVAL: 3000,
  TRANSITION_DELAY: 300,
  TAB_SWITCH_DELAY: 100,
  SERVER_URL: "http://localhost:8000",
};
```

```python
# config.py
SERVER_PORT = 8000
PDF_RENDER_DELAY_MS = 2000
```

---

### Issue #20: Inconsistent Error Messages

**Files:** `app.js`, `main.py`

**Problem:**
Some errors use emoji (✅, ❌), some don't. Some are user-friendly, some are technical.

**Recommendation:**
Standardize error message format:

```javascript
const MESSAGES = {
  SUCCESS: {
    SAVE: "✅ Scenario saved successfully!",
    UPLOAD: "✅ File uploaded successfully!",
  },
  ERROR: {
    SAVE: "❌ Failed to save scenario. Please try again.",
    UPLOAD: "❌ Failed to upload file. Please try again.",
  },
};
```

---

### Issue #21: Console.log Statements Left in Production Code

**Files:** `app.js`

**Problem:**

- Line 1: `console.log('App.js script starting...');`
- Multiple `console.error()` calls throughout

**Recommendation:**

1. Remove or wrap in debug flag:

```javascript
const DEBUG = false;

function debugLog(...args) {
  if (DEBUG) console.log(...args);
}
```

2. Or use a proper logging library

---

### Issue #22: No Input Validation in Frontend

**File:** `app.js`

**Problem:**
Lines 51-52: Only checks if topic is empty, no validation for:

- Length limits
- Special characters
- Injection attacks

**Recommendation:**
Add validation:

```javascript
function validateTopic(topic) {
  if (!topic || topic.trim().length === 0) {
    return { valid: false, error: "Please enter a scenario topic" };
  }
  if (topic.length > 500) {
    return { valid: false, error: "Topic must be less than 500 characters" };
  }
  return { valid: true };
}

const validation = validateTopic(topic);
if (!validation.valid) {
  alert(validation.error);
  return;
}
```

---

### Issue #23: No Loading State Cleanup on Error

**File:** `app.js`

**Problem:**
If an error occurs during generation, the loading spinner might not be properly hidden in all cases.

**Recommendation:**
Ensure `finally` blocks always execute and reset all UI state:

```javascript
finally {
    stopThinkingMessages();
    generateBtn.disabled = false;
    generateBtn.classList.remove('loading');
    loadingSection.classList.add('hidden');
    // Ensure input is re-enabled
    topicInput.disabled = false;
}
```

---

## 📊 Summary of Recommendations

### High Priority (Do First)

1. ✅ **Consolidate CSS files** → Save 200-300 lines
2. ✅ **Create reusable async button handler** → Save 150+ lines
3. ✅ **Remove duplicate root route** → Fix bug
4. ✅ **Extract shared prompt loading** → Single source of truth
5. ✅ **Move debug files** → Clean project structure

### Medium Priority

6. ✅ **Create DOM rendering templates** → Better maintainability
7. ✅ **Split large functions** → Better testability
8. ✅ **Add error handling decorator** → Cleaner code
9. ✅ **Centralize specialist config** → Single source of truth
10. ✅ **Fix duplicate PDF rendering** → DRY principle

### Low Priority (Nice to Have)

11. ✅ **Convert FileManager to class** → Better OOP
12. ✅ **Extract magic numbers** → Better configuration
13. ✅ **Standardize error messages** → Better UX
14. ✅ **Add input validation** → Better security
15. ✅ **Remove console.logs** → Cleaner production code

---

## 🎯 Estimated Impact

| Category              | Current LOC | After Refactor | Savings  |
| --------------------- | ----------- | -------------- | -------- |
| CSS                   | 1,446       | ~1,100         | 24%      |
| JavaScript            | 773         | ~550           | 29%      |
| Python (main.py)      | 312         | ~250           | 20%      |
| Python (generator.py) | 277         | ~200           | 28%      |
| Python (agents.py)    | 141         | ~120           | 15%      |
| **Total**             | **2,949**   | **~2,220**     | **~25%** |

**Additional Benefits:**

- Easier to onboard new developers
- Faster to add new features
- Fewer bugs from duplicate code
- Better test coverage possible
- Easier to maintain and debug

---

## 🚀 Next Steps

1. **Review this document** with the team
2. **Prioritize** which issues to tackle first
3. **Create tickets** for each refactoring task
4. **Test thoroughly** after each change
5. **Update documentation** as code changes

**Recommended Approach:**

- Start with CSS consolidation (low risk, high impact)
- Then tackle JavaScript utilities (medium risk, high impact)
- Finally refactor Python backend (higher risk, test carefully)
- Do NOT try to do everything at once - incremental improvements!
