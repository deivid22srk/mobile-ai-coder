// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const btnSend = document.getElementById('btn-send');
const lblWorkspace = document.getElementById('lbl-workspace');
const agentStatusBar = document.getElementById('agent-status-bar');
const statusText = document.getElementById('status-text');

// Modals
const modalSettings = document.getElementById('modal-settings');
const modalExplorer = document.getElementById('modal-explorer');
const modalTerminal = document.getElementById('modal-terminal');
const modalThought = document.getElementById('modal-thought');

// Menu buttons
const btnSettings = document.getElementById('btn-settings');
const btnExplorer = document.getElementById('btn-explorer');
const btnTerminal = document.getElementById('btn-terminal');
const headerModelSelect = document.getElementById('header-model-select');

// Configuration fields
const cfgApiUrl = document.getElementById('cfg-api-url');
const cfgApiKey = document.getElementById('cfg-api-key');
const cfgModel = document.getElementById('cfg-model');
const cfgWorkspace = document.getElementById('cfg-workspace');
const cfgSystemPrompt = document.getElementById('cfg-system-prompt');
const btnSettingsSave = document.getElementById('btn-settings-save');
const btnSettingsTest = document.getElementById('btn-settings-test');

// File Explorer Panel
const btnRefreshFiles = document.getElementById('btn-refresh-files');
const fileTreeContainer = document.getElementById('file-tree-container');
const editorFileTitle = document.getElementById('editor-file-title');
const btnSaveFile = document.getElementById('btn-save-file');
const editorTextarea = document.getElementById('editor-textarea');

// Terminal Modal
const termCommand = document.getElementById('term-command');
const btnRunTerm = document.getElementById('btn-run-term');
const terminalStdout = document.getElementById('terminal-stdout');

// State
let conversationHistory = [];
let appConfig = null;
let activeEditorFile = null;

// Initialize
async function init() {
  await loadSettings();
  setupEventListeners();
  autoResizeTextarea(chatInput);
  await loadApiModels();
}

// Load Settings from Backend
async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    appConfig = await res.json();
    
    // Update labels and inputs
    lblWorkspace.textContent = appConfig.workspacePath;
    cfgApiUrl.value = appConfig.apiUrl;
    cfgApiKey.value = appConfig.apiKey;
    cfgModel.value = appConfig.model;
    cfgWorkspace.value = appConfig.workspacePath;
    cfgSystemPrompt.value = appConfig.systemPrompt;
  } catch (err) {
    console.error("Error loading configurations:", err);
    alert("Could not connect to the backend server. Make sure it is running.");
  }
}

// Event Listeners Setup
function setupEventListeners() {
  // Modal toggle actions
  btnSettings.addEventListener('click', () => toggleModal(modalSettings, true));
  btnExplorer.addEventListener('click', () => {
    toggleModal(modalExplorer, true);
    loadWorkspaceFiles();
  });
  btnTerminal.addEventListener('click', () => toggleModal(modalTerminal, true));

  // Close buttons inside modals
  document.querySelectorAll('.close-button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const overlay = e.target.closest('.modal-overlay');
      toggleModal(overlay, false);
    });
  });

  // Settings save and test
  btnSettingsSave.addEventListener('click', saveSettings);
  btnSettingsTest.addEventListener('click', testApiConnection);

  // Send message
  btnSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  chatInput.addEventListener('focus', () => {
    setTimeout(scrollToBottom, 250);
  });

  // File explorer Refresh and Save
  btnRefreshFiles.addEventListener('click', loadWorkspaceFiles);
  btnSaveFile.addEventListener('click', saveActiveFile);

  // Manual terminal run
  btnRunTerm.addEventListener('click', runManualCommand);
  termCommand.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      runManualCommand();
    }
  });

  // Editor title click (for back to files navigation on mobile)
  editorFileTitle.addEventListener('click', () => {
    const splitView = document.querySelector('.split-view');
    if (splitView && splitView.classList.contains('editor-active')) {
      splitView.classList.remove('editor-active');
      editorFileTitle.textContent = "No file selected";
      editorTextarea.value = "";
      editorTextarea.setAttribute('readonly', 'true');
      btnSaveFile.classList.add('hidden');
      activeEditorFile = null;
    }
  });

  // Header model dropdown change
  headerModelSelect.addEventListener('change', async () => {
    const selectedModel = headerModelSelect.value;
    if (!selectedModel || !appConfig) return;
    appConfig.model = selectedModel;
    cfgModel.value = selectedModel;
    // Save to backend silently
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel })
      });
    } catch (err) {
      console.error('Failed to save model selection:', err);
    }
  });
}

// Helper to toggle modals
function toggleModal(modal, show) {
  if (show) {
    modal.classList.remove('hidden');
  } else {
    modal.classList.add('hidden');
  }
}

// Auto Resize Input Textarea
function autoResizeTextarea(textarea) {
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight - 8) + 'px';
  });
}

// Load models from API and populate header dropdown
async function loadApiModels() {
  try {
    const res = await fetch('/api/models');
    const data = await res.json();
    const models = data.models || [];

    headerModelSelect.innerHTML = '';

    if (models.length === 0) {
      const opt = document.createElement('option');
      opt.value = appConfig?.model || 'qwen-plus';
      opt.textContent = appConfig?.model || 'qwen-plus';
      headerModelSelect.appendChild(opt);
      return;
    }

    // Ensure current model is in the list
    const currentModel = appConfig?.model || '';
    if (currentModel && !models.includes(currentModel)) {
      models.unshift(currentModel);
    }

    models.forEach(modelId => {
      const opt = document.createElement('option');
      opt.value = modelId;
      opt.textContent = modelId;
      if (modelId === currentModel) {
        opt.selected = true;
      }
      headerModelSelect.appendChild(opt);
    });
  } catch (err) {
    console.error('Failed to load models:', err);
    headerModelSelect.innerHTML = `<option value="${appConfig?.model || 'qwen-plus'}">${appConfig?.model || 'qwen-plus'}</option>`;
  }
}

// Save Settings
async function saveSettings() {
  const payload = {
    apiUrl: cfgApiUrl.value.trim(),
    apiKey: cfgApiKey.value.trim(),
    model: cfgModel.value.trim(),
    workspacePath: cfgWorkspace.value.trim(),
    systemPrompt: cfgSystemPrompt.value.trim()
  };

  btnSettingsSave.disabled = true;
  btnSettingsSave.textContent = 'Saving...';

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      appConfig = data.config;
      lblWorkspace.textContent = appConfig.workspacePath;
      headerModelSelect.value = appConfig.model;
      toggleModal(modalSettings, false);
      loadApiModels(); // Refresh models list in case API URL changed
      alert('Settings saved successfully.');
    } else {
      alert('Error saving settings: ' + data.error);
    }
  } catch (err) {
    alert('Failed to connect to backend.');
  } finally {
    btnSettingsSave.disabled = false;
    btnSettingsSave.textContent = 'Save Changes';
  }
}

// Test API Connection
async function testApiConnection() {
  btnSettingsTest.disabled = true;
  btnSettingsTest.textContent = 'Testing...';

  try {
    const testPayload = {
      model: cfgModel.value.trim(),
      messages: [{ role: 'user', content: 'Say hello in 3 words' }],
      max_tokens: 10
    };

    const res = await fetch(`${cfgApiUrl.value.trim()}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfgApiKey.value.trim()}`
      },
      body: JSON.stringify(testPayload)
    });

    if (res.ok) {
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || 'Empty response';
      alert(`Connection Successful!\nLLM responded: "${text}"`);
    } else {
      const errText = await res.text();
      alert(`Connection Failed!\nStatus: ${res.status}\nError: ${errText}`);
    }
  } catch (err) {
    alert(`Connection Failed!\nNetwork Error: ${err.message}`);
  } finally {
    btnSettingsTest.disabled = false;
    btnSettingsTest.textContent = 'Test API Connection';
  }
}

// Load files list into workspace explorer tree
async function loadWorkspaceFiles() {
  fileTreeContainer.innerHTML = '<span class="loading-indicator">Reading workspace...</span>';
  try {
    const res = await fetch('/api/files');
    const data = await res.json();
    renderFileTree(data.files, fileTreeContainer);
  } catch (err) {
    fileTreeContainer.innerHTML = `<span style="color: var(--color-accent)">Failed to load workspace files: ${err.message}</span>`;
  }
}

// Render Workspace File Tree recursively
function renderFileTree(nodes, container) {
  container.innerHTML = '';
  if (!nodes || nodes.length === 0) {
    container.innerHTML = '<span class="loading-indicator">Workspace folder is empty.</span>';
    return;
  }

  function createNodeElement(node) {
    const nodeEl = document.createElement('div');
    nodeEl.className = 'tree-node';

    const rowEl = document.createElement('div');
    rowEl.className = 'tree-row';

    const iconEl = document.createElement('span');
    iconEl.className = 'tree-icon';
    if (node.isDirectory) {
      iconEl.innerHTML = '📁';
    } else {
      iconEl.innerHTML = '📄';
    }

    const nameEl = document.createElement('span');
    nameEl.textContent = node.name;

    // Display file size in tree
    if (!node.isDirectory && node.size !== undefined) {
      const sizeKB = (node.size / 1024).toFixed(1);
      const sizeEl = document.createElement('span');
      sizeEl.className = 'field-help';
      sizeEl.style.display = 'inline';
      sizeEl.style.marginLeft = '6px';
      sizeEl.textContent = `(${sizeKB} KB)`;
      nameEl.appendChild(sizeEl);
    }

    rowEl.appendChild(iconEl);
    rowEl.appendChild(nameEl);
    nodeEl.appendChild(rowEl);

    if (node.isDirectory) {
      const childrenEl = document.createElement('div');
      childrenEl.className = 'tree-node-children hidden';

      // Toggle dir contents on click
      rowEl.addEventListener('click', (e) => {
        e.stopPropagation();
        childrenEl.classList.toggle('hidden');
        iconEl.innerHTML = childrenEl.classList.contains('hidden') ? '📁' : '📂';
      });

      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          childrenEl.appendChild(createNodeElement(child));
        });
      } else {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'tree-node';
        emptyEl.style.paddingLeft = '20px';
        emptyEl.style.color = 'var(--color-text-sub)';
        emptyEl.style.fontSize = '0.75rem';
        emptyEl.textContent = '(empty)';
        childrenEl.appendChild(emptyEl);
      }
      nodeEl.appendChild(childrenEl);
    } else {
      // File Node Click
      rowEl.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.tree-row').forEach(row => row.classList.remove('selected'));
        rowEl.classList.add('selected');
        openFile(node.relativePath);
      });
    }

    return nodeEl;
  }

  nodes.forEach(node => {
    container.appendChild(createNodeElement(node));
  });
}

// Open File in Viewer/Editor
async function openFile(relativePath) {
  editorTextarea.value = "Loading file content...";
  editorTextarea.setAttribute('readonly', 'true');
  btnSaveFile.classList.add('hidden');

  try {
    const res = await fetch(`/api/file/view?path=${encodeURIComponent(relativePath)}`);
    const data = await res.json();
    
    if (res.ok) {
      activeEditorFile = relativePath;
      
      // Responsive slide-over transition: If mobile, hide tree panel and focus editor
      const splitView = document.querySelector('.split-view');
      const isMobile = window.innerWidth <= 768;
      
      if (isMobile) {
        editorFileTitle.innerHTML = `&larr; Back to Files | <span style="font-family: monospace; color:#C4622D">${relativePath}</span>`;
        editorFileTitle.style.cursor = 'pointer';
        splitView.classList.add('editor-active');
      } else {
        editorFileTitle.innerHTML = `<span style="font-family: monospace; color:#C4622D">${relativePath}</span>`;
        editorFileTitle.style.cursor = 'default';
      }

      editorTextarea.value = data.content;
      editorTextarea.removeAttribute('readonly');
      btnSaveFile.classList.remove('hidden');
    } else {
      editorFileTitle.textContent = "Error loading file";
      editorTextarea.value = "Failed to load: " + data.error;
    }
  } catch (err) {
    editorFileTitle.textContent = "Connection Error";
    editorTextarea.value = "Could not fetch file content from backend server.";
  }
}

// Save active file changes
async function saveActiveFile() {
  if (!activeEditorFile) return;

  btnSaveFile.disabled = true;
  btnSaveFile.textContent = "Saving...";

  try {
    const res = await fetch('/api/file/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: activeEditorFile,
        content: editorTextarea.value
      })
    });
    
    if (res.ok) {
      alert(`File "${activeEditorFile}" saved successfully.`);
      loadWorkspaceFiles(); // Refresh size in list
    } else {
      const data = await res.json();
      alert(`Failed to save: ${data.error}`);
    }
  } catch (err) {
    alert("Connection Error. Could not connect to backend server.");
  } finally {
    btnSaveFile.disabled = false;
    btnSaveFile.textContent = "Save File";
  }
}

// Run manual command in Terminal modal
async function runManualCommand() {
  const cmd = termCommand.value.trim();
  if (!cmd) return;

  btnRunTerm.disabled = true;
  btnRunTerm.textContent = 'Running...';
  terminalStdout.textContent = `$ ${cmd}\n\nRunning command...`;

  try {
    const res = await fetch('/api/terminal/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmd })
    });
    const data = await res.json();
    terminalStdout.textContent = `$ ${cmd}\n\n${data.output || data.error}`;
  } catch (err) {
    terminalStdout.textContent = `$ ${cmd}\n\nFailed to connect to backend: ${err.message}`;
  } finally {
    btnRunTerm.disabled = false;
    btnRunTerm.textContent = 'Run';
    termCommand.value = '';
  }
}

// Render markdown layout blocks inside chat
function parseMarkdown(text) {
  if (!text) return '';
  
  // HTML escaping to avoid layout break
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Handle multiline code blocks ```lang ... ```
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  html = html.replace(codeBlockRegex, (match, lang, code) => {
    const cleanCode = code.trim();
    const langLabel = lang || 'code';
    return `
      <div class="code-block-wrapper">
        <div class="code-block-header">
          <span>${langLabel}</span>
          <button class="copy-btn" onclick="copyToClipboard(this)">Copy</button>
        </div>
        <pre><code class="language-${langLabel}">${cleanCode}</code></pre>
      </div>
    `;
  });

  // Handle inline code `code`
  html = html.replace(/`([^`\n]+)`/g, '<span class="code-span">$1</span>');

  // Convert double newlines to paragraph structure, keeping linebreaks inside
  html = html.split('\n\n').map(para => {
    if (para.includes('code-block-wrapper')) return para; // Skip code blocks wrap
    return `<p>${para.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  return html;
}

// Global Copy Code utility
window.copyToClipboard = (btn) => {
  const codeEl = btn.closest('.code-block-wrapper').querySelector('code');
  if (!codeEl) return;
  
  navigator.clipboard.writeText(codeEl.innerText).then(() => {
    btn.textContent = 'Copied!';
    setTimeout(() => {
      btn.textContent = 'Copy';
    }, 2000);
  }).catch(err => {
    console.error('Copy failed:', err);
  });
};

// Global Tool Block toggle utility
window.toggleToolBody = (id) => {
  const body = document.getElementById(`tool-body-${id}`);
  if (body) {
    body.classList.toggle('hidden');
  }
};

// Append user message in Chat UI
function appendUserMessage(content) {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message user-message';
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'msg-content';
  contentDiv.innerHTML = `<span class="prompt-tag">&gt;</span>${content.replace(/\n/g, '<br>')}`;
  
  msgDiv.appendChild(contentDiv);
  chatMessages.appendChild(msgDiv);
  scrollToBottom();
}

// Scroll chat panel to bottom
function scrollToBottom() {
  chatMessages.parentElement.scrollTop = chatMessages.parentElement.scrollHeight;
}

// Send Message Stream to Agent Backend
async function sendMessage() {
  const content = chatInput.value.trim();
  if (!content) return;

  // Append user message
  appendUserMessage(content);
  conversationHistory.push({ role: 'user', content });

  // Reset Input UI
  chatInput.value = '';
  chatInput.style.height = 'auto';
  chatInput.disabled = true;
  btnSend.disabled = true;

  // Show Agent Status Bar
  agentStatusBar.classList.remove('hidden');
  statusText.textContent = 'Thinking...';

  // State elements for dynamic segment segmentation
  let currentAssistantMsgDiv = null;
  let currentAssistantContentDiv = null;
  let assistantTextAccumulator = '';
  let activeReasoningText = '';
  
  const thoughtContentPre = document.getElementById('thought-content-pre');
  if (thoughtContentPre) {
    thoughtContentPre.textContent = 'Aguardando pensamentos...';
  }

  // Helper function to dynamically append new message blocks in chronology
  const ensureAssistantMessageBlock = () => {
    if (!currentAssistantMsgDiv) {
      currentAssistantMsgDiv = document.createElement('div');
      currentAssistantMsgDiv.className = 'message assistant-message';
      currentAssistantContentDiv = document.createElement('div');
      currentAssistantContentDiv.className = 'msg-content';
      currentAssistantMsgDiv.appendChild(currentAssistantContentDiv);
      chatMessages.appendChild(currentAssistantMsgDiv);
      assistantTextAccumulator = '';
      scrollToBottom();
    }
  };

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversationHistory })
    });

    if (!response.ok) {
      throw new Error(`API returned error code ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let streamBuffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      streamBuffer += decoder.decode(value, { stream: true });
      const lines = streamBuffer.split('\n');
      streamBuffer = lines.pop(); // Keep partial line in buffer

      for (const line of lines) {
        if (!line.trim().startsWith('data: ')) continue;
        const jsonStr = line.trim().slice(6);
        
        try {
          const payload = JSON.parse(jsonStr);

          switch (payload.type) {
            case 'status':
              // "Doodling..." or "Thinking..." badge status
              statusText.textContent = payload.content;
              break;

            case 'reasoning':
              // Accumulate and display thought process in real-time
              activeReasoningText += payload.content;
              if (thoughtContentPre) {
                thoughtContentPre.textContent = activeReasoningText;
              }
              
              // Display live preview of thoughts in status bar
              statusText.innerHTML = `<span style="color:var(--color-accent)">🧠 Pensando:</span> ${payload.content.trim().slice(-40)}...`;

              // Ensure we have a bubble container to attach thoughts modal button
              ensureAssistantMessageBlock();

              // Create thought toggle button in chat bubble if it doesn't exist
              let btnThought = currentAssistantMsgDiv.querySelector('.thought-btn');
              if (!btnThought) {
                btnThought = document.createElement('button');
                btnThought.className = 'thought-btn';
                btnThought.innerHTML = `🧠 Ver Pensamento`;
                btnThought.addEventListener('click', () => {
                  toggleModal(modalThought, true);
                });
                currentAssistantMsgDiv.appendChild(btnThought);
              }
              break;

            case 'text':
              // Ensure active container block exists
              ensureAssistantMessageBlock();

              // Streaming assistant text
              assistantTextAccumulator += payload.content;
              currentAssistantContentDiv.innerHTML = parseMarkdown(assistantTextAccumulator);
              
              // Ensure the thought button stays at the bottom of the content
              let btnT = currentAssistantMsgDiv.querySelector('.thought-btn');
              if (btnT) {
                currentAssistantMsgDiv.appendChild(btnT); // Move to end of div
              }
              
              scrollToBottom();
              break;

            case 'tool_start':
              // Reset pointer references so subsequent text starts a NEW bubble below the tool card
              currentAssistantMsgDiv = null;
              currentAssistantContentDiv = null;

              // Render new Tool Card running
              statusText.textContent = `Running tool: ${payload.name}...`;
              createToolCardElement(payload.id, payload.name, payload.args);
              scrollToBottom();
              break;

            case 'tool_output':
              // Stream terminal output chunk by chunk
              const outputEl = document.getElementById(`tool-out-${payload.id}`);
              if (outputEl) {
                if (outputEl.textContent === 'Working...' || outputEl.textContent === 'Executing...') {
                  outputEl.textContent = '';
                }
                outputEl.textContent += payload.content;
                outputEl.scrollTop = outputEl.scrollHeight;
              }
              break;

            case 'tool_end':
              // Finalize the Tool Card rendering
              statusText.textContent = `Completed tool: ${payload.name}`;
              finalizeToolCardElement(payload.id, payload.name, payload.output);
              scrollToBottom();
              break;

            case 'error':
              // Ensure active container block exists
              ensureAssistantMessageBlock();

              // Render connection error inline
              const errDiv = document.createElement('div');
              errDiv.style.color = 'var(--color-accent)';
              errDiv.style.fontFamily = 'monospace';
              errDiv.style.padding = '8px';
              errDiv.style.backgroundColor = '#1C1310';
              errDiv.style.border = '1px solid var(--color-accent)';
              errDiv.style.borderRadius = '4px';
              errDiv.textContent = `Error: ${payload.content}`;
              currentAssistantContentDiv.appendChild(errDiv);
              scrollToBottom();
              break;

            case 'done':
              // Finished streaming response
              break;
          }
        } catch (parseErr) {
          console.error("Error parsing stream chunk:", line, parseErr);
        }
      }
    }

    // Save final response text in history
    if (assistantTextAccumulator) {
      conversationHistory.push({ role: 'assistant', content: assistantTextAccumulator });
    }

  } catch (err) {
    console.error("Chat streaming error:", err);
    ensureAssistantMessageBlock();
    currentAssistantContentDiv.innerHTML += `<p style="color:#C4622D; font-family:monospace;">System Error: ${err.message}</p>`;
    scrollToBottom();
  } finally {
    // Re-enable chat UI
    chatInput.disabled = false;
    btnSend.disabled = false;
    agentStatusBar.classList.add('hidden');
    chatInput.focus();
  }
}

// Create Tool execution log card
function createToolCardElement(id, name, args) {
  const toolEl = document.createElement('div');
  toolEl.className = 'tool-box running';
  toolEl.id = `tool-${id}`;

  const cleanArgs = typeof args === 'string' ? args : JSON.stringify(args, null, 2);

  toolEl.innerHTML = `
    <div class="tool-header" onclick="toggleToolBody('${id}')">
      <div class="tool-header-left">
        <span class="tool-spinner"></span>
        <span class="tool-title-text">Running <strong>${name}</strong>...</span>
      </div>
      <span class="tool-badge">${name}</span>
    </div>
    <div class="tool-body" id="tool-body-${id}">
      <div class="tool-params">Parameters:</div>
      <pre style="margin-top:0;"><code style="font-size:0.75rem;">${cleanArgs}</code></pre>
      <div class="tool-params">Execution Log:</div>
      <div class="tool-output" id="tool-out-${id}">Working...</div>
    </div>
  `;

  chatMessages.appendChild(toolEl);
}

// Update completed Tool Card element
function finalizeToolCardElement(id, name, output) {
  const toolEl = document.getElementById(`tool-${id}`);
  if (!toolEl) return;

  toolEl.classList.remove('running');
  
  // Icon and label check
  const headerLeft = toolEl.querySelector('.tool-header-left');
  
  let isError = output.startsWith('Error') || output.startsWith('[Error]') || output.includes('Error executing tool');
  
  if (isError) {
    headerLeft.innerHTML = `
      <span class="tool-error-indicator">✖</span>
      <span class="tool-title-text" style="color:#E53E3E">Failed running <strong>${name}</strong></span>
    `;
  } else {
    headerLeft.innerHTML = `
      <span class="tool-success-indicator">✔</span>
      <span class="tool-title-text">Ran <strong>${name}</strong> successfully</span>
    `;
  }

  // Set output log text
  const outputEl = document.getElementById(`tool-out-${id}`);
  if (outputEl) {
    outputEl.textContent = output || '(empty output)';
  }

  // Collapse the tool body details list automatically after successful execution
  const bodyEl = document.getElementById(`tool-body-${id}`);
  if (bodyEl && !isError) {
    bodyEl.classList.add('hidden');
  }
}

// Run initializer
document.addEventListener('DOMContentLoaded', init);
