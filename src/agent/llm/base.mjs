/**
 * Base LLM Provider interface
 */
export class BaseLLMProvider {
  /**
   * @param {string} name
   * @param {string} model
   */
  constructor(name = 'base-provider', model = 'none') {
    this.name = name;
    this.model = model;
  }

  /**
   * @param {Object} params
   * @param {Array<any>} params.messages
   * @param {Array<any>} params.tools
   * @param {string} [params.systemPrompt]
   * @returns {Promise<any>}
   */
  async generateDecision(params) {
    throw new Error('generateDecision must be implemented by subclass');
  }
}
