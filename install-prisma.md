# Install Prisma ORM

## Manual Installation Steps

Run these commands in your terminal:

### 1. Install Prisma
```bash
npm install prisma @prisma/client
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Push Schema to Database
```bash
npx prisma db push
```

### 4. Uncomment the ORM Code

After installation, uncomment these files:

#### `src/lib/prisma.ts`
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

#### `src/lib/db.ts`
```typescript
import { prisma } from './prisma'
// ... rest of the file
export { prisma }
```

#### `src/lib/orm.ts`
```typescript
import { prisma } from './prisma'
import { User, Space, DataModel, DataRecord, Attribute, Notification } from '@prisma/client'
```

### 5. Test the ORM
```bash
npm run dev
```

## Available Commands

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database  
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio

## What's Ready

✅ Prisma schema (`prisma/schema.prisma`)  
✅ ORM classes (`src/lib/orm.ts`)  
✅ Example API route (`src/app/api/spaces-orm/route.ts`)  
✅ Usage examples (`src/examples/orm-usage.ts`)  
✅ Package.json scripts updated  

## Next Steps

1. Run the installation commands above
2. Uncomment the ORM code
3. Start using the ORM in your API routes
4. Replace raw SQL queries with ORM methods
