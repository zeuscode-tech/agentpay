import { generateText } from "ai";
import { z } from "zod";

export const summaryRequestSchema = z
  .object({
    text: z.string().trim().min(80).max(12_000),
    maxSentences: z.number().int().min(1).max(5).default(3),
  })
  .strict();

export type SummaryRequest = z.infer<typeof summaryRequestSchema>;

export type SummaryResult = {
  summary: string;
  provider: "local" | "vercel-ai-gateway";
  model: string;
};

export type Summarizer = {
  summarize(request: SummaryRequest): Promise<SummaryResult>;
};

const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "with",
  "а",
  "без",
  "в",
  "для",
  "и",
  "из",
  "к",
  "как",
  "на",
  "не",
  "но",
  "по",
  "с",
  "что",
  "это",
]);

function words(text: string): string[] {
  return (text.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter(
    word => word.length > 1 && !stopWords.has(word),
  );
}

function extractiveSummary(text: string, maxSentences: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  const sentences = normalized
    .split(/(?<=[.!?])\s+(?=[\p{Lu}\p{N}])/u)
    .filter(Boolean);

  if (sentences.length <= maxSentences) {
    return normalized;
  }

  const frequencies = new Map<string, number>();
  for (const word of words(normalized)) {
    frequencies.set(word, (frequencies.get(word) ?? 0) + 1);
  }

  return sentences
    .map((sentence, index) => {
      const sentenceWords = words(sentence);
      const keywordScore = sentenceWords.reduce(
        (score, word) => score + (frequencies.get(word) ?? 0),
        0,
      );
      const lengthPenalty = Math.sqrt(Math.max(sentenceWords.length, 1));
      const positionWeight = 1 / (1 + index * 0.08);

      return {
        index,
        sentence,
        score: (keywordScore / lengthPenalty) * positionWeight,
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, maxSentences)
    .sort((left, right) => left.index - right.index)
    .map(candidate => candidate.sentence)
    .join(" ");
}

class LocalSummarizer implements Summarizer {
  async summarize(request: SummaryRequest): Promise<SummaryResult> {
    return {
      summary: extractiveSummary(request.text, request.maxSentences),
      provider: "local",
      model: "extractive-frequency-v1",
    };
  }
}

class GatewaySummarizer implements Summarizer {
  constructor(private readonly model: string) {}

  async summarize(request: SummaryRequest): Promise<SummaryResult> {
    const { text } = await generateText({
      model: this.model,
      instructions:
        "Summarize the supplied text accurately and concisely. Preserve the " +
        "source language. Return only the summary without a title or preamble.",
      prompt:
        `Use at most ${request.maxSentences} sentences.\n\n` + request.text,
      maxOutputTokens: 320,
      temperature: 0.2,
      maxRetries: 1,
      timeout: 20_000,
    });

    return {
      summary: text.trim(),
      provider: "vercel-ai-gateway",
      model: this.model,
    };
  }
}

export function createSummarizer(
  environment: NodeJS.ProcessEnv = process.env,
): Summarizer {
  const mode = environment.AI_SUMMARIZER_MODE ?? "local";

  if (mode === "local") {
    return new LocalSummarizer();
  }

  if (mode === "gateway") {
    if (!environment.AI_GATEWAY_API_KEY && !environment.VERCEL_OIDC_TOKEN) {
      throw new Error(
        "AI_SUMMARIZER_MODE=gateway requires AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN",
      );
    }

    if (!environment.AI_GATEWAY_MODEL) {
      throw new Error(
        "AI_SUMMARIZER_MODE=gateway requires an AI_GATEWAY_MODEL from the live model catalog",
      );
    }

    return new GatewaySummarizer(environment.AI_GATEWAY_MODEL);
  }

  throw new Error("AI_SUMMARIZER_MODE must be either local or gateway");
}
