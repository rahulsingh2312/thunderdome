/**
 * The six channels. Model ids are Vercel AI Gateway slugs and never translate.
 * Channel numbers map to --ch-N tokens in globals.css.
 */
export type ModelId =
  | "anthropic/claude-opus-5"
  | "openai/gpt-5.6"
  | "google/gemini-3.7-flash"
  | "xai/grok-4.6"
  | "alibaba/qwen3.8-max"
  | "deepseek/deepseek-v4";

export type Channel = {
  id: ModelId;
  /** Short label for the panel. Never translated. */
  label: string;
  /** Who built it. */
  maker: string;
  /** 1-6, maps to the --ch-N colour token. */
  ch: 1 | 2 | 3 | 4 | 5 | 6;
  /** Self-hosted brand mark, from the LobeHub AI icon set. */
  logo: string;
};

export const channels: Channel[] = [
  { id: "anthropic/claude-opus-5", label: "OPUS 5", maker: "Anthropic", ch: 1, logo: "/logos/anthropic.png" },
  { id: "openai/gpt-5.6", label: "GPT-5.6", maker: "OpenAI", ch: 2, logo: "/logos/openai.png" },
  { id: "google/gemini-3.7-flash", label: "GEMINI 3.7", maker: "Google", ch: 3, logo: "/logos/gemini.png" },
  { id: "xai/grok-4.6", label: "GROK 4.6", maker: "xAI", ch: 4, logo: "/logos/xai.png" },
  { id: "alibaba/qwen3.8-max", label: "QWEN3.8 MAX", maker: "Alibaba", ch: 5, logo: "/logos/qwen.png" },
  { id: "deepseek/deepseek-v4", label: "DEEPSEEK V4", maker: "DeepSeek", ch: 6, logo: "/logos/deepseek.png" },
];

export const byId = (id: string) => channels.find((c) => c.id === id);
