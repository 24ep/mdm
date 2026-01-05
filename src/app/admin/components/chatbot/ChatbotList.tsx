'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Edit,
  Trash2,
  Eye,
  Rocket,
  GitBranch,
  History,
  Globe,
  MessageSquare,
  Copy,
  Download,
} from 'lucide-react'
import { Chatbot, ChatbotVersion } from './types'
import { ChatbotAvatar } from './ChatbotAvatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical } from 'lucide-react'

interface ChatbotListProps {
  chatbots: Chatbot[]
  viewMode: 'table' | 'card' | 'list'
  onEdit: (chatbot: Chatbot) => void
  onDelete: (id: string) => void
  onPublish: (chatbot: Chatbot) => void
  onPreview: (chatbot: Chatbot) => void
  onViewVersions: (chatbot: Chatbot) => void
  onDuplicate?: (chatbot: Chatbot) => void
  onExport?: (chatbot: Chatbot) => void
}

export function ChatbotList({
  chatbots,
  viewMode,
  onEdit,
  onDelete,
  onPublish,
  onPreview,
  onViewVersions,
  onDuplicate,
  onExport,
}: ChatbotListProps) {
  if (chatbots.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No chatbots found. Create your first chatbot to get started.</p>
        </CardContent>
      </Card>
    )
  }

  if (viewMode === 'table') {
    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chatbots.map(chatbot => (
                <TableRow 
                  key={chatbot.id}
                  className="cursor-pointer"
                  onClick={() => onEdit(chatbot)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <ChatbotAvatar chatbot={chatbot} size="md" />
                      <div className="flex flex-col">
                        <span className="font-medium">{chatbot.name}</span>
                        {chatbot.description && (
                          <span className="text-xs text-muted-foreground mt-0.5">{chatbot.description}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{chatbot.website || '—'}</TableCell>
                  <TableCell>v{chatbot.currentVersion}</TableCell>
                  <TableCell>
                    {chatbot.isPublished ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onPreview(chatbot)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onEdit(chatbot) }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onPublish(chatbot) }}
                        disabled={chatbot.isPublished}
                      >
                        <Rocket className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onViewVersions(chatbot)
                        }}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      {(onDuplicate || onExport) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onDuplicate && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDuplicate(chatbot)
                                }}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                            )}
                            {onExport && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onExport(chatbot)
                                }}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Export
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onDelete(chatbot.id) }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  if (viewMode === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chatbots.map(chatbot => (
          <Card 
            key={chatbot.id} 
            className="relative cursor-pointer h-full flex flex-col"
            role="button"
            tabIndex={0}
            onClick={() => onEdit(chatbot)}
            onKeyDown={(e) => { if (e.key === 'Enter') onEdit(chatbot) }}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <ChatbotAvatar chatbot={chatbot} size="lg" />
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg">{chatbot.name}</CardTitle>
                    {chatbot.description && (
                      <p className="text-xs text-muted-foreground mt-1">{chatbot.description}</p>
                    )}
                    {chatbot.website && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        <span className="truncate">{chatbot.website}</span>
                      </div>
                    )}
                  </div>
                </div>
                {chatbot.isPublished ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                    Published
                  </Badge>
                ) : (
                  <Badge variant="secondary">Draft</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <GitBranch className="h-4 w-4" />
                  <span>v{chatbot.currentVersion}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onPreview(chatbot)
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onEdit(chatbot) }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onPublish(chatbot) }}
                  disabled={chatbot.isPublished}
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Publish
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewVersions(chatbot)
                  }}
                >
                  <History className="h-4 w-4 mr-2" />
                  Versions
                </Button>
                {(onDuplicate || onExport) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onDuplicate && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            onDuplicate(chatbot)
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                      )}
                      {onExport && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            onExport(chatbot)
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onDelete(chatbot.id) }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-2">
      {chatbots.map(chatbot => (
        <Card 
          key={chatbot.id} 
          className="relative cursor-pointer hover:bg-muted/50"
          role="button"
          tabIndex={0}
          onClick={() => onEdit(chatbot)}
          onKeyDown={(e) => { if (e.key === 'Enter') onEdit(chatbot) }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <ChatbotAvatar chatbot={chatbot} size="md" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{chatbot.name}</CardTitle>
                    {chatbot.isPublished ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </div>
                  {chatbot.description && (
                    <p className="text-xs text-gray-500 mt-1">{chatbot.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    {chatbot.website && (
                      <>
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          <span>{chatbot.website}</span>
                        </div>
                        <span>•</span>
                      </>
                    )}
                    <span>v{chatbot.currentVersion}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onPreview(chatbot)
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onEdit(chatbot) }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onPublish(chatbot) }}
                  disabled={chatbot.isPublished}
                >
                  <Rocket className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewVersions(chatbot)
                  }}
                >
                  <History className="h-4 w-4" />
                </Button>
                {(onDuplicate || onExport) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onDuplicate && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            onDuplicate(chatbot)
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                      )}
                      {onExport && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            onExport(chatbot)
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onDelete(chatbot.id) }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

