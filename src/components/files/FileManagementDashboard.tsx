"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  BarChart3, 
  Bell, 
  Settings, 
  Folder,
  Tag,
  Share2,
  Clock,
  HardDrive,
  FileText,
  Users,
  TrendingUp
} from 'lucide-react'
import { FileSearch } from './FileSearch'
import { FileAnalytics } from './FileAnalytics'
import { FileNotifications } from './FileNotifications'
import { FileQuotas } from './FileQuotas'

interface FileManagementDashboardProps {
  spaceId: string
}

export function FileManagementDashboard({ spaceId }: FileManagementDashboardProps) {
  const [activeTab, setActiveTab] = useState('search')

  const tabs = [
    {
      id: 'search',
      label: 'Search & Browse',
      icon: Search,
      description: 'Find and manage files'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Usage insights and trends'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'File activity alerts'
    },
    {
      id: 'quotas',
      label: 'Quotas',
      icon: Settings,
      description: 'Storage limits and settings'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">File Management</h1>
          <p className="text-muted-foreground">
            Comprehensive file management with advanced features
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <HardDrive className="w-3 h-3" />
            <span>Multi-Provider</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Search className="w-3 h-3" />
            <span>Advanced Search</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <BarChart3 className="w-3 h-3" />
            <span>Analytics</span>
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4 GB</div>
            <p className="text-xs text-muted-foreground">
              of 10 GB limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              +3 this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uploads Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">
              +8% from yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Search & Browse Files</h2>
              <p className="text-muted-foreground">
                Find files with advanced search, filtering, and categorization
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Search className="w-3 h-3" />
                <span>Full-Text Search</span>
              </Badge>
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Tag className="w-3 h-3" />
                <span>Tags & Categories</span>
              </Badge>
            </div>
          </div>
          <FileSearch 
            spaceId={spaceId}
            showFilters={true}
            showActions={true}
            allowMultiSelect={true}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">File Analytics</h2>
              <p className="text-muted-foreground">
                Insights into file usage, storage trends, and user activity
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="flex items-center space-x-1">
                <BarChart3 className="w-3 h-3" />
                <span>Usage Trends</span>
              </Badge>
              <Badge variant="secondary" className="flex items-center space-x-1">
                <TrendingUp className="w-3 h-3" />
                <span>Performance</span>
              </Badge>
            </div>
          </div>
          <FileAnalytics spaceId={spaceId} />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">File Notifications</h2>
              <p className="text-muted-foreground">
                Stay updated on file activities, uploads, and system alerts
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Bell className="w-3 h-3" />
                <span>Real-time Alerts</span>
              </Badge>
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Activity History</span>
              </Badge>
            </div>
          </div>
          <FileNotifications spaceId={spaceId} />
        </TabsContent>

        <TabsContent value="quotas" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Storage Quotas</h2>
              <p className="text-muted-foreground">
                Manage storage limits, file restrictions, and usage monitoring
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Settings className="w-3 h-3" />
                <span>Quota Management</span>
              </Badge>
              <Badge variant="secondary" className="flex items-center space-x-1">
                <HardDrive className="w-3 h-3" />
                <span>Storage Control</span>
              </Badge>
            </div>
          </div>
          <FileQuotas spaceId={spaceId} />
        </TabsContent>
      </Tabs>

      {/* Feature Highlights */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced File Management Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Search className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Advanced Search</h3>
                <p className="text-sm text-muted-foreground">
                  Full-text search with filters, tags, and categories
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">Analytics Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  Usage insights, trends, and storage analytics
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium">Smart Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time alerts for file activities and system events
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Settings className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium">Quota Management</h3>
                <p className="text-sm text-muted-foreground">
                  Storage limits, file restrictions, and usage monitoring
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Share2 className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium">File Sharing</h3>
                <p className="text-sm text-muted-foreground">
                  Secure file sharing with permissions and expiration
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Folder className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-medium">File Organization</h3>
                <p className="text-sm text-muted-foreground">
                  Categories, tags, and versioning for better organization
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
