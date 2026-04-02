/**
 * Shared Anthropic client for pipeline steps that need Claude Sonnet 4.6 for JSON tasks.
 * Used by: Knowledge Engine (topic-graph, insight-generator, framework-generator),
 * OpenAI client migration (extractTopicsAndStyle, buildResearchBrief).
 */

import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-6";

let _client: Anthropic | null = null;

/** Singleton Anthropic client — shared across the entire pipeline. */
export function getSharedAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

/** @deprecated Use getSharedAnthropicClient() */
function getClient(): Anthropic {
  return getSharedAnthropicClient();
}

export function prewarmClient(): void {
  try { getClient(); } catch { /* ignore if no key during warmup */ }
}

/**
 * Call Claude Sonnet 4.6 with a system + user prompt and get JSON back.
 * Handles markdown stripping and basic JSON extraction.
 */
export async function callClaudeJson(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number; timeoutMs?: number }
): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const client = getClient();
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: options?.maxTokens ?? 8192,
    temperature: options?.temperature ?? 0.2,
    system: [{ type: "text" as const, text: systemPrompt, cache_control: { type: "ephemeral" as const } }],
    messages: [{ role: "user", content: userPrompt }],
  }, {
    timeout: options?.timeoutMs ?? 120_000,
  });

  const block = message.content?.[0];
  if (!block || block.type !== "text") {
    throw new Error("Claude returned empty or non-text response");
  }

  return {
    content: block.text,
    inputTokens: message.usage?.input_tokens ?? 0,
    outputTokens: message.usage?.output_tokens ?? 0,
  };
}

/** Strip markdown code fences from JSON string. */
export function stripJsonMarkdown(raw: string): string {
  let s = raw.trim();
  const backtick = "```";
  if (s.startsWith(backtick)) {
    const end = s.indexOf(backtick, backtick.length);
    s = end > 0 ? s.slice(backtick.length, end) : s.slice(backtick.length);
  }
  if (s.startsWith("json")) s = s.slice(4);
  const jsonMatch = s.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : s;
}

export { MODEL as CLAUDE_SONNET_MODEL };
