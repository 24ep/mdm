import { NextRequest, NextResponse } from 'next/server';

// ChatKit Session API - Creates session with OpenAI for ChatKit
// This endpoint is called by the ChatKitWrapper to get a client_secret

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, apiKey: providedApiKey, existing, chatbotId } = body;

    let apiKey = providedApiKey;

    // If API key is missing but we have chatbotId, fetch it from DB
    if (!apiKey && chatbotId) {
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
          // Determine which key to use
          const isAgentSDK = config.engineType === 'openai-agent-sdk';
          apiKey = isAgentSDK ? config.openaiAgentSdkApiKey : config.chatkitApiKey;
        }
      } catch (dbError) {
        console.error('Error fetching API key from DB:', dbError);
        // Continue to see if we can fail gracefully or if apiKey was optional
      }
    }

    if (!agentId) {
      return NextResponse.json(
        { error: 'Missing agentId' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key', details: 'No OpenAI API key provided or found for this chatbot' },
        { status: 400 }
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
    }

    const response = await fetch(openaiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'chatkit_beta=v1',
      },
      body: JSON.stringify(sessionPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = { raw: errorText };
      }

      console.error('OpenAI session creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorDetails
      });

      return NextResponse.json(
        {
          error: 'Failed to create OpenAI session',
          details: errorDetails.error?.message || errorDetails.raw || response.statusText
        },
        { status: response.status }
      );
    }

    const sessionData = await response.json();

    // Return the client_secret to the frontend
    return NextResponse.json({
      client_secret: sessionData.client_secret?.value || sessionData.client_secret,
      session_id: sessionData.id,
      expires_at: sessionData.expires_at
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('ChatKit session error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
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
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Keep GET for backwards compatibility
export async function GET() {
  return NextResponse.json(
    { error: 'Use POST method with agentId and apiKey in body' },
    { status: 405 }
  );
}
