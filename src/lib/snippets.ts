import type { ChatMessage, RouterParams } from '../types/router';

export const DEFAULT_BASE_URL = 'https://router.vapinetwork.ai/v1';

export function buildApiMessages(
  messages: ChatMessage[],
  systemPrompt: string,
  draftInput?: string
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const formatted: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

  if (systemPrompt.trim()) {
    formatted.push({ role: 'system', content: systemPrompt.trim() });
  }

  for (const msg of messages) {
    if (msg.content.trim()) {
      formatted.push({ role: msg.role, content: msg.content });
    }
  }

  const trimmedDraft = (draftInput || '').trim();
  if (trimmedDraft && (formatted.length === 0 || formatted[formatted.length - 1].role !== 'user')) {
    formatted.push({ role: 'user', content: trimmedDraft });
  }

  if (formatted.length === 0) {
    formatted.push({ role: 'user', content: 'Hello from vAPI Router' });
  }

  return formatted;
}

export function buildRequestPayload(
  params: RouterParams,
  messages: ChatMessage[],
  draftInput?: string
) {
  return {
    model: params.model || 'venice/deepseek-v4-flash',
    messages: buildApiMessages(messages, params.systemPrompt, draftInput),
    temperature: params.temperature,
    max_tokens: params.maxTokens,
    top_p: params.topP,
    stream: params.stream,
  };
}

export function generatePythonSnippet(
  params: RouterParams,
  messages: ChatMessage[],
  draftInput?: string
): string {
  const apiMessages = buildApiMessages(messages, params.systemPrompt, draftInput);
  const formattedMessages = JSON.stringify(apiMessages, null, 4)
    .split('\n')
    .map((line, idx) => (idx === 0 ? line : `    ${line}`))
    .join('\n');

  const extraParams: string[] = [];
  if (params.temperature !== 0.7) {
    extraParams.push(`    temperature=${params.temperature},`);
  }
  if (params.maxTokens !== 1024) {
    extraParams.push(`    max_tokens=${params.maxTokens},`);
  }
  if (params.topP !== 1) {
    extraParams.push(`    top_p=${params.topP},`);
  }
  if (params.stream) {
    extraParams.push(`    stream=True,`);
  }

  const extraBlock = extraParams.length > 0 ? `\n${extraParams.join('\n')}` : '';

  if (params.stream) {
    return `from openai import OpenAI

client = OpenAI(
    base_url="${DEFAULT_BASE_URL}",
    api_key="<your router key>",
)

stream = client.chat.completions.create(
    model="${params.model}",
    messages=${formattedMessages},${extraBlock}
)

for chunk in stream:
    delta = chunk.choices[0].delta.content
    if delta:
        print(delta, end="", flush=True)`;
  }

  return `from openai import OpenAI

client = OpenAI(
    base_url="${DEFAULT_BASE_URL}",
    api_key="<your router key>",
)

response = client.chat.completions.create(
    model="${params.model}",
    messages=${formattedMessages},${extraBlock}
)

print(response.choices[0].message.content)`;
}

export function generateTypeScriptSnippet(
  params: RouterParams,
  messages: ChatMessage[],
  draftInput?: string
): string {
  const apiMessages = buildApiMessages(messages, params.systemPrompt, draftInput);
  const formattedMessages = JSON.stringify(apiMessages, null, 2)
    .split('\n')
    .map((line, idx) => (idx === 0 ? line : `  ${line}`))
    .join('\n');

  if (params.stream) {
    return `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${DEFAULT_BASE_URL}",
  apiKey: process.env.VAPI_ROUTER_API_KEY,
});

const stream = await client.chat.completions.create({
  model: "${params.model}",
  messages: ${formattedMessages},
  temperature: ${params.temperature},
  max_tokens: ${params.maxTokens},
  top_p: ${params.topP},
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? "");
}`;
  }

  return `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${DEFAULT_BASE_URL}",
  apiKey: process.env.VAPI_ROUTER_API_KEY,
});

const response = await client.chat.completions.create({
  model: "${params.model}",
  messages: ${formattedMessages},
  temperature: ${params.temperature},
  max_tokens: ${params.maxTokens},
  top_p: ${params.topP},
});

console.log(response.choices[0]?.message?.content);`;
}

export function generateCurlSnippet(
  params: RouterParams,
  messages: ChatMessage[],
  draftInput?: string
): string {
  const payload = buildRequestPayload(params, messages, draftInput);
  return `curl -X POST "${DEFAULT_BASE_URL}/chat/completions" \\
  -H "Authorization: Bearer $VAPI_ROUTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload, null, 2)}'`;
}
