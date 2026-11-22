import type { HealthStatus } from '../types/router';
import { CodeBlock } from './CodeBlock';

interface EndpointDocsViewProps {
  health: HealthStatus | null;
}

const ENV_SAMPLE = `# Configure in AI Studio Secrets panel (never commit real keys)
VAPI_ROUTER_API_KEY="your-router-api-key"
VAPI_ROUTER_BASE_URL="https://router.vapinetwork.ai/v1"`;

const PYTHON_REF = `from openai import OpenAI

client = OpenAI(
    base_url="https://router.vapinetwork.ai/v1",
    api_key="<your router key>",
)

response = client.chat.completions.create(
    model="venice/deepseek-v4-flash",
    messages=[{"role": "user", "content": "Hello from vAPI Router"}],
)

print(response.choices[0].message.content)`;

export function EndpointDocsView({ health }: EndpointDocsViewProps) {
  return (
    <div className="flex-1 overflow-y-auto px-5 lg:px-10 py-8 bg-white dark:bg-slate-950">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2 pb-6 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            vAPI Router Endpoint Reference
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            vAPI Router exposes an OpenAI-compatible REST interface at <code className="font-mono text-slate-800 dark:text-slate-200">{health?.baseUrl || 'https://router.vapinetwork.ai/v1'}</code>. Browser requests in this workbench are proxied securely through <code className="font-mono text-slate-800 dark:text-slate-200">/api/chat</code> so your router key remains server-side.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            01. Server Environment Configuration
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Key status:{' '}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {health?.configured
                ? 'VAPI_ROUTER_API_KEY is configured in server secrets'
                : 'VAPI_ROUTER_API_KEY is not configured yet'}
            </span>
          </p>
          <CodeBlock code={ENV_SAMPLE} languageLabel=".env / AI Studio Secrets" maxHeightClass="max-h-64" />
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            02. Supported Proxy & Upstream Routes
          </h2>
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-2.5 font-medium">Method</th>
                  <th className="px-4 py-2.5 font-medium">Proxy Route</th>
                  <th className="px-4 py-2.5 font-medium">Upstream Target</th>
                  <th className="px-4 py-2.5 font-medium">Behavior</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                <tr className="h-10">
                  <td className="px-4 py-2 font-mono text-slate-900 dark:text-slate-100">POST</td>
                  <td className="px-4 py-2 font-mono text-slate-800 dark:text-slate-200">/api/chat</td>
                  <td className="px-4 py-2 font-mono text-slate-600 dark:text-slate-400">/v1/chat/completions</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">Supports SSE streaming and JSON completions</td>
                </tr>
                <tr className="h-10">
                  <td className="px-4 py-2 font-mono text-slate-900 dark:text-slate-100">GET</td>
                  <td className="px-4 py-2 font-mono text-slate-800 dark:text-slate-200">/api/models</td>
                  <td className="px-4 py-2 font-mono text-slate-600 dark:text-slate-400">/v1/models</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">Lists available router models with preset fallback</td>
                </tr>
                <tr className="h-10">
                  <td className="px-4 py-2 font-mono text-slate-900 dark:text-slate-100">GET</td>
                  <td className="px-4 py-2 font-mono text-slate-800 dark:text-slate-200">/api/health</td>
                  <td className="px-4 py-2 font-mono text-slate-600 dark:text-slate-400">—</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">Checks whether VAPI_ROUTER_API_KEY is present</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            03. Reference Python Client
          </h2>
          <CodeBlock code={PYTHON_REF} languageLabel="python · openai sdk" maxHeightClass="max-h-80" />
        </section>
      </div>
    </div>
  );
}
