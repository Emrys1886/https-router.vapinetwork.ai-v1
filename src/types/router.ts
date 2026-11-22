export type MessageRole = 'system' | 'user' | 'assistant';

export interface TokenUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  model?: string;
  latencyMs?: number;
  usage?: TokenUsage;
  rawResponse?: unknown;
  error?: string;
}

export interface RouterParams {
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  stream: boolean;
}

export interface ChatThread {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
  params: RouterParams;
}

export interface ModelOption {
  id: string;
  owned_by: string;
  description?: string;
}

export interface RequestLogEntry {
  id: string;
  timestamp: string;
  model: string;
  status: number;
  stream: boolean;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  error?: string;
  requestPayload: unknown;
  responsePayload: unknown;
}

export interface HealthStatus {
  ok: boolean;
  configured: boolean;
  baseUrl: string;
  defaultModel: string;
}

export type ActiveView = 'playground' | 'sdk' | 'history' | 'docs';
