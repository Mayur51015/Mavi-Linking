const OpenAIStrategy = require('./OpenAIStrategy');
const AnthropicStrategy = require('./AnthropicStrategy');

class LLMFactory {
  static getProvider() {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;
    const grokApiKey = process.env.GROK_API_KEY;
    const openaiApiKey = process.env.OPENAI_INSIGHTS_API_KEY || process.env.OPENAI_API_KEY;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (anthropicApiKey) {
      return new AnthropicStrategy({ apiKey: anthropicApiKey });
    }

    const apiKey = geminiApiKey || groqApiKey || grokApiKey || openaiApiKey;
    if (!apiKey) {
      return null;
    }

    const baseURL = geminiApiKey ? 'https://generativelanguage.googleapis.com/v1beta/openai/'
                  : groqApiKey ? 'https://api.groq.com/openai/v1' 
                  : grokApiKey ? 'https://api.x.ai/v1' 
                  : undefined;
    
    const modelName = geminiApiKey ? 'gemini-2.5-flash'
                    : groqApiKey ? 'llama-3.1-8b-instant' 
                    : grokApiKey ? 'grok-2-latest' 
                    : 'gpt-4o-mini';

    return new OpenAIStrategy({ apiKey, baseURL, modelName });
  }
}

module.exports = LLMFactory;
