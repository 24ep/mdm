"use client"

import { useState } from 'react'
import { AttachmentManager } from '@/components/ui/attachment-manager'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AttachmentTest() {
  const [spaceId, setSpaceId] = useState('')
  const [attributeId, setAttributeId] = useState('')
  const [testMode, setTestMode] = useState(false)

  const startTest = () => {
    if (spaceId && attributeId) {
      setTestMode(true)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Attachment Infrastructure Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!testMode ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="spaceId">Space ID</Label>
                <Input
                  id="spaceId"
                  value={spaceId}
                  onChange={(e) => setSpaceId(e.target.value)}
                  placeholder="Enter space ID"
                />
              </div>
              <div>
                <Label htmlFor="attributeId">Attribute ID</Label>
                <Input
                  id="attributeId"
                  value={attributeId}
                  onChange={(e) => setAttributeId(e.target.value)}
                  placeholder="Enter attribute ID"
                />
              </div>
              <Button onClick={startTest} disabled={!spaceId || !attributeId}>
                Start Test
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Attachment Manager Test</h3>
                <Button variant="outline" onClick={() => setTestMode(false)}>
                  Reset
                </Button>
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>Space ID:</strong> {spaceId}</p>
                <p><strong>Attribute ID:</strong> {attributeId}</p>
              </div>

              <AttachmentManager
                spaceId={spaceId}
                attributeId={attributeId}
                maxFiles={5}
                maxFileSizeMB={10}
                allowedFileTypes={['jpg', 'jpeg', 'png', 'pdf', 'txt', 'doc', 'docx']}
                onAttachmentsChange={(attachments) => {
                  console.log('Attachments changed:', attachments)
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>To test the attachment infrastructure:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Get a valid Space ID from your database</li>
              <li>Create an attribute with type "attachment" in that space</li>
              <li>Use the attribute ID in the test</li>
              <li>Try uploading different file types</li>
              <li>Test file preview, download, and delete</li>
            </ol>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-800">Note:</p>
              <p className="text-blue-700 text-xs">
                Make sure you have configured storage settings in Space Settings → Attachments 
                before testing file uploads.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
