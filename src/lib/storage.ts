import type { ChatThread, RequestLogEntry, RouterParams } from '../types/router';

const THREADS_KEY = 'vapi_router_threads_v1';
const LOGS_KEY = 'vapi_router_logs_v1';
const THEME_KEY = 'vapi_router_theme_v1';

export const DEFAULT_PARAMS: RouterParams = {
  model: 'venice/deepseek-v4-flash',
  systemPrompt: '',
  temperature: 0.7,
  maxTokens: 1024,
  topP: 1.0,
  stream: true,
};

export function createNewThread(title = 'New Session', params?: Partial<RouterParams>): ChatThread {
  return {
    id: `thr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title,
    updatedAt: new Date().toISOString(),
    messages: [],
    params: {
      ...DEFAULT_PARAMS,
      ...params,
    },
  };
}

export function loadThreads(): ChatThread[] {
  try {
    const raw = localStorage.getItem(THREADS_KEY);
    if (!raw) {
      return [createNewThread('Hello from vAPI Router')];
    }
    const parsed = JSON.parse(raw) as ChatThread[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [createNewThread('Hello from vAPI Router')];
    }
    return parsed;
  } catch {
    return [createNewThread('Hello from vAPI Router')];
  }
}

export function saveThreads(threads: ChatThread[]): void {
  try {
    localStorage.setItem(THREADS_KEY, JSON.stringify(threads.slice(0, 30)));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadRequestLogs(): RequestLogEntry[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RequestLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRequestLogs(logs: RequestLogEntry[]): void {
  try {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadTheme(): 'light' | 'dark' {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
  } catch {
    // Ignore
  }
  return 'light';
}

export function saveTheme(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Ignore
  }
}
