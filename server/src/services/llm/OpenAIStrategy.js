const { OpenAI } = require('openai');
const LLMProvider = require('./LLMProvider');

class OpenAIStrategy extends LLMProvider {
  constructor(config) {
    super(config);
    this.modelName = config.modelName || 'gpt-4o-mini';
    this.client = new OpenAI({ 
      apiKey: config.apiKey, 
      baseURL: config.baseURL 
    });
  }

  async generateCompletion(systemPrompt, userPrompt, responseFormat = 'json') {
    const options = {
      model: this.modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    };
    
    if (responseFormat === 'json') {
      options.response_format = { type: "json_object" };
    }
    
    const response = await this.client.chat.completions.create(options);
    const content = response.choices[0].message.content;
    
    return responseFormat === 'json' ? JSON.parse(content) : content;
  }
}

module.exports = OpenAIStrategy;
