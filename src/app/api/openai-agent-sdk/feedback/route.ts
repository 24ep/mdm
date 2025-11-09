import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getLangfuseClient, isLangfuseEnabled } from '@/lib/langfuse'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { 
      agentId, 
      apiKey, 
      messageId,
      feedback, // 'liked' | 'disliked' | null
      messageContent,
      conversationContext,
      chatbotId,
      threadId,
      traceId, // Optional: Langfuse trace ID if available
    } = body

    if (!agentId || !apiKey || !messageId) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, apiKey, or messageId' },
        { status: 400 }
      )
    }

    if (!feedback || (feedback !== 'liked' && feedback !== 'disliked')) {
      return NextResponse.json(
        { error: 'Invalid feedback. Must be "liked" or "disliked"' },
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

    // For workflows, we can send feedback to OpenAI's feedback API if available
    // For now, we'll log it and potentially store it for analytics
    if (isWorkflow) {
      try {
        // Try to send feedback to OpenAI's feedback endpoint if available
        // Note: This endpoint might not be available in all versions
        const feedbackResponse = await fetch(`https://api.openai.com/v1/workflows/${agentId}/feedback`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message_id: messageId,
            feedback: feedback,
            message_content: messageContent,
            conversation_context: conversationContext
          }),
        })

        if (feedbackResponse.ok) {
          const data = await feedbackResponse.json()
          
          // Send feedback to Langfuse if enabled and traceId is provided
          if (isLangfuseEnabled() && traceId) {
            const langfuse = getLangfuseClient()
            if (langfuse) {
              try {
                langfuse.score({
                  traceId,
                  name: 'user-feedback',
                  value: feedback === 'liked' ? 1 : 0,
                  comment: feedback === 'liked' ? 'User liked the response' : 'User disliked the response',
                  metadata: {
                    messageId,
                    agentId,
                    chatbotId: chatbotId || undefined,
                    threadId: threadId || undefined,
                    agentType: 'workflow',
                  },
                })
              } catch (langfuseError) {
                console.warn('Failed to send feedback to Langfuse:', langfuseError)
              }
            }
          }
          
          return NextResponse.json({
            success: true,
            message: 'Feedback sent successfully',
            data
          })
        } else {
          // If the endpoint doesn't exist, we'll still log the feedback locally
          console.log('Workflow feedback (not sent to API):', {
            agentId,
            messageId,
            feedback,
            messageContent
          })
          
          // Still send to Langfuse even if OpenAI API doesn't accept it
          if (isLangfuseEnabled() && traceId) {
            const langfuse = getLangfuseClient()
            if (langfuse) {
              try {
                langfuse.score({
                  traceId,
                  name: 'user-feedback',
                  value: feedback === 'liked' ? 1 : 0,
                  comment: feedback === 'liked' ? 'User liked the response' : 'User disliked the response',
                  metadata: {
                    messageId,
                    agentId,
                    chatbotId: chatbotId || undefined,
                    threadId: threadId || undefined,
                    agentType: 'workflow',
                  },
                })
              } catch (langfuseError) {
                console.warn('Failed to send feedback to Langfuse:', langfuseError)
              }
            }
          }
          
          return NextResponse.json({
            success: true,
            message: 'Feedback recorded locally (API endpoint not available)',
            note: 'Feedback has been logged but not sent to OpenAI API'
          })
        }
      } catch (error) {
        // Log feedback locally if API call fails
        console.log('Workflow feedback (local only):', {
          agentId,
          messageId,
          feedback,
          messageContent,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Still send to Langfuse even if OpenAI API call fails
        if (isLangfuseEnabled() && traceId) {
          const langfuse = getLangfuseClient()
          if (langfuse) {
            try {
              langfuse.score({
                traceId,
                name: 'user-feedback',
                value: feedback === 'liked' ? 1 : 0,
                comment: feedback === 'liked' ? 'User liked the response' : 'User disliked the response',
                metadata: {
                  messageId,
                  agentId,
                  chatbotId: chatbotId || undefined,
                  threadId: threadId || undefined,
                  agentType: 'workflow',
                },
              })
            } catch (langfuseError) {
              console.warn('Failed to send feedback to Langfuse:', langfuseError)
            }
          }
        }
        
        return NextResponse.json({
          success: true,
          message: 'Feedback recorded locally',
          note: 'Feedback has been logged but could not be sent to OpenAI API'
        })
      }
    }

    // For assistants, try to send feedback via Assistants API
    if (isAssistant) {
      try {
        // Try OpenAI Assistants API feedback endpoint if available
        const feedbackResponse = await fetch(`https://api.openai.com/v1/assistants/${agentId}/feedback`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2',
          },
          body: JSON.stringify({
            message_id: messageId,
            feedback: feedback,
            message_content: messageContent
          }),
        })

        if (feedbackResponse.ok) {
          const data = await feedbackResponse.json()
          
          // Send feedback to Langfuse if enabled and traceId is provided
          if (isLangfuseEnabled() && traceId) {
            const langfuse = getLangfuseClient()
            if (langfuse) {
              try {
                langfuse.score({
                  traceId,
                  name: 'user-feedback',
                  value: feedback === 'liked' ? 1 : 0,
                  comment: feedback === 'liked' ? 'User liked the response' : 'User disliked the response',
                  metadata: {
                    messageId,
                    agentId,
                    chatbotId: chatbotId || undefined,
                    threadId: threadId || undefined,
                    agentType: 'assistant',
                  },
                })
              } catch (langfuseError) {
                console.warn('Failed to send feedback to Langfuse:', langfuseError)
              }
            }
          }
          
          return NextResponse.json({
            success: true,
            message: 'Feedback sent successfully',
            data
          })
        } else {
          console.log('Assistant feedback (not sent to API):', {
            agentId,
            messageId,
            feedback,
            messageContent
          })
          
          // Still send to Langfuse even if OpenAI API doesn't accept it
          if (isLangfuseEnabled() && traceId) {
            const langfuse = getLangfuseClient()
            if (langfuse) {
              try {
                langfuse.score({
                  traceId,
                  name: 'user-feedback',
                  value: feedback === 'liked' ? 1 : 0,
                  comment: feedback === 'liked' ? 'User liked the response' : 'User disliked the response',
                  metadata: {
                    messageId,
                    agentId,
                    chatbotId: chatbotId || undefined,
                    threadId: threadId || undefined,
                    agentType: 'assistant',
                  },
                })
              } catch (langfuseError) {
                console.warn('Failed to send feedback to Langfuse:', langfuseError)
              }
            }
          }
          
          return NextResponse.json({
            success: true,
            message: 'Feedback recorded locally (API endpoint not available)',
            note: 'Feedback has been logged but not sent to OpenAI API'
          })
        }
      } catch (error) {
        console.log('Assistant feedback (local only):', {
          agentId,
          messageId,
          feedback,
          messageContent,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Still send to Langfuse even if OpenAI API call fails
        if (isLangfuseEnabled() && traceId) {
          const langfuse = getLangfuseClient()
          if (langfuse) {
            try {
              langfuse.score({
                traceId,
                name: 'user-feedback',
                value: feedback === 'liked' ? 1 : 0,
                comment: feedback === 'liked' ? 'User liked the response' : 'User disliked the response',
                metadata: {
                  messageId,
                  agentId,
                  chatbotId: chatbotId || undefined,
                  threadId: threadId || undefined,
                  agentType: 'assistant',
                },
              })
            } catch (langfuseError) {
              console.warn('Failed to send feedback to Langfuse:', langfuseError)
            }
          }
        }
        
        return NextResponse.json({
          success: true,
          message: 'Feedback recorded locally',
          note: 'Feedback has been logged but could not be sent to OpenAI API'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded'
    })
  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

