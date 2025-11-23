'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Sparkles, 
  Table, 
  BarChart3, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Info
} from 'lucide-react'
import { DataModel } from '@/lib/template-generator'

interface AutoTemplateGeneratorProps {
  dataModel: DataModel
  onTemplatesGenerated?: (templates: any[]) => void
  onClose?: () => void
}

const templateTypes = [
  {
    id: 'entity-table',
    name: 'Entity Table',
    description: 'Full-featured data table with CRUD operations, filtering, sorting, and pagination',
    icon: Table,
    category: 'Entity Management',
    features: ['Data Table', 'Search & Filter', 'Sorting', 'Pagination', 'CRUD Operations'],
    recommended: true
  },
  {
    id: 'dashboard',
    name: 'Analytics Dashboard',
    description: 'Analytics dashboard with charts, metrics, and data visualization',
    icon: BarChart3,
    category: 'Analytics',
    features: ['Charts', 'Metrics', 'Data Visualization', 'KPI Cards'],
    recommended: false
  },
  {
    id: 'form',
    name: 'Data Form',
    description: 'Form template for creating and editing records',
    icon: FileText,
    category: 'Forms',
    features: ['Form Fields', 'Validation', 'Submit Actions', 'Responsive Layout'],
    recommended: false
  }
]

export function AutoTemplateGenerator({ dataModel, onTemplatesGenerated, onClose }: AutoTemplateGeneratorProps) {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>(['entity-table'])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedTemplates, setGeneratedTemplates] = useState<any[]>([])
  const [showSuccess, setShowSuccess] = useState(false)

  const handleTemplateToggle = (templateId: string) => {
    setSelectedTemplates(prev => 
      prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    )
  }

  const handleGenerateTemplates = async () => {
    setIsGenerating(true)
    
    try {
      // Simulate API call to generate templates
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const templates = selectedTemplates.map(templateId => {
        const templateType = templateTypes.find(t => t.id === templateId)
        return {
          id: `${dataModel.id}_${templateId}`,
          name: `${dataModel.display_name} ${templateType?.name}`,
          type: templateId,
          category: templateType?.category,
          dataModelId: dataModel.id,
          generated: true
        }
      })
      
      setGeneratedTemplates(templates)
      setShowSuccess(true)
      onTemplatesGenerated?.(templates)
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose?.()
      }, 3000)
    } catch (error) {
      console.error('Failed to generate templates:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  if (showSuccess) {
    return (
      <Card className="border-primary/30 bg-primary/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-semibold text-primary">Templates Generated Successfully!</h3>
              <p className="text-sm text-primary/80">
                {generatedTemplates.length} template(s) created for {dataModel.display_name}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            {generatedTemplates.map(template => (
              <div key={template.id} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-foreground">{template.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {template.category}
                </Badge>
              </div>
            ))}
          </div>
          
          <p className="text-xs text-primary mt-3">
            You can now use these templates in the Space Studio
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Generate Templates for {dataModel.display_name}</CardTitle>
            <CardDescription>
              Create pre-built templates that replicate the entity page functionality
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Info Banner */}
        <div className="flex items-start gap-3 p-3 bg-primary/10 border border-primary/30 rounded-lg">
          <Info className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="text-primary font-medium">Auto-Generated Templates</p>
            <p className="text-primary/80">
              These templates will replace the traditional entity page implementation with 
              customizable Space Studio layouts that include all the same functionality.
            </p>
          </div>
        </div>

        {/* Template Selection */}
        <div className="space-y-4">
          <h4 className="font-medium">Select Templates to Generate</h4>
          
          <div className="grid gap-3">
            {templateTypes.map(template => {
              const IconComponent = template.icon
              const isSelected = selectedTemplates.includes(template.id)
              
              return (
                <div
                  key={template.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleTemplateToggle(template.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <IconComponent className={`h-5 w-5 ${
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium">{template.name}</h5>
                        {template.recommended && (
                          <Badge variant="secondary" className="text-xs bg-warning/20 text-warning">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {template.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.features.map(feature => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Switch
                      checked={isSelected}
                      onCheckedChange={() => handleTemplateToggle(template.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedTemplates.length} template(s) selected
          </div>
          
          <div className="flex gap-2">
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button 
              onClick={handleGenerateTemplates}
              disabled={selectedTemplates.length === 0 || isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Templates
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
