/**
 * Base Strategy Interface for LLM Providers
 */
class LLMProvider {
  /**
   * Initialize the provider with API keys and configurations
   * @param {Object} config
   */
  constructor(config) {
    if (new.target === LLMProvider) {
      throw new Error('Cannot instantiate an interface');
    }
  }

  /**
   * Generate completion from the LLM
   * @param {String} systemPrompt 
   * @param {String} userPrompt 
   * @param {String} responseFormat 'json' or 'text'
   * @returns {Promise<Object|String>} Parsed response
   */
  async generateCompletion(systemPrompt, userPrompt, responseFormat = 'json') {
    throw new Error('Method generateCompletion() must be implemented');
  }
}

module.exports = LLMProvider;
