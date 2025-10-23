/**
 * EAV (Entity-Attribute-Value) Utility Functions
 * Provides helper functions for working with the enhanced EAV pattern
 */

import { query } from '@/lib/db'

export interface EavEntity {
  id: string
  entityTypeId: string
  externalId?: string
  isActive: boolean
  metadata?: any
  createdBy?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface EavAttribute {
  id: string
  name: string
  displayName: string
  description?: string
  entityTypeId: string
  attributeGroupId?: string
  dataType: string
  cardinality: string
  scope: string
  isRequired: boolean
  isUnique: boolean
  isIndexed: boolean
  isSearchable: boolean
  isAuditable: boolean
  defaultValue?: string
  options?: any
  validationRules?: any
  sortOrder: number
  isVisible: boolean
  isEditable: boolean
  helpText?: string
  placeholder?: string
  referenceEntityTypeId?: string
  referenceDisplayField?: string
  isAutoIncrement: boolean
  autoIncrementPrefix: string
  autoIncrementSuffix: string
  autoIncrementStart: number
  autoIncrementPadding: number
  currentAutoIncrementValue: number
  externalColumn?: string
  externalMapping?: any
  metadata?: any
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface EavValue {
  id: string
  entityId: string
  attributeId: string
  textValue?: string
  numberValue?: number
  booleanValue?: boolean
  dateValue?: string
  datetimeValue?: string
  jsonValue?: any
  blobValue?: Buffer
  createdAt: string
  updatedAt: string
}

export interface EntityType {
  id: string
  name: string
  displayName: string
  description?: string
  parentId?: string
  isAbstract: boolean
  isActive: boolean
  sortOrder: number
  metadata?: any
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface AttributeGroup {
  id: string
  name: string
  displayName: string
  description?: string
  entityTypeId: string
  sortOrder: number
  isCollapsible: boolean
  isRequired: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Get entity values as key-value pairs
 */
export async function getEntityValues(entityId: string): Promise<Record<string, any>> {
  const { rows } = await query(`
    SELECT 
      a.name as attribute_name,
      COALESCE(
        v.text_value,
        v.number_value::TEXT,
        v.boolean_value::TEXT,
        v.date_value::TEXT,
        v.datetime_value::TEXT,
        v.json_value::TEXT
      ) as value,
      a.data_type
    FROM eav_attributes a
    LEFT JOIN eav_values v ON v.attribute_id = a.id AND v.entity_id = $1
    WHERE a.is_active = TRUE
    ORDER BY a.sort_order, a.name
  `, [entityId])

  const result: Record<string, any> = {}
  for (const row of rows) {
    result[row.attribute_name] = {
      value: row.value,
      dataType: row.data_type
    }
  }
  return result
}

/**
 * Set entity value with proper type handling
 */
export async function setEntityValue(
  entityId: string,
  attributeId: string,
  value: any,
  dataType: string
): Promise<void> {
  const valueParams: any = {
    textValue: null,
    numberValue: null,
    booleanValue: null,
    dateValue: null,
    datetimeValue: null,
    jsonValue: null,
    blobValue: null
  }

  // Set the appropriate value column based on data type
  switch (dataType.toUpperCase()) {
    case 'TEXT':
    case 'EMAIL':
    case 'PHONE':
    case 'URL':
    case 'TEXTAREA':
    case 'SELECT':
    case 'MULTI_SELECT':
    case 'USER':
    case 'USER_MULTI':
      valueParams.textValue = value
      break
    case 'NUMBER':
    case 'CURRENCY':
    case 'PERCENTAGE':
      valueParams.numberValue = parseFloat(value)
      break
    case 'BOOLEAN':
      valueParams.booleanValue = Boolean(value)
      break
    case 'DATE':
      valueParams.dateValue = value
      break
    case 'DATETIME':
    case 'TIMESTAMP':
      valueParams.datetimeValue = value
      break
    case 'JSON':
      valueParams.jsonValue = typeof value === 'string' ? JSON.parse(value) : value
      break
    case 'BLOB':
    case 'FILE':
      valueParams.blobValue = value
      break
    default:
      valueParams.textValue = value
  }

  await query(`
    INSERT INTO eav_values (
      entity_id, attribute_id, text_value, number_value, boolean_value,
      date_value, datetime_value, json_value, blob_value
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (entity_id, attribute_id) 
    DO UPDATE SET
      text_value = EXCLUDED.text_value,
      number_value = EXCLUDED.number_value,
      boolean_value = EXCLUDED.boolean_value,
      date_value = EXCLUDED.date_value,
      datetime_value = EXCLUDED.datetime_value,
      json_value = EXCLUDED.json_value,
      blob_value = EXCLUDED.blob_value,
      updated_at = NOW()
  `, [
    entityId,
    attributeId,
    valueParams.textValue,
    valueParams.numberValue,
    valueParams.booleanValue,
    valueParams.dateValue,
    valueParams.datetimeValue,
    valueParams.jsonValue ? JSON.stringify(valueParams.jsonValue) : null,
    valueParams.blobValue
  ])
}

/**
 * Validate entity values against attribute constraints
 */
export async function validateEntityValues(entityId: string): Promise<{
  isValid: boolean
  errors: Array<{ attributeName: string; error: string }>
}> {
  const { rows } = await query(`
    SELECT 
      a.name as attribute_name,
      a.is_required,
      a.is_unique,
      a.data_type,
      v.id as value_id,
      v.text_value,
      v.number_value,
      v.boolean_value,
      v.date_value,
      v.datetime_value
    FROM eav_attributes a
    LEFT JOIN eav_values v ON v.attribute_id = a.id AND v.entity_id = $1
    WHERE a.is_active = TRUE
  `, [entityId])

  const errors: Array<{ attributeName: string; error: string }> = []

  for (const row of rows) {
    // Check required fields
    if (row.is_required && !row.value_id) {
      errors.push({
        attributeName: row.attribute_name,
        error: 'Required field is missing'
      })
    }

    // Check uniqueness
    if (row.is_unique && row.value_id) {
      const value = row.text_value || row.number_value || row.boolean_value || row.date_value || row.datetime_value
      if (value !== null) {
        const { rows: duplicateRows } = await query(`
          SELECT COUNT(*) as count
          FROM eav_values v2
          JOIN eav_entities e2 ON v2.entity_id = e2.id
          WHERE v2.attribute_id = $1
          AND v2.entity_id != $2
          AND e2.entity_type_id = (SELECT entity_type_id FROM eav_entities WHERE id = $2)
          AND (
            (v2.text_value = $3 AND $3 IS NOT NULL) OR
            (v2.number_value = $4 AND $4 IS NOT NULL) OR
            (v2.boolean_value = $5 AND $5 IS NOT NULL) OR
            (v2.date_value = $6 AND $6 IS NOT NULL) OR
            (v2.datetime_value = $7 AND $7 IS NOT NULL)
          )
        `, [
          row.attribute_id,
          entityId,
          row.text_value,
          row.number_value,
          row.boolean_value,
          row.date_value,
          row.datetime_value
        ])

        if (parseInt(duplicateRows[0].count) > 0) {
          errors.push({
            attributeName: row.attribute_name,
            error: 'Value must be unique'
          })
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get entity with all its values
 */
export async function getEntityWithValues(entityId: string): Promise<{
  entity: EavEntity
  values: Record<string, any>
}> {
  const { rows: entityRows } = await query(`
    SELECT * FROM eav_entities WHERE id = $1
  `, [entityId])

  if (entityRows.length === 0) {
    throw new Error('Entity not found')
  }

  const values = await getEntityValues(entityId)

  return {
    entity: entityRows[0],
    values
  }
}

/**
 * Create entity with values
 */
export async function createEntityWithValues(
  entityTypeId: string,
  values: Record<string, any>,
  externalId?: string,
  metadata?: any,
  createdBy?: string
): Promise<EavEntity> {
  // Create entity
  const { rows: entityRows } = await query(`
    INSERT INTO eav_entities (
      entity_type_id, external_id, metadata, created_by, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    RETURNING *
  `, [
    entityTypeId,
    externalId || null,
    JSON.stringify(metadata || {}),
    createdBy || null
  ])

  const entity = entityRows[0]

  // Get attributes for this entity type
  const { rows: attributes } = await query(`
    SELECT id, name, data_type FROM eav_attributes 
    WHERE entity_type_id = $1 AND is_active = TRUE
  `, [entityTypeId])

  // Set values
  for (const [attributeName, value] of Object.entries(values)) {
    const attribute = attributes.find(attr => attr.name === attributeName)
    if (attribute) {
      await setEntityValue(entity.id, attribute.id, value, attribute.data_type)
    }
  }

  return entity
}

/**
 * Search entities by attribute values
 */
export async function searchEntities(
  entityTypeId: string,
  searchCriteria: Record<string, any>,
  limit: number = 50,
  offset: number = 0
): Promise<{ entities: EavEntity[]; total: number }> {
  const whereConditions: string[] = ['ee.entity_type_id = $1', 'ee.is_active = TRUE']
  const params: any[] = [entityTypeId]
  let paramCount = 1

  for (const [attributeName, searchValue] of Object.entries(searchCriteria)) {
    if (searchValue === null || searchValue === undefined) continue

    paramCount++
    whereConditions.push(`
      EXISTS (
        SELECT 1 FROM eav_values v
        JOIN eav_attributes a ON a.id = v.attribute_id
        WHERE v.entity_id = ee.id
        AND a.name = $${paramCount}
        AND (
          v.text_value ILIKE $${paramCount + 1} OR
          v.number_value = $${paramCount + 2} OR
          v.boolean_value = $${paramCount + 3} OR
          v.date_value = $${paramCount + 4} OR
          v.datetime_value = $${paramCount + 5}
        )
      )
    `)
    params.push(attributeName, `%${searchValue}%`, searchValue, searchValue, searchValue, searchValue)
    paramCount += 5
  }

  // Get total count
  const { rows: countRows } = await query(`
    SELECT COUNT(*) as total
    FROM eav_entities ee
    WHERE ${whereConditions.join(' AND ')}
  `, params)

  // Get entities
  const { rows: entityRows } = await query(`
    SELECT ee.*
    FROM eav_entities ee
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY ee.created_at DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `, [...params, limit, offset])

  return {
    entities: entityRows,
    total: parseInt(countRows[0].total)
  }
}

/**
 * Get attribute groups for an entity type
 */
export async function getAttributeGroups(entityTypeId: string): Promise<AttributeGroup[]> {
  const { rows } = await query(`
    SELECT * FROM attribute_groups 
    WHERE entity_type_id = $1 
    ORDER BY sort_order ASC, name ASC
  `, [entityTypeId])

  return rows
}

/**
 * Create attribute group
 */
export async function createAttributeGroup(
  name: string,
  displayName: string,
  entityTypeId: string,
  description?: string,
  sortOrder: number = 0,
  isCollapsible: boolean = true,
  isRequired: boolean = false
): Promise<AttributeGroup> {
  const { rows } = await query(`
    INSERT INTO attribute_groups (
      name, display_name, entity_type_id, description, sort_order, 
      is_collapsible, is_required, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    RETURNING *
  `, [
    name,
    displayName,
    entityTypeId,
    description || null,
    sortOrder,
    isCollapsible,
    isRequired
  ])

  return rows[0]
}

/**
 * Get entity type hierarchy
 */
export async function getEntityTypeHierarchy(entityTypeId: string): Promise<EntityType[]> {
  const { rows } = await query(`
    WITH RECURSIVE hierarchy AS (
      SELECT * FROM entity_types WHERE id = $1
      UNION ALL
      SELECT et.* FROM entity_types et
      JOIN hierarchy h ON et.id = h.parent_id
    )
    SELECT * FROM hierarchy ORDER BY sort_order ASC, display_name ASC
  `, [entityTypeId])

  return rows
}

/**
 * Get inherited attributes for an entity type
 */
export async function getInheritedAttributes(entityTypeId: string): Promise<EavAttribute[]> {
  const { rows } = await query(`
    WITH RECURSIVE hierarchy AS (
      SELECT * FROM entity_types WHERE id = $1
      UNION ALL
      SELECT et.* FROM entity_types et
      JOIN hierarchy h ON et.parent_id = h.id
    )
    SELECT DISTINCT a.*
    FROM eav_attributes a
    JOIN hierarchy h ON a.entity_type_id = h.id
    WHERE a.is_active = TRUE
    ORDER BY a.sort_order ASC, a.name ASC
  `, [entityTypeId])

  return rows
}

/**
 * Export entity data to JSON
 */
export async function exportEntityData(entityId: string): Promise<any> {
  const { entity, values } = await getEntityWithValues(entityId)
  
  // Get entity type info
  const { rows: entityTypeRows } = await query(`
    SELECT * FROM entity_types WHERE id = $1
  `, [entity.entityTypeId])

  return {
    entity,
    entityType: entityTypeRows[0],
    values,
    exportedAt: new Date().toISOString()
  }
}

/**
 * Import entity data from JSON
 */
export async function importEntityData(
  entityTypeId: string,
  values: Record<string, any>,
  externalId?: string,
  metadata?: any,
  createdBy?: string
): Promise<EavEntity> {
  return createEntityWithValues(entityTypeId, values, externalId, metadata, createdBy)
}
