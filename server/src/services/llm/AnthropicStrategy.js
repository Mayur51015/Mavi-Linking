const LLMProvider = require('./LLMProvider');

class AnthropicStrategy extends LLMProvider {
  constructor(config) {
    super(config);
    this.apiKey = config.apiKey;
    this.modelName = config.modelName || 'claude-3-haiku-20240307';
    // Assume anthropic SDK is used, but for the sake of the pattern we mock/implement it using native fetch or if @anthropic-ai/sdk was installed
    this.baseURL = 'https://api.anthropic.com/v1/messages';
  }

  async generateCompletion(systemPrompt, userPrompt, responseFormat = 'json') {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: this.modelName,
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`Anthropic API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const content = data.content[0].text;
    return responseFormat === 'json' ? JSON.parse(content) : content;
  }
}

module.exports = AnthropicStrategy;
