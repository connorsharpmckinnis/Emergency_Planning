document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateBtn');
    const topicInput = document.getElementById('topicInput');
    const resultSection = document.getElementById('results');
    const loadingSection = document.getElementById('loading');

    generateBtn.addEventListener('click', async () => {
        const topic = topicInput.value.trim();
        if (!topic) return;

        // UI State: Loading
        generateBtn.disabled = true;
        generateBtn.classList.add('loading');
        resultSection.classList.add('hidden');
        loadingSection.classList.remove('hidden');

        try {
            const response = await fetch('/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ topic }),
            });

            if (!response.ok) {
                throw new Error('Generation failed');
            }

            const scenario = await response.json();
            renderScenario(scenario);
            resultSection.classList.remove('hidden');
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to generate scenario. Please try again.');
        } finally {
            // UI State: Reset
            generateBtn.disabled = false;
            generateBtn.classList.remove('loading');
            loadingSection.classList.add('hidden');
        }
    });

    function renderScenario(data) {
        // Metadata
        document.getElementById('scenarioTitle').textContent = `${data.metadata.hazard_type} in ${data.metadata.location}`;
        
        const badgesContainer = document.getElementById('scenarioBadges');
        badgesContainer.innerHTML = '';
        
        if (data.metadata.severity) {
            const severityBadge = document.createElement('span');
            severityBadge.className = `badge severity-${data.metadata.severity.toLowerCase()}`;
            severityBadge.textContent = data.metadata.severity;
            badgesContainer.appendChild(severityBadge);
        }
        
        if (data.metadata.season) {
            const seasonBadge = document.createElement('span');
            seasonBadge.className = 'badge info';
            seasonBadge.textContent = data.metadata.season;
            badgesContainer.appendChild(seasonBadge);
        }

        // Orchestrator Thinking
        const thinkingCard = document.getElementById('thinkingCard');
        const thinkingContent = document.getElementById('thinkingContent');
        
        if (data.thoughts && data.thoughts.length > 0) {
            thinkingCard.style.display = 'block';
            thinkingContent.innerHTML = '';
            data.thoughts.forEach((thought, index) => {
                const thoughtDiv = document.createElement('div');
                thoughtDiv.className = 'thought-item';
                thoughtDiv.innerHTML = `<strong>Step ${index + 1}:</strong> ${thought.content}`;
                thinkingContent.appendChild(thoughtDiv);
            });
        } else {
            thinkingCard.style.display = 'none';
        }

        // Narrative
        document.getElementById('narrativeSummary').textContent = data.narrative.summary;
        
        const timelineContainer = document.getElementById('narrativeTimeline');
        timelineContainer.innerHTML = '';
        data.narrative.events.forEach(event => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML = `
                <div class="timeline-time">${event.timestamp}</div>
                <div class="timeline-desc">${event.description}</div>
            `;
            timelineContainer.appendChild(item);
        });

        // Cascading Effects
        const effectsList = document.getElementById('cascadingEffectsList');
        effectsList.innerHTML = '';
        data.cascading_effects.forEach((effect, index) => {
            const li = document.createElement('li');
            const authorTag = effect.author ? `<span class="author-tag">${effect.author}</span>` : '';
            const probability = effect.probability !== null && effect.probability !== undefined 
                ? `<div class="effect-field"><strong>Probability:</strong> ${(effect.probability * 100).toFixed(0)}%</div>` 
                : '';
            
            li.innerHTML = `
                <div class="effect-header">
                    <span class="effect-number">#${index + 1}</span>
                    ${authorTag}
                </div>
                <div class="effect-field"><strong>Cause:</strong> ${effect.cause}</div>
                <div class="effect-field"><strong>Effect:</strong> ${effect.effect}</div>
                <div class="effect-field"><strong>Impacted Systems:</strong> ${effect.impacted_systems.join(', ')}</div>
                ${probability}
            `;
            effectsList.appendChild(li);
        });


    }

    // Toggle thinking section
    const toggleBtn = document.getElementById('toggleThinking');
    const thinkingContent = document.getElementById('thinkingContent');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const isCollapsed = thinkingContent.style.display === 'none';
            thinkingContent.style.display = isCollapsed ? 'block' : 'none';
            toggleBtn.textContent = isCollapsed ? '▼' : '▶';
        });
    }

    // Tabs Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked
            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}Tab`).classList.add('active');
        });
    });

    // Response Planner Logic
    const generatePlanBtn = document.getElementById('generatePlanBtn');
    const plannerInput = document.getElementById('plannerInput');
    const plannerLoading = document.getElementById('plannerLoading');
    const plannerResults = document.getElementById('plannerResults');

    generatePlanBtn.addEventListener('click', async () => {
        const context = plannerInput.value.trim();
        if (!context) return;

        plannerLoading.classList.remove('hidden');
        plannerResults.classList.add('hidden');

        try {
            const response = await fetch('/generate-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenario_context: context })
            });

            if (!response.ok) throw new Error('Generation failed');

            const plan = await response.json();
            renderPlannerResults(plan);
            plannerResults.classList.remove('hidden');
        } catch (error) {
            console.error(error);
            alert('Failed to generate plan. Please try again.');
        } finally {
            plannerLoading.classList.add('hidden');
        }
    });

    function renderPlannerResults(plan) {
        // Objectives
        const objectivesContainer = document.getElementById('plannerObjectives');
        objectivesContainer.innerHTML = '<h4>Objectives</h4><ul>' + 
            plan.objectives.map(obj => `<li>${obj}</li>`).join('') + 
            '</ul>';

        // Tasks
        const tasksBody = document.getElementById('plannerTasksBody');
        tasksBody.innerHTML = '';
        plan.tasks.forEach(task => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${task.task_id}</td>
                <td>${task.description}</td>
                <td><span class="badge priority-${task.priority.toLowerCase()}">${task.priority}</span></td>
                <td>${task.assigned_to}</td>
            `;
            tasksBody.appendChild(row);
        });
    }
});
