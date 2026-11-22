import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const DEFAULT_BASE_URL = (process.env.VAPI_ROUTER_BASE_URL || 'https://router.vapinetwork.ai/v1').replace(/\/+$/, '');
const DEFAULT_MODEL = 'venice/deepseek-v4-flash';

const PRESET_MODELS = [
  {
    id: 'venice/deepseek-v4-flash',
    owned_by: 'venice',
    description: 'Fast DeepSeek V4 Flash inference via vAPI Router',
  },
  {
    id: 'venice/deepseek-v4',
    owned_by: 'venice',
    description: 'Full DeepSeek V4 reasoning and coding model',
  },
  {
    id: 'venice/llama-3.3-70b',
    owned_by: 'venice',
    description: 'General-purpose instruction and chat model',
  },
  {
    id: 'venice/qwen-2.5-coder-32b',
    owned_by: 'venice',
    description: 'Specialized code generation and debugging model',
  },
];

function getRouterApiKey(): string {
  return (process.env.VAPI_ROUTER_API_KEY || process.env.ROUTER_API_KEY || '').trim();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    const apiKey = getRouterApiKey();
    res.json({
      ok: true,
      configured: Boolean(apiKey),
      baseUrl: DEFAULT_BASE_URL,
      defaultModel: DEFAULT_MODEL,
    });
  });

  app.get('/api/models', async (_req, res) => {
    const apiKey = getRouterApiKey();
    if (!apiKey) {
      res.json({
        models: PRESET_MODELS,
        source: 'preset',
        configured: false,
      });
      return;
    }

    try {
      const upstreamRes = await fetch(`${DEFAULT_BASE_URL}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!upstreamRes.ok) {
        const text = await upstreamRes.text();
        res.json({
          models: PRESET_MODELS,
          source: 'preset',
          configured: true,
          warning: `Upstream /models returned ${upstreamRes.status}: ${text.slice(0, 180)}`,
        });
        return;
      }

      const payload = (await upstreamRes.json()) as {
        data?: Array<{ id: string; owned_by?: string; created?: number }>;
      };

      const upstreamModels = Array.isArray(payload?.data)
        ? payload.data.map((m) => ({
            id: m.id,
            owned_by: m.owned_by || m.id.split('/')[0] || 'router',
            description: 'Live model returned by router',
          }))
        : [];

      const seen = new Set(upstreamModels.map((m) => m.id));
      const merged = [
        ...upstreamModels,
        ...PRESET_MODELS.filter((preset) => !seen.has(preset.id)),
      ];

      res.json({
        models: merged,
        source: upstreamModels.length > 0 ? 'upstream' : 'preset',
        configured: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch upstream models';
      res.json({
        models: PRESET_MODELS,
        source: 'preset',
        configured: true,
        warning: message,
      });
    }
  });

  app.post('/api/chat', async (req, res) => {
    const apiKey = getRouterApiKey();
    if (!apiKey) {
      res.status(503).json({
        error:
          'VAPI_ROUTER_API_KEY is not configured in the server environment. Add VAPI_ROUTER_API_KEY in the AI Studio Secrets panel to send live requests to https://router.vapinetwork.ai/v1.',
        code: 'MISSING_API_KEY',
      });
      return;
    }

    const body = req.body as {
      model?: string;
      messages?: Array<{ role: string; content: string }>;
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
      stream?: boolean;
    };

    if (!Array.isArray(body?.messages) || body.messages.length === 0) {
      res.status(400).json({ error: 'Request must include a non-empty messages array.' });
      return;
    }

    const model = (body.model || DEFAULT_MODEL).trim() || DEFAULT_MODEL;
    const isStream = Boolean(body.stream);
    const upstreamPayload: Record<string, unknown> = {
      model,
      messages: body.messages,
      stream: isStream,
    };

    if (typeof body.temperature === 'number' && Number.isFinite(body.temperature)) {
      upstreamPayload.temperature = body.temperature;
    }
    if (typeof body.max_tokens === 'number' && Number.isFinite(body.max_tokens)) {
      upstreamPayload.max_tokens = Math.max(1, Math.round(body.max_tokens));
    }
    if (typeof body.top_p === 'number' && Number.isFinite(body.top_p)) {
      upstreamPayload.top_p = body.top_p;
    }

    const abortController = new AbortController();
    req.on('close', () => {
      if (!res.writableEnded) {
        abortController.abort();
      }
    });

    const startedAt = Date.now();

    try {
      const upstreamRes = await fetch(`${DEFAULT_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: isStream ? 'text/event-stream' : 'application/json',
        },
        body: JSON.stringify(upstreamPayload),
        signal: abortController.signal,
      });

      if (!upstreamRes.ok) {
        const latencyMs = Date.now() - startedAt;
        const rawText = await upstreamRes.text();
        let parsedError: unknown = null;
        try {
          parsedError = JSON.parse(rawText);
        } catch {
          parsedError = { message: rawText };
        }
        res.status(upstreamRes.status).json({
          error:
            (parsedError as { error?: { message?: string }; message?: string })?.error?.message ||
            (parsedError as { message?: string })?.message ||
            `Upstream router returned HTTP ${upstreamRes.status}`,
          upstream: parsedError,
          _meta: {
            latencyMs,
            status: upstreamRes.status,
            baseUrl: DEFAULT_BASE_URL,
          },
        });
        return;
      }

      if (isStream && upstreamRes.body) {
        res.status(200);
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Router-Start', String(startedAt));

        const reader = upstreamRes.body.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }
            if (value) {
              res.write(Buffer.from(value));
            }
          }
        } finally {
          reader.releaseLock();
          res.end();
        }
        return;
      }

      const data = (await upstreamRes.json()) as Record<string, unknown>;
      const latencyMs = Date.now() - startedAt;

      res.status(upstreamRes.status).json({
        ...data,
        _meta: {
          latencyMs,
          status: upstreamRes.status,
          baseUrl: DEFAULT_BASE_URL,
        },
      });
    } catch (err) {
      if (abortController.signal.aborted) {
        return;
      }
      const latencyMs = Date.now() - startedAt;
      const message = err instanceof Error ? err.message : 'Network error reaching vAPI Router';
      res.status(502).json({
        error: message,
        _meta: {
          latencyMs,
          status: 502,
          baseUrl: DEFAULT_BASE_URL,
        },
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`vAPI Router Studio listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
