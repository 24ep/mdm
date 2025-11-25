'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Plugin {
  id: string
  name: string
  slug: string
  description?: string
  version: string
  provider: string
  category: string
  status: string
  verified: boolean
}

export default function HubHome() {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/plugins')
      .then(res => res.json())
      .then(data => {
        setPlugins(data.plugins || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching plugins:', err)
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          MDM Plugin Hub
        </h1>
        <p style={{ color: '#666' }}>
          Plugin repository for MDM Marketplace
        </p>
      </header>

      <nav style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <Link href="/" style={{ padding: '0.5rem 1rem', background: '#0070f3', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
          Home
        </Link>
        <Link href="/admin" style={{ padding: '0.5rem 1rem', background: '#666', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
          Admin
        </Link>
      </nav>

      {loading ? (
        <div>Loading plugins...</div>
      ) : (
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Available Plugins ({plugins.length})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {plugins.map(plugin => (
              <div
                key={plugin.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '1rem',
                  background: 'white',
                }}
              >
                <h3 style={{ marginBottom: '0.5rem' }}>{plugin.name}</h3>
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  {plugin.description || 'No description'}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                  <span style={{ padding: '0.25rem 0.5rem', background: '#f0f0f0', borderRadius: '4px', fontSize: '0.8rem' }}>
                    v{plugin.version}
                  </span>
                  <span style={{ padding: '0.25rem 0.5rem', background: '#f0f0f0', borderRadius: '4px', fontSize: '0.8rem' }}>
                    {plugin.category}
                  </span>
                  {plugin.verified && (
                    <span style={{ padding: '0.25rem 0.5rem', background: '#4caf50', color: 'white', borderRadius: '4px', fontSize: '0.8rem' }}>
                      Verified
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

