import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  if (!userId || userId !== session.user.id) {
    return new Response('Invalid user ID', { status: 400 });
  }

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const initialMessage = `data: ${JSON.stringify({ type: 'connected', message: 'Connected to notifications' })}\n\n`;
      controller.enqueue(new TextEncoder().encode(initialMessage));

      // Set up database polling for new notifications
      const pollInterval = setInterval(async () => {
        try {
          // Check for new notifications for this user
          const { query } = await import('@/lib/db');
          
          const checkQuery = `
            SELECT 
              id, user_id, type, priority, status, title, message, data, 
              action_url, action_label, expires_at, read_at, created_at, updated_at
            FROM public.notifications 
            WHERE user_id = $1 
            AND status = 'UNREAD' 
            AND created_at > NOW() - INTERVAL '5 seconds'
            ORDER BY created_at DESC
          `;

          const { rows } = await query(checkQuery, [userId]);

          // Send each new notification
          for (const notification of rows) {
            const message = `data: ${JSON.stringify(notification)}\n\n`;
            controller.enqueue(new TextEncoder().encode(message));
          }
        } catch (error) {
          console.error('Error polling notifications:', error);
          const errorMessage = `data: ${JSON.stringify({ type: 'error', message: 'Polling error' })}\n\n`;
          controller.enqueue(new TextEncoder().encode(errorMessage));
        }
      }, 2000); // Poll every 2 seconds

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(pollInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
