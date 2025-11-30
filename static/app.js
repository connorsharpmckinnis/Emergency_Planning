console.log('App.js script starting...');



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

    /**
     * Handle async button operations with loading states and error handling
     * @param {HTMLElement} button - Button element to manage
     * @param {Function} asyncOperation - Async function to execute
     * @param {Object} options - Configuration options
     * @returns {Promise} Result from asyncOperation
     */
    async function handleAsyncButton(button, asyncOperation, options = {}) {
        const {
            loadingText = 'Loading...',
            loadingClass = null,
            useTextContent = false,
            errorMessage = 'Operation failed. Please try again.',
            successMessage = null
        } = options;
        
        // Save original state
        const originalContent = button.innerHTML;
        const originalDisabled = button.disabled;
        
        try {
            // Set loading state
            button.disabled = true;
            if (loadingClass) {
                button.classList.add(loadingClass);
            } else {
                if (useTextContent) {
                    button.textContent = loadingText;
                } else {
                    button.innerHTML = loadingText;
                }
            }
            
            // Execute the async operation
            const result = await asyncOperation();
            
            // Show success message if provided
            if (successMessage) {
                if (typeof successMessage === 'function') {
                    alert(successMessage(result));
                } else {
                    alert(successMessage);
                }
            }
            
            return result;
            
        } catch (error) {
            console.error('Error:', error);
            alert(errorMessage);
            throw error;
            
        } finally {
            // Restore original state
            button.disabled = originalDisabled;
            if (loadingClass) {
                button.classList.remove(loadingClass);
            } else {
                button.innerHTML = originalContent;
            }
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

    // Magic Prompt Button Logic
    const magicPromptBtn = document.getElementById('magicPromptBtn');
    if (magicPromptBtn) {
        magicPromptBtn.addEventListener('click', async () => {
            if (magicPromptBtn.disabled) return;
            
            await handleAsyncButton(
                magicPromptBtn,
                async () => {
                    const response = await fetch('/generate-prompt-suggestion', {
                        method: 'POST'
                    });
                    if (!response.ok) throw new Error('Failed to generate prompt');
                    const data = await response.json();
                    topicInput.value = data.prompt;
                },
                {
                    loadingClass: 'loading',
                    errorMessage: 'Failed to generate prompt suggestion.'
                }
            );
        });
    }

    // Store current scenario data for save/export
    let currentScenarioData = null;

    // Save JSON Button
    const saveJsonBtn = document.getElementById('saveJsonBtn');
    if (saveJsonBtn) {
        saveJsonBtn.addEventListener('click', async () => {
            if (!currentScenarioData) return;
            
            await handleAsyncButton(
                saveJsonBtn,
                async () => {
                    const response = await fetch('/save-scenario', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ scenario: currentScenarioData })
                    });
                    if (!response.ok) throw new Error('Save failed');
                    return await response.json();
                },
                {
                    loadingText: 'Saving...',
                    errorMessage: 'Failed to save scenario. Please try again.',
                    successMessage: (result) => `Scenario saved successfully as ${result.filename}`
                }
            );
        });
    }

    // Export PDF Button
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', async () => {
            if (!currentScenarioData) return;
            
            await handleAsyncButton(
                exportPdfBtn,
                async () => {
                    const response = await fetch('/export-pdf', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ scenario: currentScenarioData })
                    });
                    if (!response.ok) throw new Error('PDF export failed');
                    
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
                },
                {
                    loadingText: 'Generating PDF...',
                    errorMessage: 'Failed to export PDF. Please try again.',
                    successMessage: 'PDF downloaded successfully!'
                }
            );
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
            
            // Render specialist cards dynamically
            const container = document.getElementById('specialistPromptsContainer');
            if (container && prompts.specialists) {
                const specialists = Object.keys(prompts.specialists);
                
                // Helper to get emoji for domain
                const getEmoji = (domain) => {
                    const map = {
                        'fire': '🔥', 'police': '👮', 'medical': '🏥', 
                        'utilities': '⚡', 'transport': '🚗'
                    };
                    return map[domain] || '🔧';
                };
                
                container.innerHTML = specialists.map(domain => `
                    <div class="specialist-card" data-domain="${domain}">
                        <h4>${getEmoji(domain)} ${domain.charAt(0).toUpperCase() + domain.slice(1)}</h4>
                        <label>Description</label>
                        <textarea id="${domain}-description" rows="3" placeholder="Describe focus areas...">${prompts.specialists[domain].description || ''}</textarea>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading prompts:', error);
            alert('Failed to load prompts configuration');
        }
    }

    // Save orchestrator prompt
    const saveOrchestratorBtn = document.getElementById('saveOrchestratorBtn');
    if (saveOrchestratorBtn) {
        saveOrchestratorBtn.addEventListener('click', async () => {
            await handleAsyncButton(
                saveOrchestratorBtn,
                async () => {
                    // Get current prompts
                    const response = await fetch('/api/prompts');
                    const prompts = await response.json();
                    
                    // Update orchestrator prompt
                    prompts.orchestrator_prompt = document.getElementById('orchestratorPrompt').value;
                    
                    // Save back
                    const saveResponse = await fetch('/api/prompts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(prompts)
                    });
                    
                    if (!saveResponse.ok) throw new Error('Save failed');
                },
                {
                    loadingText: 'Saving...',
                    errorMessage: '❌ Failed to save orchestrator prompt',
                    successMessage: '✅ Orchestrator prompt saved successfully!'
                }
            );
        });
    }

    // Save specialist prompts
    const saveSpecialistsBtn = document.getElementById('saveSpecialistsBtn');
    if (saveSpecialistsBtn) {
        saveSpecialistsBtn.addEventListener('click', async () => {
            await handleAsyncButton(
                saveSpecialistsBtn,
                async () => {
                    // Get current prompts
                    const response = await fetch('/api/prompts');
                    const prompts = await response.json();
                    
                    // Update base prompt
                    prompts.specialist_base_prompt = document.getElementById('specialistBasePrompt').value;
                    
                    // Update specialist descriptions from DOM
                    const container = document.getElementById('specialistPromptsContainer');
                    if (container) {
                        const cards = container.querySelectorAll('.specialist-card');
                        cards.forEach(card => {
                            const domain = card.dataset.domain;
                            const textarea = document.getElementById(`${domain}-description`);
                            if (domain && textarea && prompts.specialists && prompts.specialists[domain]) {
                                prompts.specialists[domain].description = textarea.value;
                            }
                        });
                    }
                    
                    // Save back
                    const saveResponse = await fetch('/api/prompts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(prompts)
                    });
                    
                    if (!saveResponse.ok) throw new Error('Save failed');
                },
                {
                    loadingText: 'Saving...',
                    errorMessage: '❌ Failed to save specialist prompts',
                    successMessage: '✅ Specialist prompts saved successfully!'
                }
            );
        });
    }

    // Vector Store File Management
    const fileManager = {
        currentDomain: 'fire',
        
        init() {
            this.setupDynamicTabs();
            this.setupUpload();
            this.setupRefresh();
            // loadFiles will be called after tabs are set up
        },
        
        async setupDynamicTabs() {
            const container = document.getElementById('domainTabsContainer');
            if (!container) return;
            
            try {
                // Fetch available specialists from prompts
                const response = await fetch('/api/prompts');
                if (!response.ok) throw new Error('Failed to load prompts');
                const prompts = await response.json();
                const specialists = Object.keys(prompts.specialists || {});
                
                if (specialists.length === 0) {
                    container.innerHTML = '<div class="error-message">No specialists found</div>';
                    return;
                }
                
                // Set initial domain if not set or invalid
                if (!this.currentDomain || !specialists.includes(this.currentDomain)) {
                    this.currentDomain = specialists[0];
                }
                
                // Render tabs
                container.innerHTML = specialists.map(domain => {
                    const label = domain.charAt(0).toUpperCase() + domain.slice(1);
                    const isActive = domain === this.currentDomain ? 'active' : '';
                    return `<button class="domain-tab ${isActive}" data-domain="${domain}">${label}</button>`;
                }).join('');
                
                // Add event listeners
                const tabs = container.querySelectorAll('.domain-tab');
                tabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        tabs.forEach(t => t.classList.remove('active'));
                        tab.classList.add('active');
                        this.currentDomain = tab.dataset.domain;
                        this.loadFiles();
                    });
                });
                
                // Initial load
                this.loadFiles();
                
            } catch (error) {
                console.error('Error setting up tabs:', error);
                container.innerHTML = '<div class="error-message">Failed to load specialist tabs</div>';
            }
        },
        
        setupRefresh() {
            const refreshBtn = document.getElementById('refreshFilesBtn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => this.loadFiles());
            }
        },
        
        async loadFiles() {
            const container = document.getElementById('fileListContainer');
            container.innerHTML = '<div class="empty-state">Loading files...</div>';
            
            try {
                const response = await fetch(`/api/vector-stores/${this.currentDomain}/files`);
                if (!response.ok) throw new Error('Failed to load files');
                
                const files = await response.json();
                this.renderFiles(files);
            } catch (error) {
                console.error('Error loading files:', error);
                container.innerHTML = '<div class="empty-state error">Failed to load files</div>';
            }
        },
        
        renderFiles(files) {
            const container = document.getElementById('fileListContainer');
            if (!files || files.length === 0) {
                container.innerHTML = '<div class="empty-state">No files indexed for this domain</div>';
                return;
            }
            
            container.innerHTML = files.map(file => `
                <div class="file-item">
                    <div class="file-info">
                        <span class="file-icon">📄</span>
                        <div>
                            <div class="file-name">${file.display_name || file.name}</div>
                            <div class="file-meta">Uploaded: ${new Date(file.create_time).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <button class="delete-file-btn" data-id="${file.name}" title="Delete File">
                        🗑️
                    </button>
                </div>
            `).join('');
            
            // Add delete listeners
            container.querySelectorAll('.delete-file-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.deleteFile(e.currentTarget.dataset.id));
            });
        },
        
        setupUpload() {
            const uploadArea = document.getElementById('uploadArea');
            const fileInput = document.getElementById('fileInput');
            const browseLink = document.getElementById('browseFilesLink');
            
            if (!uploadArea || !fileInput) return;
            
            // Click to browse
            uploadArea.addEventListener('click', (e) => {
                if (e.target !== browseLink) fileInput.click();
            });
            
            browseLink.addEventListener('click', (e) => {
                e.preventDefault();
                fileInput.click();
            });
            
            // Drag & Drop
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                uploadArea.addEventListener(eventName, preventDefaults, false);
            });
            
            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            ['dragenter', 'dragover'].forEach(eventName => {
                uploadArea.addEventListener(eventName, () => uploadArea.classList.add('dragover'), false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('dragover'), false);
            });
            
            uploadArea.addEventListener('drop', (e) => {
                const files = e.dataTransfer.files;
                this.handleFiles(files);
            });
            
            fileInput.addEventListener('change', () => {
                this.handleFiles(fileInput.files);
            });
        },
        
        async handleFiles(files) {
            const status = document.getElementById('uploadStatus');
            status.classList.remove('hidden', 'success', 'error');
            status.classList.add('uploading');
            status.textContent = `Uploading ${files.length} file(s)...`;
            
            let successCount = 0;
            let errorCount = 0;
            
            for (const file of files) {
                try {
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    const response = await fetch(`/api/vector-stores/${this.currentDomain}/files`, {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (!response.ok) throw new Error('Upload failed');
                    successCount++;
                } catch (error) {
                    console.error('Upload error:', error);
                    errorCount++;
                }
            }
            
            status.classList.remove('uploading');
            if (errorCount === 0) {
                status.classList.add('success');
                status.textContent = `✅ Successfully uploaded ${successCount} file(s)`;
                this.loadFiles();
            } else {
                status.classList.add('error');
                status.textContent = `⚠️ Uploaded ${successCount} files, ${errorCount} failed`;
            }
            
            // Clear status after 3 seconds
            setTimeout(() => {
                status.classList.add('hidden');
            }, 3000);
        },
        
        async deleteFile(fileId) {
            if (!confirm('Are you sure you want to delete this file?')) return;
            
            try {
                const response = await fetch(`/api/vector-stores/${this.currentDomain}/files/${encodeURIComponent(fileId)}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) throw new Error('Delete failed');
                
                this.loadFiles();
            } catch (error) {
                console.error('Delete error:', error);
                alert('Failed to delete file');
            }
        }
    };

    // Initialize File Manager
    fileManager.init();

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
