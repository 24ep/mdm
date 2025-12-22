import { NextRequest, NextResponse } from 'next/server';

// ChatKit Session API - Creates session with OpenAI for ChatKit
// This endpoint is called by the ChatKitWrapper to get a client_secret

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, apiKey, existing } = body;

    if (!agentId) {
      return NextResponse.json(
        { error: 'Missing agentId' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key', details: 'No OpenAI API key provided for this chatbot' },
        { status: 400 }
      );
    }

    // Call OpenAI's Realtime API to create a session
    // Based on ChatKit documentation, we need to create a realtime session
    const openaiUrl = 'https://api.openai.com/v1/realtime/sessions';
    
    const sessionPayload: any = {
      model: 'gpt-4o-realtime-preview-2024-12-17',
    };

    // If refreshing an existing session
    if (existing) {
      sessionPayload.session_id = existing.session_id;
    }

    const response = await fetch(openaiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
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
