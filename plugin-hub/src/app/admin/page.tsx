'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Plugin {
  id: string
  name: string
  slug: string
  version: string
  status: string
  verified: boolean
}

export default function AdminPage() {
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
          Plugin Hub Admin
        </h1>
        <p style={{ color: '#666' }}>
          Manage plugins in the hub
        </p>
      </header>

      <nav style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{ padding: '0.5rem 1rem', background: '#666', color: 'white', textDecoration: 'none', borderRadius: '4px', marginRight: '0.5rem' }}>
          ← Back to Hub
        </Link>
      </nav>

      <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Plugins in Hub</h2>
        
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Slug</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Version</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Verified</th>
              </tr>
            </thead>
            <tbody>
              {plugins.map(plugin => (
                <tr key={plugin.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.75rem' }}>{plugin.name}</td>
                  <td style={{ padding: '0.75rem' }}>{plugin.slug}</td>
                  <td style={{ padding: '0.75rem' }}>{plugin.version}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      background: plugin.status === 'approved' ? '#4caf50' : '#ff9800',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '0.8rem'
                    }}>
                      {plugin.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {plugin.verified ? '✓' : '✗'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {plugins.length === 0 && !loading && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            No plugins found. Add plugins to the <code>plugins/</code> directory.
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>How to Add Plugins</h3>
        <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>Create a directory in <code>plugins/</code> with your plugin slug</li>
          <li>Add a <code>plugin.ts</code> file with your plugin definition</li>
          <li>Add any components in a <code>components/</code> subdirectory</li>
          <li>Restart the hub server to see your plugin</li>
        </ol>
      </div>
    </div>
  )
}

