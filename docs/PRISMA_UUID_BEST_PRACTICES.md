# Prisma UUID Parameter Best Practices

## Current Implementation (Acceptable ✅)

**What we're doing:**
- Using `column::text = $1` pattern with `$queryRawUnsafe`
- Creating function indexes to maintain performance
- This works and is performant

**Why it's acceptable:**
- Solves the immediate problem (attributes not loading)
- Maintains query performance with function indexes
- Works with existing codebase structure
- Recognized pattern for Prisma's limitations

## Best Practices Hierarchy (Best to Acceptable)

### 1. **IDEAL: Use Prisma ORM Methods** ⭐⭐⭐⭐⭐
```typescript
// Best - Type-safe, handles UUIDs automatically
const attributes = await db.dataModelAttribute.findMany({
  where: {
    dataModelId: modelId,  // Prisma handles UUID conversion
    isActive: true,
    deletedAt: null
  }
})
```

**Benefits:**
- Type-safe
- Automatic UUID handling
- Uses native indexes
- No SQL injection risk
- Best performance

### 2. **GOOD: Use Prisma.sql Template Literals** ⭐⭐⭐⭐
```typescript
// Better - Type-aware parameter binding
const result = await db.$queryRaw(
  Prisma.sql`SELECT * FROM data_model_attributes 
   WHERE data_model_id = ${modelId}::uuid 
   AND is_active = TRUE`
)
```

**Benefits:**
- Better type handling than $queryRawUnsafe
- Parameterized queries
- May handle UUIDs better (needs testing)

### 3. **ACCEPTABLE: $queryRawUnsafe + Function Indexes** ⭐⭐⭐ (Current)
```typescript
// Current approach - Works but requires function indexes
const result = await query(
  `SELECT * FROM data_model_attributes 
   WHERE data_model_id::text = $1`,
  [modelId]
)
```

**Benefits:**
- Works with existing query() wrapper
- Performant with function indexes
- Flexible for complex queries

**Drawbacks:**
- Requires function indexes
- Less type-safe
- More maintenance overhead

## Why Not Use Prisma.sql?

The current codebase uses a `query()` wrapper function that takes a string and params array. Switching to `Prisma.sql` would require:
- Refactoring many files
- Changing the query() function signature
- More complex timeout handling

## Recommendation

**For new code:**
- Use Prisma ORM methods when possible
- Use `Prisma.sql` for complex queries
- Only use `$queryRawUnsafe` when absolutely necessary

**For existing code:**
- Current approach (function indexes) is acceptable
- Consider gradual migration to Prisma ORM methods
- Document why we're using this pattern

## Migration Path

If you want to improve to best practices:

1. **Short-term**: Keep current approach (it works)
2. **Medium-term**: Migrate high-traffic queries to Prisma ORM
3. **Long-term**: Replace query() wrapper with Prisma.sql where needed

## Conclusion

✅ **Current implementation is acceptable** - it solves the problem and maintains performance.

⭐⭐ **Best practice would be Prisma ORM** - but requires significant refactoring.

The function indexes approach is a **pragmatic solution** that balances:
- Minimal code changes
- Good performance
- Working solution

