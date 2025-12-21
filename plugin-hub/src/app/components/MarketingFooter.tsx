'use client'

import Link from 'next/link'
import { icons } from './icons'

export function MarketingFooter() {
    const columns = [
        {
            title: 'Product',
            links: ['Features', 'Integrations', 'Pricing', 'Changelog', 'Docs']
        },
        {
            title: 'Company',
            links: ['About', 'Blog', 'Careers', 'Customers', 'Brand']
        },
        {
            title: 'Resources',
            links: ['Community', 'Help Center', 'Partners', 'Status', 'Contact']
        },
        {
            title: 'Legal',
            links: ['Privacy', 'Terms', 'Security', 'Compliance']
        }
    ]

    return (
        <footer style={{
            background: 'hsl(var(--background))',
            borderTop: '1px solid hsl(var(--border))',
            padding: '80px 24px 40px',
        }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                    gap: '64px',
                    marginBottom: '80px'
                }}>
                    {/* Brand Column */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                background: 'var(--primary-gradient)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'hsl(var(--primary-foreground))',
                            }}>
                                <icons.package style={{ width: '18px', height: '18px' }} />
                            </div>
                            <span style={{ fontSize: '16px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                                MDM Plugin Hub
                            </span>
                        </div>
                        <p style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))', lineHeight: '1.6', maxWidth: '280px' }}>
                            The unified platform for managing your data plugins, templates, and analytics integrations. Secure, fast, and reliable.
                        </p>
                    </div>

                    {/* Link Columns */}
                    {columns.map((col) => (
                        <div key={col.title}>
                            <h4 style={{
                                fontSize: '14px',
                                fontWeight: 600,
                                color: 'hsl(var(--foreground))',
                                marginBottom: '20px'
                            }}>
                                {col.title}
                            </h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {col.links.map((link) => (
                                    <li key={link}>
                                        <Link
                                            href="#"
                                            style={{
                                                fontSize: '14px',
                                                color: 'hsl(var(--muted-foreground))',
                                                textDecoration: 'none',
                                                transition: 'color 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = 'hsl(var(--foreground))'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = 'hsl(var(--muted-foreground))'}
                                        >
                                            {link}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div style={{
                    borderTop: '1px solid hsl(var(--border))',
                    paddingTop: '32px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '24px'
                }}>
                    <div style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>
                        © 2024 MDM Plugin Hub. All rights reserved.
                    </div>
                    <div style={{ display: 'flex', gap: '24px' }}>
                        {/* Social Icons would go here */}
                        <span style={{ color: 'hsl(var(--muted-foreground))', cursor: 'pointer' }}><icons.globe style={{ width: '20px', height: '20px' }} /></span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
