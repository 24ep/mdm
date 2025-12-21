import { NextRequest, NextResponse } from 'next/server'

interface Comment {
    id: string
    pluginSlug: string
    author: string
    content: string
    createdAt: string
    rating: number
}

// In-memory store (resets on restart)
// Pre-populate with a few nice comments
const commentsStore: Comment[] = [
    {
        id: 'c1',
        pluginSlug: 'postgresql-management',
        author: 'Sarah Dev',
        content: 'This plugin saved me so much time managing my local Postgres instances. Highly recommended!',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
        rating: 5
    },
    {
        id: 'c2',
        pluginSlug: 'postgresql-management',
        author: 'Mike Johnson',
        content: 'Great UI, but I wish it supported more backup options out of the box.',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
        rating: 4
    }
]

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    const slug = params.slug
    const comments = commentsStore.filter(c => c.pluginSlug === slug)

    // Sort by newest first
    comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ comments })
}

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    try {
        const params = await props.params;
        const slug = params.slug
        const body = await request.json()
        const { author, content, rating } = body

        if (!author || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const newComment: Comment = {
            id: Math.random().toString(36).substring(7),
            pluginSlug: slug,
            author,
            content,
            createdAt: new Date().toISOString(),
            rating: rating || 5
        }

        commentsStore.push(newComment)

        return NextResponse.json({ comment: newComment }, { status: 201 })
    } catch (error) {
        console.error('Error creating comment:', error)
        return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }
}
