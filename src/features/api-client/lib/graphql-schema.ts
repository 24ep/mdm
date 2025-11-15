// GraphQL Schema Fetcher and Parser

export interface GraphQLType {
  name: string
  kind: string
  description?: string
  fields?: GraphQLField[]
  inputFields?: GraphQLField[]
  interfaces?: GraphQLType[]
  possibleTypes?: GraphQLType[]
  enumValues?: GraphQLEnumValue[]
}

export interface GraphQLField {
  name: string
  type: GraphQLTypeRef
  description?: string
  args?: GraphQLFieldArg[]
  isDeprecated?: boolean
  deprecationReason?: string
}

export interface GraphQLFieldArg {
  name: string
  type: GraphQLTypeRef
  description?: string
  defaultValue?: string
}

export interface GraphQLTypeRef {
  name?: string
  kind: string
  ofType?: GraphQLTypeRef
}

export interface GraphQLEnumValue {
  name: string
  description?: string
  isDeprecated?: boolean
  deprecationReason?: string
}

export interface GraphQLSchema {
  queryType?: {
    name: string
  }
  mutationType?: {
    name: string
  }
  subscriptionType?: {
    name: string
  }
  types: GraphQLType[]
}

/**
 * Fetch GraphQL schema using introspection query
 */
export async function fetchGraphQLSchema(url: string, headers: Record<string, string> = {}): Promise<GraphQLSchema> {
  const introspectionQuery = `
    query IntrospectionQuery {
      __schema {
        queryType { name }
        mutationType { name }
        subscriptionType { name }
        types {
          ...FullType
        }
      }
    }

    fragment FullType on __Type {
      kind
      name
      description
      fields(includeDeprecated: true) {
        name
        description
        args {
          ...InputValue
        }
        type {
          ...TypeRef
        }
        isDeprecated
        deprecationReason
      }
      inputFields {
        ...InputValue
      }
      interfaces {
        ...TypeRef
      }
      possibleTypes {
        ...TypeRef
      }
      enumValues(includeDeprecated: true) {
        name
        description
        isDeprecated
        deprecationReason
      }
    }

    fragment InputValue on __InputValue {
      name
      description
      type { ...TypeRef }
      defaultValue
    }

    fragment TypeRef on __Type {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  `

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        query: introspectionQuery,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    if (result.errors) {
      throw new Error(result.errors.map((e: any) => e.message).join(', '))
    }

    return result.data.__schema
  } catch (error) {
    throw new Error(`Failed to fetch GraphQL schema: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get type name from GraphQL type reference
 */
export function getTypeName(typeRef: GraphQLTypeRef): string {
  if (typeRef.name) {
    return typeRef.name
  }
  if (typeRef.ofType) {
    return getTypeName(typeRef.ofType)
  }
  return typeRef.kind
}

/**
 * Format type reference for display
 */
export function formatTypeRef(typeRef: GraphQLTypeRef): string {
  const name = getTypeName(typeRef)
  if (typeRef.kind === 'NON_NULL') {
    return `${formatTypeRef(typeRef.ofType!)}!`
  }
  if (typeRef.kind === 'LIST') {
    return `[${formatTypeRef(typeRef.ofType!)}]`
  }
  return name
}

