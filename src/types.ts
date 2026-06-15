export interface AppConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  workspacePath: string;
  githubToken: string;
  githubUser: GitHubUser | null;
}

export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
}

export interface Chat {
  id: number;
  title: string;
  createdAt: string;
  messages?: Message[];
}

export interface Message {
  id?: number;
  chatId?: number;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  type?: 'text' | 'tool_call' | 'tool_output';
  createdAt?: string;
  reasoning_content?: string;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

export type SSEEvent =
  | { type: 'status'; content: string }
  | { type: 'reasoning'; content: string }
  | { type: 'text'; content: string }
  | { type: 'tool_start'; id: string; name: string; args: any }
  | { type: 'tool_output'; id: string; name: string; output: string } // Added for frontend logic consistency
  | { type: 'tool_end'; id: string; name: string; output: string }
  | { type: 'done'; chatId?: number }
  | { type: 'error'; content: string };
