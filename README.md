# Mobile Code Agent 🤖

<p align="center">
  <strong>A mobile-first agentic coding environment inspired by Claude Code & OpenCode</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v18+-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/OpenAI_API-Compatible-412991?style=flat-square&logo=openai&logoColor=white" />
  <img src="https://img.shields.io/badge/Mobile-First-C4622D?style=flat-square" />
</p>

---

> 🇧🇷 **[Leia em Português](#português)** | 🇺🇸 **[Read in English](#english)**

---

<a id="english"></a>

## 🇺🇸 English

### What is this?

Mobile Code Agent is a **local agentic coding assistant** that runs entirely on your device (including Termux on Android). It connects to any OpenAI-compatible API and provides a premium dark-themed chat interface where an AI agent can:

- 📁 **Read & Write Files** in a sandboxed workspace
- 🗂️ **List Directories** and browse the file tree
- ⚡ **Run Shell Commands** with real-time streaming output
- 🔀 **Clone Git Repositories** directly into the workspace
- 🧠 **Show Thinking Process** in real-time (supports `<think>`, `<thought>` tags and native `reasoning_content`)
- 🔄 **Dynamic Model Selector** — fetches available models from `/v1/models`

### Screenshots

The interface follows the **Claude Code** dark theme with coral accent (`#C4622D`):

| Feature | Description |
|---|---|
| 💬 Chat | Terminal-style chat with markdown rendering and code blocks |
| 🔧 Tool Cards | Collapsible cards showing tool execution with live console output |
| 🧠 Thinking | Real-time thought process modal with token-by-token streaming |
| 📂 File Explorer | Split-view file manager with built-in code editor |
| ⚙️ Settings | Full-page configuration screen (not a dialog) with grouped sections |
| 🔍 Model Picker | Searchable dialog with fuzzy model search and live active-model highlight |
| 🐙 GitHub | Connect a Personal Access Token so the agent can list/create repos and push code |
| 💻 Terminal | Manual command runner for direct shell access |

### Quick Start

```bash
# Clone the repository
git clone https://github.com/deivid22srk/mobile-code-agent.git
cd mobile-code-agent

# Install dependencies
npm install

# Start the server
npm start
```

Open **http://localhost:3000** in your browser.

### Configuration

On first launch, the app creates a `config.json` with defaults:

| Setting | Default | Description |
|---|---|---|
| `apiUrl` | `https://qwenproxy-cookies.onrender.com/v1` | OpenAI-compatible API endpoint |
| `apiKey` | `0` | API authentication key |
| `model` | `qwen-plus` | Default LLM model |
| `workspacePath` | `./workspace` | Sandboxed directory for file operations |
| `systemPrompt` | *(built-in)* | Agent system instructions |
| `githubToken` | *(empty)* | GitHub PAT that unlocks the `github_*` tools for the agent |
| `githubUser` | `null` | Cached info about the connected GitHub account |

You can change all settings via the ⚙️ gear icon — which now opens a **full configuration screen** (not a dialog) with grouped sections for *API Provider*, *Workspace*, *System Instructions* and *GitHub Integration*. The header model trigger opens a **searchable model picker dialog** where you can type to filter through every model exposed by your provider.

### GitHub Integration

Connect your account once in **Settings → GitHub Integration** by pasting a [Personal Access Token](https://github.com/settings/tokens?type=beta) (scope `repo` is recommended). Once connected, the agent gains four extra tools:

| Tool | Description |
|---|---|
| `github_get_user` | Returns info about the connected account (login, name, public repos). |
| `github_list_repos` | Lists repos owned by (or visible to) the account. |
| `github_create_repo` | Creates a new repository under your account. |
| `github_push_files` | Creates or updates one or more files in an existing repo via the Contents API. |

The agent can now do end-to-end tasks like *"create a new public repo called `my-app`, then push these 4 files to `main` with a sensible commit message"* without leaving the chat.

### Architecture

```
┌────────────────────────────────────────────────────┐
│             Mobile Browser (Frontend)              │
│  ┌───────────┬──────────┬─────────────┬─────────┐   │
│  │ Chat UI   │ Explorer │  Settings   │ Model   │   │
│  │           │  Modal   │ Full Screen │ Picker  │   │
│  └─────┬─────┴────┬─────┴──────┬──────┴────┬────┘   │
│        │ SSE Stream│   REST API  │   REST   │        │
└────────┼──────────┼─────────────┼──────────┼────────┘
         │          │             │          │
┌────────┼──────────┼─────────────┼──────────┼────────┐
│        ▼          ▼             ▼          ▼        │
│  ┌──────────────────────────────────────────────┐  │
│  │          Express Server (Backend)            │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │  │
│  │  │ /chat  │ │ /files │ │/settings│ │/models │ │  │
│  │  │  SSE   │ │  REST  │ │  REST   │ │  REST  │ │  │
│  │  └───┬────┘ └───┬────┘ └────┬───┘ └───┬────┘ │  │
│  │      │          │           │         │      │  │
│  │      ▼          ▼           ▼         ▼      │  │
│  │  ┌────────┐ ┌────────┐  ┌────────┐ ┌────────┐ │  │
│  │  │  LLM   │ │ Local  │  │ Config │ │  LLM   │ │  │
│  │  │  API   │ │  FS    │  │  JSON  │ │  API   │ │  │
│  │  └────────┘ └────────┘  └────────┘ └────────┘ │  │
│  └──────────────────────────────────────────────┘  │
│                   Node.js Server                   │
└────────────────────────────────────────────────────┘
```

### Available Tools

The AI agent has access to these workspace tools:

| Tool | Description |
|---|---|
| `list_dir` | Lists files and directories in the workspace |
| `read_file` | Reads file contents |
| `write_file` | Creates or overwrites files (auto-creates parent dirs) |
| `run_command` | Executes shell commands with streaming output |
| `git_clone` | Clones a Git repository into the workspace |

### Key Features

- **Real-Time LLM Streaming** — Uses `stream: true` for token-by-token text and reasoning display
- **Thinking Extraction** — Supports native `reasoning_content`, `<think>` tags (DeepSeek-R1), and `<thought>` tags
- **Background Process Management** — Server commands (like `npm run dev`) auto-detect and run in background
- **Path Traversal Protection** — All file operations are sandboxed to the workspace directory
- **Client Disconnect Handling** — Aborts API calls when the user closes the browser tab
- **Settings as a Screen, not a Dialog** — The configuration UI is a dedicated full-page experience with grouped sections and inline feedback
- **Searchable Model Picker** — A focused dialog with a fuzzy text filter, current-model highlight and zero-friction keyboard escape
- **GitHub-Powered Agent** — A dedicated GitHub section in Settings plus four new tools (`github_get_user`, `github_list_repos`, `github_create_repo`, `github_push_files`) so the agent can publish code on your behalf

### Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla HTML/CSS/JS (no frameworks)
- **Fonts**: Outfit (UI) + JetBrains Mono (code)
- **Communication**: Server-Sent Events (SSE)
- **API**: OpenAI Chat Completions compatible

---

<a id="português"></a>

## 🇧🇷 Português

### O que é isso?

Mobile Code Agent é um **assistente de codificação agente local** que roda inteiramente no seu dispositivo (incluindo Termux no Android). Ele se conecta a qualquer API compatível com OpenAI e oferece uma interface de chat com tema escuro premium onde um agente de IA pode:

- 📁 **Ler e Escrever Arquivos** em um workspace isolado
- 🗂️ **Listar Diretórios** e navegar pela árvore de arquivos
- ⚡ **Executar Comandos Shell** com saída em tempo real
- 🔀 **Clonar Repositórios Git** diretamente no workspace
- 🧠 **Mostrar Processo de Pensamento** em tempo real (suporta tags `<think>`, `<thought>` e `reasoning_content` nativo)
- 🔄 **Seletor Dinâmico de Modelos** — busca modelos disponíveis via `/v1/models`

### Início Rápido

```bash
# Clonar o repositório
git clone https://github.com/deivid22srk/mobile-code-agent.git
cd mobile-code-agent

# Instalar dependências
npm install

# Iniciar o servidor
npm start
```

Abra **http://localhost:3000** no seu navegador.

### Configuração

Na primeira execução, o app cria um `config.json` com valores padrão:

| Configuração | Padrão | Descrição |
|---|---|---|
| `apiUrl` | `https://qwenproxy-cookies.onrender.com/v1` | Endpoint da API compatível com OpenAI |
| `apiKey` | `0` | Chave de autenticação da API |
| `model` | `qwen-plus` | Modelo LLM padrão |
| `workspacePath` | `./workspace` | Diretório isolado para operações de arquivo |
| `systemPrompt` | *(embutido)* | Instruções de sistema do agente |

Você pode alterar todas as configurações pelo ícone ⚙️ — que agora abre uma **tela de configuração completa** (não um diálogo) com seções agrupadas para *Provedor de API*, *Workspace*, *Instruções de Sistema* e *Integração com GitHub*. O gatilho de modelo no header abre um **diálogo de seleção de modelo com busca**, onde você pode digitar para filtrar entre todos os modelos expostos pelo seu provedor.

### Integração com GitHub

Conecte sua conta uma vez em **Configurações → Integração com GitHub** colando um [Personal Access Token](https://github.com/settings/tokens?type=beta) (escopo `repo` é o mínimo recomendado). Uma vez conectado, o agente ganha quatro ferramentas extras:

| Ferramenta | Descrição |
|---|---|
| `github_get_user` | Retorna info da conta conectada (login, nome, repos públicos). |
| `github_list_repos` | Lista repositórios da conta. |
| `github_create_repo` | Cria um novo repositório na sua conta. |
| `github_push_files` | Cria ou atualiza um ou mais arquivos em um repositório existente via API de Contents. |

O agente agora consegue fazer tarefas completas como *"crie um repositório público chamado `meu-app` e depois envie estes 4 arquivos para a branch `main` com uma mensagem de commit decente"* sem sair do chat.

### Ferramentas Disponíveis

O agente de IA tem acesso a estas ferramentas no workspace:

| Ferramenta | Descrição |
|---|---|
| `list_dir` | Lista arquivos e diretórios no workspace |
| `read_file` | Lê o conteúdo de arquivos |
| `write_file` | Cria ou sobrescreve arquivos (cria diretórios pai automaticamente) |
| `run_command` | Executa comandos shell com saída em streaming |
| `git_clone` | Clona um repositório Git para o workspace |

### Recursos Principais

- **Streaming em Tempo Real do LLM** — Usa `stream: true` para exibir texto e raciocínio token por token
- **Extração de Pensamento** — Suporta `reasoning_content` nativo, tags `<think>` (DeepSeek-R1) e `<thought>`
- **Gerenciamento de Processos em Background** — Comandos de servidor (como `npm run dev`) são auto-detectados e rodam em segundo plano
- **Proteção contra Path Traversal** — Todas as operações de arquivo são restritas ao diretório workspace
- **Tratamento de Desconexão** — Aborta chamadas à API quando o usuário fecha a aba do navegador
- **Configurações como Tela, não Diálogo** — UI de configuração dedicada em página cheia, com seções agrupadas e feedback inline
- **Seletor de Modelo com Busca** — Diálogo focado com filtro de texto fuzzy, destaque do modelo ativo e tecla ESC para fechar
- **Agente com GitHub** — Seção dedicada nas Configurações e quatro tools novas (`github_get_user`, `github_list_repos`, `github_create_repo`, `github_push_files`) que permitem ao agente publicar código em seu nome

### Paleta de Cores (Tema Claude Code)

| Função | Cor |
|---|---|
| Fundo | `#0D0D0D` |
| Texto Principal | `#FFFFFF` |
| Texto Secundário | `#888888` |
| Accent (marca) | `#C4622D` |
| Botão Secundário | `#2A2A2A` |

### Stack Tecnológica

- **Backend**: Node.js + Express
- **Frontend**: HTML/CSS/JS puro (sem frameworks)
- **Fontes**: Outfit (UI) + JetBrains Mono (código)
- **Comunicação**: Server-Sent Events (SSE)
- **API**: Compatível com OpenAI Chat Completions

---

## 📄 License

MIT License — use, modify, and distribute freely.
