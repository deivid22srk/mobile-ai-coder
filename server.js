const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const fsSync = require('fs');
const initSqlJs = require('sql.js');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Path to store config
const CONFIG_FILE = path.join(__dirname, 'config.json');
const DB_FILE = path.join(__dirname, 'database.sqlite');
const DB_LEGACY_FILE = path.join(__dirname, 'database.json');

// ------------------------------------------------------------------
// SQLite Database (sql.js — pure JS, no native compilation needed)
// ------------------------------------------------------------------
class SqliteDb {
  constructor(filePath) {
    this.filePath = filePath;
    this.db = null;
  }

  async init() {
    const SQL = await initSqlJs();
    
    // Try to migrate legacy JSON data first
    await this.migrateFromJson(SQL);

    // Load or create SQLite database
    if (fsSync.existsSync(this.filePath)) {
      const buffer = fsSync.readFileSync(this.filePath);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }

    // Ensure schema exists
    this.db.run(`
      CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    this.db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT DEFAULT 'text',
        tool_call_id TEXT,
        tool_calls TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
      )
    `);
    this.db.run(`
      CREATE TABLE IF NOT EXISTS chat_skills (
        chat_id INTEGER NOT NULL,
        skill_name TEXT NOT NULL,
        PRIMARY KEY (chat_id, skill_name),
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
      )
    `);
    this.db.run(`
      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id INTEGER,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        scope TEXT DEFAULT 'global',
        type TEXT DEFAULT 'fact',
        tags TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
      )
    `);
    // Enable WAL mode for better concurrent reads
    this.db.run('PRAGMA journal_mode=WAL');

    this.save();
  }

  async migrateFromJson(SQL) {
    if (!fsSync.existsSync(DB_LEGACY_FILE)) return;
    if (fsSync.existsSync(this.filePath)) return; // Already migrated

    console.log('Migrating legacy JSON database to SQLite...');
    try {
      const jsonData = JSON.parse(fsSync.readFileSync(DB_LEGACY_FILE, 'utf-8'));
      if (!jsonData.chats || jsonData.chats.length === 0) return;

      this.db = new SQL.Database();
      this.db.run(`
        CREATE TABLE IF NOT EXISTS chats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `);
      this.db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chat_id INTEGER NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          type TEXT DEFAULT 'text',
          tool_call_id TEXT,
          tool_calls TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
        )
      `);

      const insertChat = this.db.prepare('INSERT INTO chats (id, title, created_at) VALUES (?, ?, ?)');
      const insertMsg = this.db.prepare('INSERT INTO messages (chat_id, role, content, type, tool_call_id, tool_calls, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');

      for (const chat of jsonData.chats) {
        insertChat.run([chat.id, chat.title, chat.createdAt]);
      }
      for (const msg of jsonData.messages) {
        insertMsg.run([
          msg.chatId,
          msg.role,
          typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
          msg.type || 'text',
          msg.tool_call_id || null,
          msg.tool_calls ? JSON.stringify(msg.tool_calls) : null,
          msg.createdAt || new Date().toISOString()
        ]);
      }

      this.save();
      // Rename legacy file so it won't be migrated again
      fsSync.renameSync(DB_LEGACY_FILE, DB_LEGACY_FILE + '.backup');
      console.log(`Migration complete: ${jsonData.chats.length} chats, ${jsonData.messages.length} messages`);
    } catch (err) {
      console.error('Migration failed (legacy file may be corrupt):', err.message);
      this.db = new SQL.Database();
    }
  }

  save() {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fsSync.writeFileSync(this.filePath, buffer);
  }

  getChats() {
    const rows = this.db.exec('SELECT id, title, created_at FROM chats ORDER BY created_at DESC');
    if (!rows.length) return [];
    return rows[0].values.map(row => ({
      id: row[0],
      title: row[1],
      createdAt: row[2]
    }));
  }

  createChat(title) {
    const createdAt = new Date().toISOString();
    this.db.run('INSERT INTO chats (title, created_at) VALUES (?, ?)', [title || 'New Chat', createdAt]);
    const id = this.db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    this.save();
    return { id, title: title || 'New Chat', createdAt };
  }

  getChat(id) {
    const rows = this.db.exec('SELECT id, title, created_at FROM chats WHERE id = ?', [id]);
    if (!rows.length || !rows[0].values.length) return null;
    const chat = rows[0].values[0];
    const msgRows = this.db.exec(
      'SELECT id, chat_id, role, content, type, tool_call_id, tool_calls, created_at FROM messages WHERE chat_id = ? ORDER BY id ASC',
      [id]
    );
    const messages = msgRows.length ? msgRows[0].values.map(row => ({
      id: row[0],
      chatId: row[1],
      role: row[2],
      content: row[3],
      type: row[4],
      tool_call_id: row[5] || undefined,
      tool_calls: row[6] ? JSON.parse(row[6]) : undefined,
      createdAt: row[7]
    })) : [];
    return { id: chat[0], title: chat[1], createdAt: chat[2], messages };
  }

  deleteChat(id) {
    this.db.run('DELETE FROM messages WHERE chat_id = ?', [id]);
    this.db.run('DELETE FROM chat_skills WHERE chat_id = ?', [id]);
    this.db.run('DELETE FROM chats WHERE id = ?', [id]);
    this.save();
  }

  saveMessage(chatId, role, content, type = 'text', toolCallId = null, toolCalls = null) {
    const createdAt = new Date().toISOString();
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const toolCallsStr = toolCalls ? JSON.stringify(toolCalls) : null;
    this.db.run(
      'INSERT INTO messages (chat_id, role, content, type, tool_call_id, tool_calls, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [chatId, role, contentStr, type, toolCallId, toolCallsStr, createdAt]
    );
    const id = this.db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    this.save();
    return { id, chatId, role, content: contentStr, type, tool_call_id: toolCallId, tool_calls: toolCalls, createdAt };
  }

  getChatSkills(chatId) {
    const rows = this.db.exec('SELECT skill_name FROM chat_skills WHERE chat_id = ?', [chatId]);
    if (!rows.length) return [];
    return rows[0].values.map(r => r[0]);
  }

  setChatSkill(chatId, skillName, active) {
    if (active) {
      this.db.run('INSERT OR IGNORE INTO chat_skills (chat_id, skill_name) VALUES (?, ?)', [chatId, skillName]);
    } else {
      this.db.run('DELETE FROM chat_skills WHERE chat_id = ? AND skill_name = ?', [chatId, skillName]);
    }
    this.save();
  }

  deleteChatSkills(chatId) {
    this.db.run('DELETE FROM chat_skills WHERE chat_id = ?', [chatId]);
    this.save();
  }

  // Memory CRUD
  saveMemory(chatId, name, content, scope = 'global', type = 'fact', tags = '') {
    const now = new Date().toISOString();
    // Check if memory with same name+scope exists
    const existing = this.db.exec(
      'SELECT id FROM memories WHERE name = ? AND scope = ? AND (chat_id IS ? OR (chat_id IS NULL AND ? IS NULL))',
      [name, scope, chatId, chatId]
    );
    if (existing.length && existing[0].values.length) {
      const id = existing[0].values[0][0];
      this.db.run(
        'UPDATE memories SET content = ?, type = ?, tags = ?, updated_at = ? WHERE id = ?',
        [content, type, tags, now, id]
      );
      this.save();
      return { id, name, content, scope, type, tags, updatedAt: now };
    }
    this.db.run(
      'INSERT INTO memories (chat_id, name, content, scope, type, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [chatId, name, content, scope, type, tags, now, now]
    );
    const id = this.db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    this.save();
    return { id, chatId, name, content, scope, type, tags, createdAt: now, updatedAt: now };
  }

  getMemories(scope = 'global', chatId = null) {
    if (chatId) {
      const rows = this.db.exec(
        'SELECT id, chat_id, name, content, scope, type, tags, created_at, updated_at FROM memories WHERE scope = ? OR chat_id = ? ORDER BY updated_at DESC',
        [scope, chatId]
      );
      if (!rows.length) return [];
      return rows[0].values.map(r => ({
        id: r[0], chatId: r[1], name: r[2], content: r[3],
        scope: r[4], type: r[5], tags: r[6], createdAt: r[7], updatedAt: r[8]
      }));
    }
    const rows = this.db.exec(
      'SELECT id, chat_id, name, content, scope, type, tags, created_at, updated_at FROM memories WHERE scope = ? ORDER BY updated_at DESC',
      [scope]
    );
    if (!rows.length) return [];
    return rows[0].values.map(r => ({
      id: r[0], chatId: r[1], name: r[2], content: r[3],
      scope: r[4], type: r[5], tags: r[6], createdAt: r[7], updatedAt: r[8]
    }));
  }

  searchMemories(query) {
    const like = `%${query}%`;
    const rows = this.db.exec(
      'SELECT id, chat_id, name, content, scope, type, tags, created_at, updated_at FROM memories WHERE content LIKE ? OR name LIKE ? OR tags LIKE ? ORDER BY updated_at DESC LIMIT 20',
      [like, like, like]
    );
    if (!rows.length) return [];
    return rows[0].values.map(r => ({
      id: r[0], chatId: r[1], name: r[2], content: r[3],
      scope: r[4], type: r[5], tags: r[6], createdAt: r[7], updatedAt: r[8]
    }));
  }

  deleteMemory(id) {
    this.db.run('DELETE FROM memories WHERE id = ?', [id]);
    this.save();
  }

  getGlobalMemoriesForInjection() {
    const rows = this.db.exec(
      "SELECT name, content, type FROM memories WHERE scope = 'global' ORDER BY updated_at DESC LIMIT 30"
    );
    if (!rows.length) return [];
    return rows[0].values.map(r => ({ name: r[0], content: r[1], type: r[2] }));
  }
}

const db = new SqliteDb(DB_FILE);

// Default configurations
const DEFAULT_CONFIG = {
  provider: 'custom',
  apiUrl: '',
  apiKey: '0',
  opencodeZenApiKey: '',
  model: 'qwen-plus',
  systemPrompt: 'You are *coder (mobile-ai-coder), a powerful agentic AI coding assistant optimized for mobile. You have access to local tools in the workspace: write_file, read_file, list_dir, run_command, git_clone, and (when the user has connected GitHub) github_list_repos, github_create_repo, github_push_files, github_get_user.\n\nUse these tools to help the user. Always explain what you are doing (e.g. "I am going to read the index.html file to inspect its content") right before invoking a tool. Make sure code changes are correct and tested.\n\n## Iteration Limit\n\nYou have a limited number of tool calls per turn. When you need more, you MUST end your response with a clear instruction like "Tell me to continue and I will keep working on this." or "Say \\"continue\\" and I will finish the remaining steps." The user will then say "continue" and you can proceed. Always track progress with `update_plan` so the user knows what has been done and what remains.\n\n## Sub-Agents\n\nYou can spawn sub-agents to delegate work using `spawn_agent`. This is useful for:\n- Exploring code in parallel while you plan\n- Delegating large refactoring tasks\n- Running independent investigations\n\nAfter spawning, use `list_agents` to check status and `wait_agent` to get results.\nSub-agents share your workspace and tools but focus only on their assigned task.\n\n## update_Plan Tool\n\nYou have access to an `update_plan` tool which tracks steps and progress as a visual checklist for the user.\n\n**When to use a plan:**\n- The task is non-trivial and requires multiple actions\n- There are logical phases or dependencies where sequencing matters\n- The user asked for multiple things in one prompt\n- You generate additional steps while working\n\n**When NOT to use a plan:**\n- Simple or single-step queries you can do immediately\n- Questions or brainstorming that don\'t need code changes\n\n**How to use update_plan:**\n- Create a plan with short 1-sentence steps (max 10 words each)\n- Each step must have a status: `pending`, `in_progress`, or `completed`\n- Exactly one step should be `in_progress` at a time\n- Update the plan as you complete steps: mark finished steps as `completed` and the next step as `in_progress`\n- When all steps are complete, mark all as `completed`\n- Do not jump an item from pending to completed without setting it to in_progress first\n- Update your plan before reaching the iteration limit so the user can see your progress',
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

function getActiveConnectionInfo(config) {
  const provider = config.provider || 'custom';
  if (provider === 'opencode-zen') {
    return {
      apiUrl: 'https://opencode.ai/zen/v1',
      apiKey: config.opencodeZenApiKey || ''
    };
  }
  return {
    apiUrl: config.apiUrl || '',
    apiKey: config.apiKey || '0'
  };
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

// ------------------------------------------------------------------
// Skills System
// ------------------------------------------------------------------
const SKILLS_DIR = path.join(__dirname, '.mobile-ai-coder', 'skills');

function parseSkillFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  const frontmatter = {};
  const lines = match[1].split('\n');
  let currentKey = null;
  let blockScalar = null; // '>' folded, '|' literal
  let blockValue = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const sep = line.indexOf(':');
    if (sep > 0 && (blockScalar === null || line.trim().length === 0 || line[0] !== ' ')) {
      // Flush previous block scalar if any
      if (currentKey && blockScalar !== null) {
        let val = blockValue.join(blockScalar === '>' ? ' ' : '\n');
        val = val.replace(/^\s+/gm, '').trim();
        frontmatter[currentKey] = val;
        blockValue = [];
        blockScalar = null;
      }
      currentKey = line.slice(0, sep).trim();
      let val = line.slice(sep + 1).trim();
      if (val === '>' || val === '|') {
        blockScalar = val;
      } else {
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        frontmatter[currentKey] = val;
        currentKey = null;
      }
    } else if (currentKey && blockScalar !== null) {
      blockValue.push(line);
    }
  }
  // Flush last block scalar
  if (currentKey && blockScalar !== null) {
    let val = blockValue.join(blockScalar === '>' ? ' ' : '\n');
    val = val.replace(/^\s+/gm, '').trim();
    frontmatter[currentKey] = val;
  }
  return { frontmatter, body: match[2].trim() };
}

async function discoverSkills() {
  const skills = [];
  try {
    const entries = await fs.readdir(SKILLS_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const skillPath = path.join(SKILLS_DIR, entry.name, 'SKILL.md');
      try {
        const content = await fs.readFile(skillPath, 'utf-8');
        const parsed = parseSkillFrontmatter(content);
        if (!parsed || !parsed.frontmatter.name) {
          console.log(`SKILL PARSE FAIL for ${entry.name}: no frontmatter/name`);
          continue;
        }
        if (parsed.frontmatter.name.includes('"')) {
          console.log(`SKILL QUOTE BUG for ${entry.name}: name=${JSON.stringify(parsed.frontmatter.name)}`);
        }
        skills.push({
          name: parsed.frontmatter.name,
          description: parsed.frontmatter.description || '',
          content: parsed.body
        });
      } catch (_) {}
    }
  } catch (_) {
    // skills dir doesn't exist yet
  }
  return skills;
}

const skillsCache = { skills: [], loaded: false };

async function refreshSkills() {
  skillsCache.skills = await discoverSkills();
  skillsCache.loaded = true;
  return skillsCache.skills;
}

function getCachedSkills() {
  return skillsCache.skills;
}

// Agent registry for sub-agent management
const agentRegistry = new Map();

function generateAgentNickname() {
  const names = ['Archimedes', 'Euclid', 'Galileo', 'Einstein', 'Newton', 'Ada', 'Turing', 'Lovelace', 'Faraday', 'Curie', 'Bohr', 'Feynman', 'Planck', 'Tesla', 'Darwin', 'Mendel', 'Pasteur', 'Lavoisier', 'Kepler', 'Copernicus'];
  const used = new Set(Array.from(agentRegistry.values()).map(a => a.nickname));
  for (const name of names) {
    if (!used.has(name)) return name;
  }
  return `Agent-${agentRegistry.size + 1}`;
}

async function runSubAgent(agentId, nickname, task, chatId) {
  const config = await getConfig();
  const maxIterations = 10;
  let messages = [
    { role: 'system', content: config.systemPrompt + '\n\nYou are a sub-agent tasked with a specific goal. Focus only on your task and report results concisely.' },
    { role: 'user', content: task }
  ];

  const entry = agentRegistry.get(agentId);
  if (!entry) return;

  try {
    for (let i = 0; i < maxIterations; i++) {
      if (entry.cancelled) {
        entry.output = 'Sub-agent was cancelled.';
        entry.status = 'cancelled';
        return;
      }

      entry.status = 'running';
      const conn = getActiveConnectionInfo(config);

      const response = await fetch(`${conn.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${conn.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages,
          tools: toolsDefinition,
          tool_choice: 'auto',
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        entry.output = `Error: LLM API returned ${response.status}: ${errorText}`;
        entry.status = 'error';
        return;
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      if (!choice) {
        entry.output = 'Error: No response from LLM';
        entry.status = 'error';
        return;
      }

      const msg = choice.message;
      messages.push({ role: 'assistant', content: msg.content || '', tool_calls: msg.tool_calls });

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        for (const tc of msg.tool_calls) {
          let args = {};
          try {
            args = typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments;
          } catch (e) {
            args = {};
          }

          let toolOutput = '';
          try {
            const name = tc.function.name;
            switch (name) {
              case 'list_dir': {
                const target = resolveWorkspacePath(config.workspacePath, args.relative_path);
                const files = await fs.readdir(target, { withFileTypes: true });
                const list = await Promise.all(files.map(async f => {
                  const absolute = path.join(target, f.name);
                  let size = 0;
                  if (f.isFile()) { try { const s = await fs.stat(absolute); size = s.size; } catch (_) {} }
                  return { name: f.name, isDirectory: f.isDirectory(), size };
                }));
                toolOutput = JSON.stringify(list);
                break;
              }
              case 'read_file': {
                const fp = resolveWorkspacePath(config.workspacePath, args.relative_path);
                toolOutput = await fs.readFile(fp, 'utf-8');
                break;
              }
              case 'write_file': {
                const fp = resolveWorkspacePath(config.workspacePath, args.relative_path);
                await fs.mkdir(path.dirname(fp), { recursive: true });
                await fs.writeFile(fp, args.content || '', 'utf-8');
                toolOutput = `Successfully wrote to ${args.relative_path}`;
                break;
              }
              case 'run_command': {
                const { spawn } = require('child_process');
                toolOutput = await new Promise((resolve, reject) => {
                  const child = spawn('sh', ['-c', args.command], { cwd: config.workspacePath, shell: false, timeout: 60000 });
                  let out = '';
                  child.stdout.on('data', d => out += d.toString());
                  child.stderr.on('data', d => out += d.toString());
                  child.on('close', code => resolve(out + (code !== 0 ? `\nExit code: ${code}` : '')));
                  child.on('error', reject);
                });
                break;
              }
              case 'git_clone': {
                const cmd = args.relative_path ? `git clone "${args.repo_url}" "${args.relative_path}"` : `git clone "${args.repo_url}"`;
                const { spawn } = require('child_process');
                toolOutput = await new Promise((resolve, reject) => {
                  const child = spawn('sh', ['-c', cmd], { cwd: config.workspacePath, shell: false, timeout: 180000 });
                  let out = '';
                  child.stdout.on('data', d => out += d.toString());
                  child.stderr.on('data', d => out += d.toString());
                  child.on('close', code => resolve(out + (code !== 0 ? `\nExit code: ${code}` : '')));
                  child.on('error', reject);
                });
                break;
              }
              case 'memory_save': {
                const mem = db.saveMemory(chatId, args.name || 'unnamed', args.content || '', args.scope || 'global', args.type || 'fact', args.tags || '');
                toolOutput = JSON.stringify({ success: true, memory: mem });
                break;
              }
              case 'memory_search': {
                const results = db.searchMemories(args.query || '');
                toolOutput = JSON.stringify({ success: true, results });
                break;
              }
              default:
                toolOutput = `Tool ${name} is not available to sub-agents.`;
            }
          } catch (toolErr) {
            toolOutput = `Error: ${toolErr.message}`;
          }

          messages.push({ role: 'tool', tool_call_id: tc.id, name: tc.function.name, content: toolOutput });
        }
      } else {
        // No tool calls - agent finished its task
        entry.output = msg.content || 'Task completed.';
        entry.status = 'completed';
        return;
      }
    }
    entry.output = 'Sub-agent reached maximum iterations without completing.';
    entry.status = 'completed';
  } catch (err) {
    entry.output = `Error: ${err.message}`;
    entry.status = 'error';
  }
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
  },
  {
    type: 'function',
    function: {
      name: 'memory_save',
      description: 'Save a persistent fact, preference, or observation that should be remembered across sessions.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Short identifier for this memory (e.g., "user-name", "project-framework")' },
          content: { type: 'string', description: 'The information to remember.' },
          scope: { type: 'string', enum: ['global', 'chat'], description: 'Global memories are shared across all chats. Chat memories are per-conversation.' },
          type: { type: 'string', enum: ['fact', 'preference', 'identity', 'project'], description: 'Category of memory.' }
        },
        required: ['name', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'memory_search',
      description: 'Search saved memories to recall facts, preferences, and past decisions.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Keywords to search for in memories.' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'skill_read',
      description: 'Load the full instructions for an active skill. Call this when you decide to use a skill listed in Active Skills.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'The skill name to load.' }
        },
        required: ['name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'spawn_agent',
      description: 'Spawns a sub-agent to work on a specific task in the background. Use this to delegate work (e.g. explore code, refactor a module) while you continue with other tasks.',
      parameters: {
        type: 'object',
        properties: {
          task: {
            type: 'string',
            description: 'Clear, specific task description for the sub-agent. Include file paths, requirements, and expected output format.'
          }
        },
        required: ['task']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_agents',
      description: 'Lists all active sub-agents and their current status (running, completed, error, cancelled).',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'wait_agent',
      description: 'Waits for a sub-agent to complete and returns its final output. Use this after spawning an agent to get results.',
      parameters: {
        type: 'object',
        properties: {
          agent_id: {
            type: 'string',
            description: 'The agent_id returned by spawn_agent.'
          }
        },
        required: ['agent_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_plan',
      description: 'Create or update a step-by-step plan with status tracking. Shows a visual checklist to the user. Use this for multi-step tasks to show your approach and progress.',
      parameters: {
        type: 'object',
        properties: {
          explanation: {
            type: 'string',
            description: 'Optional explanation of what this plan covers or what changed since the last update.'
          },
          plan: {
            type: 'array',
            description: 'List of steps in the plan with their current status.',
            items: {
              type: 'object',
              properties: {
                step: { type: 'string', description: 'Brief step description (max 10 words).' },
                status: { type: 'string', enum: ['pending', 'in_progress', 'completed'], description: 'Current status of this step.' }
              },
              required: ['step', 'status']
            }
          }
        },
        required: ['plan']
      }
    }
  }
];

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Chat History Endpoints
app.get('/api/chats', (req, res) => {
  try {
    res.json(db.getChats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chats', (req, res) => {
  try {
    const { title } = req.body;
    res.json(db.createChat(title));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/chats/:id', (req, res) => {
  try {
    const chat = db.getChat(req.params.id);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/chats/:id', (req, res) => {
  try {
    db.deleteChat(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Skills Endpoints
app.get('/api/skills', async (req, res) => {
  try {
    if (!skillsCache.loaded) await refreshSkills();
    res.json({ skills: getCachedSkills() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/chats/:id/skills', (req, res) => {
  try {
    const active = db.getChatSkills(parseInt(req.params.id));
    res.json({ active });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chats/:id/skills', (req, res) => {
  try {
    const chatId = parseInt(req.params.id);
    const { name, active } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing skill name' });
    db.setChatSkill(chatId, name, active);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new skill manually
app.post('/api/skills', async (req, res) => {
  try {
    const { name, description, content } = req.body;
    if (!name || !content) return res.status(400).json({ error: 'Name and content are required' });
    const safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const skillDir = path.join(SKILLS_DIR, safeName);
    const skillFile = path.join(skillDir, 'SKILL.md');
    const frontmatter = `---\nname: ${safeName}\ndescription: ${description || ''}\n---\n\n`;
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(skillFile, frontmatter + content, 'utf-8');
    await refreshSkills();
    res.json({ success: true, skill: { name: safeName, description: description || '', content } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import skill from URL
app.post('/api/skills/import', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    // Try fetching the URL — could be a direct SKILL.md or an index.json
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Failed to fetch URL: ${response.status}`);
    const text = await response.text();

    // Determine if it's a JSON index or a markdown skill file
    let imported = [];
    if (url.endsWith('.json') || text.trim().startsWith('{')) {
      // Treat as index.json (opencode format: { skills: [{ name, files: [] }] })
      let index;
      try { index = JSON.parse(text); } catch (_) { throw new Error('Invalid JSON index at URL'); }
      const skillsList = index.skills || [];
      for (const skill of skillsList) {
        if (!skill.name || !skill.files) continue;
        // Try to fetch SKILL.md from the first .md file in files, or from the base URL
        const mdFile = skill.files.find(f => f.endsWith('.md') || f.endsWith('SKILL.md')) || (skill.files[0] + '/SKILL.md');
        const mdUrl = new URL(mdFile, url).href;
        try {
          const mdRes = await fetch(mdUrl, { signal: AbortSignal.timeout(5000) });
          if (!mdRes.ok) continue;
          const mdContent = await mdRes.text();
          const parsed = parseSkillFrontmatter(mdContent);
          if (!parsed || !parsed.frontmatter.name) continue;
          const safeName = parsed.frontmatter.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
          const skillDir = path.join(SKILLS_DIR, safeName);
          await fs.mkdir(skillDir, { recursive: true });
          await fs.writeFile(path.join(skillDir, 'SKILL.md'), mdContent, 'utf-8');
          imported.push({ name: safeName, description: parsed.frontmatter.description || '' });
        } catch (_) { continue; }
      }
    } else {
      // Treat as direct SKILL.md
      const parsed = parseSkillFrontmatter(text);
      if (!parsed || !parsed.frontmatter.name) throw new Error('Invalid skill file: missing name in frontmatter');
      const safeName = parsed.frontmatter.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const skillDir = path.join(SKILLS_DIR, safeName);
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), text, 'utf-8');
      imported.push({ name: safeName, description: parsed.frontmatter.description || '' });
    }

    await refreshSkills();
    res.json({ success: true, imported });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a skill
app.delete('/api/skills/:name', async (req, res) => {
  try {
    const safeName = req.params.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const skillDir = path.join(SKILLS_DIR, safeName);
    await fs.rm(skillDir, { recursive: true, force: true });
    await refreshSkills();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Agent Skills Catalog — live from GitHub API
const SKILLS_CATALOG_CACHE = { data: null, timestamp: 0, ttl: 5 * 60 * 1000 };

async function fetchSkillsCatalog() {
  const now = Date.now();
  if (SKILLS_CATALOG_CACHE.data && (now - SKILLS_CATALOG_CACHE.timestamp) < SKILLS_CATALOG_CACHE.ttl) {
    return SKILLS_CATALOG_CACHE.data;
  }
  const categories = ['curated', 'system', 'experimental'];
  const result = {};
  for (const cat of categories) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/openai/skills/contents/skills/.${cat}`,
        { headers: { 'Accept': 'application/vnd.github.v3+json' }, signal: AbortSignal.timeout(10000) }
      );
      if (res.ok) {
        const data = await res.json();
        result[cat] = data.filter(item => item.type === 'dir').map(item => item.name);
      } else {
        result[cat] = [];
      }
    } catch (e) {
      console.error(`Failed to fetch ${cat} skills:`, e.message);
      result[cat] = [];
    }
  }

  SKILLS_CATALOG_CACHE.data = result;
  SKILLS_CATALOG_CACHE.timestamp = now;
  return result;
}

app.get('/api/skills/catalog', async (req, res) => {
  try {
    const catalog = await fetchSkillsCatalog();
    res.json(catalog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/skills/import-from-catalog', async (req, res) => {
  try {
    const { name, category } = req.body;
    if (!name || !category) return res.status(400).json({ error: 'Skill name and category are required' });

    const catalog = await fetchSkillsCatalog();
    if (!catalog[category] || !catalog[category].includes(name)) {
      return res.status(400).json({ error: `Skill "${name}" not found in ${category} catalog` });
    }

    const url = `https://raw.githubusercontent.com/openai/skills/main/skills/.${category}/${name}/SKILL.md`;
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Failed to fetch skill: HTTP ${response.status}`);
    const mdContent = await response.text();

    // Parse existing frontmatter or create new one
    let safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    let description = `Agent skill from openai/skills .${category}`;
    let body = mdContent;

    const parsed = parseSkillFrontmatter(mdContent);
    if (parsed) {
      description = parsed.frontmatter.description || description;
      body = mdContent;
    } else {
      const frontmatter = `---\nname: ${safeName}\ndescription: ${description}\n---\n\n`;
      body = frontmatter + mdContent;
    }

    const skillDir = path.join(SKILLS_DIR, safeName);
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(path.join(skillDir, 'SKILL.md'), body, 'utf-8');
    await refreshSkills();

    res.json({ success: true, skill: { name: safeName, description, content: body } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Memory Endpoints
app.get('/api/memories', (req, res) => {
  try {
    const scope = req.query.scope || 'global';
    const chatId = req.query.chatId ? parseInt(req.query.chatId) : null;
    const memories = db.getMemories(scope, chatId);
    res.json({ memories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/memories', (req, res) => {
  try {
    const { name, content, scope, type, tags, chatId } = req.body;
    if (!name || !content) return res.status(400).json({ error: 'Name and content are required' });
    const memory = db.saveMemory(chatId || null, name, content, scope || 'global', type || 'fact', tags || '');
    res.json({ success: true, memory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/memories/:id', (req, res) => {
  try {
    db.deleteMemory(parseInt(req.params.id));
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
    const conn = getActiveConnectionInfo(config);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const apiResponse = await fetch(`${conn.apiUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${conn.apiKey}`
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
    const child = spawn(command, { shell: true, cwd, detached: true });

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
              try {
                process.kill(-child.pid, 'SIGKILL');
              } catch (e) {
                child.kill('SIGKILL');
              }
              resolveTool(false);
            }
          }, (timeoutSec - 5) * 1000);
        }
      }
    }, 5000);
  });
}

// Active background executions
const activeExecutions = new Map();

function cleanMessagesForApi(messages) {
  return messages.map(msg => {
    const clean = {
      role: msg.role,
      content: msg.content
    };
    if (msg.tool_call_id) clean.tool_call_id = msg.tool_call_id;
    if (msg.tool_calls) clean.tool_calls = msg.tool_calls;
    if (msg.name) clean.name = msg.name;
    return clean;
  });
}

async function runAgentExecution(chatId, clientMessages) {
  // If already running, return the existing execution
  if (activeExecutions.has(chatId)) {
    return activeExecutions.get(chatId);
  }

  const config = await getConfig();

  // Get current message count in DB before adding this turn's messages
  const chatDataBefore = db.getChat(chatId);
  const startIndex = chatDataBefore ? (chatDataBefore.messages || []).length : 0;

  const execution = {
    chatId,
    startIndex,
    events: [],
    clients: new Set(),
    done: false,
    error: null,
    promise: null,
    abortController: null,
    cancelled: false
  };
  activeExecutions.set(chatId, execution);

  // Helper to send events to all connected clients and buffer them
  const broadcastEvent = (type, data) => {
    const eventPayload = { type, ...data };
    if (type === 'tool_output' && data.content && !data.output) {
      eventPayload.output = data.content;
    }
    execution.events.push(eventPayload);
    for (const res of execution.clients) {
      try {
        res.write(`data: ${JSON.stringify(eventPayload)}\n\n`);
      } catch (err) {
        console.error("Error writing to client SSE:", err);
      }
    }
  };

  const saveMessage = (role, content, type = 'text', toolCallId = null, toolCalls = null) => {
    try {
      db.saveMessage(chatId, role, content, type, toolCallId, toolCalls);
    } catch (err) {
      console.error("Failed to persist message:", err);
    }
  };

  // Persist the last user message if it's new
  if (clientMessages.length > 0) {
    const lastMsg = clientMessages[clientMessages.length - 1];
    if (lastMsg.role === 'user') {
      saveMessage('user', lastMsg.content);
    }
  }

  // Compile memories for injection
  const globalMemories = db.getGlobalMemoriesForInjection();
  let memoriesBlock = '';
  if (globalMemories.length > 0) {
    memoriesBlock = '\n\n---\n### Persistent Memories\n' +
      globalMemories.map(m =>
        `<memory name="${m.name}" type="${m.type}">\n${m.content}\n</memory>`
      ).join('\n\n') +
      '\n---';
  }

  // Compile active messages history with system prompt + active skills
  // Uses full injection for skills that fit in budget, progressive disclosure for overflow
  const activeSkillNames = chatId ? db.getChatSkills(chatId) : [];
  let skillsBlock = '';
  let skillReadCache = {};
  if (activeSkillNames.length > 0 && skillsCache.loaded) {
    const allSkills = getCachedSkills();
    const activeSkills = allSkills.filter(s => activeSkillNames.includes(s.name));
    if (activeSkills.length > 0) {
      const SKILLS_BUDGET = 8000;
      let block = '';
      let progressiveSkills = [];
      for (const s of activeSkills) {
        const fullEntry = `<skill name="${s.name}">\n${s.content}\n</skill>\n`;
        const progEntry = `<skill name="${s.name}" description="${s.description}">\n`;
        if (block.length + fullEntry.length <= SKILLS_BUDGET) {
          block += fullEntry;
        } else if (block.length + progEntry.length <= SKILLS_BUDGET) {
          block += progEntry;
          progressiveSkills.push(s.name);
        } else {
          break;
        }
      }
      if (block) {
        let hint = '';
        if (progressiveSkills.length > 0) {
          hint = '\nUse skill_read("skill-name") to load full instructions for skills marked with description only.';
        }
        skillsBlock = '\n\n---\n### Active Skills\n' + block.trimEnd() + hint + '\n---';
      }
    }
  }
  let messages = [
    { role: 'system', content: config.systemPrompt + memoriesBlock + skillsBlock },
    ...clientMessages
  ];

  // Run the background execution
  execution.promise = (async () => {
    let loopLimit = 50; // Limit tool loop to prevent infinite runs
    let currentIteration = 0;
    let hitLoopLimit = false;

    try {
      while (currentIteration < loopLimit && !execution.cancelled) {
        currentIteration++;

        broadcastEvent('status', { content: 'Thinking...' });

        // Call LLM API (OpenAI specification) with stream: true
        const controller = new AbortController();
        execution.abortController = controller;

        const conn = getActiveConnectionInfo(config);

        // Guard: cancelled right before fetch
        if (execution.cancelled) break;

        let apiResponse;
        try {
          apiResponse = await fetch(`${conn.apiUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${conn.apiKey}`
            },
            body: JSON.stringify({
              model: config.model,
              messages: cleanMessagesForApi(messages),
              tools: toolsDefinition,
              tool_choice: 'auto',
              stream: true
            }),
            signal: controller.signal
          });
        } catch (fetchErr) {
          // AbortError from cancellation — exit silently
          if (fetchErr.name === 'AbortError') break;
          throw fetchErr;
        }

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

        try {
          for await (const chunk of reader) {
            // Check cancellation during stream processing
            if (execution.cancelled) {
              controller.abort();
              break;
            }

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
                    broadcastEvent('reasoning', { content: delta.reasoning_content });
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
                        broadcastEvent('text', { content: parts[0] });
                      }
                      if (parts[1]) {
                        assistantReasoning += parts[1];
                        broadcastEvent('reasoning', { content: parts[1] });
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
                        broadcastEvent('reasoning', { content: parts[0] });
                      }
                      if (parts[1]) {
                        assistantContent += parts[1];
                        broadcastEvent('text', { content: parts[1] });
                      }
                      continue;
                    }

                    if (isThinkingInline) {
                      assistantReasoning += textChunk;
                      broadcastEvent('reasoning', { content: textChunk });
                    } else {
                      assistantContent += textChunk;
                      broadcastEvent('text', { content: textChunk });
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
        } catch (streamErr) {
          if (streamErr.name === 'AbortError' || execution.cancelled) {
            // Stream aborted due to cancellation
            break;
          }
          throw streamErr;
        }

        // If cancelled during stream, exit loop
        if (execution.cancelled) break;

        // Stream response finished successfully
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

          if (execution.cancelled) break;

          broadcastEvent('status', { content: 'Analyzing tools...' });

          for (const toolCall of toolCalls) {
            if (execution.cancelled) break;
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
            broadcastEvent('tool_start', { id, name, args });

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
                  toolOutput = await executeCommandWithStreaming(args.command, config.workspacePath, id, broadcastEvent, 120);
                  break;
                }
                case 'git_clone': {
                  const repoUrl = args.repo_url;
                  const relPath = args.relative_path;
                  const cmd = relPath ? `git clone "${repoUrl}" "${relPath}"` : `git clone "${repoUrl}"`;
                  toolOutput = await executeCommandWithStreaming(cmd, config.workspacePath, id, broadcastEvent, 180);
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
                  let branch = args.branch;
                  const repoInfo = await githubRequest(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
                  branch = branch || repoInfo.default_branch;
                  const files = Array.isArray(args.files) ? args.files : [];
                  if (files.length === 0) {
                    throw new Error('No files provided to github_push_files.');
                  }
                  const commitMessage = args.commit_message || `Update ${files.length} file(s) via mobile-ai-coder`;

                  // Get the latest commit SHA for the branch
                  const refData = await githubRequest(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/refs/heads/${encodeURIComponent(branch)}`);
                  const latestCommitSha = refData.object.sha;

                  // Get the tree SHA from the latest commit
                  const commitData = await githubRequest(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/commits/${latestCommitSha}`);
                  const baseTreeSha = commitData.tree.sha;

                  // Build tree entries for all files
                  const treeEntries = await Promise.all(files.map(async (file) => {
                    let existingSha = null;
                    try {
                      const existing = await githubRequest(
                        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(file.path)}?ref=${encodeURIComponent(branch)}`
                      );
                      if (existing && existing.sha) existingSha = existing.sha;
                    } catch (_) {}
                    return {
                      path: file.path,
                      mode: '100644',
                      type: 'blob',
                      sha: existingSha || undefined,
                      content: existingSha ? undefined : String(file.content)
                    };
                  }));

                  // Create a new tree with all files
                  const newTree = await githubRequest(
                    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees`,
                    { method: 'POST', body: { base_tree: baseTreeSha, tree: treeEntries } }
                  );

                  // Create a commit pointing to the new tree
                  const newCommit = await githubRequest(
                    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/commits`,
                    { method: 'POST', body: { message: commitMessage, tree: newTree.sha, parents: [latestCommitSha] } }
                  );

                  // Update the branch reference
                  await githubRequest(
                    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/refs/heads/${encodeURIComponent(branch)}`,
                    { method: 'PATCH', body: { sha: newCommit.sha, force: false } }
                  );

                  const results = files.map(f => ({ path: f.path }));
                  toolOutput = JSON.stringify({ owner, repo, branch, commit: newCommit.sha, count: results.length, files: results });
                  break;
                }
                case 'memory_save': {
                  const mem = db.saveMemory(
                    chatId,
                    args.name || 'unnamed',
                    args.content || '',
                    args.scope || 'global',
                    args.type || 'fact',
                    args.tags || ''
                  );
                  toolOutput = JSON.stringify({ success: true, memory: mem });
                  break;
                }
                case 'memory_search': {
                  const results = db.searchMemories(args.query || '');
                  if (results.length === 0) {
                    toolOutput = JSON.stringify({ success: true, results: [], message: 'No memories found matching the query.' });
                  } else {
                    toolOutput = JSON.stringify({ success: true, results });
                  }
                  break;
                }
                case 'skill_read': {
                  const allLoadedSkills = getCachedSkills();
                  const skill = allLoadedSkills.find(s => s.name === args.name);
                  if (!skill) {
                    toolOutput = JSON.stringify({ error: `Skill "${args.name}" not found. Available: ${allLoadedSkills.map(s => s.name).join(', ')}` });
                  } else {
                    toolOutput = `--- Full instructions for "${skill.name}" ---\n${skill.content}\n--- End of "${skill.name}" instructions ---`;
                    skillReadCache[skill.name] = true;
                  }
                  break;
                }
                case 'spawn_agent': {
                  const agentId = `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                  const nickname = generateAgentNickname();
                  const task = args.task || 'No task specified.';
                  agentRegistry.set(agentId, { nickname, task, status: 'pending', output: '', cancelled: false });
                  runSubAgent(agentId, nickname, task, chatId);
                  toolOutput = JSON.stringify({
                    success: true,
                    agent_id: agentId,
                    nickname: nickname,
                    status: 'running',
                    message: `Sub-agent "${nickname}" spawned and working on: ${task.slice(0, 100)}${task.length > 100 ? '...' : ''}`
                  });
                  broadcastEvent('agent_spawned', { agent_id: agentId, nickname, task: task.slice(0, 200) });
                  break;
                }
                case 'list_agents': {
                  const agents = Array.from(agentRegistry.entries()).map(([id, a]) => ({
                    agent_id: id,
                    nickname: a.nickname,
                    status: a.status,
                    task: a.task.slice(0, 150)
                  }));
                  toolOutput = JSON.stringify({ success: true, agents });
                  break;
                }
                case 'wait_agent': {
                  const agentId = args.agent_id;
                  const entry = agentRegistry.get(agentId);
                  if (!entry) {
                    toolOutput = JSON.stringify({ error: `Agent "${agentId}" not found.` });
                    break;
                  }
                  // Poll until agent completes (max 5 minutes)
                  const startTime = Date.now();
                  const timeout = 300000;
                  while (entry.status === 'pending' || entry.status === 'running') {
                    if (Date.now() - startTime > timeout) {
                      toolOutput = JSON.stringify({ error: 'Timeout waiting for sub-agent.', agent_id: agentId, nickname: entry.nickname });
                      break;
                    }
                    await new Promise(r => setTimeout(r, 1000));
                  }
                  if (toolOutput) break;
                  toolOutput = JSON.stringify({
                    success: true,
                    agent_id: agentId,
                    nickname: entry.nickname,
                    status: entry.status,
                    output: entry.output
                  });
                  break;
                }
                case 'update_plan': {
                  const planData = {
                    explanation: args.explanation || '',
                    plan: (args.plan || []).map(p => ({
                      step: p.step || 'Untitled step',
                      status: p.status || 'pending'
                    }))
                  };
                  broadcastEvent('plan_update', planData);
                  const total = planData.plan.length;
                  const completed = planData.plan.filter(p => p.status === 'completed').length;
                  const inProgress = planData.plan.filter(p => p.status === 'in_progress').length;
                  toolOutput = JSON.stringify({
                    success: true,
                    summary: `Plan updated: ${completed}/${total} steps completed, ${inProgress} in progress.`
                  });
                  break;
                }
                default:
                  toolOutput = `Error: Tool ${name} not found.`;
              }
            } catch (toolErr) {
              toolOutput = `Error executing tool: ${toolErr.message}`;
            }

            // Emit tool execution finished
            broadcastEvent('tool_end', { id, name, output: toolOutput });

            // Append tool message response to history
            messages.push({
              role: 'tool',
              tool_call_id: id,
              name: name,
              content: toolOutput
            });

            // If skill_read was called, persist full instructions as system message for future turns
            if (name === 'skill_read' && !toolOutput.startsWith('{"error"')) {
              const contentMatch = toolOutput.match(/--- Full instructions for "(.+?)" ---\n([\s\S]*?)\n--- End of /);
              if (contentMatch) {
                messages.push({
                  role: 'system',
                  content: `<skill name="${contentMatch[1]}">\n${contentMatch[2]}\n</skill>`
                });
              }
            }

            // Persist tool call and output
            saveMessage('assistant', `Call tool: ${name} with args ${JSON.stringify(args)}`, 'tool_call', null, [{
              id: id,
              type: 'function',
              function: { name, arguments: typeof args === 'string' ? args : JSON.stringify(args) }
            }]);
            saveMessage('tool', toolOutput, 'tool_output', id);
          }

          // Loop continues to feed tool outputs back to LLM
          continue;
        } else {
          // No tool calls means we are finished
          messages.push(assistantMessage);
        }

        break;
      }

      // Check if the loop exited due to iteration limit (not natural completion)
      hitLoopLimit = currentIteration >= loopLimit && !execution.cancelled;

      if (hitLoopLimit) {
        // Extract context about what the agent was doing
        const lastToolCalls = messages.filter(m => m.role === 'assistant' && m.tool_calls);
        const lastToolCall = lastToolCalls[lastToolCalls.length - 1];
        const planSteps = messages.filter(m => m.role === 'tool' && m.name === 'update_plan');
        const lastPlan = planSteps[planSteps.length - 1];
        let planSummary = '';
        if (lastPlan) {
          try {
            const planData = JSON.parse(lastPlan.content);
            planSummary = planData.summary || '';
          } catch (_) {}
        }

        const continueMsg = `I've reached my iteration limit for this turn. I was working on: ${lastToolCall ? lastToolCall.tool_calls.map(t => t.function.name).join(', ') : 'the current task'}. ${planSummary ? `Progress: ${planSummary}. ` : ''}Please tell me to "continue" so I can keep going.`;
        messages.push({ role: 'assistant', content: continueMsg });

        broadcastEvent('needs_continue', {
          content: continueMsg,
          planSummary: planSummary
        });

        // Persist the continuation message
        saveMessage('assistant', continueMsg);
      } else {
        broadcastEvent('done', { chatId });
      }

      // Persist final assistant message (only if not the loop limit case)
      if (!execution.cancelled && !hitLoopLimit) {
        const finalAssistant = messages[messages.length - 1];
        if (finalAssistant && finalAssistant.role === 'assistant' && !finalAssistant.tool_calls) {
          saveMessage('assistant', finalAssistant.content);
        }
      }
    } catch (err) {
      // AbortError from cancellation — exit silently
      if (err.name === 'AbortError' || execution.cancelled) {
        broadcastEvent('done', { chatId });
      } else {
        console.error("Agent execution error:", err);
        broadcastEvent('error', { content: err.message });
      }
    } finally {
      execution.done = true;
      for (const res of execution.clients) {
        try {
          res.end();
        } catch (err) {
          console.error("Error closing client response:", err);
        }
      }
      activeExecutions.delete(chatId);
    }
  })();

  return execution;
}

// Get status of active agent execution
app.get('/api/chat/status', (req, res) => {
  try {
    const chatId = parseInt(req.query.chatId);
    if (!chatId) return res.status(400).json({ error: 'Missing chatId' });
    const execution = activeExecutions.get(chatId);
    res.json({ running: !!execution, chatId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel active agent execution
app.post('/api/chat/cancel', (req, res) => {
  try {
    const chatId = parseInt(req.body.chatId);
    if (!chatId) return res.status(400).json({ error: 'Missing chatId' });
    const execution = activeExecutions.get(chatId);
    if (!execution) return res.json({ cancelled: false, reason: 'No active execution' });
    execution.cancelled = true;
    if (execution.abortController) {
      execution.abortController.abort();
    }
    // Notify all SSE clients of cancellation
    for (const client of execution.clients) {
      try {
        client.write(`data: ${JSON.stringify({ type: 'cancelled', chatId })}\n\n`);
      } catch (_) {}
    }
    res.json({ cancelled: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chat SSE completion agent
app.post('/api/chat', async (req, res) => {
  const clientMessages = req.body.messages || [];
  let chatId = req.body.chatId;
  const reconnect = req.body.reconnect;

  // If this is the first message in a new chat, we might need to create it
  if (!chatId && clientMessages.length > 0) {
    try {
      const firstUserMsg = clientMessages.find(m => m.role === 'user');
      const title = firstUserMsg ? (firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '')) : 'New Chat';
      const newChat = db.createChat(title);
      chatId = newChat.id;
    } catch (err) {
      console.error("Failed to create chat for persistence:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (!chatId) {
    return res.status(400).json({ error: 'Chat ID is required' });
  }

  // Setup Server-Sent Events headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Establish connection

  // Get or start active execution
  let execution = activeExecutions.get(chatId);
  if (!execution) {
    if (reconnect || clientMessages.length === 0) {
      // Just send done and end connection if reconnect requested but none running
      res.write(`data: ${JSON.stringify({ type: 'done', chatId })}\n\n`);
      res.end();
      return;
    }
    execution = await runAgentExecution(chatId, clientMessages);
  }

  // Subscribe this client response
  execution.clients.add(res);

  // Send the metadata event containing startIndex so client knows how to slice its UI list
  res.write(`data: ${JSON.stringify({ type: 'metadata', startIndex: execution.startIndex, chatId })}\n\n`);

  // Replay all buffered events to this client
  for (const event of execution.events) {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  // If execution is already done, end immediately
  if (execution.done) {
    res.end();
    return;
  }

  // Cancel LLM call if client closes the tab
  req.on('close', () => {
    if (execution) {
      execution.clients.delete(res);
    }
  });
});

// Port configuration
const PORT = process.env.PORT || 3000;

async function start() {
  await db.init();
  const config = await getConfig();
  app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`Mobile Code Agent listening on http://localhost:${PORT}`);
    console.log(`Workspace folder is: ${config.workspacePath}`);
    console.log(`===================================================`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
