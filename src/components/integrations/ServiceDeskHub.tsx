'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { JiraIntegration } from './JiraIntegration'
import { ESMPortalIntegration } from './ESMPortalIntegration'
import { ITSMIntegration } from './ITSMIntegration'
import { Settings, ExternalLink } from 'lucide-react'

interface ServiceDeskHubProps {
  spaceId: string
}

export function ServiceDeskHub({ spaceId }: ServiceDeskHubProps) {
  const [activeTab, setActiveTab] = useState('jira')

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Service Desk Integrations
          </CardTitle>
          <CardDescription>
            Connect and configure service desk platforms to sync tickets and manage workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="jira">Jira</TabsTrigger>
              <TabsTrigger value="esm-portal">ESM Portal</TabsTrigger>
              <TabsTrigger value="itsm">ITSM</TabsTrigger>
            </TabsList>

            <TabsContent value="jira" className="mt-6">
              <JiraIntegration spaceId={spaceId} />
            </TabsContent>

            <TabsContent value="esm-portal" className="mt-6">
              <ESMPortalIntegration spaceId={spaceId} />
            </TabsContent>

            <TabsContent value="itsm" className="mt-6">
              <ITSMIntegration spaceId={spaceId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

