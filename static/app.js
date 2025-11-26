document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateBtn');
    const topicInput = document.getElementById('topicInput');
    const resultSection = document.getElementById('resultSection');

    generateBtn.addEventListener('click', async () => {
        const topic = topicInput.value.trim();
        if (!topic) return;

        // UI State: Loading
        generateBtn.disabled = true;
        generateBtn.classList.add('loading');
        resultSection.classList.add('hidden');

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
        data.cascading_effects.forEach(effect => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="effect-cause">${effect.cause} → ${effect.effect}</span>
                <span class="effect-desc">Impacts: ${effect.impacted_systems.join(', ')}</span>
            `;
            effectsList.appendChild(li);
        });

        // Response Plan
        const objectivesList = document.getElementById('planObjectives');
        objectivesList.innerHTML = '';
        data.draft_response_plan.objectives.forEach(obj => {
            const li = document.createElement('li');
            li.textContent = obj;
            objectivesList.appendChild(li);
        });

        const tasksBody = document.getElementById('planTasks');
        tasksBody.innerHTML = '';
        data.draft_response_plan.tasks.forEach(task => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${task.task_id}</td>
                <td>${task.description}</td>
                <td>${task.owner || 'Unassigned'}</td>
                <td>${task.estimated_time_minutes ? task.estimated_time_minutes + 'm' : '-'}</td>
            `;
            tasksBody.appendChild(row);
        });
    }
});
