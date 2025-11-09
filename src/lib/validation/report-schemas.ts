import { z } from 'zod'

export const reportSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  source: z.enum(['BUILT_IN', 'POWER_BI', 'GRAFANA', 'LOOKER_STUDIO']),
  category_id: z.string().uuid().optional().nullable(),
  folder_id: z.string().uuid().optional().nullable(),
  owner: z.string().max(255).optional().nullable(),
  link: z.string().url('Invalid URL').optional().nullable(),
  workspace: z.string().max(255).optional().nullable(),
  embed_url: z.string().url('Invalid URL').optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
  space_ids: z.array(z.string().uuid()).optional(),
})

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  parent_id: z.string().uuid().optional().nullable(),
})

export const folderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  parent_id: z.string().uuid().optional().nullable(),
})

export const powerBIConfigSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  access_type: z.enum(['API', 'SDK', 'EMBED', 'PUBLIC']),
  tenant_id: z.string().optional(),
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
  sdk_config: z.string().optional(),
  embed_url: z.string().url().optional(),
  public_link: z.string().url().optional(),
  is_active: z.boolean().default(true),
})

export const grafanaConfigSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  access_type: z.enum(['SDK', 'EMBED', 'PUBLIC']),
  api_url: z.string().url('Invalid URL').optional(),
  api_key: z.string().optional(),
  embed_url: z.string().url().optional(),
  public_link: z.string().url().optional(),
  is_active: z.boolean().default(true),
})

export const lookerStudioConfigSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  access_type: z.enum(['API', 'PUBLIC']),
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
  refresh_token: z.string().optional(),
  public_link: z.string().url().optional(),
  is_active: z.boolean().default(true),
})

export type ReportFormData = z.infer<typeof reportSchema>
export type CategoryFormData = z.infer<typeof categorySchema>
export type FolderFormData = z.infer<typeof folderSchema>
export type PowerBIConfigFormData = z.infer<typeof powerBIConfigSchema>
export type GrafanaConfigFormData = z.infer<typeof grafanaConfigSchema>
export type LookerStudioConfigFormData = z.infer<typeof lookerStudioConfigSchema>

