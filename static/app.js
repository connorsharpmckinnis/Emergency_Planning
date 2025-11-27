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

    // Store current scenario data for save/export
    let currentScenarioData = null;

    // Save JSON Button
    const saveJsonBtn = document.getElementById('saveJsonBtn');
    if (saveJsonBtn) {
        saveJsonBtn.addEventListener('click', async () => {
            if (!currentScenarioData) return;
            
            try {
                saveJsonBtn.disabled = true;
                saveJsonBtn.textContent = 'Saving...';
                
                const response = await fetch('/save-scenario', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ scenario: currentScenarioData }),
                });

                if (!response.ok) {
                    throw new Error('Save failed');
                }

                const result = await response.json();
                alert(`Scenario saved successfully as ${result.filename}`);
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to save scenario. Please try again.');
            } finally {
                saveJsonBtn.disabled = false;
                saveJsonBtn.innerHTML = '<span>💾</span> Save JSON';
            }
        });
    }

    // Export PDF Button
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', async () => {
            if (!currentScenarioData) return;
            
            try {
                exportPdfBtn.disabled = true;
                exportPdfBtn.textContent = 'Generating PDF...';
                
                const response = await fetch('/export-pdf', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ scenario: currentScenarioData }),
                });

                if (!response.ok) {
                    throw new Error('PDF export failed');
                }

                // Download the PDF
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                
                // Extract filename from Content-Disposition header or use default
                const contentDisposition = response.headers.get('content-disposition');
                const filename = contentDisposition 
                    ? contentDisposition.split('filename=')[1].replace(/"/g, '')
                    : 'scenario.pdf';
                
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                alert('PDF downloaded successfully!');
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to export PDF. Please try again.');
            } finally {
                exportPdfBtn.disabled = false;
                exportPdfBtn.innerHTML = '<span>📄</span> Download PDF';
            }
        });
    }

    function renderScenario(data) {
        // Store for save/export
        currentScenarioData = data;
        // Title and Badges
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

        // Narrative Summary
        document.getElementById('narrativeSummary').textContent = data.narrative.summary;
        
        // Timeline
        const timelineContainer = document.getElementById('narrativeTimeline');
        timelineContainer.innerHTML = '';
        data.narrative.events.forEach(event => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML = `
                <div class="timeline-timestamp">${event.timestamp}</div>
                <div class="timeline-description">${event.description}</div>
            `;
            timelineContainer.appendChild(item);
        });

        // Metadata Cards
        document.getElementById('metaLocation').textContent = data.metadata.location;
        document.getElementById('metaSeason').textContent = data.metadata.season || 'N/A';
        document.getElementById('metaSeverity').textContent = data.metadata.severity || 'N/A';
        document.getElementById('metaHazard').textContent = data.metadata.hazard_type;

        // Cascading Effects
        const effectsList = document.getElementById('effectsList');
        effectsList.innerHTML = '';
        data.cascading_effects.forEach((effect, index) => {
            const card = document.createElement('div');
            card.className = 'effect-card';
            
            const probability = effect.probability !== null && effect.probability !== undefined 
                ? `<div class="effect-field">
                     <div class="effect-field-label">Probability</div>
                     <div class="effect-probability">
                       <div class="probability-bar">
                         <div class="probability-fill" style="width: ${effect.probability * 100}%"></div>
                       </div>
                       <span>${(effect.probability * 100).toFixed(0)}%</span>
                     </div>
                   </div>` 
                : '';
            
            const systemTags = effect.impacted_systems.map(sys => 
                `<span class="system-tag">${sys}</span>`
            ).join('');
            
            card.innerHTML = `
                <div class="effect-header">
                    <div class="effect-number">${index + 1}</div>
                    ${effect.author ? `<div class="effect-author">${effect.author}</div>` : ''}
                </div>
                <div class="effect-field">
                    <div class="effect-field-label">Cause</div>
                    <div class="effect-field-value">${effect.cause}</div>
                </div>
                <div class="effect-field">
                    <div class="effect-field-label">Effect</div>
                    <div class="effect-field-value">${effect.effect}</div>
                </div>
                <div class="effect-field">
                    <div class="effect-field-label">Impacted Systems</div>
                    <div class="effect-systems">${systemTags}</div>
                </div>
                ${probability}
            `;
            effectsList.appendChild(card);
        });

        // Orchestrator Thinking (Footer)
        const thinkingFooter = document.getElementById('thinkingFooter');
        const thinkingContent = document.getElementById('thinkingContent');
        
        if (data.thoughts && data.thoughts.length > 0) {
            thinkingFooter.style.display = 'block';
            thinkingContent.innerHTML = '';
            data.thoughts.forEach((thought, index) => {
                const thoughtDiv = document.createElement('div');
                thoughtDiv.className = 'thought-item';
                thoughtDiv.innerHTML = `<strong>Step ${index + 1}:</strong> ${thought.content}`;
                thinkingContent.appendChild(thoughtDiv);
            });
        } else {
            thinkingFooter.style.display = 'none';
        }

        // Specialist Agent Debug Section
        const debugFooter = document.getElementById('debugFooter');
        const debugContent = document.getElementById('debugContent');
        
        if (data.cascading_effects && data.cascading_effects.length > 0) {
            debugFooter.style.display = 'block';
            debugContent.innerHTML = '';
            
            data.cascading_effects.forEach((effect, index) => {
                const debugDiv = document.createElement('div');
                debugDiv.className = 'debug-agent-output';
                
                const probability = effect.probability !== null && effect.probability !== undefined 
                    ? `<div class="debug-agent-field">
                         <strong>Probability</strong>
                         <div class="debug-agent-field-value">${(effect.probability * 100).toFixed(0)}%</div>
                       </div>` 
                    : '';
                
                debugDiv.innerHTML = `
                    <div class="debug-agent-name">${effect.author || 'Unknown Agent'} - Effect #${index + 1}</div>
                    <div class="debug-agent-field">
                        <strong>Cause</strong>
                        <div class="debug-agent-field-value">${effect.cause}</div>
                    </div>
                    <div class="debug-agent-field">
                        <strong>Effect</strong>
                        <div class="debug-agent-field-value">${effect.effect}</div>
                    </div>
                    <div class="debug-agent-field">
                        <strong>Impacted Systems</strong>
                        <div class="debug-agent-field-value">${effect.impacted_systems.join(', ')}</div>
                    </div>
                    ${probability}
                `;
                debugContent.appendChild(debugDiv);
            });
        } else {
            debugFooter.style.display = 'none';
        }
    }

    // Toggle thinking section
    const toggleThinking = document.getElementById('toggleThinking');
    if (toggleThinking) {
        toggleThinking.addEventListener('click', () => {
            const content = document.getElementById('thinkingContent');
            content.classList.toggle('hidden');
            toggleThinking.classList.toggle('active');
        });
    }

    // Toggle debug section
    const toggleDebug = document.getElementById('toggleDebug');
    if (toggleDebug) {
        toggleDebug.addEventListener('click', () => {
            const content = document.getElementById('debugContent');
            content.classList.toggle('hidden');
            toggleDebug.classList.toggle('active');
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
