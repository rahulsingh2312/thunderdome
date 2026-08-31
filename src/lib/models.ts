/**
 * The six channels. Model ids are Vercel AI Gateway slugs and never translate.
 * Channel numbers map to --ch-N tokens in globals.css.
 */
export type ModelId =
  | "anthropic/claude-opus-4.5"
  | "openai/gpt-5.2"
  | "google/gemini-3-pro"
  | "xai/grok-4"
  | "alibaba/qwen3-max"
  | "deepseek/deepseek-v3.2";

export type Channel = {
  id: ModelId;
  /** Short label for the panel. Never translated. */
  label: string;
  /** Who built it. */
  maker: string;
  /** 1-6, maps to the --ch-N colour token. */
  ch: 1 | 2 | 3 | 4 | 5 | 6;
};

export const channels: Channel[] = [
  { id: "anthropic/claude-opus-4.5", label: "OPUS 4.5", maker: "Anthropic", ch: 1 },
  { id: "openai/gpt-5.2", label: "GPT 5.2", maker: "OpenAI", ch: 2 },
  { id: "google/gemini-3-pro", label: "GEMINI 3", maker: "Google", ch: 3 },
  { id: "xai/grok-4", label: "GROK 4", maker: "xAI", ch: 4 },
  { id: "alibaba/qwen3-max", label: "QWEN3 MAX", maker: "Alibaba", ch: 5 },
  { id: "deepseek/deepseek-v3.2", label: "DEEPSEEK", maker: "DeepSeek", ch: 6 },
];

export const byId = (id: string) => channels.find((c) => c.id === id);
