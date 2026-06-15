const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const Database = require('better-sqlite3');

const app = express();
app.use(cors());
app.use(express.json());

// Path to store config
const CONFIG_FILE = path.join(__dirname, 'config.json');
const DB_FILE = path.join(__dirname, 'database.sqlite');

// Initialize Database
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chatId INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chatId) REFERENCES chats(id) ON DELETE CASCADE
  );
`);

// Default configurations
const DEFAULT_CONFIG = {
  apiUrl: 'https://qwenproxy-cookies.onrender.com/v1',
  apiKey: '0',
  model: 'qwen-plus',
  systemPrompt: 'You are Claude Code Mobile, a powerful agentic AI coding assistant. You have access to local tools in the workspace: write_file, read_file, list_dir, run_command, git_clone, and (when the user has connected GitHub) github_list_repos, github_create_repo, github_push_files, github_get_user.\n\nUse these tools to help the user. Always explain what you are doing (e.g. "I am going to read the index.html file to inspect its content") right before invoking a tool. Make sure code changes are correct and tested.',
  workspacePath: path.join(__dirname, 'workspace'),
  githubToken: '',
  githubUser: null
};

// Load configurations
async function getConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
  } catch (err) {
    // Return default and save it
    await saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }
}

// Save configurations
async function saveConfig(config) {
  await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  // Ensure workspace exists
  try {
    await fs.mkdir(config.workspacePath, { recursive: true });
  } catch (err) {
    console.error("Could not create workspace directory:", err);
  }
}

// Check workspace paths to prevent directory traversal
function resolveWorkspacePath(workspacePath, relativePath) {
  const absoluteWorkspace = path.resolve(workspacePath);
  const resolvedPath = path.resolve(absoluteWorkspace, relativePath || '.');
  if (!resolvedPath.startsWith(absoluteWorkspace)) {
    throw new Error('Access denied: Path is outside the workspace directory');
  }
  return resolvedPath;
}

// GitHub API helper — used both by tools and /api/github/* endpoints
const GITHUB_API_BASE = 'https://api.github.com';

async function githubRequest(pathname, options = {}) {
  const config = await getConfig();
  if (!config.githubToken) {
    throw new Error('GitHub is not connected. Ask the user to add a Personal Access Token in Settings → GitHub Integration.');
  }
  const headers = Object.assign(
    {
      'Authorization': `Bearer ${config.githubToken}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'mobile-code-agent'
    },
    options.headers || {}
  );
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${GITHUB_API_BASE}${pathname}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
  });
  const text = await res.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch (_) { data = text; }
  }
  if (!res.ok) {
    const message = (data && data.message) ? data.message : (typeof data === 'string' ? data : `GitHub API error ${res.status}`);
    throw new Error(`GitHub ${res.status}: ${message}`);
  }
  return data;
}

function redactToken(token) {
  if (!token) return '';
  if (token.length <= 8) return '•'.repeat(token.length);
  return token.slice(0, 4) + '•'.repeat(Math.max(0, token.length - 8)) + token.slice(-4);
}

// Tool definitions for OpenAI API
const toolsDefinition = [
  {
    type: 'function',
    function: {
      name: 'list_dir',
      description: 'Lists all files and subdirectories inside the workspace directory relative path.',
      parameters: {
        type: 'object',
        properties: {
          relative_path: {
            type: 'string',
            description: 'The path to list, relative to workspace root. Use "." or omit for root.'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Reads and returns the contents of a file in the workspace.',
      parameters: {
        type: 'object',
        properties: {
          relative_path: {
            type: 'string',
            description: 'The path of the file, relative to the workspace.'
          }
        },
        required: ['relative_path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Creates or overwrites a file in the workspace with specific content. Creates parent directories if needed.',
      parameters: {
        type: 'object',
        properties: {
          relative_path: {
            type: 'string',
            description: 'The relative path of the file to create/overwrite.'
          },
          content: {
            type: 'string',
            description: 'The text content to write to the file.'
          }
        },
        required: ['relative_path', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'run_command',
      description: 'Runs a terminal command in the workspace directory. Use this to install dependencies, run scripts, run tests, build projects, or run git commands.',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The shell command to run.'
          }
        },
        required: ['command']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'git_clone',
      description: 'Clones a remote git repository into the workspace.',
      parameters: {
        type: 'object',
        properties: {
          repo_url: {
            type: 'string',
            description: 'The Git repository HTTP/HTTPS URL.'
          },
          relative_path: {
            type: 'string',
            description: 'Optional directory name/path inside the workspace to clone into. If omitted, clones into a folder named after the repo.'
          }
        },
        required: ['repo_url']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'github_get_user',
      description: 'Returns information about the currently connected GitHub account (login, name, avatar).',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'github_list_repos',
      description: 'Lists repositories owned by (or visible to) the connected GitHub account. Useful before creating a new one to avoid name clashes.',
      parameters: {
        type: 'object',
        properties: {
          visibility: {
            type: 'string',
            enum: ['all', 'owner', 'public', 'private'],
            description: 'Filter by visibility. Defaults to "owner".'
          },
          per_page: {
            type: 'integer',
            description: 'How many repositories to return (max 100). Defaults to 30.'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'github_create_repo',
      description: 'Creates a new GitHub repository under the connected account. Use this when the user asks to publish code or when you need a destination for github_push_files.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Repository name (lowercase, dashes/underscores allowed).'
          },
          description: {
            type: 'string',
            description: 'Short description of the repository.'
          },
          private: {
            type: 'boolean',
            description: 'Whether the repository should be private. Defaults to false.'
          },
          auto_init: {
            type: 'boolean',
            description: 'Whether to initialize the repo with a README. Defaults to true.'
          }
        },
        required: ['name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'github_push_files',
      description: 'Creates or updates one or more files in a GitHub repository using the Contents API. Each file is committed atomically (per file) with the provided commit message. The repository must already exist (use github_create_repo first if not).',
      parameters: {
        type: 'object',
        properties: {
          owner: {
            type: 'string',
            description: 'Repository owner (username or org). If omitted, defaults to the connected account.'
          },
          repo: {
            type: 'string',
            description: 'Repository name.'
          },
          branch: {
            type: 'string',
            description: 'Target branch. Defaults to the repository default branch (usually "main").'
          },
          commit_message: {
            type: 'string',
            description: 'Commit message to use for all the file updates.'
          },
          files: {
            type: 'array',
            description: 'List of files to create or update.',
            items: {
              type: 'object',
              required: ['path', 'content'],
              properties: {
                path: { type: 'string', description: 'File path inside the repository (e.g. "src/index.js").' },
                content: { type: 'string', description: 'Full file content to write.' }
              }
            }
          }
        },
        required: ['repo', 'files']
      }
    }
  }
];

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Chat History Endpoints
app.get('/api/chats', (req, res) => {
  try {
    const chats = db.prepare('SELECT * FROM chats ORDER BY createdAt DESC').all();
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chats', (req, res) => {
  try {
    const { title } = req.body;
    const result = db.prepare('INSERT INTO chats (title) VALUES (?)').run(title || 'New Chat');
    const newChat = db.prepare('SELECT * FROM chats WHERE id = ?').get(result.lastInsertRowid);
    res.json(newChat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/chats/:id', (req, res) => {
  try {
    const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(req.params.id);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    const messages = db.prepare('SELECT * FROM messages WHERE chatId = ? ORDER BY createdAt ASC').all(req.params.id);
    res.json({ ...chat, messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/chats/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM chats WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Settings Endpoints
app.get('/api/settings', async (req, res) => {
  try {
    const config = await getConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const current = await getConfig();
    const updated = { ...current, ...req.body };
    await saveConfig(updated);
    res.json({ success: true, config: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GitHub Integration Endpoints
app.get('/api/github/status', async (req, res) => {
  try {
    const config = await getConfig();
    res.json({
      connected: Boolean(config.githubToken),
      user: config.githubUser || null,
      tokenPreview: redactToken(config.githubToken)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/github/connect', async (req, res) => {
  const token = (req.body && req.body.token || '').trim();
  if (!token) {
    return res.status(400).json({ error: 'GitHub Personal Access Token is required.' });
  }
  try {
    const userRes = await fetch(`${GITHUB_API_BASE}/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'mobile-code-agent'
      }
    });
    const userText = await userRes.text();
    let userData = null;
    try { userData = JSON.parse(userText); } catch (_) { userData = { message: userText }; }
    if (!userRes.ok) {
      return res.status(userRes.status).json({
        error: (userData && userData.message) || `GitHub rejected the token (HTTP ${userRes.status}).`
      });
    }
    const current = await getConfig();
    const updated = {
      ...current,
      githubToken: token,
      githubUser: {
        login: userData.login,
        name: userData.name || userData.login,
        avatarUrl: userData.avatar_url,
        htmlUrl: userData.html_url,
        publicRepos: userData.public_repos
      }
    };
    await saveConfig(updated);
    res.json({ success: true, user: updated.githubUser, tokenPreview: redactToken(token) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/github/disconnect', async (req, res) => {
  try {
    const current = await getConfig();
    const updated = { ...current, githubToken: '', githubUser: null };
    await saveConfig(updated);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Workspace Files Endpoint
app.get('/api/files', async (req, res) => {
  try {
    const config = await getConfig();
    const ws = config.workspacePath;

    // Helper to recursively list files
    async function listRecursive(dir, baseDir = '') {
      const files = await fs.readdir(dir, { withFileTypes: true });
      let results = [];
      for (const file of files) {
        const relative = path.join(baseDir, file.name);
        const absolute = path.join(dir, file.name);
        if (file.isDirectory()) {
          // Skip node_modules and .git to prevent listing bloat
          if (file.name === 'node_modules' || file.name === '.git') {
            results.push({
              name: file.name,
              relativePath: relative,
              isDirectory: true,
              children: []
            });
            continue;
          }
          const children = await listRecursive(absolute, relative);
          results.push({
            name: file.name,
            relativePath: relative,
            isDirectory: true,
            children
          });
        } else {
          let size = 0;
          try {
            const stat = await fs.stat(absolute);
            size = stat.size;
          } catch (_) {}
          results.push({
            name: file.name,
            relativePath: relative,
            isDirectory: false,
            size
          });
        }
      }
      // Sort: directories first, then alphabetical
      return results.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
    }

    const tree = await listRecursive(ws);
    res.json({ workspace: ws, files: tree });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// File Details / Edit Endpoints
app.get('/api/file/view', async (req, res) => {
  try {
    const config = await getConfig();
    const relPath = req.query.path;
    if (!relPath) return res.status(400).json({ error: 'Missing path query parameter' });

    const filePath = resolveWorkspacePath(config.workspacePath, relPath);
    const content = await fs.readFile(filePath, 'utf-8');
    res.json({ path: relPath, content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/file/write', async (req, res) => {
  try {
    const config = await getConfig();
    const { path: relPath, content } = req.body;
    if (!relPath) return res.status(400).json({ error: 'Missing path' });

    const filePath = resolveWorkspacePath(config.workspacePath, relPath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content || '', 'utf-8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Execute manual terminal command
app.post('/api/terminal/run', async (req, res) => {
  try {
    const config = await getConfig();
    const { command } = req.body;
    if (!command) return res.status(400).json({ error: 'Missing command' });

    exec(command, { cwd: config.workspacePath, timeout: 60000 }, (error, stdout, stderr) => {
      let output = '';
      if (stdout) output += stdout;
      if (stderr) output += stderr;
      if (error) output += `\nError: ${error.message}`;
      res.json({ output: output || 'Executed successfully with no output.' });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get models from OpenAI endpoint
app.get('/api/models', async (req, res) => {
  try {
    const config = await getConfig();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const apiResponse = await fetch(`${config.apiUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!apiResponse.ok) {
      throw new Error(`Models API returned status ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    // Format is usually { data: [ { id: '...', ... } ] }
    const models = data.data ? data.data.map(m => m.id) : [];
    res.json({ success: true, models: models.sort() });
  } catch (err) {
    console.error("Error fetching models:", err.message);
    // Standard fallbacks if request fails (e.g. offline, proxy issues, key not set yet)
    res.json({ 
      success: false, 
      error: err.message,
      models: ['qwen-plus', 'qwen-turbo', 'qwen-max', 'gpt-4o-mini', 'gpt-4o', 'deepseek-coder'] 
    });
  }
});

// Map to keep track of active background processes (e.g. servers)
const activeProcesses = new Map();

// Helper to spawn processes and stream output chunk by chunk to the SSE client
function executeCommandWithStreaming(command, cwd, id, sendEvent, timeoutSec = 120) {
  return new Promise(resolve => {
    const { spawn } = require('child_process');
    const child = spawn(command, { shell: true, cwd });

    let accumulatedOutput = '';
    let resolved = false;

    const resolveTool = (isBackground = false) => {
      if (resolved) return;
      resolved = true;
      if (isBackground) {
        activeProcesses.set(id, child);
        resolve(accumulatedOutput + `\n\n[Process running in the background. Command: "${command}"]`);
      } else {
        resolve(accumulatedOutput || 'Executed with no output.');
      }
    };

    child.stdout.on('data', (data) => {
      const str = data.toString();
      accumulatedOutput += str;
      sendEvent('tool_output', { id, content: str });
    });

    child.stderr.on('data', (data) => {
      const str = data.toString();
      accumulatedOutput += str;
      sendEvent('tool_output', { id, content: str });
    });

    child.on('close', (code) => {
      if (resolved) {
        sendEvent('tool_output_end', { id, exitCode: code });
        activeProcesses.delete(id);
      } else {
        resolveTool(false);
      }
    });

    child.on('error', (err) => {
      accumulatedOutput += `\nError: ${err.message}`;
      sendEvent('tool_output', { id, content: `\nError: ${err.message}` });
      if (!resolved) resolveTool(false);
    });

    // Detect persistent commands (e.g. servers) that shouldn't block the agent
    setTimeout(() => {
      if (!resolved) {
        const isServer = /listen|port|http|ready|dev|start|server|watch|npm run/i.test(command) || 
                         /listen|port|http|ready|started/i.test(accumulatedOutput);
        if (isServer) {
          resolveTool(true); // run in background
        } else {
          // Non-server command timeout (e.g., waiting for npm install)
          setTimeout(() => {
            if (!resolved) {
              child.kill('SIGKILL');
              resolveTool(false);
            }
          }, (timeoutSec - 5) * 1000);
        }
      }
    }, 5000);
  });
}

// Chat SSE completion agent
app.post('/api/chat', async (req, res) => {
  const config = await getConfig();
  const clientMessages = req.body.messages || [];
  let chatId = req.body.chatId;

  // Persistence helpers
  const saveMessage = (role, content, type = 'text') => {
    if (!chatId) return;
    try {
      db.prepare('INSERT INTO messages (chatId, role, content, type) VALUES (?, ?, ?, ?)').run(
        chatId, role, typeof content === 'string' ? content : JSON.stringify(content), type
      );
    } catch (err) {
      console.error("Failed to persist message:", err);
    }
  };

  // If this is the first message in a new chat, we might need to create it
  if (!chatId && clientMessages.length > 0) {
    try {
      const firstUserMsg = clientMessages.find(m => m.role === 'user');
      const title = firstUserMsg ? (firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '')) : 'New Chat';
      const result = db.prepare('INSERT INTO chats (title) VALUES (?)').run(title);
      chatId = result.lastInsertRowid;
    } catch (err) {
      console.error("Failed to create chat for persistence:", err);
    }
  }

  // Persist the last user message if it's new
  if (chatId && clientMessages.length > 0) {
    const lastMsg = clientMessages[clientMessages.length - 1];
    if (lastMsg.role === 'user') {
      saveMessage('user', lastMsg.content);
    }
  }

  // Setup Server-Sent Events headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Establish connection

  const sendEvent = (type, data) => {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  };

  // Compile active messages history with system prompt
  let messages = [
    { role: 'system', content: config.systemPrompt },
    ...clientMessages
  ];

  let loopLimit = 15; // Limit tool loop to prevent infinite runs
  let currentIteration = 0;

  try {
    while (currentIteration < loopLimit) {
      currentIteration++;
      sendEvent('status', { content: 'Thinking...' });

      // Call LLM API (OpenAI specification) with stream: true
      const controller = new AbortController();

      // Cancel LLM call if client closes the tab
      req.on('close', () => {
        controller.abort();
      });

      const apiResponse = await fetch(`${config.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages,
          tools: toolsDefinition,
          tool_choice: 'auto',
          stream: true
        }),
        signal: controller.signal
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        throw new Error(`LLM API returned error: ${apiResponse.status} ${errorText}`);
      }

      // Accumulator variables for this stream
      let assistantContent = '';
      let assistantReasoning = '';
      let accumulatedToolCalls = [];
      let isThinkingInline = false;

      const reader = apiResponse.body;
      const decoder = new TextDecoder();
      let streamBuffer = '';

      for await (const chunk of reader) {
        streamBuffer += decoder.decode(chunk, { stream: true });
        const lines = streamBuffer.split('\n');
        streamBuffer = lines.pop(); // Keep partial line

        for (const line of lines) {
          const cleanedLine = line.trim();
          if (!cleanedLine) continue;
          if (cleanedLine === 'data: [DONE]') continue;
          
          if (cleanedLine.startsWith('data: ')) {
            const dataStr = cleanedLine.slice(6);
            try {
              const data = JSON.parse(dataStr);
              const choice = data.choices?.[0];
              if (!choice) continue;

              const delta = choice.delta;

              // 1. Handle native reasoning content
              if (delta.reasoning_content) {
                assistantReasoning += delta.reasoning_content;
                sendEvent('reasoning', { content: delta.reasoning_content });
              }

              // 2. Handle streamed content (with potential inline <think> tags)
              if (delta.content) {
                let textChunk = delta.content;

                // Match inline <think> or <thought>
                if (textChunk.includes('<think>') || textChunk.includes('<thought>')) {
                  isThinkingInline = true;
                  const tag = textChunk.includes('<think>') ? '<think>' : '<thought>';
                  const parts = textChunk.split(tag);
                  if (parts[0]) {
                    assistantContent += parts[0];
                    sendEvent('text', { content: parts[0] });
                  }
                  if (parts[1]) {
                    assistantReasoning += parts[1];
                    sendEvent('reasoning', { content: parts[1] });
                  }
                  continue;
                }

                // Match inline </think> or </thought>
                if (textChunk.includes('</think>') || textChunk.includes('</thought>')) {
                  isThinkingInline = false;
                  const tag = textChunk.includes('</think>') ? '</think>' : '</thought>';
                  const parts = textChunk.split(tag);
                  if (parts[0]) {
                    assistantReasoning += parts[0];
                    sendEvent('reasoning', { content: parts[0] });
                  }
                  if (parts[1]) {
                    assistantContent += parts[1];
                    sendEvent('text', { content: parts[1] });
                  }
                  continue;
                }

                if (isThinkingInline) {
                  assistantReasoning += textChunk;
                  sendEvent('reasoning', { content: textChunk });
                } else {
                  assistantContent += textChunk;
                  sendEvent('text', { content: textChunk });
                }
              }

              // 3. Accumulate tool calls chunks
              if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index;
                  if (!accumulatedToolCalls[idx]) {
                    accumulatedToolCalls[idx] = {
                      id: tc.id || '',
                      name: tc.function?.name || '',
                      arguments: tc.function?.arguments || ''
                    };
                  } else {
                    if (tc.id) accumulatedToolCalls[idx].id = tc.id;
                    if (tc.function?.name) accumulatedToolCalls[idx].name = tc.function.name;
                    if (tc.function?.arguments) accumulatedToolCalls[idx].arguments += tc.function.arguments;
                  }
                }
              }

            } catch (err) {
              console.error("Error parsing LLM stream chunk:", line, err);
            }
          }
        }
      }

      // Stream response finished successfully

      // Clean up accumulated tool calls array
      const toolCalls = accumulatedToolCalls.filter(x => x !== undefined);

      // Build assistant message object matching OpenAI spec
      const assistantMessage = {
        role: 'assistant',
        content: assistantContent
      };
      if (assistantReasoning) {
        assistantMessage.reasoning_content = assistantReasoning;
      }
      if (toolCalls.length > 0) {
        assistantMessage.tool_calls = toolCalls.map(tc => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.name,
            arguments: tc.arguments
          }
        }));
      }

      // If LLM wants to invoke tools
      if (toolCalls.length > 0) {
        // We push assistant message (including the tool calls) to history
        messages.push(assistantMessage);

        sendEvent('status', { content: 'Analyzing tools...' });

        for (const toolCall of toolCalls) {
          const { name, id } = toolCall;
          let args = {};
          try {
            args = typeof toolCall.arguments === 'string' 
              ? JSON.parse(toolCall.arguments) 
              : toolCall.arguments;
          } catch (e) {
            console.error("Failed to parse tool arguments:", toolCall.arguments);
          }

          // Emit tool execution started
          sendEvent('tool_start', { id, name, args });

          let toolOutput = '';
          try {
            switch (name) {
              case 'list_dir': {
                const target = resolveWorkspacePath(config.workspacePath, args.relative_path);
                const files = await fs.readdir(target, { withFileTypes: true });
                const list = await Promise.all(files.map(async file => {
                  const absolute = path.join(target, file.name);
                  let size = 0;
                  if (file.isFile()) {
                    try {
                      const stat = await fs.stat(absolute);
                      size = stat.size;
                    } catch (_) {}
                  }
                  return {
                    name: file.name,
                    isDirectory: file.isDirectory(),
                    size
                  };
                }));
                toolOutput = JSON.stringify(list);
                break;
              }
              case 'read_file': {
                const filePath = resolveWorkspacePath(config.workspacePath, args.relative_path);
                toolOutput = await fs.readFile(filePath, 'utf-8');
                break;
              }
              case 'write_file': {
                const filePath = resolveWorkspacePath(config.workspacePath, args.relative_path);
                await fs.mkdir(path.dirname(filePath), { recursive: true });
                await fs.writeFile(filePath, args.content || '', 'utf-8');
                toolOutput = `Successfully wrote to file ${args.relative_path}`;
                break;
              }
              case 'run_command': {
                toolOutput = await executeCommandWithStreaming(args.command, config.workspacePath, id, sendEvent, 120);
                break;
              }
              case 'git_clone': {
                const repoUrl = args.repo_url;
                const relPath = args.relative_path;
                const cmd = relPath ? `git clone "${repoUrl}" "${relPath}"` : `git clone "${repoUrl}"`;
                toolOutput = await executeCommandWithStreaming(cmd, config.workspacePath, id, sendEvent, 180);
                break;
              }
              case 'github_get_user': {
                const data = await githubRequest('/user');
                toolOutput = JSON.stringify({
                  login: data.login,
                  name: data.name,
                  avatar_url: data.avatar_url,
                  html_url: data.html_url,
                  public_repos: data.public_repos,
                  private_repos: (data.total_private_repos != null ? data.total_private_repos : null)
                });
                break;
              }
              case 'github_list_repos': {
                const visibility = args.visibility || 'owner';
                const perPage = Math.min(Math.max(parseInt(args.per_page, 10) || 30, 1), 100);
                const data = await githubRequest(`/user/repos?visibility=${encodeURIComponent(visibility)}&per_page=${perPage}&sort=updated`);
                toolOutput = JSON.stringify(data.map(r => ({
                  name: r.name,
                  full_name: r.full_name,
                  private: r.private,
                  html_url: r.html_url,
                  description: r.description,
                  default_branch: r.default_branch,
                  updated_at: r.updated_at
                })));
                break;
              }
              case 'github_create_repo': {
                const body = {
                  name: args.name,
                  description: args.description || '',
                  private: Boolean(args.private),
                  auto_init: args.auto_init !== false
                };
                const data = await githubRequest('/user/repos', { method: 'POST', body });
                toolOutput = JSON.stringify({
                  name: data.name,
                  full_name: data.full_name,
                  html_url: data.html_url,
                  private: data.private,
                  default_branch: data.default_branch,
                  clone_url: data.clone_url
                });
                break;
              }
              case 'github_push_files': {
                const cfg = await getConfig();
                const owner = args.owner || (cfg.githubUser && cfg.githubUser.login);
                const repo = args.repo;
                if (!owner) {
                  throw new Error('Could not determine repository owner. Connect GitHub first or pass owner explicitly.');
                }
                // Resolve default branch if not provided
                let branch = args.branch;
                if (!branch) {
                  const repoInfo = await githubRequest(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
                  branch = repoInfo.default_branch;
                }
                const files = Array.isArray(args.files) ? args.files : [];
                if (files.length === 0) {
                  throw new Error('No files provided to github_push_files.');
                }
                const commitMessage = args.commit_message || `Update ${files.length} file(s) via mobile-code-agent`;
                const results = [];
                for (const file of files) {
                  // Look up existing file SHA if updating
                  let sha;
                  try {
                    const existing = await githubRequest(
                      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(file.path)}?ref=${encodeURIComponent(branch)}`
                    );
                    if (existing && existing.sha) sha = existing.sha;
                  } catch (_) {
                    // File doesn't exist yet — that's fine for new files
                  }
                  const body = {
                    message: commitMessage,
                    branch,
                    content: Buffer.from(String(file.content), 'utf-8').toString('base64')
                  };
                  if (sha) body.sha = sha;
                  const result = await githubRequest(
                    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(file.path)}`,
                    { method: 'PUT', body }
                  );
                  results.push({
                    path: file.path,
                    commit_sha: result.commit && result.commit.sha,
                    content_url: result.content && result.content.html_url
                  });
                }
                toolOutput = JSON.stringify({ owner, repo, branch, count: results.length, files: results });
                break;
              }
              default:
                toolOutput = `Error: Tool ${name} not found.`;
            }
          } catch (toolErr) {
            toolOutput = `Error executing tool: ${toolErr.message}`;
          }

          // Emit tool execution finished
          sendEvent('tool_end', { id, name, output: toolOutput });

          // Append tool message response to history
          messages.push({
            role: 'tool',
            tool_call_id: id,
            name: name,
            content: toolOutput
          });

          // Persist tool call and output
          saveMessage('assistant', `Call tool: ${name} with args ${JSON.stringify(args)}`, 'tool_call');
          saveMessage('tool', toolOutput, 'tool_output');
        }

        // Loop continues to feed tool outputs back to LLM
        continue;
      } else {
        // No tool calls means we are finished
        messages.push(assistantMessage);
      }

      break;
    }

    sendEvent('done', { chatId });
    // Persist final assistant message
    const finalAssistant = messages[messages.length - 1];
    if (finalAssistant && finalAssistant.role === 'assistant' && !finalAssistant.tool_calls) {
      saveMessage('assistant', finalAssistant.content);
    }
  } catch (err) {
    console.error("Chat handler error:", err);
    sendEvent('error', { content: err.message });
  } finally {
    res.end();
  }
});

// Port configuration
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  const config = await getConfig();
  console.log(`===================================================`);
  console.log(`Mobile Code Agent listening on http://localhost:${PORT}`);
  console.log(`Workspace folder is: ${config.workspacePath}`);
  console.log(`===================================================`);
});
