import { Play } from 'lucide-react';
import type { ChatMessage, RouterParams } from '../types/router';
import {
  buildRequestPayload,
  generateCurlSnippet,
  generatePythonSnippet,
  generateTypeScriptSnippet,
} from '../lib/snippets';
import { CodeBlock } from './CodeBlock';

interface SdkWorkbenchViewProps {
  params: RouterParams;
  messages: ChatMessage[];
  draftInput: string;
  onOpenPlayground: () => void;
}

export function SdkWorkbenchView({
  params,
  messages,
  draftInput,
  onOpenPlayground,
}: SdkWorkbenchViewProps) {
  const pythonCode = generatePythonSnippet(params, messages, draftInput);
  const tsCode = generateTypeScriptSnippet(params, messages, draftInput);
  const curlCode = generateCurlSnippet(params, messages, draftInput);
  const jsonPayload = JSON.stringify(buildRequestPayload(params, messages, draftInput), null, 2);

  return (
    <div className="flex-1 overflow-y-auto px-5 lg:px-10 py-8 bg-white dark:bg-slate-950">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 text-balance">
              SDK Snippets & Request Generator
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Synchronized with your active sidebar configuration (<span className="font-mono text-slate-800 dark:text-slate-200">{params.model}</span> · temperature <span className="font-mono tabular-nums">{params.temperature.toFixed(2)}</span> · stream <span className="font-mono">{String(params.stream)}</span>).
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenPlayground}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            Test in Playground
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="space-y-2.5">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                01. Python (OpenAI SDK)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Drop-in compatible with <code className="font-mono">pip install openai</code>
              </p>
            </div>
            <CodeBlock code={pythonCode} languageLabel="python · router_client.py" maxHeightClass="max-h-96" />
          </section>

          <section className="space-y-2.5">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                02. TypeScript / Node.js
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Drop-in compatible with <code className="font-mono">npm install openai</code>
              </p>
            </div>
            <CodeBlock code={tsCode} languageLabel="typescript · client.ts" maxHeightClass="max-h-96" />
          </section>

          <section className="space-y-2.5">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                03. HTTP / cURL
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct REST invocation against <code className="font-mono">/v1/chat/completions</code>
              </p>
            </div>
            <CodeBlock code={curlCode} languageLabel="bash · curl" maxHeightClass="max-h-96" />
          </section>

          <section className="space-y-2.5">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                04. Request Body JSON
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Exact serialized payload sent to vAPI Router
              </p>
            </div>
            <CodeBlock code={jsonPayload} languageLabel="application/json" maxHeightClass="max-h-96" />
          </section>
        </div>
      </div>
    </div>
  );
}
