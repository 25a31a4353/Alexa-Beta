/**
 * @typedef {Object} ToolCall
 * @property {string} id
 * @property {string} name
 * @property {Record<string, any>} arguments
 */

/**
 * @typedef {Object} Message
 * @property {'system' | 'user' | 'assistant' | 'tool'} role
 * @property {string} content
 * @property {string} [toolCallId]
 * @property {string} [name]
 * @property {ToolCall[]} [toolCalls]
 */

/**
 * @typedef {Object} LLMDecisionToolCall
 * @property {'tool_call'} type
 * @property {ToolCall[]} toolCalls
 * @property {string} [rationale]
 */

/**
 * @typedef {Object} LLMDecisionFinalAnswer
 * @property {'final_answer'} type
 * @property {string} text
 * @property {string[]} [sourcesUsed]
 */

/**
 * @typedef {LLMDecisionToolCall | LLMDecisionFinalAnswer} LLMDecision
 */

export {};
