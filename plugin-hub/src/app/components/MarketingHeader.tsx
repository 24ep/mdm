'use client'

import Link from 'next/link'
import { icons } from './icons'

export function MarketingHeader() {
    return (
        <header style={{
            background: 'linear-gradient(to bottom, rgba(15, 15, 20, 0.9), rgba(15, 15, 20, 0.7))',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>
                    {/* Logo */}
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                background: 'var(--primary-gradient)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'hsl(var(--primary-foreground))',
                            }}>
                                <icons.package style={{ width: '20px', height: '20px' }} />
                            </div>
                            <span style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff' }}>
                                MDM Plugin Hub
                            </span>
                        </div>
                    </Link>
                    {/* Nav Links */}
                    <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                        <Link
                            href="/plugins"
                            style={{
                                fontSize: '14px',
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontWeight: 500,
                                textDecoration: 'none',
                                transition: 'color 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
                        >
                            Plugins
                        </Link>
                        <Link
                            href="/features"
                            style={{
                                fontSize: '14px',
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontWeight: 500,
                                textDecoration: 'none',
                                transition: 'color 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
                        >
                            Features
                        </Link>
                        <Link
                            href="/pricing"
                            style={{
                                fontSize: '14px',
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontWeight: 500,
                                textDecoration: 'none',
                                transition: 'color 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
                        >
                            Pricing
                        </Link>
                        <Link
                            href="/community"
                            style={{
                                fontSize: '14px',
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontWeight: 500,
                                textDecoration: 'none',
                                transition: 'color 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
                        >
                            Community
                        </Link>
                        {['Solutions', 'Integrations', 'Docs'].map((item) => (
                            <Link
                                key={item}
                                href="#"
                                style={{
                                    fontSize: '14px',
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    fontWeight: 500,
                                    textDecoration: 'none',
                                    transition: 'color 0.15s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
                            >
                                {item}
                            </Link>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: 'pointer',
                        }}>
                            Sign In
                        </button>
                        <button style={{
                            padding: '10px 20px',
                            background: 'var(--primary-gradient)',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            color: 'hsl(var(--primary-foreground))',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'transform 0.15s ease',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}>
                            Get Started
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}
