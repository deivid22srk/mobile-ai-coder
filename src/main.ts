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
const btnCancel = document.getElementById('btn-cancel') as HTMLButtonElement;
export const lblWorkspace = document.getElementById('lbl-workspace') as HTMLSpanElement;
export const agentStatusBar = document.getElementById('agent-status-bar') as HTMLDivElement;
export const statusText = document.getElementById('status-text') as HTMLSpanElement;

// Slash Command
export const slashPopover = document.getElementById('slash-popover') as HTMLDivElement;
export const slashMenu = document.getElementById('slash-menu') as HTMLDivElement;
export const slashSkillsPicker = document.getElementById('slash-skills-picker') as HTMLDivElement;
export const slashSkillsList = document.getElementById('slash-skills-list') as HTMLDivElement;
export const btnSlashBack = document.getElementById('btn-slash-back') as HTMLButtonElement;
export const btnSlashNext = document.getElementById('btn-slash-next') as HTMLButtonElement;
let slashSelectedSkills: string[] = [];
let isSlashActive = false;

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

// Skills
export const skillsList = document.getElementById('skills-list') as HTMLDivElement;
export const btnRefreshSkills = document.getElementById('btn-refresh-skills') as HTMLButtonElement;
export const skillsStatus = document.getElementById('skills-status') as HTMLSpanElement;
export const btnNewSkill = document.getElementById('btn-new-skill') as HTMLButtonElement;
export const btnImportSkill = document.getElementById('btn-import-skill') as HTMLButtonElement;
export const modalCreateSkill = document.getElementById('modal-create-skill') as HTMLDivElement;
export const modalImportSkill = document.getElementById('modal-import-skill') as HTMLDivElement;
export const skillNameInput = document.getElementById('skill-name') as HTMLInputElement;
export const skillDescInput = document.getElementById('skill-desc') as HTMLInputElement;
export const skillContentInput = document.getElementById('skill-content') as HTMLTextAreaElement;
export const btnSaveSkill = document.getElementById('btn-save-skill') as HTMLButtonElement;
export const skillImportUrl = document.getElementById('skill-import-url') as HTMLInputElement;
export const btnImportSkillConfirm = document.getElementById('btn-import-skill-confirm') as HTMLButtonElement;
let availableSkills: Array<{ name: string; description: string }> = [];
let activeSkills: string[] = [];

// Agent Skills
export const modalAgenteskills = document.getElementById('modal-agenteskills') as HTMLDivElement;
export const agentSkillsSearch = document.getElementById('agenteskills-search') as HTMLInputElement;
export const agentSkillsList = document.getElementById('agenteskills-list') as HTMLDivElement;
export const agentSkillsTabs = document.getElementById('agenteskills-tabs') as HTMLDivElement;
export const agentSkillsStatus = document.getElementById('agenteskills-status') as HTMLSpanElement;
export const btnImportAgenteskills = document.getElementById('btn-import-agenteskills') as HTMLButtonElement;

// Memory
export const memoriesList = document.getElementById('memories-list') as HTMLDivElement;
export const btnRefreshMemories = document.getElementById('btn-refresh-memories') as HTMLButtonElement;
export const btnNewMemory = document.getElementById('btn-new-memory') as HTMLButtonElement;
export const modalCreateMemory = document.getElementById('modal-create-memory') as HTMLDivElement;
export const memoryNameInput = document.getElementById('memory-name') as HTMLInputElement;
export const memoryContentInput = document.getElementById('memory-content') as HTMLTextAreaElement;
export const memoryTypeSelect = document.getElementById('memory-type') as HTMLSelectElement;
export const memoryScopeSelect = document.getElementById('memory-scope') as HTMLSelectElement;
export const btnSaveMemory = document.getElementById('btn-save-memory') as HTMLButtonElement;
export const memoriesStatus = document.getElementById('memories-status') as HTMLSpanElement;

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

  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Handle mermaid code blocks FIRST (before other code blocks)
  html = html.replace(/```mermaid\n([\s\S]*?)```/g, (_match, code) => {
    const id = 'mermaid-' + Math.random().toString(36).slice(2, 9);
    const clean = code.trim();
    return `<div class="mermaid-wrapper"><div class="mermaid" id="${id}">${clean}</div></div>`;
  });

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

  // Handle tables: | col1 | col2 |\n | --- | --- |\n | a | b |
  const tableRegex = /^\|(.+)\|\n\|([-| :]+)\|\n((?:\|.+\|\n?)*)/gm;
  html = html.replace(tableRegex, (_match, headerRow, alignRow, bodyRows) => {
    const headers = headerRow.split('|').map((s: string) => s.trim()).filter(Boolean);
    const aligns = alignRow.split('|').map((s: string) => {
      const t = s.trim();
      if (t.startsWith(':') && t.endsWith(':')) return 'center';
      if (t.endsWith(':')) return 'right';
      return 'left';
    }).filter(Boolean);
    const rows = bodyRows.trim().split('\n').map((r: string) =>
      r.split('|').map((s: string) => s.trim()).filter(Boolean)
    );

    let tableHtml = '<div class="markdown-table-wrapper"><table class="markdown-table"><thead><tr>';
    headers.forEach((h: string, i: number) => {
      tableHtml += `<th style="text-align:${aligns[i] || 'left'}">${h}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';
    rows.forEach((row: string[]) => {
      tableHtml += '<tr>';
      row.forEach((cell: string, i: number) => {
        tableHtml += `<td style="text-align:${aligns[i] || 'left'}">${cell}</td>`;
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table></div>';
    return tableHtml;
  });

  // Handle horizontal rules
  html = html.replace(/^---+\s*$/gm, '<hr>');
  html = html.replace(/^\*\*\*+\s*$/gm, '<hr>');
  html = html.replace(/^___+\s*$/gm, '<hr>');

  // Handle blockquotes
  html = html.replace(/^&gt;\s?(.*)$/gm, '<blockquote><p>$1</p></blockquote>');
  // Collapse consecutive blockquotes
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');

  // Handle headings (must be after code blocks, before paragraphs)
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Handle unordered lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
  // Handle ordered lists
  html = html.replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>');

  // Wrap consecutive <li> in <ul> or <ol>
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Handle inline formatting: bold (**text**), italic (*text*), links
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Handle images ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:8px 0;" />');

  // Handle links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Convert double newlines to paragraph structure, keeping linebreaks inside
  // But skip wrapping in <p> if the content is already a block-level element
  const blockLevelRegex = /^(<(div|table|blockquote|h[1-4]|hr|ul|ol|li|pre|p))/;
  html = html.split('\n\n').map(para => {
    const trimmed = para.trim();
    if (!trimmed) return '';
    if (blockLevelRegex.test(trimmed)) return trimmed;
    return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  return html;
}

export function renderMermaidDiagrams(container: HTMLElement) {
  if (!container) return;
  const mermaidEls = container.querySelectorAll('.mermaid');
  if (mermaidEls.length > 0 && typeof (window as any).mermaid !== 'undefined') {
    (mermaidEls as NodeListOf<HTMLElement>).forEach(el => {
      try {
        (window as any).mermaid.run({ nodes: [el] });
      } catch (e) {
        console.warn('Mermaid render error:', e);
      }
    });
  }
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

let isStreamActive = false;
let activeStreamChatId: number | null = null;

async function cancelActiveStream() {
  if (!isStreamActive || !activeStreamChatId) return;
  try {
    await fetch('/api/chat/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: activeStreamChatId })
    });
  } catch (_) {}
}

export async function sendMessage() {
  // Cancel any active stream before starting a new one
  if (isStreamActive) {
    await cancelActiveStream();
    // Small delay to let cancellation propagate
    await new Promise(r => setTimeout(r, 200));
  }

  let content = chatInput.value.trim();
  if (!content) return;

  closeSlashPopover();

  // Parse /skills command
  const skillsMatch = content.match(/^\/skills\s+([\w-]+(?:\s*,\s*[\w-]+)*)/i);
  let skillsToActivate: string[] = [];
  if (skillsMatch) {
    skillsToActivate = skillsMatch[1].split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    content = content.replace(skillsMatch[0], '').trim();
  }

  // Parse $mention syntax ($skill-name inline references)
  const mentionRegex = /\$([\w-]+)/g;
  let mentionMatch;
  const mentionedSkills: string[] = [];
  while ((mentionMatch = mentionRegex.exec(content)) !== null) {
    mentionedSkills.push(mentionMatch[1].toLowerCase());
  }
  if (mentionedSkills.length > 0) {
    try {
      const res = await fetch('/api/skills');
      const { skills: allLocalSkills } = await res.json();
      const localSkillNames = new Map(allLocalSkills.map((s: any) => [s.name.toLowerCase(), s]));
      const inlineCtx: string[] = [];
      for (const name of mentionedSkills) {
        const skill = localSkillNames.get(name);
        if (skill) {
          if (!skillsToActivate.includes(name)) skillsToActivate.push(name);
          inlineCtx.push(`[Skill "${skill.name}"]\n${skill.content}\n[/Skill]`);
        }
      }
      if (inlineCtx.length > 0) {
        content += '\n\n' + inlineCtx.join('\n\n');
      }
      // Remove $mention prefix from name references
      content = content.replace(mentionRegex, (...args) => args[1]);
    } catch (_) {}
  }

  // Activate skills for this chat if any
  if (skillsToActivate.length > 0) {
    const chatId = await ensureChat();
    if (chatId) {
      for (const name of skillsToActivate) {
        try {
          await fetch(`/api/chats/${chatId}/skills`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, active: true })
          });
        } catch (_) {}
      }
      if (!activeSkills.includes(skillsToActivate[0])) {
        activeSkills.push(...skillsToActivate);
      }
    }
  }

  // If only the /skills command was typed with no additional text, use a default prompt
  if (!content && skillsToActivate.length > 0) {
    content = `Activate skills: ${skillsToActivate.join(', ')}`;
  }
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
  isStreamActive = true;
  activeStreamChatId = chatId;
  chatInput.disabled = true;
  btnSend.classList.add('hidden');
  btnCancel.classList.remove('hidden');

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
              renderMermaidDiagrams(currentAssistantContentDiv!);
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

            case 'plan_update':
              statusText.textContent = `Plan updated`;
              renderPlanPanel(payload);
              break;

            case 'agent_spawned':
              statusText.textContent = `Agent "${payload.nickname}" spawned`;
              appendAgentIndicator(payload.nickname, payload.agent_id);
              break;

            case 'needs_continue':
              statusText.textContent = `Task incomplete - say "continue" to proceed`;
              ensureAssistantMessageBlock();
              const continueDiv = document.createElement('div');
              continueDiv.className = 'continue-hint';
              continueDiv.innerHTML = `<span class="continue-icon">⏸</span><span>${payload.content}</span>`;
              currentAssistantContentDiv!.appendChild(continueDiv);
              shouldCloseStream = true;
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

            case 'cancelled':
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
    // Don't show error UI for cancellation
    if (err.name === 'AbortError') return;
    ensureAssistantMessageBlock();
    currentAssistantContentDiv!.innerHTML += `<p style="color:#C4622D; font-family:monospace;">System Error: ${err.message}</p>`;
    scrollToBottom();
  } finally {
    isStreamActive = false;
    activeStreamChatId = null;
    chatInput.disabled = false;
    btnCancel.classList.add('hidden');
    btnSend.classList.remove('hidden');
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

// Floating Plan Panel
let planPanelVisible = false;
let planPanelMinimized = false;
let currentPlanData: { explanation?: string, plan: Array<{ step: string, status: string }> } | null = null;

const planPanel = document.getElementById('plan-panel') as HTMLDivElement;
const planPanelBody = document.getElementById('plan-panel-body') as HTMLDivElement;
const planPanelCount = document.getElementById('plan-panel-count') as HTMLSpanElement;
const planPanelExplanation = document.getElementById('plan-panel-explanation') as HTMLDivElement;
const planPanelSteps = document.getElementById('plan-panel-steps') as HTMLDivElement;
const planPanelToggle = document.getElementById('plan-panel-toggle') as HTMLButtonElement;
const planPanelClose = document.getElementById('plan-panel-close') as HTMLButtonElement;

function getPlanStatusSymbol(status: string): string {
  switch (status) {
    case 'completed': return '✔';
    case 'in_progress': return '◉';
    default: return '○';
  }
}

function getPlanStatusClass(status: string): string {
  switch (status) {
    case 'completed': return 'plan-step-completed';
    case 'in_progress': return 'plan-step-in-progress';
    default: return 'plan-step-pending';
  }
}

function renderPlanPanel(data: { explanation?: string, plan: Array<{ step: string, status: string }> }) {
  currentPlanData = data;
  planPanelCount.textContent = `${data.plan.length} step${data.plan.length !== 1 ? 's' : ''}`;

  if (data.explanation) {
    planPanelExplanation.textContent = data.explanation;
    planPanelExplanation.classList.remove('hidden');
  } else {
    planPanelExplanation.classList.add('hidden');
  }

  let stepsHtml = '';
  for (const item of data.plan) {
    const symbol = getPlanStatusSymbol(item.status);
    const statusClass = getPlanStatusClass(item.status);
    stepsHtml += `<div class="plan-step ${statusClass}"><span class="plan-step-icon">${symbol}</span><span class="plan-step-text">${item.step}</span><span class="plan-step-label">${item.status}</span></div>`;
  }
  planPanelSteps.innerHTML = stepsHtml;

  planPanel.classList.remove('hidden');
  planPanelVisible = true;
}

function togglePlanPanel() {
  planPanelMinimized = !planPanelMinimized;
  if (planPanelMinimized) {
    planPanelBody.classList.add('hidden');
    planPanel.classList.add('minimized');
  } else {
    planPanelBody.classList.remove('hidden');
    planPanel.classList.remove('minimized');
  }
}

function closePlanPanel() {
  planPanel.classList.add('hidden');
  planPanelVisible = false;
  planPanelMinimized = false;
  currentPlanData = null;
}

// Agent indicators
const agentsBar = document.getElementById('agents-bar') as HTMLDivElement;
const agentsList = document.getElementById('agents-list') as HTMLDivElement;
const activeAgentIndicators = new Map<string, HTMLSpanElement>();

function appendAgentIndicator(nickname: string, agentId: string) {
  const tag = document.createElement('span');
  tag.className = 'agent-tag';
  tag.textContent = nickname;
  tag.title = `Agent: ${nickname} (${agentId})`;
  agentsList.appendChild(tag);
  activeAgentIndicators.set(agentId, tag);
  agentsBar.classList.remove('hidden');
}

function initPlanPanel() {
  planPanelToggle.addEventListener('click', togglePlanPanel);
  planPanelClose.addEventListener('click', closePlanPanel);
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
  loadSkills();
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
  const categories = ['llm', 'memory', 'skills', 'github', 'general', 'tools'];
  categories.forEach(cat => {
    const section = document.getElementById(`settings-cat-${cat}`);
    if (section) {
      if (cat === categoryId) section.classList.remove('hidden');
      else section.classList.add('hidden');
    }
  });
}

// Skills Functions
export async function loadSkills() {
  if (!skillsList) return;
  try {
    const skillsRes = await fetch('/api/skills');
    const skillsData = await skillsRes.json();
    availableSkills = skillsData.skills || [];

    const targetChatId = await ensureChat();
    if (targetChatId) {
      const activeRes = await fetch(`/api/chats/${targetChatId}/skills`);
      const activeData = await activeRes.json();
      activeSkills = activeData.active || [];
    } else {
      activeSkills = [];
    }

    renderSkillsList();
    if (skillsStatus && targetChatId) {
      skillsStatus.textContent = `Skills for chat #${targetChatId}`;
      skillsStatus.className = 'settings-test-status';
    }
  } catch (err) {
    console.error('Failed to load skills:', err);
    if (skillsList) {
      skillsList.innerHTML = '<div class="skills-empty">Could not load skills. Check server connection.</div>';
    }
  }
}

function renderSkillsList() {
  if (!skillsList) return;
  skillsList.innerHTML = '';

  if (availableSkills.length === 0) {
    skillsList.innerHTML = '<div class="skills-empty">No skills found. Add SKILL.md files to <code>.mobile-ai-coder/skills/</code> directory and click Refresh.</div>';
    return;
  }

  availableSkills.forEach(skill => {
    const isActive = activeSkills.includes(skill.name);

    const item = document.createElement('div');
    item.className = `skill-item${isActive ? ' is-active' : ''}`;

    const info = document.createElement('div');
    info.className = 'skill-info';

    const name = document.createElement('span');
    name.className = 'skill-name';
    name.textContent = skill.name;

    const desc = document.createElement('span');
    desc.className = 'skill-desc';
    desc.textContent = skill.description || 'No description';

    info.appendChild(name);
    info.appendChild(desc);

    const label = document.createElement('label');
    label.className = 'skill-toggle';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = isActive;
    checkbox.addEventListener('change', () => toggleSkill(skill.name, checkbox.checked));

    const track = document.createElement('span');
    track.className = 'toggle-track';

    label.appendChild(checkbox);
    label.appendChild(track);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'skill-delete-btn';
    deleteBtn.title = 'Delete skill';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteSkill(skill.name);
    });

    item.appendChild(info);
    item.appendChild(label);
    item.appendChild(deleteBtn);
    skillsList.appendChild(item);
  });
}

async function ensureChat(): Promise<number | null> {
  if (activeChatId) return activeChatId;
  const saved = localStorage.getItem('activeChatId');
  if (saved) return parseInt(saved);
  try {
    const res = await fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Chat' })
    });
    const chat = await res.json();
    if (chat.id) {
      activeChatId = chat.id;
      localStorage.setItem('activeChatId', chat.id.toString());
      return chat.id;
    }
  } catch (err) {
    console.error('Failed to create chat:', err);
  }
  return null;
}

async function toggleSkill(name: string, active: boolean) {
  const chatId = await ensureChat();
  if (!chatId) {
    if (skillsStatus) {
      skillsStatus.textContent = 'Could not create a chat to attach skill to';
      skillsStatus.className = 'settings-test-status is-error';
    }
    return;
  }
  try {
    const res = await fetch(`/api/chats/${chatId}/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, active })
    });
    const data = await res.json();
    if (data.success) {
      if (active) {
        if (!activeSkills.includes(name)) activeSkills.push(name);
      } else {
        activeSkills = activeSkills.filter(s => s !== name);
      }
      if (activeChatId !== chatId) activeChatId = chatId;
      localStorage.setItem('activeChatId', chatId.toString());
      renderSkillsList();
      if (skillsStatus) {
        skillsStatus.textContent = active ? `Skill "${name}" activated for this chat` : `Skill "${name}" deactivated`;
        skillsStatus.className = 'settings-test-status is-success';
        setTimeout(() => { if (skillsStatus) { skillsStatus.textContent = ''; skillsStatus.className = 'settings-test-status'; } }, 2000);
      }
    } else {
      if (skillsStatus) {
        skillsStatus.textContent = 'Failed to toggle skill';
        skillsStatus.className = 'settings-test-status is-error';
      }
    }
  } catch (err) {
    console.error('Failed to toggle skill:', err);
    if (skillsStatus) {
      skillsStatus.textContent = 'Error connecting to server';
      skillsStatus.className = 'settings-test-status is-error';
    }
  }
}

// Create, Import, Delete Skills
export async function createSkillFromUI() {
  const name = (skillNameInput?.value || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const description = (skillDescInput?.value || '').trim();
  const content = (skillContentInput?.value || '').trim();
  if (!name || !content) {
    if (skillsStatus) { skillsStatus.textContent = 'Name and content are required'; skillsStatus.className = 'settings-test-status is-error'; }
    return;
  }
  if (btnSaveSkill) { btnSaveSkill.disabled = true; btnSaveSkill.textContent = 'Creating...'; }
  try {
    const res = await fetch('/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, content })
    });
    const data = await res.json();
    if (data.success) {
      if (skillsStatus) { skillsStatus.textContent = `Skill "${name}" created!`; skillsStatus.className = 'settings-test-status is-success'; }
      toggleModal(modalCreateSkill, false);
      if (skillNameInput) skillNameInput.value = '';
      if (skillDescInput) skillDescInput.value = '';
      if (skillContentInput) skillContentInput.value = '';
      loadSkills();
    } else {
      if (skillsStatus) { skillsStatus.textContent = data.error || 'Failed to create skill'; skillsStatus.className = 'settings-test-status is-error'; }
    }
  } catch (err: any) {
    if (skillsStatus) { skillsStatus.textContent = 'Error: ' + err.message; skillsStatus.className = 'settings-test-status is-error'; }
  } finally {
    if (btnSaveSkill) { btnSaveSkill.disabled = false; btnSaveSkill.textContent = 'Create Skill'; }
  }
}

export async function importSkillFromURL() {
  const url = (skillImportUrl?.value || '').trim();
  if (!url) {
    if (skillsStatus) { skillsStatus.textContent = 'URL is required'; skillsStatus.className = 'settings-test-status is-error'; }
    return;
  }
  if (btnImportSkillConfirm) { btnImportSkillConfirm.disabled = true; btnImportSkillConfirm.textContent = 'Importing...'; }
  try {
    const res = await fetch('/api/skills/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    if (data.success) {
      const count = data.imported?.length || 0;
      if (skillsStatus) { skillsStatus.textContent = `${count} skill(s) imported!`; skillsStatus.className = 'settings-test-status is-success'; }
      toggleModal(modalImportSkill, false);
      if (skillImportUrl) skillImportUrl.value = '';
      loadSkills();
    } else {
      if (skillsStatus) { skillsStatus.textContent = data.error || 'Failed to import skill'; skillsStatus.className = 'settings-test-status is-error'; }
    }
  } catch (err: any) {
    if (skillsStatus) { skillsStatus.textContent = 'Error: ' + err.message; skillsStatus.className = 'settings-test-status is-error'; }
  } finally {
    if (btnImportSkillConfirm) { btnImportSkillConfirm.disabled = false; btnImportSkillConfirm.textContent = 'Import'; }
  }
}

export async function deleteSkill(name: string) {
  if (!confirm(`Delete skill "${name}"?`)) return;
  try {
    const res = await fetch(`/api/skills/${encodeURIComponent(name)}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      if (skillsStatus) { skillsStatus.textContent = `Skill "${name}" deleted`; skillsStatus.className = 'settings-test-status is-success'; }
      loadSkills();
    } else {
      if (skillsStatus) { skillsStatus.textContent = data.error || 'Failed to delete'; skillsStatus.className = 'settings-test-status is-error'; }
    }
  } catch (err: any) {
    if (skillsStatus) { skillsStatus.textContent = 'Error: ' + err.message; skillsStatus.className = 'settings-test-status is-error'; }
  }
}

// Memory Functions
export async function loadMemories() {
  if (!memoriesList) return;
  try {
    const res = await fetch('/api/memories?scope=global');
    const data = await res.json();
    const memories = data.memories || [];
    renderMemoriesList(memories);
  } catch (err) {
    console.error('Failed to load memories:', err);
    if (memoriesList) {
      memoriesList.innerHTML = '<div class="skills-empty">Could not load memories.</div>';
    }
  }
}

function renderMemoriesList(memories: Array<{ id: number; name: string; content: string; type: string; tags: string; updatedAt: string }>) {
  if (!memoriesList) return;
  memoriesList.innerHTML = '';

  if (memories.length === 0) {
    memoriesList.innerHTML = '<div class="skills-empty">No memories yet. The agent can save memories using the <code>memory_save</code> tool, or you can create one manually.</div>';
    return;
  }

  memories.forEach(mem => {
    const item = document.createElement('div');
    item.className = 'skill-item';

    const info = document.createElement('div');
    info.className = 'skill-info';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'skill-name';
    nameSpan.textContent = mem.name;

    const typeSpan = document.createElement('span');
    typeSpan.style.cssText = 'font-size:0.65rem;color:var(--color-accent);font-family:monospace;background:var(--color-bg-card);padding:1px 6px;border-radius:4px;margin-left:6px;';
    typeSpan.textContent = mem.type || 'fact';

    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = 'font-size:0.75rem;color:var(--color-text-sub);margin-top:4px;white-space:pre-wrap;word-break:break-word;max-height:60px;overflow:hidden;';
    contentDiv.textContent = mem.content;

    info.appendChild(nameSpan);
    info.appendChild(typeSpan);
    info.appendChild(contentDiv);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'skill-delete-btn';
    deleteBtn.title = 'Delete memory';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Delete memory "${mem.name}"?`)) deleteMemory(mem.id);
    });

    item.appendChild(info);
    item.appendChild(deleteBtn);
    memoriesList.appendChild(item);
  });
}

async function deleteMemory(id: number) {
  try {
    const res = await fetch(`/api/memories/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      if (memoriesStatus) {
        memoriesStatus.textContent = 'Memory deleted';
        memoriesStatus.className = 'settings-test-status is-success';
        setTimeout(() => { if (memoriesStatus) { memoriesStatus.textContent = ''; memoriesStatus.className = 'settings-test-status'; } }, 2000);
      }
      loadMemories();
    }
  } catch (err) {
    console.error('Failed to delete memory:', err);
  }
}

export async function createMemoryFromUI() {
  const name = (memoryNameInput?.value || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const content = (memoryContentInput?.value || '').trim();
  const type = memoryTypeSelect?.value || 'fact';
  const scope = memoryScopeSelect?.value || 'global';

  if (!name || !content) {
    if (memoriesStatus) { memoriesStatus.textContent = 'Name and content are required'; memoriesStatus.className = 'settings-test-status is-error'; }
    return;
  }

  if (btnSaveMemory) { btnSaveMemory.disabled = true; btnSaveMemory.textContent = 'Saving...'; }

  try {
    const res = await fetch('/api/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, content, type, scope })
    });
    const data = await res.json();
    if (data.success) {
      if (memoriesStatus) { memoriesStatus.textContent = `Memory "${name}" saved!`; memoriesStatus.className = 'settings-test-status is-success'; }
      toggleModal(modalCreateMemory, false);
      if (memoryNameInput) memoryNameInput.value = '';
      if (memoryContentInput) memoryContentInput.value = '';
      loadMemories();
    } else {
      if (memoriesStatus) { memoriesStatus.textContent = data.error || 'Failed to save memory'; memoriesStatus.className = 'settings-test-status is-error'; }
    }
  } catch (err: any) {
    if (memoriesStatus) { memoriesStatus.textContent = 'Error: ' + err.message; memoriesStatus.className = 'settings-test-status is-error'; }
  } finally {
    if (btnSaveMemory) { btnSaveMemory.disabled = false; btnSaveMemory.textContent = 'Save Memory'; }
  }
}

// Agent Skills Catalog Functions
let agentSkillsCatalog: { curated: string[]; system: string[]; experimental: string[] } = { curated: [], system: [], experimental: [] };
let agentSkillsActiveTab = 'curated';

export async function loadAgentSkillsCatalog() {
  if (!agentSkillsList) return;
  agentSkillsList.innerHTML = '<div class="model-picker-empty">Loading catalog...</div>';
  try {
    const res = await fetch('/api/skills/catalog');
    agentSkillsCatalog = await res.json();
    // Update tab labels with counts
    if (agentSkillsTabs) {
      const tabs = agentSkillsTabs.querySelectorAll('[data-askill-tab]');
      tabs.forEach(tab => {
        const cat = (tab as HTMLElement).dataset.askillTab || '';
        const count = (agentSkillsCatalog[cat] || []).length;
        const base = cat.charAt(0).toUpperCase() + cat.slice(1);
        tab.textContent = `${base} (${count})`;
        // Auto-switch to first tab that has results if current tab is empty
        if (count === 0 && cat === agentSkillsActiveTab) {
          const firstNonEmpty = tabs.find(t => (agentSkillsCatalog[(t as HTMLElement).dataset.askillTab || ''] || []).length > 0);
          if (firstNonEmpty) {
            tabs.forEach(t => t.classList.remove('active'));
            firstNonEmpty.classList.add('active');
            agentSkillsActiveTab = (firstNonEmpty as HTMLElement).dataset.askillTab || 'curated';
          }
        }
      });
    }
    renderAgentSkillsList('');
  } catch (err) {
    agentSkillsList.innerHTML = '<div class="model-picker-empty" style="color:var(--color-accent);">Failed to load catalog. Check connection.</div>';
  }
}

function renderAgentSkillsList(filter: string) {
  if (!agentSkillsList) return;
  const query = (filter || '').trim().toLowerCase();
  const skills = agentSkillsCatalog[agentSkillsActiveTab] || [];

  let filtered = skills;
  if (query) {
    filtered = skills.filter(s => s.includes(query));
  }

  agentSkillsList.innerHTML = '';

  if (filtered.length === 0) {
    agentSkillsList.innerHTML = `<div class="model-picker-empty">${query ? 'No skills match "' + filter + '"' : 'No skills in this category.'}</div>`;
    return;
  }

  filtered.forEach(name => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'model-picker-item';
    item.dataset.name = name;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'model-picker-item-name';
    nameSpan.textContent = name;

    const importBtn = document.createElement('span');
    importBtn.className = 'model-picker-item-check';
    importBtn.textContent = 'Import';
    importBtn.style.color = 'var(--color-accent)';
    importBtn.style.fontSize = '0.7rem';
    importBtn.style.fontWeight = '500';

    item.appendChild(nameSpan);
    item.appendChild(importBtn);

    item.addEventListener('click', () => importAgentSkill(name, agentSkillsActiveTab));
    agentSkillsList.appendChild(item);
  });
}

async function importAgentSkill(name: string, category: string) {
  if (!confirm(`Import agent skill "${name}" from openai/skills ${category}?`)) return;
  if (agentSkillsStatus) {
    agentSkillsStatus.textContent = `Importing "${name}"...`;
    agentSkillsStatus.className = 'settings-test-status';
  }
  try {
    const res = await fetch('/api/skills/import-from-catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category })
    });
    const data = await res.json();
    if (data.success) {
      if (agentSkillsStatus) {
        agentSkillsStatus.textContent = `"${name}" imported!`;
        agentSkillsStatus.className = 'settings-test-status is-success';
        setTimeout(() => { if (agentSkillsStatus) { agentSkillsStatus.textContent = ''; agentSkillsStatus.className = 'settings-test-status'; } }, 3000);
      }
      loadSkills(); // Refresh skills list
    } else {
      if (agentSkillsStatus) {
        agentSkillsStatus.textContent = data.error || 'Import failed';
        agentSkillsStatus.className = 'settings-test-status is-error';
      }
    }
  } catch (err: any) {
    if (agentSkillsStatus) {
      agentSkillsStatus.textContent = 'Error: ' + err.message;
      agentSkillsStatus.className = 'settings-test-status is-error';
    }
  }
}

function openAgentSkillsCatalog() {
  toggleModal(modalAgenteskills, true);
  if (agentSkillsSearch) agentSkillsSearch.value = '';
  loadAgentSkillsCatalog();
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
    deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      showDeleteConfirm(chat.id, chat.title);
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

function showDeleteConfirm(chatId: number, chatTitle: string) {
  const existing = document.getElementById('confirm-dialog-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'confirm-dialog-overlay';
  overlay.className = 'modal-overlay';
  overlay.style.zIndex = '3000';

  const dialog = document.createElement('div');
  dialog.className = 'confirm-dialog';

  dialog.innerHTML = `
    <div class="confirm-dialog-icon">
      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#E53E3E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
    </div>
    <h3 class="confirm-dialog-title">Delete chat?</h3>
    <p class="confirm-dialog-msg">"${chatTitle}" and all its messages will be permanently deleted.</p>
    <div class="confirm-dialog-actions">
      <button class="secondary-button" id="btn-confirm-cancel">Cancel</button>
      <button class="primary-button" id="btn-confirm-delete" style="background-color:#E53E3E;color:#fff">Delete</button>
    </div>
  `;

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  document.getElementById('btn-confirm-cancel')!.onclick = () => overlay.remove();
  document.getElementById('btn-confirm-delete')!.onclick = async () => {
    overlay.remove();
    try {
      const res = await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (activeChatId === chatId) startNewChat();
        loadChats();
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
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

          // Render update_plan in the floating panel instead of inline
          if (tcName === 'update_plan') {
            try {
              const argsObj = typeof tcArgs === 'string' ? JSON.parse(tcArgs) : tcArgs;
              const planData = {
                explanation: argsObj.explanation || '',
                plan: (argsObj.plan || []).map((p: any) => ({
                  step: p.step || 'Untitled step',
                  status: p.status || 'pending'
                }))
              };
              renderPlanPanel(planData);
            } catch (e) {
              // fallback to tool card if parsing fails
            }
          } else {
            createToolCardElement(tcId, tcName, tcArgs);
            if (matchingToolMsg) {
              finalizeToolCardElement(tcId, tcName, matchingToolMsg.content);
            }
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
        renderMermaidDiagrams(contentDiv);
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
    <div class="message system-message welcome-message">
      <div class="msg-content">
        <div class="welcome-icon">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--color-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
          </svg>
        </div>
        <h3 class="welcome-title">Welcome to <span style="color: var(--color-accent);">*coder</span></h3>
        <p class="welcome-desc">Your AI pair programmer. I can edit files, clone repos, run commands, and more.</p>
        <div class="welcome-features">
          <span class="welcome-feature">&#9889; Edit files</span>
          <span class="welcome-feature">&#128194; Browse workspace</span>
          <span class="welcome-feature">&#128279; Git & GitHub</span>
          <span class="welcome-feature">&#128187; Run commands</span>
        </div>
        <p class="workspace-label-text">Workspace: <span id="lbl-workspace" class="code-span">Loading...</span></p>
      </div>
    </div>
  `;
  if (agentStatusBar) agentStatusBar.classList.add('hidden');
  const newLbl = document.getElementById('lbl-workspace') as HTMLSpanElement;
  if (newLbl && appConfig) newLbl.textContent = appConfig.workspacePath;
  toggleDrawer(false);
}

// Slash Command Functions
function handleSlashInput() {
  const val = chatInput?.value || '';
  if (val === '/' && !isSlashActive) {
    isSlashActive = true;
    slashMenu?.classList.remove('hidden');
    slashSkillsPicker?.classList.add('hidden');
    slashPopover?.classList.remove('hidden');
  } else if (val !== '/' && isSlashActive && slashMenu?.classList.contains('hidden') === false) {
    // If user typed more than just "/", close if it's not a slash command
    if (!val.startsWith('/')) closeSlashPopover();
  }
}

function closeSlashPopover() {
  isSlashActive = false;
  slashPopover?.classList.add('hidden');
  slashMenu?.classList.remove('hidden');
  slashSkillsPicker?.classList.add('hidden');
  slashSelectedSkills = [];
}

function openSlashSkillsPicker() {
  if (!slashSkillsList) return;
  slashMenu?.classList.add('hidden');
  slashSkillsPicker?.classList.remove('hidden');

  // Load available skills
  fetch('/api/skills').then(r => r.json()).then(data => {
    const skills = data.skills || [];
    slashSkillsList.innerHTML = '';
    if (skills.length === 0) {
      slashSkillsList.innerHTML = '<div style="padding:16px;text-align:center;color:var(--color-text-muted);font-size:0.82rem;">No skills available. Create one in Settings.</div>';
      return;
    }
    slashSelectedSkills = [];
    skills.forEach((skill: { name: string; description: string }) => {
      const item = document.createElement('div');
      item.className = 'slash-skill-item';
      item.dataset.name = skill.name;

      const box = document.createElement('span');
      box.className = 'check-box';
      box.textContent = '\u2713';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'skill-name';
      nameSpan.textContent = skill.name;

      const descSpan = document.createElement('span');
      descSpan.className = 'skill-desc';
      descSpan.textContent = skill.description || '';

      item.appendChild(box);
      item.appendChild(nameSpan);
      item.appendChild(descSpan);

      item.addEventListener('click', () => {
        item.classList.toggle('is-checked');
        const checked = item.classList.contains('is-checked');
        if (checked) {
          if (!slashSelectedSkills.includes(skill.name)) slashSelectedSkills.push(skill.name);
        } else {
          slashSelectedSkills = slashSelectedSkills.filter(s => s !== skill.name);
        }
      });

      slashSkillsList.appendChild(item);
    });
  }).catch(() => {
    slashSkillsList.innerHTML = '<div style="padding:16px;text-align:center;color:var(--color-accent);font-size:0.82rem;">Failed to load skills.</div>';
  });
}

function confirmSlashSkills() {
  // Update skills display
  if (slashSelectedSkills.length === 0) {
    if (slashSkillsList) {
      const emptyMsg = slashSkillsList.querySelector('.slash-skill-item');
      if (!emptyMsg) return;
    }
    return;
  }

  // Insert /skills command into input
  const cmd = `/skills ${slashSelectedSkills.join(', ')}`;
  if (chatInput) {
    chatInput.value = cmd + ' ';
    chatInput.focus();
    autoResizeTextarea(chatInput);
    // Move cursor to end
    chatInput.selectionStart = chatInput.selectionEnd = chatInput.value.length;
  }

  closeSlashPopover();
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
  btnCancel?.addEventListener('click', cancelActiveStream);
  chatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isSlashActive) {
        closeSlashPopover();
      }
      sendMessage();
    }
    if (e.key === 'Escape') {
      closeSlashPopover();
    }
  });
  chatInput?.addEventListener('focus', () => {
    setTimeout(scrollToBottom, 250);
  });
  chatInput?.addEventListener('input', () => {
    autoResizeTextarea(chatInput);
    handleSlashInput();
  });

  // Slash command option click
  document.querySelectorAll('.slash-option').forEach(el => {
    el.addEventListener('click', () => {
      const cmd = (el as HTMLElement).dataset.slash;
      if (cmd === 'skills') openSlashSkillsPicker();
      if (cmd === 'agenteskills') { closeSlashPopover(); openAgentSkillsCatalog(); }
    });
  });
  btnSlashBack?.addEventListener('click', () => {
    slashMenu?.classList.remove('hidden');
    slashSkillsPicker?.classList.add('hidden');
  });
  btnSlashNext?.addEventListener('click', confirmSlashSkills);

  btnRefreshFiles?.addEventListener('click', loadWorkspaceFiles);
  btnSaveFile?.addEventListener('click', saveActiveFile);
  btnSettingsSave?.addEventListener('click', saveSettings);
  btnSettingsTest?.addEventListener('click', testApiConnection);
  btnRefreshSkills?.addEventListener('click', () => { loadSkills(); if (skillsStatus) { skillsStatus.textContent = 'Skills refreshed!'; skillsStatus.className = 'settings-test-status is-success'; setTimeout(() => { if (skillsStatus) { skillsStatus.textContent = ''; skillsStatus.className = 'settings-test-status'; } }, 2000); } });
  btnNewSkill?.addEventListener('click', () => toggleModal(modalCreateSkill, true));
  btnImportSkill?.addEventListener('click', () => toggleModal(modalImportSkill, true));
  btnSaveSkill?.addEventListener('click', createSkillFromUI);
  btnImportSkillConfirm?.addEventListener('click', importSkillFromURL);
  btnRefreshMemories?.addEventListener('click', () => { loadMemories(); if (memoriesStatus) { memoriesStatus.textContent = 'Refreshed!'; memoriesStatus.className = 'settings-test-status is-success'; setTimeout(() => { if (memoriesStatus) { memoriesStatus.textContent = ''; memoriesStatus.className = 'settings-test-status'; } }, 2000); } });
  btnNewMemory?.addEventListener('click', () => toggleModal(modalCreateMemory, true));
  btnSaveMemory?.addEventListener('click', createMemoryFromUI);
  btnImportAgenteskills?.addEventListener('click', openAgentSkillsCatalog);

  // Agent Skills catalog search
  agentSkillsSearch?.addEventListener('input', () => {
    renderAgentSkillsList(agentSkillsSearch.value);
  });

  // Agent Skills tab switching
  agentSkillsTabs?.addEventListener('click', (e) => {
    const tab = (e.target as HTMLElement).closest('[data-askill-tab]') as HTMLElement;
    if (!tab) return;
    agentSkillsTabs.querySelectorAll('.provider-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    agentSkillsActiveTab = tab.dataset.askillTab || 'curated';
    if (agentSkillsSearch) agentSkillsSearch.value = '';
    renderAgentSkillsList('');
  });
  // Close modals via data-close attributes
  document.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', () => {
      const targetId = (el as HTMLElement).dataset.close;
      if (targetId) {
        const modal = document.getElementById(targetId);
        if (modal) toggleModal(modal, false);
      }
    });
  });
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
      if (cat) {
        switchSettingsCategory(cat);
        if (cat === 'skills') loadSkills();
        if (cat === 'memory') loadMemories();
      }
    });
  });
}

// Initializer
export async function init() {
  await loadSettings();
  setupEventListeners();
  initPlanPanel();
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
