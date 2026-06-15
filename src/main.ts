import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import bash from 'highlight.js/lib/languages/bash';
import python from 'highlight.js/lib/languages/python';
import markdown from 'highlight.js/lib/languages/markdown';
import diff from 'highlight.js/lib/languages/diff';
import yaml from 'highlight.js/lib/languages/yaml';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('css', css);
hljs.registerLanguage('json', json);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);
hljs.registerLanguage('diff', diff);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);

import { AppConfig, Chat, Message, SSEEvent, GitHubUser } from './types';

// DOM Elements
export const chatMessages = document.getElementById('chat-messages') as HTMLDivElement;
export const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
export const btnSend = document.getElementById('btn-send') as HTMLButtonElement;
export const lblWorkspace = document.getElementById('lbl-workspace') as HTMLSpanElement;
export const agentStatusBar = document.getElementById('agent-status-bar') as HTMLDivElement;
export const statusText = document.getElementById('status-text') as HTMLSpanElement;

// Drawer Elements
export const chatDrawer = document.getElementById('chat-drawer') as HTMLElement;
export const btnToggleDrawer = document.getElementById('btn-toggle-drawer') as HTMLButtonElement;
export const btnNewChat = document.getElementById('btn-new-chat') as HTMLButtonElement;
export const chatsList = document.getElementById('chats-list') as HTMLDivElement;
export const drawerOverlay = document.getElementById('drawer-overlay') as HTMLDivElement;

// Modals
export const screenSettings = document.getElementById('screen-settings') as HTMLDivElement;
export const modalModelPicker = document.getElementById('modal-model-picker') as HTMLDivElement;
export const modalExplorer = document.getElementById('modal-explorer') as HTMLDivElement;
export const modalTerminal = document.getElementById('modal-terminal') as HTMLDivElement;

// Menu buttons
export const btnSettings = document.getElementById('btn-settings') as HTMLButtonElement;
export const btnSettingsBack = document.getElementById('btn-settings-back') as HTMLButtonElement;
export const btnExplorer = document.getElementById('btn-explorer') as HTMLButtonElement;
export const btnTerminal = document.getElementById('btn-terminal') as HTMLButtonElement;
export const headerModelTrigger = document.getElementById('header-model-trigger') as HTMLButtonElement;
export const headerModelLabel = document.getElementById('header-model-label') as HTMLSpanElement;
export const btnPickModel = document.getElementById('btn-pick-model') as HTMLButtonElement;
export const modelPickerSearch = document.getElementById('model-picker-search') as HTMLInputElement;
export const modelPickerClear = document.getElementById('model-picker-clear') as HTMLButtonElement;
export const modelPickerList = document.getElementById('model-picker-list') as HTMLDivElement;
export const modelPickerCount = document.getElementById('model-picker-count') as HTMLSpanElement;
export const modelPickerActive = document.getElementById('model-picker-active') as HTMLSpanElement;

export const btnPickerProviderCustom = document.getElementById('btn-picker-provider-custom') as HTMLButtonElement;
export const btnPickerProviderZen = document.getElementById('btn-picker-provider-zen') as HTMLButtonElement;

// Configuration fields
export const cfgProvider = document.getElementById('cfg-provider') as HTMLSelectElement;
export const cfgApiUrl = document.getElementById('cfg-api-url') as HTMLInputElement;
export const cfgApiKey = document.getElementById('cfg-api-key') as HTMLInputElement;
export const cfgOpencodeZenApiKey = document.getElementById('cfg-opencode-zen-api-key') as HTMLInputElement;
export const cfgModel = document.getElementById('cfg-model') as HTMLInputElement;
export const cfgWorkspace = document.getElementById('cfg-workspace') as HTMLInputElement;
export const cfgSystemPrompt = document.getElementById('cfg-system-prompt') as HTMLTextAreaElement;
export const cfgGithubToken = document.getElementById('cfg-github-token') as HTMLInputElement;
export const btnSettingsSave = document.getElementById('btn-settings-save') as HTMLButtonElement;

// Provider Form Groups
export const formGroupApiUrl = document.getElementById('form-group-api-url') as HTMLDivElement;
export const formGroupApiKey = document.getElementById('form-group-api-key') as HTMLDivElement;
export const formGroupZenKey = document.getElementById('form-group-zen-key') as HTMLDivElement;
export const btnSettingsTest = document.getElementById('btn-settings-test') as HTMLButtonElement;
export const settingsTestStatus = document.getElementById('settings-test-status') as HTMLSpanElement;
export const btnGithubConnect = document.getElementById('btn-github-connect') as HTMLButtonElement;
export const btnGithubDisconnect = document.getElementById('btn-github-disconnect') as HTMLButtonElement;
export const githubStatusDot = document.getElementById('github-status-dot') as HTMLDivElement;
export const githubStatusTitle = document.getElementById('github-status-title') as HTMLHeadingElement;
export const githubStatusSub = document.getElementById('github-status-sub') as HTMLSpanElement;
export const githubStatusMessage = document.getElementById('github-status-message') as HTMLSpanElement;
export const githubAvatar = document.getElementById('github-avatar') as HTMLImageElement;

// File Explorer Panel
export const btnRefreshFiles = document.getElementById('btn-refresh-files') as HTMLButtonElement;
export const fileTreeContainer = document.getElementById('file-tree-container') as HTMLDivElement;
export const editorFileTitle = document.getElementById('editor-file-title') as HTMLSpanElement;
export const btnSaveFile = document.getElementById('btn-save-file') as HTMLButtonElement;
export const editorTextarea = document.getElementById('editor-textarea') as HTMLTextAreaElement;

// Terminal Modal
export const termCommand = document.getElementById('term-command') as HTMLInputElement;
export const btnRunTerm = document.getElementById('btn-run-term') as HTMLButtonElement;
export const terminalStdout = document.getElementById('terminal-stdout') as HTMLDivElement;

// State
export let conversationHistory: Message[] = [];
export let appConfig: AppConfig | null = null;
export let activeEditorFile: string | null = null;
export let availableModels: string[] = [];
export let modelPickerSelected: string | null = null;
export let githubState = { connected: false, user: null as GitHubUser | null };
export let activeChatId: number | null = null;

// Basic Utilities
export function parseMarkdown(text: string): string {
  if (!text) return '';

  // HTML escaping to avoid layout break
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Handle multiline code blocks ```lang ... ```
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  html = html.replace(codeBlockRegex, (_match, lang, code) => {
    const cleanCode = code.trim();
    const langLabel = lang || 'code';
    const previewBtn = langLabel === 'html'
      ? `<button class="preview-btn" onclick="previewCode(this)">Preview</button>`
      : '';
    return `
      <div class="code-block-wrapper">
        <div class="code-block-header">
          <span>${langLabel}</span>
          <div class="code-block-actions">
            ${previewBtn}
            <button class="copy-btn" onclick="copyToClipboard(this)">Copy</button>
          </div>
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

export function scrollToBottom() {
  if (chatMessages && chatMessages.parentElement) {
    chatMessages.parentElement.scrollTop = chatMessages.parentElement.scrollHeight;
  }
}

export function autoResizeTextarea(textarea: HTMLTextAreaElement) {
  textarea.style.height = 'auto';
  textarea.style.height = (textarea.scrollHeight) + 'px';
}

export function updateProviderFieldsVisibility() {
  if (!cfgProvider) return;
  const provider = cfgProvider.value;
  if (provider === 'opencode-zen') {
    if (formGroupApiUrl) formGroupApiUrl.classList.add('hidden');
    if (formGroupApiKey) formGroupApiKey.classList.add('hidden');
    if (formGroupZenKey) formGroupZenKey.classList.remove('hidden');
  } else {
    if (formGroupApiUrl) formGroupApiUrl.classList.remove('hidden');
    if (formGroupApiKey) formGroupApiKey.classList.remove('hidden');
    if (formGroupZenKey) formGroupZenKey.classList.add('hidden');
  }
}

// Settings and API functions
export async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    appConfig = await res.json() as AppConfig;

    // Update labels and inputs
    if (lblWorkspace) lblWorkspace.textContent = appConfig.workspacePath;
    if (cfgProvider) cfgProvider.value = appConfig.provider || 'custom';
    if (cfgApiUrl) cfgApiUrl.value = appConfig.apiUrl;
    if (cfgApiKey) cfgApiKey.value = appConfig.apiKey;
    if (cfgOpencodeZenApiKey) cfgOpencodeZenApiKey.value = appConfig.opencodeZenApiKey || '';
    if (cfgModel) cfgModel.value = appConfig.model;
    if (cfgWorkspace) cfgWorkspace.value = appConfig.workspacePath;
    if (cfgSystemPrompt) cfgSystemPrompt.value = appConfig.systemPrompt;

    updateProviderFieldsVisibility();
  } catch (err) {
    console.error("Error loading configurations:", err);
    alert("Could not connect to the backend server. Make sure it is running.");
  }
}

export async function saveSettings() {
  if (!appConfig) return;
  const payload = {
    provider: cfgProvider ? cfgProvider.value : 'custom',
    apiUrl: cfgApiUrl.value.trim(),
    apiKey: cfgApiKey.value.trim(),
    opencodeZenApiKey: cfgOpencodeZenApiKey ? cfgOpencodeZenApiKey.value.trim() : '',
    model: cfgModel.value.trim(),
    workspacePath: cfgWorkspace.value.trim(),
    systemPrompt: cfgSystemPrompt.value.trim()
  };

  if (btnSettingsSave) {
    btnSettingsSave.disabled = true;
    btnSettingsSave.textContent = 'Saving...';
  }

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      appConfig = data.config;
      if (lblWorkspace) lblWorkspace.textContent = appConfig!.workspacePath;
      updateHeaderModelLabel();
      loadApiModels(); // Refresh models list in case provider or API URL changed
      if (settingsTestStatus) {
        settingsTestStatus.textContent = '';
        settingsTestStatus.className = 'settings-test-status';
      }
      flashSettingsSave('Settings saved', 'success');
    } else {
      flashSettingsSave('Error saving: ' + data.error, 'error');
    }
  } catch (err: any) {
    flashSettingsSave('Failed to connect to backend.', 'error');
  } finally {
    if (btnSettingsSave) {
      btnSettingsSave.disabled = false;
      btnSettingsSave.textContent = 'Save';
    }
  }
}

export async function testApiConnection() {
  if (!btnSettingsTest) return;
  btnSettingsTest.disabled = true;
  btnSettingsTest.textContent = 'Testing...';
  if (settingsTestStatus) {
    settingsTestStatus.textContent = '';
    settingsTestStatus.className = 'settings-test-status';
  }

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
      showTestStatus(`Connected — "${text}"`, 'success');
    } else {
      const errText = await res.text();
      showTestStatus(`Failed (${res.status}): ${errText.slice(0, 120)}`, 'error');
    }
  } catch (err: any) {
    showTestStatus(`Network error: ${err.message}`, 'error');
  } finally {
    btnSettingsTest.disabled = false;
    btnSettingsTest.textContent = 'Test API Connection';
  }
}

function showTestStatus(message: string, kind: string) {
  if (!settingsTestStatus) return;
  settingsTestStatus.textContent = message;
  settingsTestStatus.className = `settings-test-status is-${kind}`;
}

export function flashSettingsSave(message: string, kind: 'success' | 'error') {
  if (!btnSettingsSave) return;
  const original = btnSettingsSave.textContent;
  btnSettingsSave.textContent = message;
  btnSettingsSave.classList.add(kind === 'success' ? 'is-success' : 'is-error');
  setTimeout(() => {
    btnSettingsSave.textContent = 'Save';
    btnSettingsSave.classList.remove('is-success', 'is-error');
  }, 2000);
}

export async function loadApiModels() {
  try {
    const res = await fetch('/api/models');
    const data = await res.json();
    availableModels = Array.isArray(data.models) ? data.models : [];

    // Ensure current model is in the list (if API didn't include it)
    const currentModel = appConfig?.model || '';
    if (currentModel && !availableModels.includes(currentModel)) {
      availableModels.unshift(currentModel);
    }

    if (availableModels.length === 0) {
      const fallback = appConfig?.model || 'qwen-plus';
      availableModels = [fallback];
    }

    updateHeaderModelLabel();
  } catch (err) {
    console.error('Failed to load models:', err);
    const fallback = appConfig?.model || 'qwen-plus';
    availableModels = [fallback];
    updateHeaderModelLabel();
  }
}

export function updateHeaderModelLabel() {
  const model = appConfig?.model || availableModels[0] || 'qwen-plus';
  if (headerModelLabel) {
    headerModelLabel.textContent = model;
    headerModelLabel.title = model;
  }
}

// Messaging and SSE functions
export function appendUserMessage(content: string) {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message user-message';

  const contentDiv = document.createElement('div');
  contentDiv.className = 'msg-content';
  contentDiv.innerHTML = `<span class="prompt-tag">&gt;</span>${content.replace(/\n/g, '<br>')}`;

  msgDiv.appendChild(contentDiv);
  chatMessages.appendChild(msgDiv);
  scrollToBottom();
}

export async function sendMessage() {
  const content = chatInput.value.trim();
  if (!content) return;

  // Append user message
  appendUserMessage(content);
  conversationHistory.push({ role: 'user', content });

  // Reset Input UI
  chatInput.value = '';
  chatInput.style.height = 'auto';

  await startAgentStream(activeChatId, false);
}

export async function startAgentStream(chatId: number | null, isReconnect: boolean) {
  chatInput.disabled = true;
  btnSend.disabled = true;

  // Show Agent Status Bar
  agentStatusBar.classList.remove('hidden');
  statusText.textContent = 'Thinking...';

  // State elements for dynamic segment segmentation
  let currentAssistantMsgDiv: HTMLDivElement | null = null;
  let currentAssistantContentDiv: HTMLDivElement | null = null;
  let assistantTextAccumulator = '';

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
    const payload = isReconnect
      ? { chatId, reconnect: true }
      : { messages: conversationHistory, chatId };

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API returned error code ${response.status}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let streamBuffer = '';
    let shouldCloseStream = false;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      streamBuffer += decoder.decode(value, { stream: true });
      const lines = streamBuffer.split('\n');
      streamBuffer = lines.pop()!; // Keep partial line in buffer

      for (const line of lines) {
        if (!line.trim().startsWith('data: ')) continue;
        const jsonStr = line.trim().slice(6);

        try {
          const payload = JSON.parse(jsonStr) as SSEEvent;

          switch (payload.type) {
              case 'metadata':
                if (payload.startIndex !== undefined) {
                  conversationHistory = conversationHistory.slice(0, payload.startIndex + 1);
                  renderConversation();
                }
              if (payload.chatId) {
                activeChatId = payload.chatId;
                localStorage.setItem('activeChatId', activeChatId.toString());
              }
              break;

            case 'status':
              statusText.textContent = payload.content;
              break;

            case 'reasoning':
              statusText.innerHTML = `<span style="color:var(--color-accent)">🧠 Thinking:</span> ${payload.content.trim().slice(-40)}...`;
              break;

            case 'text':
              ensureAssistantMessageBlock();
              assistantTextAccumulator += payload.content;
              currentAssistantContentDiv!.innerHTML = parseMarkdown(assistantTextAccumulator);
              highlightCodeBlocks(currentAssistantContentDiv!);
              scrollToBottom();
              break;

            case 'tool_start':
              currentAssistantMsgDiv = null;
              currentAssistantContentDiv = null;
              statusText.textContent = `Running tool: ${payload.name}...`;
              createToolCardElement(payload.id, payload.name, payload.args);
              scrollToBottom();
              break;

            case 'tool_output':
              const outputEl = document.getElementById(`tool-out-${payload.id}`);
              if (outputEl) {
                if (outputEl.textContent === 'Working...' || outputEl.textContent === 'Executing...') {
                  outputEl.textContent = '';
                }
                outputEl.textContent += payload.output;
                outputEl.scrollTop = outputEl.scrollHeight;
              }
              break;

            case 'tool_end':
              statusText.textContent = `Completed tool: ${payload.name}`;
              finalizeToolCardElement(payload.id, payload.name, payload.output);
              scrollToBottom();
              break;

            case 'error':
              ensureAssistantMessageBlock();
              const errDiv = document.createElement('div');
              errDiv.style.color = 'var(--color-accent)';
              errDiv.style.fontFamily = 'monospace';
              errDiv.style.padding = '8px';
              errDiv.style.backgroundColor = '#1C1310';
              errDiv.style.border = '1px solid var(--color-accent)';
              errDiv.style.borderRadius = '4px';
              errDiv.textContent = `Error: ${payload.content}`;
              currentAssistantContentDiv!.appendChild(errDiv);
              scrollToBottom();
              shouldCloseStream = true;
              break;

            case 'done':
              if (payload.chatId) {
                activeChatId = payload.chatId;
                localStorage.setItem('activeChatId', activeChatId.toString());
              }
              shouldCloseStream = true;
              break;
          }
        } catch (parseErr) {
          console.error("Error parsing stream chunk:", line, parseErr);
        }
      }

      if (shouldCloseStream) {
        try {
          await reader.cancel();
        } catch (e) {}
        break;
      }
    }

    if (assistantTextAccumulator) {
      conversationHistory.push({ role: 'assistant', content: assistantTextAccumulator });
    }

  } catch (err: any) {
    console.error("Chat streaming error:", err);
    ensureAssistantMessageBlock();
    currentAssistantContentDiv!.innerHTML += `<p style="color:#C4622D; font-family:monospace;">System Error: ${err.message}</p>`;
    scrollToBottom();
  } finally {
    chatInput.disabled = false;
    btnSend.disabled = false;
    agentStatusBar.classList.add('hidden');
    chatInput.focus();
    loadChats(); // Refresh drawer
  }
}

export function createToolCardElement(id: string, name: string, args: any) {
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

export function finalizeToolCardElement(id: string, name: string, output: string) {
  const toolEl = document.getElementById(`tool-${id}`);
  if (!toolEl) return;

  toolEl.classList.remove('running');
  const headerLeft = toolEl.querySelector('.tool-header-left');
  if (!headerLeft) return;

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

  const outputEl = document.getElementById(`tool-out-${id}`);
  if (outputEl) {
    outputEl.textContent = output || '(empty output)';
  }

  const bodyEl = document.getElementById(`tool-body-${id}`);
  if (bodyEl && !isError) {
    bodyEl.classList.add('hidden');
  }
}

// GitHub Integration
export async function refreshGithubStatus() {
  try {
    const res = await fetch('/api/github/status');
    const data = await res.json();
    githubState = { connected: Boolean(data.connected), user: data.user || null };
    renderGithubStatus();
  } catch (err) {
    console.error('Failed to fetch GitHub status:', err);
    setGithubStatusMessage('Could not reach the backend to check GitHub status.', 'error');
  }
}

function renderGithubStatus() {
  if (githubState.connected && githubState.user) {
    if (githubStatusDot) githubStatusDot.className = 'github-status-dot is-connected';
    if (githubStatusTitle) githubStatusTitle.textContent = `Connected as @${githubState.user.login}`;
    const meta = [];
    if (githubState.user.name) meta.push(githubState.user.name);
    // Assuming data structure based on previous app.js
    if (githubStatusSub) githubStatusSub.textContent = meta.length ? meta.join(' • ') + ' • The agent can use github_* tools.' : 'The agent can use github_* tools.';
    if (githubState.user.avatar_url && githubAvatar) {
      githubAvatar.src = githubState.user.avatar_url;
      githubAvatar.alt = `${githubState.user.login} avatar`;
      githubAvatar.classList.remove('hidden');
    }
    if (btnGithubConnect) btnGithubConnect.classList.add('hidden');
    if (btnGithubDisconnect) btnGithubDisconnect.classList.remove('hidden');
  } else {
    if (githubStatusDot) githubStatusDot.className = 'github-status-dot';
    if (githubStatusTitle) githubStatusTitle.textContent = 'Not connected';
    if (githubStatusSub) githubStatusSub.textContent = 'Add a Personal Access Token below to enable GitHub tools for the agent.';
    if (githubAvatar) githubAvatar.classList.add('hidden');
    if (btnGithubConnect) btnGithubConnect.classList.remove('hidden');
    if (btnGithubDisconnect) btnGithubDisconnect.classList.add('hidden');
  }
}

function setGithubStatusMessage(message: string, kind: string) {
  if (!githubStatusMessage) return;
  githubStatusMessage.textContent = message;
  githubStatusMessage.className = `settings-test-status${kind ? ' is-' + kind : ''}`;
}

export async function connectGithub() {
  const token = (cfgGithubToken.value || '').trim();
  if (!token) {
    setGithubStatusMessage('Please paste a Personal Access Token first.', 'error');
    cfgGithubToken.focus();
    return;
  }
  if (btnGithubConnect) {
    btnGithubConnect.disabled = true;
    const originalLabel = btnGithubConnect.textContent;
    btnGithubConnect.textContent = 'Connecting...';
    setGithubStatusMessage('Validating token with GitHub...', '');
    try {
      const res = await fetch('/api/github/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        githubState = { connected: true, user: data.user };
        renderGithubStatus();
        setGithubStatusMessage(`Connected to @${data.user.login}.`, 'success');
        cfgGithubToken.value = '';
      } else {
        setGithubStatusMessage(data.error || 'Failed to connect to GitHub.', 'error');
      }
    } catch (err: any) {
      setGithubStatusMessage('Network error: ' + err.message, 'error');
    } finally {
      btnGithubConnect.disabled = false;
      btnGithubConnect.textContent = originalLabel;
    }
  }
}

export async function disconnectGithub() {
  if (!confirm('Disconnect GitHub? The agent will no longer be able to call github_* tools.')) return;
  if (btnGithubDisconnect) {
    btnGithubDisconnect.disabled = true;
    try {
      const res = await fetch('/api/github/disconnect', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        githubState = { connected: false, user: null };
        renderGithubStatus();
        setGithubStatusMessage('Disconnected from GitHub.', 'success');
      } else {
        setGithubStatusMessage(data.error || 'Failed to disconnect.', 'error');
      }
    } catch (err: any) {
      setGithubStatusMessage('Network error: ' + err.message, 'error');
    } finally {
      btnGithubDisconnect.disabled = false;
    }
  }
}

// Modal and UI Toggles
export function toggleModal(modal: HTMLElement, show: boolean) {
  if (show) {
    modal.classList.remove('hidden');
  } else {
    modal.classList.add('hidden');
  }
}

export function openSettingsScreen() {
  if (!appConfig) return;
  if (cfgApiUrl) cfgApiUrl.value = appConfig.apiUrl || '';
  if (cfgApiKey) cfgApiKey.value = appConfig.apiKey || '';
  if (cfgModel) cfgModel.value = appConfig.model || '';
  if (cfgWorkspace) cfgWorkspace.value = appConfig.workspacePath || '';
  if (cfgSystemPrompt) cfgSystemPrompt.value = appConfig.systemPrompt || '';
  if (settingsTestStatus) {
    settingsTestStatus.textContent = '';
    settingsTestStatus.className = 'settings-test-status';
  }
  if (githubStatusMessage) {
    githubStatusMessage.textContent = '';
    githubStatusMessage.className = 'settings-test-status';
  }
  if (screenSettings) screenSettings.classList.remove('hidden');
  const body = screenSettings ? screenSettings.querySelector('.settings-body') as HTMLElement : null;
  if (body) body.scrollTop = 0;
  refreshGithubStatus();
  switchSettingsCategory('llm'); // Default category
}

export function closeSettingsScreen() {
  if (screenSettings) screenSettings.classList.add('hidden');
}

export function switchSettingsCategory(categoryId: string) {
  // Update nav buttons
  document.querySelectorAll('.settings-nav-item').forEach(btn => {
    if ((btn as HTMLElement).dataset.category === categoryId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update section visibility
  const categories = ['llm', 'github', 'general', 'tools'];
  categories.forEach(cat => {
    const section = document.getElementById(`settings-cat-${cat}`);
    if (section) {
      if (cat === categoryId) section.classList.remove('hidden');
      else section.classList.add('hidden');
    }
  });
}

export function openModelPicker() {
  if (!availableModels || availableModels.length === 0) {
    loadApiModels().then(() => {
      if (availableModels.length > 0) reallyOpenModelPicker();
    });
    return;
  }
  reallyOpenModelPicker();
}

function reallyOpenModelPicker() {
  if (modelPickerSearch) {
    modelPickerSearch.value = '';
    if (modelPickerClear) modelPickerClear.classList.add('hidden');
    
    // Set active provider tab
    const currentProvider = appConfig?.provider || 'custom';
    updateModelPickerProviderTabs(currentProvider);

    renderModelPickerList('');
    toggleModal(modalModelPicker, true);
    setTimeout(() => modelPickerSearch.focus(), 50);
  }
}

export function updateModelPickerProviderTabs(provider: 'custom' | 'opencode-zen') {
  if (btnPickerProviderCustom) {
    if (provider === 'custom') btnPickerProviderCustom.classList.add('active');
    else btnPickerProviderCustom.classList.remove('active');
  }
  if (btnPickerProviderZen) {
    if (provider === 'opencode-zen') btnPickerProviderZen.classList.add('active');
    else btnPickerProviderZen.classList.remove('active');
  }
}

export async function switchPickerProvider(provider: 'custom' | 'opencode-zen') {
  if (!appConfig) return;
  
  updateModelPickerProviderTabs(provider);
  
  // Show loading indicator
  if (modelPickerList) {
    modelPickerList.innerHTML = '<div class="model-picker-empty">Loading models for ' + (provider === 'custom' ? 'Custom' : 'Opencode Zen') + '...</div>';
  }

  try {
    // Save provider change to server
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider })
    });
    const data = await res.json();
    if (data.success) {
      appConfig = data.config;
      if (cfgProvider) cfgProvider.value = provider;
      updateProviderFieldsVisibility();
      
      // Reload models for this provider
      await loadApiModels();
      renderModelPickerList(modelPickerSearch ? modelPickerSearch.value : '');
    }
  } catch (err) {
    console.error("Failed to switch provider:", err);
    if (modelPickerList) {
      modelPickerList.innerHTML = '<div class="model-picker-empty" style="color:var(--color-accent);">Failed to load models. Check connection settings.</div>';
    }
  }
}

export function renderModelPickerList(filter: string) {
  const query = (filter || '').trim().toLowerCase();
  const currentModel = appConfig?.model || '';

  let filtered = availableModels;
  if (query) {
    filtered = availableModels.filter(m => m.toLowerCase().includes(query));
  }

  if (!modelPickerList) return;
  modelPickerList.innerHTML = '';
  if (modelPickerCount) modelPickerCount.textContent = `${filtered.length} model${filtered.length === 1 ? '' : 's'}`;
  if (modelPickerActive) {
    modelPickerActive.textContent = currentModel ? `Active: ${currentModel}` : '';
  }

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'model-picker-empty';
    empty.textContent = query
      ? `No models match "${filter}"`
      : 'No models available. Check your API URL in settings.';
    modelPickerList.appendChild(empty);
    return;
  }

  filtered.forEach(modelId => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'model-picker-item';
    item.setAttribute('role', 'option');
    if (modelId === currentModel) {
      item.classList.add('is-active');
    }
    item.dataset.model = modelId;

    const name = document.createElement('span');
    name.className = 'model-picker-item-name';
    name.textContent = modelId;

    const check = document.createElement('span');
    check.className = 'model-picker-item-check';
    check.textContent = '\u2713';

    item.appendChild(name);
    item.appendChild(check);

    item.addEventListener('click', () => selectModel(modelId));
    modelPickerList.appendChild(item);
  });
}

async function selectModel(modelId: string) {
  if (!modelId || !appConfig) return;
  appConfig.model = modelId;
  if (cfgModel) cfgModel.value = modelId;
  updateHeaderModelLabel();
  toggleModal(modalModelPicker, false);
  renderModelPickerList(modelPickerSearch ? modelPickerSearch.value : '');
  try {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelId })
    });
  } catch (err) {
    console.error('Failed to save model selection:', err);
  }
}

// File Explorer and Terminal
export async function loadWorkspaceFiles() {
  if (!fileTreeContainer) return;
  fileTreeContainer.innerHTML = '<span class="loading-indicator">Reading workspace...</span>';
  try {
    const res = await fetch('/api/files');
    const data = await res.json();
    renderFileTree(data.files, fileTreeContainer);
  } catch (err: any) {
    fileTreeContainer.innerHTML = `<span style="color: var(--color-accent)">Failed to load workspace files: ${err.message}</span>`;
  }
}

function renderFileTree(nodes: any[], container: HTMLElement) {
  container.innerHTML = '';
  if (!nodes || nodes.length === 0) {
    container.innerHTML = '<span class="loading-indicator">Workspace folder is empty.</span>';
    return;
  }

  function createNodeElement(node: any) {
    const nodeEl = document.createElement('div');
    nodeEl.className = 'tree-node';

    const rowEl = document.createElement('div');
    rowEl.className = 'tree-row';

    const iconEl = document.createElement('span');
    iconEl.className = 'tree-icon';
    iconEl.innerHTML = node.isDirectory ? '📁' : '📄';

    const nameEl = document.createElement('span');
    nameEl.textContent = node.name;

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
      rowEl.addEventListener('click', (e) => {
        e.stopPropagation();
        childrenEl.classList.toggle('hidden');
        iconEl.innerHTML = childrenEl.classList.contains('hidden') ? '📁' : '📂';
      });

      if (node.children && node.children.length > 0) {
        node.children.forEach((child: any) => {
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

export async function openFile(relativePath: string) {
  if (!editorTextarea) return;
  editorTextarea.value = "Loading file content...";
  editorTextarea.setAttribute('readonly', 'true');
  if (btnSaveFile) btnSaveFile.classList.add('hidden');

  try {
    const res = await fetch(`/api/file/view?path=${encodeURIComponent(relativePath)}`);
    const data = await res.json();

    if (res.ok) {
      activeEditorFile = relativePath;
      const splitView = document.querySelector('.split-view');
      const isMobile = window.innerWidth <= 768;

      if (editorFileTitle) {
        if (isMobile) {
          editorFileTitle.innerHTML = `&larr; Back to Files | <span style="font-family: monospace; color:#C4622D">${relativePath}</span>`;
          editorFileTitle.style.cursor = 'pointer';
          if (splitView) splitView.classList.add('editor-active');
        } else {
          editorFileTitle.innerHTML = `<span style="font-family: monospace; color:#C4622D">${relativePath}</span>`;
          editorFileTitle.style.cursor = 'default';
        }
      }

      editorTextarea.value = data.content;
      editorTextarea.removeAttribute('readonly');
      if (btnSaveFile) btnSaveFile.classList.remove('hidden');

      // Add preview button for HTML files
      const isHtmlFile = /\.html?$/i.test(relativePath);
      const existingPreviewBtn = document.getElementById('btn-preview-file');
      if (isHtmlFile && btnSaveFile && !existingPreviewBtn) {
        const previewBtn = document.createElement('button');
        previewBtn.id = 'btn-preview-file';
        previewBtn.className = 'mini-btn';
        previewBtn.style.border = '1px solid var(--color-accent)';
        previewBtn.style.color = 'var(--color-accent)';
        previewBtn.textContent = 'Open Preview';
        previewBtn.onclick = () => openPreviewModal(data.content);
        btnSaveFile.parentNode?.insertBefore(previewBtn, btnSaveFile);
      } else if (!isHtmlFile && existingPreviewBtn) {
        existingPreviewBtn.remove();
      }
    } else {
      if (editorFileTitle) editorFileTitle.textContent = "Error loading file";
      editorTextarea.value = "Failed to load: " + data.error;
    }
  } catch (err) {
    if (editorFileTitle) editorFileTitle.textContent = "Connection Error";
    editorTextarea.value = "Could not fetch file content from backend server.";
  }
}

export async function saveActiveFile() {
  if (!activeEditorFile || !editorTextarea) return;
  if (btnSaveFile) {
    btnSaveFile.disabled = true;
    btnSaveFile.textContent = "Saving...";
  }

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
      loadWorkspaceFiles();
    } else {
      const data = await res.json();
      alert(`Failed to save: ${data.error}`);
    }
  } catch (err) {
    alert("Connection Error. Could not connect to backend server.");
  } finally {
    if (btnSaveFile) {
      btnSaveFile.disabled = false;
      btnSaveFile.textContent = "Save File";
    }
  }
}

export async function runManualCommand() {
  if (!termCommand) return;
  const cmd = termCommand.value.trim();
  if (!cmd) return;

  if (btnRunTerm) {
    btnRunTerm.disabled = true;
    btnRunTerm.textContent = 'Running...';
  }
  if (terminalStdout) terminalStdout.textContent = `$ ${cmd}\n\nRunning command...`;

  try {
    const res = await fetch('/api/terminal/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmd })
    });
    const data = await res.json();
    if (terminalStdout) terminalStdout.textContent = `$ ${cmd}\n\n${data.output || data.error}`;
  } catch (err: any) {
    if (terminalStdout) terminalStdout.textContent = `$ ${cmd}\n\nFailed to connect to backend: ${err.message}`;
  } finally {
    if (btnRunTerm) {
      btnRunTerm.disabled = false;
      btnRunTerm.textContent = 'Run';
    }
    termCommand.value = '';
  }
}

// Chat History Drawer Functions
export function toggleDrawer(show: boolean) {
  if (show) {
    chatDrawer.classList.remove('hidden');
    drawerOverlay.classList.remove('hidden');
    loadChats();
  } else {
    chatDrawer.classList.add('hidden');
    drawerOverlay.classList.add('hidden');
  }
}

export async function loadChats() {
  if (!chatsList) return;
  try {
    const res = await fetch('/api/chats');
    const chats = await res.json() as Chat[];
    renderChatsList(chats);
  } catch (err) {
    console.error("Failed to load chats:", err);
  }
}

function renderChatsList(chats: Chat[]) {
  if (!chatsList) return;
  chatsList.innerHTML = '';
  if (chats.length === 0) {
    chatsList.innerHTML = '<div style="padding:16px; color:var(--color-text-sub); font-size:0.85rem; text-align:center;">No previous chats found.</div>';
    return;
  }

  chats.forEach(chat => {
    const item = document.createElement('div');
    item.className = `drawer-item ${activeChatId === chat.id ? 'active' : ''}`;

    const info = document.createElement('div');
    info.style.flex = '1';
    info.style.minWidth = '0';
    info.style.cursor = 'pointer';

    const title = document.createElement('span');
    title.className = 'drawer-item-title';
    title.textContent = chat.title;

    const date = document.createElement('span');
    date.className = 'drawer-item-date';
    date.textContent = new Date(chat.createdAt).toLocaleString();

    info.appendChild(title);
    info.appendChild(date);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'drawer-delete-btn';
    deleteBtn.title = 'Delete chat';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteChat(chat.id);
    };

    item.appendChild(info);
    item.appendChild(deleteBtn);

    info.addEventListener('click', () => {
      selectChat(chat.id);
      toggleDrawer(false);
    });

    chatsList.appendChild(item);
  });
}

async function deleteChat(id: number) {
  if (!confirm('Delete this chat?')) return;
  try {
    const res = await fetch(`/api/chats/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      if (activeChatId === id) startNewChat();
      loadChats();
    }
  } catch (err) {
    console.error('Failed to delete chat:', err);
  }
}

export async function selectChat(id: number) {
  activeChatId = id;
  localStorage.setItem('activeChatId', id.toString());
  chatMessages.innerHTML = '<div style="padding:16px; color:var(--color-accent); font-family:monospace;">Loading chat history...</div>';
  if (agentStatusBar) agentStatusBar.classList.add('hidden');
  try {
    const res = await fetch(`/api/chats/${id}`);
    const data = await res.json() as Chat;
    conversationHistory = data.messages || [];
    renderConversation();

    // Check if the agent is currently running for this chat
    const statusRes = await fetch(`/api/chat/status?chatId=${id}`);
    const statusData = await statusRes.json();
    if (statusData.running) {
      startAgentStream(id, true);
    }
  } catch (err) {
    console.error("Failed to load chat details:", err);
    chatMessages.innerHTML = '<div style="padding:16px; color:var(--color-accent); font-family:monospace;">Error loading chat.</div>';
  }
}

function renderConversation() {
  chatMessages.innerHTML = '';
  if (conversationHistory.length === 0) {
    chatMessages.innerHTML = '<div class="message system-message"><div class="msg-content">No messages in this chat.</div></div>';
    return;
  }

  conversationHistory.forEach(msg => {
    if (msg.role === 'system') return;

    if (msg.role === 'user') {
      appendUserMessage(msg.content);
    } else if (msg.role === 'assistant') {
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        msg.tool_calls.forEach(tc => {
          const tcId = tc.id || `hist-${Math.random()}`;
          const tcName = tc.function?.name || 'unknown';
          const tcArgs = tc.function?.arguments || '{}';

          // Find matching tool output in history
          const matchingToolMsg = conversationHistory.find(
            item => item.role === 'tool' && item.tool_call_id === tc.id
          );

          createToolCardElement(tcId, tcName, tcArgs);
          if (matchingToolMsg) {
            finalizeToolCardElement(tcId, tcName, matchingToolMsg.content);
          }
        });
      } else if (msg.type === 'tool_call') {
        // Simple representation for old history tool calls
        const div = document.createElement('div');
        div.style.fontFamily = 'monospace';
        div.style.fontSize = '0.8rem';
        div.style.color = 'var(--color-accent)';
        div.style.padding = '4px 8px';
        div.textContent = `🛠 ${msg.content}`;
        chatMessages.appendChild(div);
      } else {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message assistant-message';
        const contentDiv = document.createElement('div');
        contentDiv.className = 'msg-content';
        contentDiv.innerHTML = parseMarkdown(msg.content);
        highlightCodeBlocks(contentDiv);
        msgDiv.appendChild(contentDiv);
        chatMessages.appendChild(msgDiv);
      }
    } else if (msg.role === 'tool') {
      // If this tool output has a matching tool call in history, it is already rendered beautifully.
      // Otherwise render the fallback plain representation.
      const hasToolCallInHistory = conversationHistory.some(
        item => item.role === 'assistant' && item.tool_calls && item.tool_calls.some(tc => tc.id === msg.tool_call_id)
      );

      if (!hasToolCallInHistory) {
        const div = document.createElement('div');
        div.style.fontFamily = 'monospace';
        div.style.fontSize = '0.75rem';
        div.style.color = 'var(--color-text-sub)';
        div.style.padding = '4px 16px';
        div.style.borderLeft = '1px solid var(--color-border)';
        div.textContent = `↩ ${msg.content.slice(0, 100)}${msg.content.length > 100 ? '...' : ''}`;
        chatMessages.appendChild(div);
      }
    }
  });
  scrollToBottom();
}

export function startNewChat() {
  activeChatId = null;
  localStorage.removeItem('activeChatId');
  conversationHistory = [];
  chatMessages.innerHTML = `
    <div class="message system-message">
      <div class="msg-content">
        <strong>Welcome to Coder!</strong><br>
        Ask anything or type a command to begin.
      </div>
    </div>
  `;
  if (agentStatusBar) agentStatusBar.classList.add('hidden');
  toggleDrawer(false);
}

// Event Listeners Setup
export function setupEventListeners() {
  btnSettings?.addEventListener('click', openSettingsScreen);
  btnSettingsBack?.addEventListener('click', closeSettingsScreen);
  btnExplorer?.addEventListener('click', () => {
    toggleModal(modalExplorer, true);
    loadWorkspaceFiles();
  });
  btnTerminal?.addEventListener('click', () => toggleModal(modalTerminal, true));

  headerModelTrigger?.addEventListener('click', openModelPicker);
  btnPickModel?.addEventListener('click', openModelPicker);
  modelPickerSearch?.addEventListener('input', () => {
    renderModelPickerList(modelPickerSearch.value);
    if (modelPickerClear) {
      if (modelPickerSearch.value) modelPickerClear.classList.remove('hidden');
      else modelPickerClear.classList.add('hidden');
    }
  });
  modelPickerClear?.addEventListener('click', () => {
    modelPickerSearch.value = '';
    modelPickerSearch.focus();
    modelPickerClear.classList.add('hidden');
    renderModelPickerList('');
  });

  document.querySelectorAll('[data-close-model-picker]').forEach(btn => {
    btn.addEventListener('click', () => toggleModal(modalModelPicker, false));
  });

  document.querySelectorAll('.close-button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const overlay = target.closest('.modal-overlay') as HTMLElement;
      if (overlay) {
        toggleModal(overlay, false);
        return;
      }
      if (target.closest('.settings-header')) {
        closeSettingsScreen();
      }
    });
  });

  btnSend?.addEventListener('click', sendMessage);
  chatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  chatInput?.addEventListener('focus', () => {
    setTimeout(scrollToBottom, 250);
  });
  chatInput?.addEventListener('input', () => autoResizeTextarea(chatInput));

  btnRefreshFiles?.addEventListener('click', loadWorkspaceFiles);
  btnSaveFile?.addEventListener('click', saveActiveFile);
  btnSettingsSave?.addEventListener('click', saveSettings);
  btnSettingsTest?.addEventListener('click', testApiConnection);
  btnGithubConnect?.addEventListener('click', connectGithub);
  btnGithubDisconnect?.addEventListener('click', disconnectGithub);

  cfgProvider?.addEventListener('change', () => {
    updateProviderFieldsVisibility();
  });

  btnPickerProviderCustom?.addEventListener('click', () => switchPickerProvider('custom'));
  btnPickerProviderZen?.addEventListener('click', () => switchPickerProvider('opencode-zen'));

  btnRunTerm?.addEventListener('click', runManualCommand);
  termCommand?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runManualCommand();
  });

  editorFileTitle?.addEventListener('click', () => {
    const splitView = document.querySelector('.split-view');
    if (splitView && splitView.classList.contains('editor-active')) {
      splitView.classList.remove('editor-active');
      editorFileTitle.textContent = "No file selected";
      if (editorTextarea) {
        editorTextarea.value = "";
        editorTextarea.setAttribute('readonly', 'true');
      }
      if (btnSaveFile) btnSaveFile.classList.add('hidden');
      activeEditorFile = null;
    }
  });

  // Drawer events
  btnToggleDrawer?.addEventListener('click', () => toggleDrawer(true));
  drawerOverlay?.addEventListener('click', () => toggleDrawer(false));
  btnNewChat?.addEventListener('click', startNewChat);

  // Settings Category Nav
  document.querySelectorAll('.settings-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = (btn as HTMLElement).dataset.category;
      if (cat) switchSettingsCategory(cat);
    });
  });
}

// Initializer
export async function init() {
  await loadSettings();
  setupEventListeners();
  if (chatInput) autoResizeTextarea(chatInput);
  await loadApiModels();
  await refreshGithubStatus();
  loadChats();

  // Re-load last active chat if stored
  const savedChatId = localStorage.getItem('activeChatId');
  if (savedChatId) {
    selectChat(parseInt(savedChatId));
  } else {
    startNewChat();
  }
}

// Global UI Helpers (for window object)
(window as any).copyToClipboard = (btn: HTMLButtonElement) => {
  const wrapper = btn.closest('.code-block-wrapper');
  const codeEl = wrapper ? wrapper.querySelector('code') : null;
  if (!codeEl) return;

  navigator.clipboard.writeText(codeEl.innerText).then(() => {
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => {
      btn.textContent = originalText;
    }, 2000);
  }).catch(err => {
    console.error('Copy failed:', err);
  });
};

(window as any).toggleToolBody = (id: string) => {
  const body = document.getElementById(`tool-body-${id}`);
  if (body) {
    body.classList.toggle('hidden');
  }
};

export function highlightCodeBlocks(container: HTMLElement) {
  container.querySelectorAll('pre code').forEach(el => {
    if (!(el as HTMLElement).dataset.highlighted) {
      hljs.highlightElement(el as HTMLElement);
    }
  });
}

export function openPreviewModal(htmlContent: string) {
  const existing = document.getElementById('preview-modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'preview-modal-overlay';
  overlay.className = 'modal-overlay';
  overlay.style.zIndex = '2000';

  const card = document.createElement('div');
  card.className = 'modal-card preview-card';

  card.innerHTML = `
    <div class="modal-header">
      <h3>Preview</h3>
      <div style="display:flex;gap:8px">
        <button class="mini-btn" id="btn-preview-open-tab">Open in tab</button>
        <button class="close-button" id="btn-preview-close">&times;</button>
      </div>
    </div>
    <div class="modal-body" style="padding:0;display:flex;flex:1;overflow:hidden">
      <iframe id="preview-iframe" style="width:100%;height:100%;border:none;background:#fff"></iframe>
    </div>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
  const blob = new Blob([htmlContent], { type: 'text/html' });
  iframe.src = URL.createObjectURL(blob);

  document.getElementById('btn-preview-close')!.onclick = () => overlay.remove();
  document.getElementById('btn-preview-open-tab')!.onclick = () => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(htmlContent);
      win.document.close();
    }
  };
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
}

(window as any).previewCode = (btn: HTMLButtonElement) => {
  const wrapper = btn.closest('.code-block-wrapper');
  const codeEl = wrapper ? wrapper.querySelector('code') : null;
  if (!codeEl) return;
  openPreviewModal(codeEl.textContent || '');
};

document.addEventListener('DOMContentLoaded', init);
