export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LlmConfig {
  baseUrl: string
  apiKey: string
  model: string
}

export interface ChatCompletionResponse {
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  model?: string
}

export async function chatCompletion(
  config: LlmConfig,
  messages: ChatMessage[],
  options?: { temperature?: number; max_tokens?: number }
): Promise<ChatCompletionResponse> {
  const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens,
      stream: false,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`LLM API error (${response.status}): ${errorBody}`)
  }

  return response.json()
}

export async function chatCompletionStream(
  config: LlmConfig,
  messages: ChatMessage[],
  options?: { temperature?: number; max_tokens?: number }
): Promise<ReadableStream<Uint8Array>> {
  const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens,
      stream: true,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`LLM API error (${response.status}): ${errorBody}`)
  }

  if (!response.body) {
    throw new Error('No response body received from LLM')
  }

  return response.body
}

export async function testConnection(
  config: LlmConfig
): Promise<{ success: boolean; message: string; model?: string }> {
  try {
    const result = await chatCompletion(config, [
      { role: 'user', content: 'Hi, respond with just "ok".' }
    ], { max_tokens: 10 })
    
    return {
      success: true,
      message: 'Connection successful',
      model: result.model || config.model,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
