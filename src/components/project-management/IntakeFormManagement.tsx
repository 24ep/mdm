'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IntakeFormList } from './IntakeFormList'
import { IntakeSubmissionList } from './IntakeSubmissionList'
import { FileText, Inbox } from 'lucide-react'

interface IntakeFormManagementProps {
  spaceId: string
  formId?: string
}

export function IntakeFormManagement({ spaceId, formId }: IntakeFormManagementProps) {
  const [selectedFormId, setSelectedFormId] = useState<string | undefined>(formId)
  const [activeTab, setActiveTab] = useState('forms')

  const handleFormSelect = (formId: string) => {
    setSelectedFormId(formId)
    setActiveTab('submissions')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Intake Forms</h1>
        <p className="text-muted-foreground">
          Create forms for ticket intake and manage submissions
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="forms">
            <FileText className="h-4 w-4 mr-2" />
            Forms
          </TabsTrigger>
          {selectedFormId && (
            <TabsTrigger value="submissions">
              <Inbox className="h-4 w-4 mr-2" />
              Submissions
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="forms" className="mt-6">
          <IntakeFormList
            spaceId={spaceId}
            onFormSelect={handleFormSelect}
          />
        </TabsContent>
        {selectedFormId && (
          <TabsContent value="submissions" className="mt-6">
            <IntakeSubmissionList
              formId={selectedFormId}
              spaceId={spaceId}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

