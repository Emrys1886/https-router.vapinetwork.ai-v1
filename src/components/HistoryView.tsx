import { useMemo, useState } from 'react';
import { ArrowRight, Search, Trash2 } from 'lucide-react';
import type { RequestLogEntry } from '../types/router';
import { CodeBlock } from './CodeBlock';

interface HistoryViewProps {
  logs: RequestLogEntry[];
  onClearLogs: () => void;
  onOpenPlayground: () => void;
}

type StatusFilter = 'all' | 'ok' | 'error';

export function HistoryView({ logs, onClearLogs, onOpenPlayground }: HistoryViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(logs[0]?.id ?? null);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((entry) => {
      if (statusFilter === 'ok' && (entry.status < 200 || entry.status >= 300)) {
        return false;
      }
      if (statusFilter === 'error' && entry.status >= 200 && entry.status < 300) {
        return false;
      }
      if (!q) return true;
      return (
        entry.model.toLowerCase().includes(q) ||
        String(entry.status).includes(q) ||
        (entry.error || '').toLowerCase().includes(q)
      );
    });
  }, [logs, search, statusFilter]);

  const selectedEntry =
    filteredLogs.find((item) => item.id === selectedId) || filteredLogs[0] || null;

  return (
    <div className="flex-1 overflow-y-auto px-5 lg:px-10 py-8 bg-white dark:bg-slate-950">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Request Execution Log
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Real request timings, HTTP status codes, token usage, and raw payloads recorded during your sessions.
            </p>
          </div>
          {logs.length > 0 && (
            <button
              type="button"
              onClick={onClearLogs}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Log
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-10 text-center space-y-4">
            <div className="space-y-1.5 max-w-md mx-auto">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                No requests recorded yet
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Send a prompt from the Playground to capture actual HTTP status, latency, token counts, and raw response envelopes here.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenPlayground}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Open Playground
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by model, status, error…"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'ok', label: '2xx Success' },
                    { id: 'error', label: 'Errors' },
                  ] as Array<{ id: StatusFilter; label: string }>
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                      statusFilter === tab.id
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <th className="px-4 py-2.5">Timestamp</th>
                      <th className="px-4 py-2.5">Model</th>
                      <th className="px-4 py-2.5">Mode</th>
                      <th className="px-4 py-2.5 text-right">Status</th>
                      <th className="px-4 py-2.5 text-right">Tokens</th>
                      <th className="px-4 py-2.5 text-right">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                    {filteredLogs.map((entry) => {
                      const isSelected = selectedEntry?.id === entry.id;
                      const isOk = entry.status >= 200 && entry.status < 300;
                      return (
                        <tr
                          key={entry.id}
                          onClick={() => setSelectedId(entry.id)}
                          className={`h-10 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50/70 dark:bg-blue-950/30'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                          }`}
                        >
                          <td className="px-4 py-2 font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-2 font-mono text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {entry.model}
                          </td>
                          <td className="px-4 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {entry.stream ? 'Stream' : 'JSON'}
                          </td>
                          <td
                            className={`px-4 py-2 font-mono tabular-nums text-right whitespace-nowrap ${
                              isOk
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-red-700 dark:text-red-400'
                            }`}
                          >
                            {isOk ? `${entry.status} OK` : `${entry.status} ERR`}
                          </td>
                          <td className="px-4 py-2 font-mono tabular-nums text-right text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {entry.totalTokens !== undefined ? entry.totalTokens : '—'}
                          </td>
                          <td className="px-4 py-2 font-mono tabular-nums text-right text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {entry.latencyMs} ms
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedEntry && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Request Payload
                  </h3>
                  <CodeBlock
                    code={JSON.stringify(selectedEntry.requestPayload, null, 2)}
                    languageLabel="POST /api/chat"
                    maxHeightClass="max-h-80"
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Response Envelope
                  </h3>
                  <CodeBlock
                    code={JSON.stringify(selectedEntry.responsePayload, null, 2)}
                    languageLabel={`HTTP ${selectedEntry.status}`}
                    maxHeightClass="max-h-80"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
