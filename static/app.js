console.log('App.js script starting...');

    // Magic Prompt Logic
    window.generatePrompt = async function() {
        const btn = document.getElementById('magicPromptBtn');
        const input = document.getElementById('topicInput');
        
        if (!btn) return;

        try {
            btn.disabled = true;
            btn.classList.add('loading');
            
            const response = await fetch('/generate-prompt-suggestion', {
                method: 'POST'
            });

            if (!response.ok) throw new Error('Failed to generate prompt');

            const data = await response.json();
            input.value = data.prompt;
            
        } catch (error) {
            console.error('Error generating prompt:', error);
            alert('Failed to generate prompt suggestion.');
        } finally {
            btn.disabled = false;
            btn.classList.remove('loading');
        }
    };

document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateBtn');
    const topicInput = document.getElementById('topicInput');
    const resultSection = document.getElementById('results');
    const loadingSection = document.getElementById('loading');
    const thinkingMessage = document.getElementById('thinkingMessage');

    // Thinking messages to rotate through
    const thinkingMessages = [
        'Crafting emergency narrative...',
        'Analyzing initial conditions...',
        'Simulating cascading effects...',
        'Consulting specialist agents...',
        'Evaluating system impacts...',
        'Calculating probabilities...',
        'Synthesizing final scenario...'
    ];

    let thinkingInterval = null;

    function startThinkingMessages() {
        let index = 0;
        if (thinkingMessage) {
            thinkingMessage.textContent = thinkingMessages[0];
            thinkingInterval = setInterval(() => {
                index = (index + 1) % thinkingMessages.length;
                thinkingMessage.textContent = thinkingMessages[index];
            }, 3000); // Change message every 3 seconds
        }
    }

    function stopThinkingMessages() {
        if (thinkingInterval) {
            clearInterval(thinkingInterval);
            thinkingInterval = null;
        }
        if (thinkingMessage) {
            thinkingMessage.textContent = '';
        }
    }

    // Ensure loading is hidden on initial page load
    loadingSection.classList.add('hidden');
    resultSection.classList.add('hidden');

    generateBtn.addEventListener('click', async () => {
        const topic = topicInput.value.trim();
        if (!topic) return;

        // UI State: Loading
        generateBtn.disabled = true;
        generateBtn.classList.add('loading');
        resultSection.classList.add('hidden');
        loadingSection.classList.remove('hidden');
        startThinkingMessages();

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
            
            // Small delay for smooth transition
            await new Promise(resolve => setTimeout(resolve, 300));
            
            renderScenario(scenario);
            resultSection.classList.remove('hidden');
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to generate scenario. Please try again.');
        } finally {
            // UI State: Reset
            stopThinkingMessages();
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

    // Draft Response Button
    const draftResponseBtn = document.getElementById('draftResponseBtn');
    if (draftResponseBtn) {
        draftResponseBtn.addEventListener('click', async () => {
            if (!currentScenarioData) return;
            
            // Switch to planner tab
            const plannerTabBtn = document.querySelector('[data-tab="planner"]');
            const generatorTab = document.getElementById('generatorTab');
            const plannerTab = document.getElementById('plannerTab');
            const tabBtns = document.querySelectorAll('.tab-btn');
            
            // Update tab buttons
            tabBtns.forEach(btn => btn.classList.remove('active'));
            plannerTabBtn.classList.add('active');
            
            // Update tab content
            generatorTab.classList.remove('active');
            plannerTab.classList.add('active');
            
            // Populate planner input with JSON
            const plannerInput = document.getElementById('plannerInput');
            plannerInput.value = JSON.stringify(currentScenarioData, null, 2);
            
            // Trigger generate plan button after a short delay to ensure UI updates
            setTimeout(() => {
                const generatePlanBtn = document.getElementById('generatePlanBtn');
                generatePlanBtn.click();
            }, 100);
        });
    }

    // Admin Tab Functionality
    async function loadAdminPrompts() {
        try {
            const response = await fetch('/api/prompts');
            if (!response.ok) throw new Error('Failed to load prompts');
            
            const prompts = await response.json();
            
            // Load orchestrator prompt
            document.getElementById('orchestratorPrompt').value = prompts.orchestrator_prompt || '';
            document.getElementById('specialistBasePrompt').value = prompts.specialist_base_prompt || '';
            
            // Load specialist descriptions
            const specialists = ['fire', 'police', 'medical', 'utilities', 'transport'];
            specialists.forEach(domain => {
                const textarea = document.getElementById(`${domain}-description`);
                if (textarea && prompts.specialists && prompts.specialists[domain]) {
                    textarea.value = prompts.specialists[domain].description || '';
                }
            });
        } catch (error) {
            console.error('Error loading prompts:', error);
            alert('Failed to load prompts configuration');
        }
    }

    // Save orchestrator prompt
    const saveOrchestratorBtn = document.getElementById('saveOrchestratorBtn');
    if (saveOrchestratorBtn) {
        saveOrchestratorBtn.addEventListener('click', async () => {
            try {
                saveOrchestratorBtn.disabled = true;
                saveOrchestratorBtn.textContent = 'Saving...';
                
                // Get current prompts
                const response = await fetch('/api/prompts');
                const prompts = await response.json();
                
                // Update orchestrator prompt
                prompts.orchestrator_prompt = document.getElementById('orchestratorPrompt').value;
                
                // Save back
                const saveResponse = await fetch('/api/prompts', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(prompts)
                });
                
                if (!saveResponse.ok) throw new Error('Save failed');
                
                alert('✅ Orchestrator prompt saved successfully!');
            } catch (error) {
                console.error('Error:', error);
                alert('❌ Failed to save orchestrator prompt');
            } finally {
                saveOrchestratorBtn.disabled = false;
                saveOrchestratorBtn.innerHTML = '💾 Save Orchestrator Prompt';
            }
        });
    }

    // Save specialist prompts
    const saveSpecialistsBtn = document.getElementById('saveSpecialistsBtn');
    if (saveSpecialistsBtn) {
        saveSpecialistsBtn.addEventListener('click', async () => {
            try {
                saveSpecialistsBtn.disabled = true;
                saveSpecialistsBtn.textContent = 'Saving...';
                
                // Get current prompts
                const response = await fetch('/api/prompts');
                const prompts = await response.json();
                
                // Update base prompt
                prompts.specialist_base_prompt = document.getElementById('specialistBasePrompt').value;
                
                // Update specialist descriptions
                const specialists = ['fire', 'police', 'medical', 'utilities', 'transport'];
                specialists.forEach(domain => {
                    const textarea = document.getElementById(`${domain}-description`);
                    if (textarea && prompts.specialists && prompts.specialists[domain]) {
                        prompts.specialists[domain].description = textarea.value;
                    }
                });
                
                // Save back
                const saveResponse = await fetch('/api/prompts', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(prompts)
                });
                
                if (!saveResponse.ok) throw new Error('Save failed');
                
                alert('✅ Specialist prompts saved successfully!');
            } catch (error) {
                console.error('Error:', error);
                alert('❌ Failed to save specialist prompts');
            } finally {
                saveSpecialistsBtn.disabled = false;
                saveSpecialistsBtn.innerHTML = '💾 Save All Specialist Prompts';
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

        // Show Orchestrator Thinking if available
        const thinkingFooter = document.getElementById('thinkingFooter');
        if (data.thoughts && data.thoughts.length > 0) {
            thinkingFooter.style.display = 'block';
            const thinkingContent = document.getElementById('thinkingContent');
            thinkingContent.innerHTML = data.thoughts.map(t => 
                `<div class="thought-item">
                    <p>${t.content}</p>
                 </div>`
            ).join('');
        } else {
            thinkingFooter.style.display = 'none';
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
            const tabId = `${btn.dataset.tab}Tab`;
            document.getElementById(tabId).classList.add('active');
            
            // Load admin prompts when switching to admin tab
            if (btn.dataset.tab === 'admin') {
                loadAdminPrompts();
            }
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
