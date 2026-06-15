# Claude Code Mobile Agent

Mobile Code Agent is a **powerful agentic AI coding assistant** that runs entirely on your device (including Termux on Android). It connects to any OpenAI-compatible API and provides a premium dark-themed chat interface where an AI agent can read/write files, execute commands, and manage GitHub repositories.

[🇧🇷 Ver versão em Português](#português)

---

## 🚀 Key Features

- **Chat History & Persistence** — All your conversations are saved locally in a JSON database. Create new chats, switch between previous sessions, and never lose your context.
- **TypeScript Frontend** — The entire web interface has been migrated to TypeScript for better maintainability and type safety.
- **Categorized Settings** — A dedicated configuration screen organized into logical subcategories (LLM Config, GitHub, General, and Tools).
- **Real-Time LLM Streaming** — Token-by-token text and reasoning display using Server-Sent Events (SSE).
- **Thinking Extraction** — Supports native `reasoning_content`, `<think>` tags (DeepSeek-R1), and `<thought>` tags.
- **GitHub-Powered Agent** — Dedicated tools (`github_get_user`, `github_list_repos`, `github_create_repo`, `github_push_files`) to manage your repositories directly from the chat.
- **Background Process Management** — Server commands (like `npm run dev`) are automatically detected and run in the background.

---

## 🛠 Tech Stack

- **Backend**: Node.js + Express
- **Persistence**: Portable JSON-based file storage (Zero external database dependencies).
- **Frontend**: TypeScript + Vanilla HTML/CSS
- **Bundler**: `esbuild` for ultra-fast builds.
- **Fonts**: Outfit (UI) + JetBrains Mono (code).
- **Communication**: Server-Sent Events (SSE).

---

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended).

### Installation

```bash
# Clone the repository
git clone https://github.com/deivid22srk/mobile-code-agent.git
cd mobile-code-agent

# Install dependencies
npm install

# Build the frontend assets
npm run build

# Start the server
npm start
```

Open **http://localhost:3000** in your browser.

---

## ⚙️ Configuration

On first launch, the app creates a `config.json` with defaults. You can change all settings via the ⚙️ gear icon in the app.

| Setting | Default | Description |
|---|---|---|
| `apiUrl` | `https://qwenproxy-cookies.onrender.com/v1` | OpenAI-compatible API endpoint |
| `apiKey` | `0` | API authentication key |
| `model` | `qwen-plus` | Default LLM model |
| `workspacePath` | `./workspace` | Sandboxed directory for file operations |
| `systemPrompt` | *(built-in)* | Agent system instructions |
| `githubToken` | *(empty)* | GitHub PAT for unlocking `github_*` tools |

---

## 🇧🇷 Português

O **Claude Code Mobile Agent** é um assistente de codificação agente local que roda inteiramente no seu dispositivo.

### Novidades desta versão:
- **Histórico de Chat** — Todas as conversas são salvas automaticamente. Continue de onde parou.
- **Interface em TypeScript** — Código mais robusto e fácil de manter.
- **Configurações Categorizadas** — Telas específicas para LLM, GitHub, Geral e Ferramentas.
- **Portabilidade Total** — Agora utiliza um banco de dados JSON nativo, eliminando erros de instalação no Termux/Android.

### Como rodar:
1. `npm install`
2. `npm run build`
3. `npm start`

---

## 📄 License

MIT License — use, modify, and distribute freely.
