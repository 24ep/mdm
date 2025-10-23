// PostgREST client configuration
// This file has been updated to use PostgREST instead of Supabase

export function createClient() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  if (!apiUrl) {
    throw new Error('Missing NEXT_PUBLIC_API_URL')
  }

  // Return a simple fetch-based client for PostgREST
  return {
    from: (table: string) => ({
      select: (columns = '*') => ({
        eq: (column: string, value: any) => ({
          single: () => fetch(`${apiUrl}/${table}?${column}=eq.${value}&select=${columns}`).then(res => res.json()),
          then: (callback: any) => fetch(`${apiUrl}/${table}?${column}=eq.${value}&select=${columns}`).then(res => res.json()).then(callback)
        }),
        then: (callback: any) => fetch(`${apiUrl}/${table}?select=${columns}`).then(res => res.json()).then(callback)
      }),
      insert: (data: any) => ({
        then: (callback: any) => fetch(`${apiUrl}/${table}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).then(res => res.json()).then(callback)
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          then: (callback: any) => fetch(`${apiUrl}/${table}?${column}=eq.${value}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          }).then(res => res.json()).then(callback)
        })
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({
          then: (callback: any) => fetch(`${apiUrl}/${table}?${column}=eq.${value}`, {
            method: 'DELETE'
          }).then(res => res.json()).then(callback)
        })
      })
    })
  }
}


