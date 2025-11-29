import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }}

export const POST = withErrorHandling(postHandler, '

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }}

    const { id: bucketId } = await params
    const { name, path } = await request.json()

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Folder name is required' }}

    // Validate folder name (no slashes, no special characters that could break paths)
    const sanitizedName = name.trim()
    if (sanitizedName.includes('/') || sanitizedName.includes('\\')) {
      return NextResponse.json({ 
        error: 'Folder name cannot contain slashes' 
      }}

    // Verify bucket (space) exists
    const space = await db.space.findUnique({
      where: { id: bucketId }
    })

    if (!space) {
      return NextResponse.json({ error: 'Bucket not found' }}

    // Construct full folder path
    const folderPath = path && path.trim() 
      ? `${path.trim()}/${sanitizedName}`.replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
      : sanitizedName

    // Check if folder already exists by checking if any file has this exact path as prefix
    const existingFile = await db.spaceAttachmentStorage.findFirst({
      where: {
        spaceId: bucketId,
        filePath: {
          startsWith: folderPath + '/'
        }
      }
    })

    if (existingFile) {
      return NextResponse.json({ 
        error: 'A folder or file with this name already exists' 
      }}

    // Check if a file exists with this exact path
    const exactFile = await db.spaceAttachmentStorage.findFirst({
      where: {
        spaceId: bucketId,
        filePath: folderPath
      }
    })

    if (exactFile) {
      return NextResponse.json({ 
        error: 'A file with this path already exists' 
      }}

    // Create a placeholder marker file to represent the folder
    // In a real implementation, you might want a separate folders table
    // For now, we'll create a hidden marker file
    const folderMarkerId = randomUUID()
    
    // Note: This is a simplified approach. In production, you'd want:
    // 1. A separate folders table, OR
    // 2. Use a special file with mimeType 'folder' or type field
    
    // We'll store it as a special entry with mimeType 'folder'
    await db.spaceAttachmentStorage.create({
      data: {
        id: folderMarkerId,
        spaceId: bucketId,
        fileName: sanitizedName,
        filePath: folderPath,
        mimeType: 'folder',
        fileSize: 0,
        createdAt: new Date()
      }
    })

    return NextResponse.json({
      folder: {
        id: folderMarkerId,
        name: sanitizedName,
        path: folderPath,
        type: 'folder',
        createdAt: new Date()
      }
    })

