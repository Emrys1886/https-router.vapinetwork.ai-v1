import { Moon, RefreshCw, RotateCcw, Sun, Trash2, X } from 'lucide-react';
import type { ActiveView, ChatThread, ModelOption, RouterParams } from '../types/router';

interface SidebarProps {
  threads: ChatThread[];
  activeThreadId: string;
  params: RouterParams;
  models: ModelOption[];
  modelsLoading: boolean;
  theme: 'light' | 'dark';
  activeView: ActiveView;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectThread: (id: string) => void;
  onDeleteThread: (id: string) => void;
  onUpdateParams: (patch: Partial<RouterParams>) => void;
  onResetParams: () => void;
  onRefreshModels: () => void;
  onToggleTheme: () => void;
  onChangeView: (view: ActiveView) => void;
}

const MOBILE_NAV: Array<{ id: ActiveView; label: string }> = [
  { id: 'playground', label: 'Playground' },
  { id: 'sdk', label: 'SDK Code' },
  { id: 'history', label: 'History' },
  { id: 'docs', label: 'Endpoint' },
];

export function Sidebar({
  threads,
  activeThreadId,
  params,
  models,
  modelsLoading,
  theme,
  activeView,
  mobileOpen,
  onCloseMobile,
  onSelectThread,
  onDeleteThread,
  onUpdateParams,
  onResetParams,
  onRefreshModels,
  onToggleTheme,
  onChangeView,
}: SidebarProps) {
  const isPresetModel = models.some((m) => m.id === params.model);

  const sidebarContent = (
    <aside className="w-[272px] h-full flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 select-none">
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <span className="text-sm font-semibold">Navigation</span>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close sidebar"
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="md:hidden grid grid-cols-2 gap-1.5 p-3 border-b border-slate-200 dark:border-slate-800">
        {MOBILE_NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onChangeView(item.id);
              onCloseMobile();
            }}
            className={`px-3 py-2 text-xs font-medium rounded-md text-left transition-colors ${
              activeView === item.id
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Sessions
            </h2>
            <span className="text-xs font-mono tabular-nums text-slate-400 dark:text-slate-500">
              {threads.length}
            </span>
          </div>
          <div className="space-y-1 max-h-44 overflow-y-auto pr-0.5">
            {threads.map((thread) => {
              const active = thread.id === activeThreadId;
              return (
                <div
                  key={thread.id}
                  className={`group flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-xs transition-colors ${
                    active
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectThread(thread.id);
                      onCloseMobile();
                    }}
                    className="flex-1 text-left truncate font-medium focus-visible:outline-none"
                    title={thread.title}
                  >
                    {thread.title}
                  </button>
                  {threads.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteThread(thread.id);
                      }}
                      aria-label={`Delete ${thread.title}`}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="h-px bg-slate-200 dark:bg-slate-800" />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Model Configuration
            </h2>
            <button
              type="button"
              onClick={onResetParams}
              title="Reset parameters to defaults"
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="model-select"
                className="text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Model ID
              </label>
              <button
                type="button"
                onClick={onRefreshModels}
                disabled={modelsLoading}
                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${modelsLoading ? 'animate-spin' : ''}`} />
                Sync
              </button>
            </div>
            <select
              id="model-select"
              value={isPresetModel ? params.model : '__custom__'}
              onChange={(e) => {
                if (e.target.value !== '__custom__') {
                  onUpdateParams({ model: e.target.value });
                }
              }}
              className="w-full px-2.5 py-2 text-xs font-mono rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id}
                </option>
              ))}
              {!isPresetModel && (
                <option value="__custom__">Custom: {params.model}</option>
              )}
            </select>
            <input
              type="text"
              value={params.model}
              onChange={(e) => onUpdateParams({ model: e.target.value })}
              placeholder="venice/deepseek-v4-flash"
              aria-label="Custom model identifier"
              className="w-full px-2.5 py-1.5 text-xs font-mono rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="system-prompt"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              System Prompt
            </label>
            <textarea
              id="system-prompt"
              rows={3}
              value={params.systemPrompt}
              onChange={(e) => onUpdateParams({ systemPrompt: e.target.value })}
              placeholder="Optional system instruction..."
              className="w-full px-2.5 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-y focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Stream Response
              </span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                Server-sent events (SSE)
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={params.stream}
              aria-label="Toggle streaming response"
              onClick={() => onUpdateParams({ stream: !params.stream })}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-blue-600 ${
                params.stream
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-150 ${
                  params.stream ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor="param-temp"
                className="font-medium text-slate-700 dark:text-slate-300"
              >
                Temperature
              </label>
              <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                {params.temperature.toFixed(2)}
              </span>
            </div>
            <input
              id="param-temp"
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={params.temperature}
              onChange={(e) => onUpdateParams({ temperature: parseFloat(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor="param-top-p"
                className="font-medium text-slate-700 dark:text-slate-300"
              >
                Top P
              </label>
              <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                {params.topP.toFixed(2)}
              </span>
            </div>
            <input
              id="param-top-p"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={params.topP}
              onChange={(e) => onUpdateParams({ topP: parseFloat(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor="param-max-tokens"
                className="font-medium text-slate-700 dark:text-slate-300"
              >
                Max Tokens
              </label>
              <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                1 – 8192
              </span>
            </div>
            <input
              id="param-max-tokens"
              type="number"
              min={1}
              max={8192}
              step={64}
              value={params.maxTokens}
              onChange={(e) => {
                const next = parseInt(e.target.value, 10);
                if (!Number.isNaN(next)) {
                  onUpdateParams({ maxTokens: Math.min(8192, Math.max(1, next)) });
                }
              }}
              className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </section>
      </div>

      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Theme
        </span>
        <button
          type="button"
          onClick={onToggleTheme}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-3.5 h-3.5" />
              Dark Mode
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5" />
              Light Mode
            </>
          )}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block h-full shrink-0">{sidebarContent}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-50 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
