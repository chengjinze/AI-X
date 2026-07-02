import type { AiProvider, AiProviderConfig, ProviderId } from "./types";
import { createOpenAiProvider } from "./openai";
import { createAnthropicProvider } from "./anthropic";
import { createGoogleProvider } from "./google";
import { createDeepSeekProvider, createOllamaProvider } from "./compatible";

// Singleton provider instances (lazy initialized)
const providers = new Map<ProviderId, AiProvider>();

function getOrCreateProvider(id: ProviderId): AiProvider | null {
  if (providers.has(id)) return providers.get(id)!;

  let provider: AiProvider | null = null;

  switch (id) {
    case "openai": {
      if (process.env.OPENAI_API_KEY) {
        provider = createOpenAiProvider();
      }
      break;
    }
    case "anthropic": {
      if (process.env.ANTHROPIC_API_KEY) {
        provider = createAnthropicProvider();
      }
      break;
    }
    case "google": {
      if (process.env.GOOGLE_API_KEY) {
        provider = createGoogleProvider();
      }
      break;
    }
    case "deepseek": {
      if (process.env.DEEPSEEK_API_KEY) {
        provider = createDeepSeekProvider();
      }
      break;
    }
    case "ollama": {
      // Ollama is always "enabled" — it's local
      provider = createOllamaProvider();
      break;
    }
  }

  if (provider) {
    providers.set(id, provider);
  }

  return provider;
}

/** Get all available providers (those with API keys configured) */
export function getAvailableProviders(): AiProviderConfig[] {
  const ids: ProviderId[] = ["openai", "anthropic", "google", "deepseek", "ollama"];
  const result: AiProviderConfig[] = [];

  for (const id of ids) {
    const p = getOrCreateProvider(id);
    if (p?.config.enabled) {
      result.push(p.config);
    }
  }

  return result;
}

/** Get a specific provider by ID */
export function getProvider(id: ProviderId): AiProvider | null {
  return getOrCreateProvider(id);
}

/** Get the default provider (from env DEFAULT_PROVIDER, or first available) */
export function getDefaultProvider(): AiProvider | null {
  const defaultId = (process.env.DEFAULT_PROVIDER as ProviderId) || "openai";
  const available = getAvailableProviders();

  // Try default first
  const defaultProvider = getOrCreateProvider(defaultId);
  if (defaultProvider?.config.enabled) return defaultProvider;

  // Fallback to first available
  if (available.length > 0) {
    return getOrCreateProvider(available[0].id);
  }

  return null;
}

/** Get the default model for a given provider */
export function getDefaultModel(providerId: ProviderId): string {
  const p = getOrCreateProvider(providerId);
  return p?.config.defaultModel ?? process.env.DEFAULT_MODEL ?? "gpt-4o";
}
