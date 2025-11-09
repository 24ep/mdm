import { NextResponse } from 'next/server'

interface WorkflowHandlerOptions {
  agentId: string
  apiKey: string
  message: string
  attachments?: any[]
  conversationHistory?: any[]
  model?: string
  instructions?: string
  reasoningEffort?: string
  store?: boolean
  vectorStoreId?: string
  enableWebSearch?: boolean
  enableCodeInterpreter?: boolean
  enableComputerUse?: boolean
  enableImageGeneration?: boolean
  requestStream?: boolean
  existingThreadId?: string
  chatbotId?: string
  spaceId?: string
  session?: any
}

export async function handleWorkflowRequest(options: WorkflowHandlerOptions) {
  const {
    agentId,
    apiKey,
    message,
    requestStream,
  } = options

  // Execute static workflow from repository
  console.log('AgentSDK: Using static workflow from repository', {
      workflowId: agentId,
      hasInput: !!message,
      inputLength: message?.length || 0,
    })

    try {
    // Import and execute static workflow
    const { runWorkflow } = await import('@/lib/workflows/qsncc-workflow')
    
    // Pass API key from config to workflow (not from environment)
    const result = await runWorkflow(
      { input_as_text: message || '' },
      agentId,
      apiKey // Pass API key from config
    )

    const output = result?.output_text || ''

        if (requestStream) {
          // For streaming, send the output as chunks
          const stream = new ReadableStream({
            async start(controller) {
              const encoder = new TextEncoder()
          const chunks = output.split(' ')
              for (const chunk of chunks) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
            await new Promise(resolve => setTimeout(resolve, 10))
              }
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
            },
          })

          return new Response(stream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          })
        } else {
          return NextResponse.json({
        message: output,
            cached: false,
          })
      }
    } catch (error) {
    console.error('AgentSDK: Error executing static workflow:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorStack = error instanceof Error ? error.stack : undefined
      
      return NextResponse.json(
        { 
        error: `Failed to execute workflow: ${errorMessage}`,
        details: 'The workflow code could not be executed. Please check the logs for details.',
          stack: errorStack,
        },
        { status: 500 }
      )
    }
  }
