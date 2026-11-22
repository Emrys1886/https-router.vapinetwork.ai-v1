import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, Code2, Copy, Eraser, Send, Square } from 'lucide-react';
import type { ChatMessage, HealthStatus, RouterParams } from '../types/router';
import {
  buildRequestPayload,
  generateCurlSnippet,
  generatePythonSnippet,
  generateTypeScriptSnippet,
} from '../lib/snippets';
import { CodeBlock } from './CodeBlock';

interface PlaygroundViewProps {
  messages: ChatMessage[];
  params: RouterParams;
  input: string;
  isLoading: boolean;
  errorBanner: string | null;
  health: HealthStatus | null;
  lastRawResponse: unknown;
  onInputChange: (val: string) => void;
  onSend: (overridePrompt?: string) => void;
  onStop: () => void;
  onClearThread: () => void;
  onOpenDocs: () => void;
}

type InspectorTab = 'python' | 'typescript' | 'curl' | 'json';

const STARTER_PROMPTS = [
  'Hello from vAPI Router',
  'Summarize how OpenAI-compatible router endpoints handle streaming chunks.',
  'Write a compact Python retry wrapper for OpenAI chat completions.',
];

export function PlaygroundView({
  messages,
  params,
  input,
  isLoading,
  errorBanner,
  health,
  lastRawResponse,
  onInputChange,
  onSend,
  onStop,
  onClearThread,
  onOpenDocs,
}: PlaygroundViewProps) {
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('python');
  const [mobilePanel, setMobilePanel] = useState<'chat' | 'inspector'>('chat');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedJsonId, setExpandedJsonId] = useState<string | null>(null);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, messages[messages.length - 1]?.content]);

  const handleCopyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      // Ignore clipboard failure
    }
  };

  const requestPayload = buildRequestPayload(params, messages, input);
  const pythonCode = generatePythonSnippet(params, messages, input);
  const tsCode = generateTypeScriptSnippet(params, messages, input);
  const curlCode = generateCurlSnippet(params, messages, input);

  const inspectorCode =
    inspectorTab === 'python'
      ? pythonCode
      : inspectorTab === 'typescript'
      ? tsCode
      : inspectorTab === 'curl'
      ? curlCode
      : JSON.stringify(
          lastRawResponse
            ? { request: requestPayload, response: lastRawResponse }
            : { request: requestPayload },
          null,
          2
        );

  const inspectorLanguageLabel =
    inspectorTab === 'python'
      ? 'python · openai sdk'
      : inspectorTab === 'typescript'
      ? 'typescript · openai sdk'
      : inspectorTab === 'curl'
      ? 'bash · curl'
      : 'application/json';

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-white dark:bg-slate-950">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 lg:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 min-w-0 truncate">
          <span className="font-mono text-slate-700 dark:text-slate-200 truncate">
            {health?.baseUrl || 'https://router.vapinetwork.ai/v1'}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-slate-700 dark:text-slate-200 truncate">
            {params.model}
          </span>
          <span aria-hidden="true">·</span>
          <span className="whitespace-nowrap">
            {params.stream ? 'Streaming SSE' : 'Standard JSON'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="xl:hidden flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setMobilePanel('chat')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                mobilePanel === 'chat'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setMobilePanel('inspector')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                mobilePanel === 'inspector'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              SDK & JSON
            </button>
          </div>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={onClearThread}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              <Eraser className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {health && !health.configured && (
        <div className="px-5 lg:px-6 py-2.5 border-b border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/30 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              Server key <code className="font-mono font-semibold">VAPI_ROUTER_API_KEY</code> is not configured in environment secrets yet. Add it in AI Studio Secrets to execute live completions.
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenDocs}
            className="font-semibold underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-100 whitespace-nowrap"
          >
            View Setup
          </button>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        <div
          className={`flex-1 flex flex-col min-w-0 ${
            mobilePanel === 'inspector' ? 'hidden xl:flex' : 'flex'
          }`}
        >
          <div className="flex-1 overflow-y-auto px-5 lg:px-8 py-6">
            {messages.length === 0 ? (
              <div className="max-w-2xl mx-auto py-8 space-y-6">
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 text-balance">
                    Chat Completions Workbench
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                    Test prompts against <span className="font-mono text-slate-800 dark:text-slate-200">venice/deepseek-v4-flash</span> via <span className="font-mono text-slate-800 dark:text-slate-200">https://router.vapinetwork.ai/v1</span> and inspect synchronized Python, TypeScript, and cURL payloads in real time.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Quick Prompts
                  </h2>
                  <div className="grid gap-2.5">
                    {STARTER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => onSend(prompt)}
                        className="text-left px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 hover:bg-slate-100/80 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-sm text-slate-800 dark:text-slate-200"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((msg) => (
                  <article
                    key={msg.id}
                    className={`rounded-lg border p-4 sm:p-5 ${
                      msg.role === 'user'
                        ? 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-2.5">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {msg.role === 'user' ? 'User' : 'Assistant'}
                        </span>
                        {msg.model && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono">{msg.model}</span>
                          </>
                        )}
                        {typeof msg.latencyMs === 'number' && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{msg.latencyMs} ms</span>
                          </>
                        )}
                        {msg.usage?.total_tokens !== undefined && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              {msg.usage.total_tokens} tokens
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {Boolean(msg.rawResponse) && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedJsonId(expandedJsonId === msg.id ? null : msg.id)
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Code2 className="w-3.5 h-3.5" />
                            JSON
                          </button>
                        )}
                        {msg.content && (
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Copy
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {msg.error ? (
                      <div className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-md px-3.5 py-2.5">
                        {msg.error}
                      </div>
                    ) : (
                      <div className="text-[15px] leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words">
                        {msg.content || (isLoading ? 'Waiting for completion…' : '')}
                      </div>
                    )}

                    {expandedJsonId === msg.id && Boolean(msg.rawResponse) && (
                      <div className="mt-4">
                        <CodeBlock
                          code={JSON.stringify(msg.rawResponse, null, 2)}
                          languageLabel="response payload"
                          maxHeightClass="max-h-72"
                        />
                      </div>
                    )}
                  </article>
                ))}
                <div ref={scrollEndRef} />
              </div>
            )}
          </div>

          {errorBanner && (
            <div className="mx-5 lg:mx-8 mb-3 px-4 py-2.5 rounded-md border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorBanner}</span>
            </div>
          )}

          <div className="px-5 lg:px-8 pb-5 pt-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!isLoading) {
                  onSend();
                }
              }}
              className="max-w-3xl mx-auto"
            >
              <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-600 transition-shadow">
                <textarea
                  rows={3}
                  value={input}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!isLoading && input.trim()) {
                        onSend();
                      }
                    }
                  }}
                  placeholder="Enter a prompt for venice/deepseek-v4-flash…"
                  className="w-full px-4 pt-3 pb-2 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-none focus:outline-none"
                />
                <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    Enter to send · Shift+Enter for newline
                  </span>
                  <div className="flex items-center gap-2">
                    {isLoading ? (
                      <button
                        type="button"
                        onClick={onStop}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0"
                      >
                        <Square className="w-3 h-3 fill-current" />
                        Stop
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!input.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-45 disabled:cursor-not-allowed rounded-md transition-colors whitespace-nowrap shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send Request
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        <aside
          className={`w-full xl:w-[420px] border-l border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col shrink-0 ${
            mobilePanel === 'inspector' ? 'flex' : 'hidden xl:flex'
          }`}
        >
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Live Request Inspector
            </h2>
            <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 dark:bg-slate-800 rounded-md">
              {(
                [
                  { id: 'python', label: 'Python' },
                  { id: 'typescript', label: 'TS' },
                  { id: 'curl', label: 'cURL' },
                  { id: 'json', label: 'JSON' },
                ] as Array<{ id: InspectorTab; label: string }>
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setInspectorTab(tab.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    inspectorTab === tab.id
                      ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <CodeBlock
              code={inspectorCode}
              languageLabel={inspectorLanguageLabel}
              maxHeightClass="max-h-[calc(100vh-250px)]"
            />
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed space-y-1">
              <p>
                Requests execute through <code className="font-mono text-slate-700 dark:text-slate-300">POST /api/chat</code> and proxy to <code className="font-mono text-slate-700 dark:text-slate-300">https://router.vapinetwork.ai/v1/chat/completions</code>.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
