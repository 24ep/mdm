/**
 * WebSocket Proxy Server for OpenAI Realtime API
 * 
 * This is a standalone WebSocket server that proxies connections between
 * the client and OpenAI Realtime API.
 * 
 * To run this server:
 * 1. Install dependencies: npm install ws
 * 2. Run: npx tsx lib/websocket-proxy.ts
 * 3. Or add to package.json: "scripts": { "ws-proxy": "tsx lib/websocket-proxy.ts" }
 * 
 * The server will run on ws://localhost:3001
 * Update the client to connect to ws://localhost:3001/api/openai-realtime
 */

import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'

// Default to port 3002 since 3001 may be used by Docker or other services
const PORT = process.env.WS_PROXY_PORT || 3002
// Use the latest Realtime API model
const OPENAI_REALTIME_URL = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17'

interface ClientConnection {
  ws: WebSocket
  openaiWs: WebSocket | null
  apiKey: string | null
  isOpenAIConnected: boolean
}

const clients = new Map<string, ClientConnection>()

const server = createServer()
const wss = new WebSocketServer({ server, path: '/api/openai-realtime' })

wss.on('connection', (clientWs: WebSocket, request) => {
  const clientId = `${Date.now()}-${Math.random()}`
  const connection: ClientConnection = {
    ws: clientWs,
    openaiWs: null,
    apiKey: null,
    isOpenAIConnected: false,
  }
  
  clients.set(clientId, connection)
  console.log(`Client connected: ${clientId}`)

  clientWs.on('message', async (message: Buffer) => {
    try {
      const data = JSON.parse(message.toString())
      
      // Log incoming messages (except audio chunks to avoid spam)
      if (data.type !== 'input_audio_buffer.append') {
        console.log(`📥 Received message from client ${clientId}:`, data.type)
        if (data.type === 'auth' && data.sessionConfig) {
          console.log(`📋 Auth message sessionConfig:`, JSON.stringify(data.sessionConfig, null, 2))
          if (data.sessionConfig.prompt) {
            console.log(`✅ Prompt ID detected in auth: ${data.sessionConfig.prompt.id}, version: ${data.sessionConfig.prompt.version}`)
          } else {
            console.log(`⚠️ No prompt ID in sessionConfig. Keys:`, Object.keys(data.sessionConfig))
          }
        }
      } else if (Math.random() < 0.01) { // Log 1% of audio chunks
        console.log(`📥 Received audio chunk from client ${clientId}`)
      }
      
      // Handle authentication
      if (data.type === 'auth' && data.apiKey) {
        connection.apiKey = data.apiKey
        console.log(`🔐 Authentication received for client ${clientId}`)
        
        // Create a session first using the /v1/realtime/sessions endpoint
        // This is the recommended approach when using prompt IDs
        const createSession = async () => {
          try {
            // Build session creation payload
            const sessionPayload: any = {}
            
            // If prompt ID is provided in sessionConfig, use it
            if (data.sessionConfig?.prompt?.id) {
              sessionPayload.prompt = {
                id: data.sessionConfig.prompt.id,
                version: data.sessionConfig.prompt.version || '1',
              }
              console.log(`📋 Creating session with prompt ID: ${data.sessionConfig.prompt.id}, version: ${data.sessionConfig.prompt.version || '1'}`)
              console.log(`📋 Session payload:`, JSON.stringify(sessionPayload, null, 2))
            } else {
              console.log(`⚠️ No prompt ID provided in sessionConfig. Session config keys:`, Object.keys(data.sessionConfig || {}))
            }
            
            // Create session via REST API (only if prompt ID is provided)
            // If no prompt ID, we'll use direct connection instead
            if (!sessionPayload.prompt) {
              console.log(`⚠️ No prompt ID provided - skipping session creation, using direct connection`)
              connectDirectly()
              return
            }
            
            console.log(`📤 Creating Realtime API session with prompt ID...`)
            const sessionResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.apiKey}`,
                'OpenAI-Beta': 'realtime=v1',
              },
              body: JSON.stringify(sessionPayload),
            })
            
            if (!sessionResponse.ok) {
              const errorText = await sessionResponse.text()
              console.error(`❌ Failed to create session: ${sessionResponse.status} ${errorText}`)
              // Try to parse error for better message
              let errorMessage = 'Failed to create Realtime API session'
              try {
                const errorData = JSON.parse(errorText)
                errorMessage = errorData.error?.message || errorData.message || errorMessage
              } catch {
                errorMessage = errorText || errorMessage
              }
              
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({
                  type: 'error',
                  error: { 
                    message: errorMessage,
                    details: `HTTP ${sessionResponse.status}: ${errorText}`,
                  },
                }))
              }
              // Fallback to direct connection if session creation fails
              console.log(`Falling back to direct WebSocket connection for client ${clientId}`)
              connectDirectly()
              return
            }
            
            const sessionData = await sessionResponse.json()
            const sessionId = sessionData.id
            console.log(`✅ Session created successfully: ${sessionId} for client ${clientId}`)
            console.log(`📋 Session details:`, JSON.stringify(sessionData, null, 2))
            
            // Connect to OpenAI Realtime API with session ID
            const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17&session_id=${sessionId}`
            console.log(`🔗 Connecting to OpenAI Realtime API with session ID: ${sessionId}`)
            const openaiWs = new WebSocket(wsUrl, [], {
              headers: {
                'Authorization': `Bearer ${data.apiKey}`,
                'OpenAI-Beta': 'realtime=v1',
              },
            } as any)
            
            openaiWs.on('open', () => {
              console.log(`✅ OpenAI Realtime API connected for client ${clientId} (session: ${sessionId})`)
              connection.openaiWs = openaiWs
              connection.isOpenAIConnected = true
              
              // Update session with additional config if provided (modalities, voice, etc.)
              if (data.sessionConfig) {
                // Remove prompt from sessionConfig since it's already set via session creation
                const { prompt, ...sessionUpdate } = data.sessionConfig
                
                if (Object.keys(sessionUpdate).length > 0) {
                  openaiWs.send(JSON.stringify({
                    type: 'session.update',
                    session: sessionUpdate,
                  }))
                  console.log(`📝 Session updated with config for client ${clientId}:`, Object.keys(sessionUpdate))
                } else {
                  console.log(`ℹ️ No additional session config to update for client ${clientId}`)
                }
              }
              
              // Send confirmation to client ONLY after OpenAI connection is established
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: 'auth.success' }))
                console.log(`✅ Sent auth.success to client ${clientId}`)
              } else {
                console.error(`❌ Cannot send auth.success - client WebSocket not open (state: ${clientWs.readyState})`)
              }
            })
            
            // Set up message handlers (moved outside to avoid duplication)
            setupOpenAIWebSocketHandlers(openaiWs, clientWs, clientId, connection)
            
          } catch (error: any) {
            console.error(`❌ Error creating session for client ${clientId}:`, error)
            // Fallback to direct connection on error
            console.log(`Falling back to direct WebSocket connection for client ${clientId}`)
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'error',
                error: { 
                  message: 'Failed to create Realtime API session, trying direct connection',
                  details: error.message,
                },
              }))
            }
            // Try direct connection as fallback
            connectDirectly()
          }
        }
        
        // Fallback: Direct WebSocket connection if session creation fails or no prompt ID
        const connectDirectly = () => {
          console.log(`Connecting directly to OpenAI Realtime API for client ${clientId}`)
          const openaiWs = new WebSocket(OPENAI_REALTIME_URL, [], {
            headers: {
              'Authorization': `Bearer ${data.apiKey}`,
              'OpenAI-Beta': 'realtime=v1',
            },
          } as any)
          
          // Add connection timeout
          const wsTimeout = setTimeout(() => {
            if (openaiWs.readyState !== WebSocket.OPEN) {
              openaiWs.close()
              console.error(`Direct WebSocket connection timeout for client ${clientId}`)
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({
                  type: 'error',
                  error: { 
                    message: 'Failed to connect to OpenAI Realtime API',
                    details: 'Connection timeout',
                  },
                }))
              }
            }
          }, 10000) // 10 second timeout
          
          openaiWs.on('open', () => {
            clearTimeout(wsTimeout)
            console.log(`✅ OpenAI Realtime API connected (direct) for client ${clientId}`)
            connection.openaiWs = openaiWs
            connection.isOpenAIConnected = true
            
            // Forward initial session config if provided
            if (data.sessionConfig) {
              openaiWs.send(JSON.stringify({
                type: 'session.update',
                session: data.sessionConfig,
              }))
              console.log(`Session config sent for client ${clientId}`)
            }
            
            // Send confirmation to client ONLY after OpenAI connection is established
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'auth.success' }))
              console.log(`✅ Sent auth.success to client ${clientId}`)
            }
          })
          
          openaiWs.on('error', (error) => {
            clearTimeout(wsTimeout)
            console.error(`❌ Direct WebSocket error for client ${clientId}:`, error)
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'error',
                error: { 
                  message: 'Failed to connect to OpenAI Realtime API',
                  details: error.message || 'WebSocket connection error',
                },
              }))
            }
          })
          
          setupOpenAIWebSocketHandlers(openaiWs, clientWs, clientId, connection)
        }
        
        // Try to create session first if prompt ID is provided, otherwise connect directly
        console.log(`🔍 Checking for prompt ID in sessionConfig...`)
        console.log(`   sessionConfig exists:`, !!data.sessionConfig)
        console.log(`   sessionConfig.prompt exists:`, !!data.sessionConfig?.prompt)
        console.log(`   sessionConfig.prompt.id exists:`, !!data.sessionConfig?.prompt?.id)
        if (data.sessionConfig?.prompt?.id) {
          console.log(`✅ Prompt ID found: ${data.sessionConfig.prompt.id}, version: ${data.sessionConfig.prompt.version || '1'}`)
          console.log(`📤 Creating session with prompt ID...`)
          createSession()
        } else {
          console.log(`⚠️ No prompt ID found - using direct connection (no session creation)`)
          // No prompt ID, use direct connection
          connectDirectly()
        }
        
        // Helper function to set up WebSocket handlers
        const setupOpenAIWebSocketHandlers = (
          openaiWs: WebSocket,
          clientWs: WebSocket,
          clientId: string,
          connection: ClientConnection
        ) => {
          openaiWs.on('message', (openaiMessage: Buffer) => {
            // Forward OpenAI messages to client
            // OpenAI sends messages as JSON strings, forward them as-is
            try {
              const messageStr = openaiMessage.toString()
              const messageData = JSON.parse(messageStr)
              
              // Log important messages from OpenAI
              if (messageData.type && !messageData.type.includes('ping') && !messageData.type.includes('pong')) {
                if (messageData.type === 'conversation.item.input_audio_buffer.speech_started') {
                  console.log(`🎙️ OpenAI detected speech started (client ${clientId})`)
                } else if (messageData.type === 'conversation.item.input_audio_transcription.completed') {
                  console.log(`📝 OpenAI transcription: ${messageData.transcript || 'N/A'} (client ${clientId})`)
                } else if (messageData.type === 'response.create') {
                  console.log(`🎙️ OpenAI response.create (client ${clientId})`)
                } else if (messageData.type === 'response.audio.delta') {
                  console.log(`🔊 OpenAI response.audio.delta (client ${clientId}), length: ${messageData.delta?.length || 0}`)
                } else if (messageData.type === 'response.audio.done') {
                  console.log(`✅ OpenAI response.audio.done (client ${clientId})`)
                } else if (messageData.type === 'response.audio_transcript.delta') {
                  console.log(`💬 OpenAI response transcript delta (client ${clientId})`)
                } else if (messageData.type === 'response.done') {
                  console.log(`✅ OpenAI response.done (client ${clientId})`)
                } else {
                  console.log(`📨 OpenAI message: ${messageData.type} (client ${clientId})`)
                }
              }
              
              if (clientWs.readyState === WebSocket.OPEN) {
                // Forward the raw message buffer (which contains JSON string)
                clientWs.send(openaiMessage)
              }
            } catch (error) {
              console.error(`Error parsing OpenAI message for client ${clientId}:`, error)
              // Still forward the raw message even if parsing fails
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(openaiMessage)
              }
            }
          })
          
          openaiWs.on('error', (error) => {
            console.error(`OpenAI WebSocket error for client ${clientId}:`, error)
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'error',
                error: { message: 'OpenAI WebSocket error', details: error.message },
              }))
            }
          })
          
          openaiWs.on('close', () => {
            console.log(`OpenAI WebSocket closed for client ${clientId}`)
            connection.openaiWs = null
            connection.isOpenAIConnected = false
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'connection.closed' }))
            }
          })
        }
        
        // Don't send auth.success here - wait for openaiWs.on('open')
        return
      }
      
      // Forward messages to OpenAI if connected
      // Only forward non-auth messages (auth was already handled above)
      if (data.type !== 'auth') {
        // Check if OpenAI connection is fully established
        if (connection.isOpenAIConnected && 
            connection.openaiWs && 
            connection.openaiWs.readyState === WebSocket.OPEN) {
          // Forward the message to OpenAI
          // For JSON messages, send as JSON string
          if (data.type === 'input_audio_buffer.append') {
            // Log audio chunks being forwarded (but not the actual audio data to avoid spam)
            if (Math.random() < 0.01) { // Log 1% of audio chunks to avoid spam
              console.log(`📤 Forwarding audio chunk to OpenAI (client ${clientId})`)
            }
          } else {
            console.log(`📤 Forwarding message to OpenAI: ${data.type} (client ${clientId})`)
          }
          connection.openaiWs.send(JSON.stringify(data))
        } else {
          // If not connected yet, check if we're still connecting
          if (connection.apiKey && !connection.isOpenAIConnected) {
            // Still connecting - silently drop audio chunks (they'll be lost anyway)
            // Only show error for non-audio messages
            if (data.type === 'input_audio_buffer.append') {
              // Silently drop audio chunks if not connected yet
              // Don't spam errors for audio chunks during connection
              console.debug(`Dropping audio chunk from client ${clientId} - OpenAI connection not ready yet`)
              return
            } else {
              // For other messages, return error
              console.warn(`Client ${clientId} sent message before OpenAI connection established:`, data.type)
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({
                  type: 'error',
                  error: { 
                    message: 'Not connected to OpenAI. Send auth message first.',
                    details: 'Wait for auth.success before sending messages.'
                  },
                }))
              }
            }
          } else {
            // No auth yet
            console.warn(`Client ${clientId} sent message before authentication:`, data.type)
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'error',
                error: { 
                  message: 'Not connected to OpenAI. Send auth message first.',
                  details: 'Wait for auth.success before sending messages.'
                },
              }))
            }
          }
        }
      }
    } catch (error: any) {
      console.error(`Error handling message from client ${clientId}:`, error)
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: 'error',
          error: { message: error.message || 'Invalid message format' },
        }))
      }
    }
  })
  
  clientWs.on('close', () => {
    console.log(`Client disconnected: ${clientId}`)
    if (connection.openaiWs) {
      connection.openaiWs.close()
    }
    clients.delete(clientId)
  })
  
  clientWs.on('error', (error) => {
    console.error(`Client WebSocket error for ${clientId}:`, error)
  })
})

server.listen(PORT, () => {
  console.log(`WebSocket proxy server running on ws://localhost:${PORT}`)
  console.log(`Connect to: ws://localhost:${PORT}/api/openai-realtime`)
}).on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use. The WebSocket proxy server may already be running.`)
    console.log(`If you want to use a different port, set WS_PROXY_PORT environment variable.`)
    console.log(`Example: WS_PROXY_PORT=3002 npx tsx lib/websocket-proxy.ts`)
    process.exit(1)
  } else {
    console.error('Server error:', error)
    process.exit(1)
  }
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...')
  wss.close(() => {
    server.close(() => {
      process.exit(0)
    })
  })
})

