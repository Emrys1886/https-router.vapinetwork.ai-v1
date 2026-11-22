import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ActiveView,
  ChatMessage,
  ChatThread,
  HealthStatus,
  ModelOption,
  RequestLogEntry,
  RouterParams,
  TokenUsage,
} from './types/router';
import {
  createNewThread,
  DEFAULT_PARAMS,
  loadRequestLogs,
  loadTheme,
  loadThreads,
  saveRequestLogs,
  saveTheme,
  saveThreads,
} from './lib/storage';
import { buildApiMessages } from './lib/snippets';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { PlaygroundView } from './components/PlaygroundView';
import { SdkWorkbenchView } from './components/SdkWorkbenchView';
import { HistoryView } from './components/HistoryView';
import { EndpointDocsView } from './components/EndpointDocsView';

const FALLBACK_MODELS: ModelOption[] = [
  { id: 'venice/deepseek-v4-flash', owned_by: 'venice' },
  { id: 'venice/deepseek-v4', owned_by: 'venice' },
  { id: 'venice/llama-3.3-70b', owned_by: 'venice' },
  { id: 'venice/qwen-2.5-coder-32b', owned_by: 'venice' },
];

export default function App() {
  const [threads, setThreads] = useState<ChatThread[]>(() => loadThreads());
  const [activeThreadId, setActiveThreadId] = useState<string>(() => loadThreads()[0].id);
  const [logs, setLogs] = useState<RequestLogEntry[]>(() => loadRequestLogs());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadTheme());
  const [activeView, setActiveView] = useState<ActiveView>('playground');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [input, setInput] = useState('Hello from vAPI Router');
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [lastRawResponse, setLastRawResponse] = useState<unknown>(null);

  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [models, setModels] = useState<ModelOption[]>(FALLBACK_MODELS);
  const [modelsLoading, setModelsLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    saveThreads(threads);
  }, [threads]);

  useEffect(() => {
    saveRequestLogs(logs);
  }, [logs]);

  const fetchModels = useCallback(async () => {
    setModelsLoading(true);
    try {
      const res = await fetch('/api/models');
      if (res.ok) {
        const data = (await res.json()) as { models?: ModelOption[] };
        if (Array.isArray(data.models) && data.models.length > 0) {
          setModels(data.models);
        }
      }
    } catch {
      // Keep fallback presets
    } finally {
      setModelsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: HealthStatus | null) => {
        if (data) setHealth(data);
      })
      .catch(() => {
        // Ignore transient startup check errors
      });
    fetchModels();
  }, [fetchModels]);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) || threads[0],
    [threads, activeThreadId]
  );

  const updateActiveThread = useCallback(
    (updater: (thread: ChatThread) => ChatThread) => {
      setThreads((prev) =>
        prev.map((t) => (t.id === activeThread.id ? updater(t) : t))
      );
    },
    [activeThread.id]
  );

  const handleNewThread = () => {
    const fresh = createNewThread('New Session', activeThread.params);
    setThreads((prev) => [fresh, ...prev]);
    setActiveThreadId(fresh.id);
    setInput('Hello from vAPI Router');
    setErrorBanner(null);
    setActiveView('playground');
  };

  const handleSelectThread = (id: string) => {
    setActiveThreadId(id);
    setErrorBanner(null);
    const chosen = threads.find((t) => t.id === id);
    if (chosen && chosen.messages.length === 0) {
      setInput('Hello from vAPI Router');
    } else {
      setInput('');
    }
  };

  const handleDeleteThread = (id: string) => {
    setThreads((prev) => {
      const remaining = prev.filter((t) => t.id !== id);
      if (remaining.length === 0) {
        const fallback = createNewThread('Hello from vAPI Router');
        setActiveThreadId(fallback.id);
        return [fallback];
      }
      if (activeThreadId === id) {
        setActiveThreadId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleUpdateParams = (patch: Partial<RouterParams>) => {
    updateActiveThread((thread) => ({
      ...thread,
      updatedAt: new Date().toISOString(),
      params: { ...thread.params, ...patch },
    }));
  };

  const handleResetParams = () => {
    updateActiveThread((thread) => ({
      ...thread,
      updatedAt: new Date().toISOString(),
      params: { ...DEFAULT_PARAMS },
    }));
  };

  const handleClearThread = () => {
    updateActiveThread((thread) => ({
      ...thread,
      updatedAt: new Date().toISOString(),
      messages: [],
    }));
    setErrorBanner(null);
    setLastRawResponse(null);
    setInput('Hello from vAPI Router');
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsLoading(false);
  };

  const appendLog = useCallback((entry: RequestLogEntry) => {
    setLogs((prev) => [entry, ...prev].slice(0, 100));
  }, []);

  const handleSend = async (overridePrompt?: string) => {
    const promptText = (overridePrompt !== undefined ? overridePrompt : input).trim();
    if (!promptText || isLoading) return;

    setErrorBanner(null);
    const params = activeThread.params;
    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: promptText,
      createdAt: new Date().toISOString(),
    };
    const assistantMsgId = `msg_a_${Date.now() + 1}`;
    const assistantPlaceholder: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      model: params.model,
    };

    const nextTitle =
      activeThread.messages.length === 0
        ? promptText.slice(0, 42) + (promptText.length > 42 ? '…' : '')
        : activeThread.title;

    const priorMessages = activeThread.messages;
    updateActiveThread((thread) => ({
      ...thread,
      title: nextTitle,
      updatedAt: new Date().toISOString(),
      messages: [...thread.messages, userMsg, assistantPlaceholder],
    }));

    if (overridePrompt === undefined) {
      setInput('');
    }

    const requestPayload = {
      model: params.model,
      messages: buildApiMessages([...priorMessages, userMsg], params.systemPrompt),
      temperature: params.temperature,
      max_tokens: params.maxTokens,
      top_p: params.topP,
      stream: params.stream,
    };

    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);
    const startedAt = performance.now();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
      });

      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        const errData = (await response.json().catch(() => ({}))) as {
          error?: string;
          _meta?: { latencyMs?: number };
        };
        const errMsg =
          errData.error || `Request failed with HTTP ${response.status}`;
        const latencyMs = Math.round(
          errData._meta?.latencyMs ?? performance.now() - startedAt
        );

        updateActiveThread((thread) => ({
          ...thread,
          messages: thread.messages.map((m) =>
            m.id === assistantMsgId
              ? { ...m, error: errMsg, latencyMs, rawResponse: errData }
              : m
          ),
        }));
        setErrorBanner(errMsg);
        setLastRawResponse(errData);
        appendLog({
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          model: params.model,
          status: response.status,
          stream: params.stream,
          latencyMs,
          error: errMsg,
          requestPayload,
          responsePayload: errData,
        });
        return;
      }

      if (params.stream && contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulated = '';
        let usage: TokenUsage | undefined;
        let resolvedModel = params.model;
        let lastChunk: unknown = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line.startsWith('data:')) continue;
            const dataStr = line.slice(5).trim();
            if (!dataStr || dataStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(dataStr) as {
                model?: string;
                usage?: TokenUsage;
                choices?: Array<{
                  delta?: { content?: string };
                  message?: { content?: string };
                }>;
              };
              lastChunk = parsed;
              if (parsed.model) resolvedModel = parsed.model;
              if (parsed.usage) usage = parsed.usage;

              const deltaText =
                parsed.choices?.[0]?.delta?.content ??
                parsed.choices?.[0]?.message?.content ??
                '';

              if (deltaText) {
                accumulated += deltaText;
                updateActiveThread((thread) => ({
                  ...thread,
                  messages: thread.messages.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: accumulated, model: resolvedModel }
                      : m
                  ),
                }));
              }
            } catch {
              // Ignore non-JSON SSE keepalive lines
            }
          }
        }

        const latencyMs = Math.round(performance.now() - startedAt);
        const finalSummary = {
          model: resolvedModel,
          content: accumulated,
          usage,
          lastChunk,
          latencyMs,
        };

        updateActiveThread((thread) => ({
          ...thread,
          updatedAt: new Date().toISOString(),
          messages: thread.messages.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: accumulated,
                  model: resolvedModel,
                  latencyMs,
                  usage,
                  rawResponse: finalSummary,
                }
              : m
          ),
        }));
        setLastRawResponse(finalSummary);
        appendLog({
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          model: resolvedModel,
          status: 200,
          stream: true,
          latencyMs,
          promptTokens: usage?.prompt_tokens,
          completionTokens: usage?.completion_tokens,
          totalTokens: usage?.total_tokens,
          requestPayload,
          responsePayload: finalSummary,
        });
        return;
      }

      const data = (await response.json()) as {
        model?: string;
        usage?: TokenUsage;
        choices?: Array<{ message?: { content?: string } }>;
        _meta?: { latencyMs?: number };
      };
      const latencyMs = Math.round(
        data._meta?.latencyMs ?? performance.now() - startedAt
      );
      const replyContent = data.choices?.[0]?.message?.content ?? '';
      const resolvedModel = data.model || params.model;

      updateActiveThread((thread) => ({
        ...thread,
        updatedAt: new Date().toISOString(),
        messages: thread.messages.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: replyContent,
                model: resolvedModel,
                latencyMs,
                usage: data.usage,
                rawResponse: data,
              }
            : m
        ),
      }));
      setLastRawResponse(data);
      appendLog({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        model: resolvedModel,
        status: response.status,
        stream: false,
        latencyMs,
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens,
        requestPayload,
        responsePayload: data,
      });
    } catch (err) {
      if (controller.signal.aborted) {
        return;
      }
      const message =
        err instanceof Error ? err.message : 'Unexpected network error';
      const latencyMs = Math.round(performance.now() - startedAt);
      updateActiveThread((thread) => ({
        ...thread,
        messages: thread.messages.map((m) =>
          m.id === assistantMsgId ? { ...m, error: message, latencyMs } : m
        ),
      }));
      setErrorBanner(message);
    } finally {
      abortRef.current = null;
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      <TopBar
        activeView={activeView}
        onChangeView={setActiveView}
        onNewThread={handleNewThread}
        onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <Sidebar
          threads={threads}
          activeThreadId={activeThread.id}
          params={activeThread.params}
          models={models}
          modelsLoading={modelsLoading}
          theme={theme}
          activeView={activeView}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onSelectThread={handleSelectThread}
          onDeleteThread={handleDeleteThread}
          onUpdateParams={handleUpdateParams}
          onResetParams={handleResetParams}
          onRefreshModels={fetchModels}
          onToggleTheme={() =>
            setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
          }
          onChangeView={setActiveView}
        />

        <main className="flex-1 flex min-w-0 min-h-0 overflow-hidden">
          {activeView === 'playground' && (
            <PlaygroundView
              messages={activeThread.messages}
              params={activeThread.params}
              input={input}
              isLoading={isLoading}
              errorBanner={errorBanner}
              health={health}
              lastRawResponse={lastRawResponse}
              onInputChange={setInput}
              onSend={handleSend}
              onStop={handleStop}
              onClearThread={handleClearThread}
              onOpenDocs={() => setActiveView('docs')}
            />
          )}

          {activeView === 'sdk' && (
            <SdkWorkbenchView
              params={activeThread.params}
              messages={activeThread.messages}
              draftInput={input}
              onOpenPlayground={() => setActiveView('playground')}
            />
          )}

          {activeView === 'history' && (
            <HistoryView
              logs={logs}
              onClearLogs={() => setLogs([])}
              onOpenPlayground={() => setActiveView('playground')}
            />
          )}

          {activeView === 'docs' && <EndpointDocsView health={health} />}
        </main>
      </div>
    </div>
  );
}
