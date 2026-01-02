import { NextRequest, NextResponse } from 'next/server';
import { validateDomain } from '@/lib/chatbot-helper';

// CORS headers for embed support
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Private-Network': 'true',
};

// Helper to create JSON response with CORS headers
function jsonResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

// ChatKit Session API - Creates session with OpenAI for ChatKit
// This endpoint is called by the ChatKitWrapper to get a client_secret
// MOVED from /api/chatkit/session to /next-api/chatkit/session to avoid Nginx API collision

export async function POST(request: NextRequest) {
  console.log('🔵 ChatKit session API called (Physical Route)')
  try {
    const body = await request.json();
    const { agentId, apiKey: providedApiKey, existing, chatbotId } = body;

    console.log('📝 Session request details:', {
      hasAgentId: !!agentId,
      agentIdPrefix: agentId?.substring(0, 10),
      hasChatbotId: !!chatbotId,
      hasProvidedApiKey: !!providedApiKey,
      hasExistingSession: !!existing
    })

    let apiKey = providedApiKey;

    // If API key is missing but we have chatbotId, fetch it from DB
    if (!apiKey && chatbotId) {
      console.log('🔍 Fetching API key from database for chatbot:', chatbotId)
      try {
        // Import db dynamically to avoid build cycle issues if any
        const { db } = await import('@/lib/db');
        const { mergeVersionConfig } = await import('@/lib/chatbot-helper');

        const chatbot = await db.chatbot.findUnique({
          where: { id: chatbotId },
          include: {
            versions: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        });

        if (chatbot) {
          const config = mergeVersionConfig(chatbot);

          // SECURITY: Domain Whitelisting
          const domainValidation = validateDomain(config, request)
          if (!domainValidation.allowed) {
            console.warn(`[Session API] ${domainValidation.error}`)
            return jsonResponse(
              { error: 'Domain not allowed', details: domainValidation.error },
              403
            )
          }

          // Check if chatbot is enabled (default to true if not set)
          const chatbotEnabled = config.chatbotEnabled !== false
          if (!chatbotEnabled) {
            console.log(`[Session API] Chatbot ${chatbotId} is disabled`)
            return jsonResponse(
              { error: 'Chatbot is disabled', disabled: true },
              403
            )
          }

          // Determine which key to use
          const isAgentSDK = config.engineType === 'openai-agent-sdk';
          apiKey = isAgentSDK ? config.openaiAgentSdkApiKey : config.chatkitApiKey;
          console.log('✅ Retrieved API key from database', {
            engineType: config.engineType,
            hasKey: !!apiKey
          })
        } else {
          console.warn('⚠️ Chatbot not found in database:', chatbotId)
        }
      } catch (dbError) {
        console.error('❌ Error fetching API key from DB:', dbError);
        // Continue to see if we can fail gracefully or if apiKey was optional
      }
    }

    if (!agentId) {
      console.error('❌ Missing agentId in request')
      return jsonResponse({ error: 'Missing agentId' }, 400);
    }

    if (!apiKey) {
      console.error('❌ Missing API key')
      return jsonResponse(
        { error: 'Missing API key', details: 'No OpenAI API key provided or found for this chatbot' },
        400
      );
    }

    // Call OpenAI's ChatKit Sessions API to create a session
    // API requires: user (string), workflow.id (string)
    // See: https://platform.openai.com/docs/api-reference/chatkit/sessions
    const openaiUrl = 'https://api.openai.com/v1/chatkit/sessions';

    // Build session payload for ChatKit
    // Generate a unique user ID for the session (could be enhanced with real user IDs)
    const userId = body.userId || `user_${chatbotId}_${Date.now()}`;

    const sessionPayload: any = {
      user: userId,
      workflow: {
        id: agentId,
      },
    };

    // If refreshing an existing session, include session info
    if (existing && existing.session_id) {
      sessionPayload.session_id = existing.session_id;
      console.log('🔄 Refreshing session:', existing.session_id)
    }

    console.log('🌐 Calling OpenAI ChatKit API:', {
      url: openaiUrl,
      userId,
      workflowId: agentId?.substring(0, 20) + '...',
      isRefresh: !!existing
    })

    const response = await fetch(openaiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'chatkit_beta=v1',
      },
      body: JSON.stringify(sessionPayload),
    });

    console.log('📡 OpenAI API response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = { raw: errorText };
      }

      console.error('❌ OpenAI session creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorDetails
      });

      return jsonResponse(
        {
          error: 'Failed to create OpenAI session',
          details: errorDetails.error?.message || errorDetails.raw || response.statusText
        },
        response.status
      );
    }

    const sessionData = await response.json();
    console.log('✅ Session created successfully:', {
      session_id: sessionData.id,
      has_client_secret: !!sessionData.client_secret,
      expires_at: sessionData.expires_at
    })

    // Return the client_secret to the frontend
    return jsonResponse({
      client_secret: sessionData.client_secret?.value || sessionData.client_secret,
      session_id: sessionData.id,
      expires_at: sessionData.expires_at
    });

  } catch (error) {
    console.error('❌ ChatKit session error:', error);
    return jsonResponse(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Private-Network': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Keep GET for backwards compatibility
export async function GET() {
  return jsonResponse(
    { error: 'Use POST method with agentId and apiKey in body' },
    405
  );
}
