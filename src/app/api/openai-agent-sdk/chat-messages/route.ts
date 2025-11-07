import { NextRequest, NextResponse } from 'next/server'
import { Agent, AgentInputItem, Runner, withTrace, fileSearchTool } from '@openai/agents'
import { OpenAI } from 'openai'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      agentId, 
      apiKey, 
      message, 
      attachments, 
      conversationHistory, 
      model, 
      instructions,
      reasoningEffort,
      store,
      vectorStoreId
    } = body

    if (!agentId || !apiKey) {
      return NextResponse.json(
        { error: 'Missing agentId or apiKey' },
        { status: 400 }
      )
    }

    // Check if agentId is a workflow ID (wf_...) or assistant ID (asst_...)
    const isWorkflow = agentId.startsWith('wf_')
    const isAssistant = agentId.startsWith('asst_')

    if (!isWorkflow && !isAssistant) {
      return NextResponse.json(
        { 
          error: 'Invalid agent ID format',
          details: 'Agent ID must start with "wf_" (workflow) or "asst_" (assistant)'
        },
        { status: 400 }
      )
    }

    // Prepare messages for the thread
    const threadMessages = conversationHistory?.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content || ''
    })) || []

    // Add current message
    threadMessages.push({
      role: 'user',
      content: message || ''
    })

    // For workflows, use OpenAI Agents SDK
    if (isWorkflow) {
      try {
        // Set OpenAI API key for the Agents SDK
        process.env.OPENAI_API_KEY = apiKey

        // Try to fetch workflow configuration from OpenAI API
        // Note: This might not be available in all versions, but we'll try
        let workflowConfig: any = null
        try {
          // Attempt to fetch workflow details from OpenAI API
          // The endpoint might be different - this is a placeholder
          const workflowResponse = await fetch(`https://api.openai.com/v1/workflows/${agentId}`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          })
          if (workflowResponse.ok) {
            workflowConfig = await workflowResponse.json()
          }
        } catch (e) {
          // Workflow API might not be available, continue with defaults
          console.debug('Could not fetch workflow config, using defaults:', e)
        }

        // Create agent configuration from user settings, workflow config, or defaults
        // Priority: user settings > workflow config > defaults
        const agentName = workflowConfig?.name || "Workflow Agent"
        const agentInstructions = instructions || workflowConfig?.instructions || workflowConfig?.agent?.instructions || "You are a helpful assistant."
        const agentModel = model || workflowConfig?.model || workflowConfig?.agent?.model || "gpt-4o"
        
        // Build tools array - add file search if vector store ID is provided
        const tools: any[] = []
        if (vectorStoreId) {
          try {
            const fileSearch = fileSearchTool([vectorStoreId])
            tools.push(fileSearch)
          } catch (e) {
            console.warn('Failed to create file search tool:', e)
          }
        }
        
        // Build model settings
        const modelSettings: any = {}
        if (reasoningEffort && (reasoningEffort === 'low' || reasoningEffort === 'medium' || reasoningEffort === 'high')) {
          modelSettings.reasoning = { effort: reasoningEffort }
        }
        if (store !== undefined) {
          modelSettings.store = store
        }
        
        // Merge with workflow config model settings if available
        if (workflowConfig?.agent?.modelSettings) {
          Object.assign(modelSettings, workflowConfig.agent.modelSettings)
        }
        
        const myAgent = new Agent({
          name: agentName,
          instructions: agentInstructions,
          model: agentModel,
          ...(tools.length > 0 ? { tools } : {}),
          ...(Object.keys(modelSettings).length > 0 ? { modelSettings } : {}),
        })

        // Convert to AgentInputItem format
        // Based on the example, we only pass the current message, not the full history
        // The workflow handles its own state management
        const agentInputHistory: AgentInputItem[] = [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: message || ''
              }
            ]
          }
        ]

        // Create runner with workflow ID in traceMetadata
        const runner = new Runner({
          traceMetadata: {
            __trace_source__: 'agent-builder',
            workflow_id: agentId
          }
        })

        // Run the agent with the workflow
        const result = await withTrace('chat-workflow', async () => {
          const agentResult = await runner.run(myAgent, agentInputHistory)
          
          // Extract text content from the result
          // The output might be in finalOutput or in newItems
          let outputText = ''
          
          // First, try to extract from newItems (assistant messages)
          if (agentResult.newItems && Array.isArray(agentResult.newItems)) {
            for (const item of agentResult.newItems) {
              if (item.rawItem && item.rawItem.role === 'assistant') {
                // Extract text from assistant message
                if (item.rawItem.content && Array.isArray(item.rawItem.content)) {
                  for (const contentItem of item.rawItem.content) {
                    if (contentItem.type === 'text' || contentItem.type === 'output_text') {
                      const textValue = typeof contentItem.text === 'string' 
                        ? contentItem.text 
                        : (contentItem.text?.value || contentItem.value || '')
                      if (textValue) {
                        outputText += textValue
                      }
                    }
                  }
                } else if (typeof item.rawItem.content === 'string') {
                  outputText += item.rawItem.content
                }
              }
            }
          }
          
          // If no output from newItems, try finalOutput
          if (!outputText && agentResult.finalOutput) {
            if (typeof agentResult.finalOutput === 'string') {
              outputText = agentResult.finalOutput
            } else if (typeof agentResult.finalOutput === 'object') {
              // Skip if it has input_text type (that's an error)
              if (agentResult.finalOutput.type === 'input_text') {
                console.warn('Agent returned input_text type in output, skipping')
              } else if (agentResult.finalOutput.type === 'text' || agentResult.finalOutput.type === 'output_text') {
                outputText = agentResult.finalOutput.text || agentResult.finalOutput.value || ''
              } else if ('text' in agentResult.finalOutput) {
                outputText = typeof agentResult.finalOutput.text === 'string' 
                  ? agentResult.finalOutput.text 
                  : agentResult.finalOutput.text?.value || ''
              } else if ('value' in agentResult.finalOutput) {
                outputText = String(agentResult.finalOutput.value)
              } else if ('content' in agentResult.finalOutput) {
                if (typeof agentResult.finalOutput.content === 'string') {
                  outputText = agentResult.finalOutput.content
                }
              }
            }
          }

          if (!outputText) {
            // Log the full result for debugging
            console.error('Agent result structure:', JSON.stringify(agentResult, null, 2))
            throw new Error('Agent result has no extractable text content')
          }

          return {
            content: outputText,
            newItems: agentResult.newItems
          }
        })

        // Return the response
        return NextResponse.json({
          content: result.content || 'No response received',
          message: result.content || 'No response received',
          text: result.content || 'No response received',
          response: result.content || 'No response received'
        })
      } catch (error) {
        console.error('OpenAI Agents SDK workflow error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const errorStack = error instanceof Error ? error.stack : undefined
        
        // Try to extract more details from the error
        let errorDetails = errorMessage
        if (error instanceof Error && 'cause' in error) {
          const cause = (error as any).cause
          if (cause) {
            errorDetails += `\nCause: ${typeof cause === 'string' ? cause : JSON.stringify(cause)}`
          }
        }
        
        return NextResponse.json(
          { 
            error: 'Workflow execution failed',
            details: errorDetails,
            stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
          },
          { status: 500 }
        )
      }
    }

    // For assistants, use the standard Assistants API
    const requestBody: any = {
      assistant_id: agentId,
      stream: true, // Enable streaming
    }

    // If we have a thread_id stored, use it; otherwise create a new thread first
    // For simplicity, we'll create a new thread each time
    // In production, you'd want to maintain thread state
    
    // First, create a thread with messages
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        messages: threadMessages
      }),
    })

    if (!threadResponse.ok) {
      const errorText = await threadResponse.text()
      try {
        const errorData = JSON.parse(errorText)
        return NextResponse.json(errorData, { status: threadResponse.status })
      } catch {
        return NextResponse.json(
          { error: errorText || 'Failed to create thread' },
          { status: threadResponse.status }
        )
      }
    }

    const threadData = await threadResponse.json()
    const threadId = threadData.id

    // Now create a run on the thread
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify(requestBody),
    })

    if (!runResponse.ok) {
      const errorText = await runResponse.text()
      try {
        const errorData = JSON.parse(errorText)
        return NextResponse.json(errorData, { status: runResponse.status })
      } catch {
        return NextResponse.json(
          { error: errorText || 'OpenAI Agent SDK API request failed' },
          { status: runResponse.status }
        )
      }
    }

    // Check if response is streaming
    const contentType = runResponse.headers.get('content-type')
    const isStreaming = contentType?.includes('text/event-stream') || requestBody.stream

    if (isStreaming && runResponse.body) {
      // Return streaming response - proxy the stream directly
      return new NextResponse(runResponse.body, {
        status: runResponse.status,
        headers: {
          'Content-Type': contentType || 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      })
    } else {
      // Return JSON response
      const data = await runResponse.json()
      return NextResponse.json(data, { status: runResponse.status })
    }
  } catch (error) {
    console.error('OpenAI Agent SDK proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

