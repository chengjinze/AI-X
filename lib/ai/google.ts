import { GoogleGenerativeAI, GenerativeModel, Content } from "@google/generative-ai";
import type {
  AiProvider,
  AiProviderConfig,
  ChatMessage,
  GenerateOptions,
  ProviderId,
  StreamChunk,
} from "./types";

function toGeminiContents(messages: ChatMessage[]): Content[] {
  const contents: Content[] = [];

  for (const msg of messages) {
    switch (msg.role) {
      case "system":
        // Gemini handles system prompts via systemInstruction in model config
        break;
      case "user":
        contents.push({ role: "user", parts: [{ text: msg.content }] });
        break;
      case "assistant":
        contents.push({ role: "model", parts: [{ text: msg.content }] });
        break;
      case "tool":
        contents.push({
          role: "function",
          parts: [{ text: msg.content }],
        });
        break;
    }
  }

  return contents;
}

function extractSystemPrompt(messages: ChatMessage[]): string {
  return messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
}

export function createGoogleProvider(config?: { apiKey?: string }): AiProvider {
  const apiKey = config?.apiKey ?? process.env.GOOGLE_API_KEY ?? "";
  const genAI = new GoogleGenerativeAI(apiKey);

  const providerConfig: AiProviderConfig = {
    id: "google",
    name: "Google Gemini",
    models: [
      "gemini-2.5-pro-exp-03-25",
      "gemini-2.5-flash-preview-04-17",
      "gemini-2.0-flash",
    ],
    defaultModel: "gemini-2.5-pro-exp-03-25",
    enabled: !!apiKey,
  };

  function getModel(modelName: string): GenerativeModel {
    const systemPrompt = ""; // set per call
    return genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    });
  }

  return {
    id: "google" as ProviderId,
    config: providerConfig,

    async *streamChat(
      messages: ChatMessage[],
      options: GenerateOptions
    ): AsyncGenerator<StreamChunk> {
      const modelName = options.model || providerConfig.defaultModel;
      const systemPrompt = extractSystemPrompt(messages);
      const contents = toGeminiContents(messages);

      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt || undefined,
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 4096,
        },
      });

      const result = await model.generateContentStream({ contents });

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield { type: "text-delta", content: text };
        }
      }

      yield { type: "done" };
    },

    async generateText(
      messages: ChatMessage[],
      options: GenerateOptions
    ): Promise<string> {
      const modelName = options.model || providerConfig.defaultModel;
      const systemPrompt = extractSystemPrompt(messages);
      const contents = toGeminiContents(messages);

      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt || undefined,
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 4096,
        },
      });

      const result = await model.generateContent({ contents });
      return result.response.text();
    },
  };
}
