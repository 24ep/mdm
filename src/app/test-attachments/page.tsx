import { AttachmentTest } from '@/components/test/attachment-test'
import { DataModelRecordForm } from '@/components/forms/data-model-record-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { FileText, Database, Settings } from 'lucide-react'

export default function TestAttachmentsPage() {
  // Sample data for testing
  const sampleSpaceId = "1e63695c-16ee-4129-b0b6-3b4f792928c4"
  const sampleDataModel = {
    id: "sample-model-1",
    name: "Sample Data Model",
    attributes: [
      {
        id: "attr-1",
        code: "name",
        label: "Name",
        type: "text",
        required: true
      },
      {
        id: "attr-2",
        code: "description",
        label: "Description",
        type: "textarea",
        required: false
      },
      {
        id: "attr-3",
        code: "attachments",
        label: "Attachments",
        type: "attachment",
        required: false,
        allowed_file_types: ["image/*", "application/pdf", "text/*"],
        max_file_size: 10485760, // 10MB
        allow_multiple_files: true
      }
    ]
  }

  const handleSave = async (data: any) => {
    console.log('Saving record:', data)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const handleCancel = () => {
    console.log('Cancelled')
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Attachment Infrastructure Test</h1>
        <p className="text-muted-foreground">
          Test the complete attachment system with file uploads, storage, and data model integration
        </p>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Basic Test</span>
          </TabsTrigger>
          <TabsTrigger value="integration" className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Data Model Integration</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Storage Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Basic Attachment Test</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AttachmentTest />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Data Model Integration Test</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">Space ID: {sampleSpaceId}</Badge>
                <Badge variant="secondary">Model: {sampleDataModel.name}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <DataModelRecordForm
                spaceId={sampleSpaceId}
                dataModel={sampleDataModel}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Storage Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Storage Setup Instructions</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Go to Space Settings → Attachments tab</li>
                  <li>Select your storage provider (MinIO recommended)</li>
                  <li>Configure connection settings</li>
                  <li>Test the connection</li>
                  <li>Save the configuration</li>
                </ol>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">Quick MinIO Setup</h3>
                <div className="text-sm text-green-800 space-y-1">
                  <p>Run this command to start MinIO:</p>
                  <code className="block p-2 bg-green-100 rounded text-xs">
                    docker run -p 9000:9000 -p 9001:9001 -e "MINIO_ROOT_USER=minioadmin" -e "MINIO_ROOT_PASSWORD=minioadmin" minio/minio server /data --console-address ":9001"
                  </code>
                  <p>Then access MinIO Console at <a href="http://localhost:9001" target="_blank" className="underline">http://localhost:9001</a></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
