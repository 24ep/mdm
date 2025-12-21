'use client'

import { icons } from './icons'

export function MarketingFeatures() {
    const features = [
        {
            icon: 'zap',
            title: 'Lightning Fast',
            description: 'Optimized for speed. Install plugins and deploy templates in seconds.'
        },
        {
            icon: 'shield',
            title: 'Enterprise Security',
            description: 'All plugins are scanned and verified for security and compliance.'
        },
        {
            icon: 'globe',
            title: 'Global Integration',
            description: 'Connect with tools and services from around the world effortlessly.'
        }
    ]

    return (
        <section style={{
            padding: '80px 24px',
            background: 'hsl(var(--background))',
            borderBottom: '1px solid hsl(var(--border))'
        }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '32px'
                }}>
                    {features.map((feature, i) => (
                        <div key={i} style={{
                            padding: '32px',
                            background: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius-lg)',
                            transition: 'transform 0.15s ease',
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: 'var(--primary-gradient)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'hsl(var(--primary-foreground))',
                                marginBottom: '24px'
                            }}>
                                {(() => {
                                    const Icon = icons[feature.icon as keyof typeof icons]
                                    return <Icon style={{ width: '24px', height: '24px' }} />
                                })()}
                            </div>
                            <h3 style={{
                                fontSize: '20px',
                                fontWeight: 600,
                                color: 'hsl(var(--foreground))',
                                marginBottom: '12px'
                            }}>
                                {feature.title}
                            </h3>
                            <p style={{
                                fontSize: '16px',
                                color: 'hsl(var(--muted-foreground))',
                                lineHeight: '1.6'
                            }}>
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
