# Architecture Learnings & Best Practices

## 🎯 Key Learnings from Recent Bug Fixes

### **Bug #3: Prisma + Supabase Deployment Connection Issues**

#### **What Went Wrong?**
- Database connection errors on deployed site: `Can't reach database server at aws-0-ca-central-1.pooler.supabase.com:5432`
- Local development worked fine, but production failed
- Prisma schema required both `DATABASE_URL` and `DIRECT_URL` but only `DATABASE_URL` was configured in Vercel
- Custom Prisma client output path caused import conflicts

#### **The Root Cause**
```typescript
// ❌ Problematic Prisma schema configuration
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"  // Custom path caused issues
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")       // Pooled connection
  directUrl = env("DIRECT_URL")         // Direct connection (missing in Vercel)
}
```

```typescript
// ❌ Problematic import
import { PrismaClient } from "../generated/prisma";  // Custom path import
```

#### **The Fix**
```typescript
// ✅ Correct Prisma schema configuration
generator client {
  provider = "prisma-client-js"
  // No custom output path - use standard location
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")       // Pooled connection
  directUrl = env("DIRECT_URL")         // Direct connection
}
```

```typescript
// ✅ Correct import
import { PrismaClient, Prisma } from "@prisma/client";  // Standard import
```

#### **Environment Variables Required**
```bash
# Supabase Connection Pooling (for most operations)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Supabase Direct Connection (for migrations, introspection)
DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-0-ca-central-1.supabase.com:5432/postgres
```

#### **Why This Works**
- **Standard Prisma Client**: Uses the default location in `node_modules/@prisma/client`
- **Both URLs Required**: Supabase needs both pooled and direct connections
- **Proper Import Path**: Standard import path works reliably in all environments
- **Retry Logic**: Added robust retry logic for connection resilience

#### **Vercel Configuration**
```json
{
  "buildCommand": "prisma generate && next build",
  "framework": "nextjs"
}
```

#### **Key Learnings**
1. **Never use custom Prisma output paths** in production - stick to defaults
2. **Always configure both DATABASE_URL and DIRECT_URL** for Supabase
3. **Use standard imports** from `@prisma/client`, not custom paths
4. **Add retry logic** for production resilience
5. **Test builds locally** before deploying

---

### **Bug #1: Supabase Storage RLS Policy Issues**

#### **What Went Wrong?**
- The Supabase Storage RLS policy requires uploads to be performed in the context of the authenticated user
- When using the shared Supabase client in API routes, the user's JWT was not being forwarded to the storage API
- Supabase Storage saw the request as "anonymous" and denied it due to RLS

#### **The Fix**
```typescript
// ❌ Wrong: Using shared client
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.jpg`, file)

// ✅ Correct: Create new client with user's JWT
const supabaseWithAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    global: {
      headers: {
        Authorization: `Bearer ${userJWT}`
      }
    }
  }
)

const { data, error } = await supabaseWithAuth.storage
  .from('avatars')
  .upload(`${userId}/avatar.jpg`, file)
```

#### **Why This Works**
- Creates a new Supabase client with the user's JWT in the Authorization header
- Ensures the file path matches RLS policy (userId as first folder)
- Storage upload is performed as the authenticated user

---

### **Bug #2: Mixed Database Access Patterns**

#### **What We Found**
After analyzing the codebase, we discovered **one remaining anti-pattern** in `src/lib/chat.ts`:

```typescript
// ❌ Anti-pattern: Direct Supabase database access in server-side code
const { data: existingChats, error: existingError } = await supabase
  .from("Chat")
  .select(`
    *,
    members:ChatMember(
      userId
    )
  `)
  .eq("type", "direct")
  .eq("members.userId", currentUser.user.id);

// ❌ More direct database access
const { data: chat, error: chatError } = await supabase
  .from("Chat")
  .insert({
    type: "direct",
  })
  .select()
  .single();

// ❌ Direct inserts
const memberPromises = [currentUser.user.id, userId].map((memberId) =>
  supabase.from("ChatMember").insert({
    chatId: chat.id,
    userId: memberId,
  })
);
```

#### **The Problem**
- This function is used in API routes but contains direct Supabase database queries
- It bypasses the proper API route pattern
- Creates inconsistency in data access patterns

#### **The Solution**
This should be refactored to use Prisma consistently:

```typescript
// ✅ Correct: Use Prisma for all database operations
export async function createDirectChat(userId: string) {
  try {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error("Not authenticated");

    // Check if chat already exists using Prisma
    const existingChats = await prisma.chat.findMany({
      where: {
        type: "direct",
        members: {
          some: {
            userId: currentUser.user.id
          }
        }
      },
      include: {
        members: {
          where: {
            userId: userId
          }
        }
      }
    });

    // Check if there's already a direct chat between these users
    const existingChat = existingChats.find((chat) =>
      chat.members.some((member) => member.userId === userId)
    );

    if (existingChat) {
      return existingChat;
    }

    // Create new chat using Prisma
    const chat = await prisma.chat.create({
      data: {
        type: "direct",
        members: {
          create: [
            { userId: currentUser.user.id },
            { userId: userId }
          ]
        }
      }
    });

    return chat;
  } catch (error) {
    console.error("Error creating direct chat:", error);
    throw error;
  }
}
```

---

## 🏗️ **Current Architecture Analysis**

### **✅ What's Working Well**

#### **1. Proper API Route Pattern**
Most of the application follows the correct pattern:
```
Client → API Route → Prisma → Database
```

**Examples of good patterns:**
- `/api/chats/route.ts` - Uses Prisma for all database operations
- `/api/bookings/route.ts` - Proper authentication + Prisma
- `/api/profile/[id]/avatar/route.ts` - Correct storage upload with JWT
- `/api/sessions/route.ts` - Consistent Prisma usage

#### **2. Authentication Flow**
All API routes properly:
- Extract JWT from Authorization header
- Verify with Supabase auth
- Use authenticated user context

```typescript
// ✅ Consistent authentication pattern
const authHeader = request.headers.get("Authorization");
const token = authHeader.replace("Bearer ", "");
const { data: { user }, error: authError } = await supabase.auth.getUser(token);
```

#### **3. Storage Upload Pattern**
Storage uploads correctly use authenticated clients:

```typescript
// ✅ Correct storage pattern
const storageSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
});
```

#### **4. Client-Side Patterns**
Client components properly:
- Use API routes for data operations
- Use Supabase auth for authentication
- Use Supabase realtime for live updates

```typescript
// ✅ Good client-side pattern
const response = await fetch(`/api/chats/${chatId}/messages`, {
  headers: {
    Authorization: `Bearer ${session.access_token}`,
  },
});
```

### **❌ What Needs Fixing**

#### **1. Mixed Database Access in `src/lib/chat.ts`**
This is the **only remaining anti-pattern** in the codebase.

#### **2. Inconsistent Error Handling**
Some API routes have detailed error logging, others don't.

---

## 🔧 **Best Practices (Current State)**

### **When to Use What**

#### **Supabase Client (Browser)**
✅ **DO Use For:**
- Realtime subscriptions (chat messages, etc.)
- User authentication (login/signup)
- Getting user session/token

❌ **DON'T Use For:**
- Direct database queries
- Data mutations
- Complex business logic

#### **Prisma (Server-Side)**
✅ **DO Use For:**
- All database operations in API routes
- Complex queries with joins
- Data validation
- Business logic

#### **API Routes**
✅ **DO Use For:**
- All client-server communication
- Authentication middleware
- Data transformation
- Error handling

#### **Supabase Storage**
✅ **DO Use For:**
- File uploads (with authenticated client)
- Image storage
- Public file serving

---

## 🚨 **Current Anti-Patterns to Fix**

### **1. Mixed Database Access in `src/lib/chat.ts`**
```typescript
// ❌ FIX NEEDED: This violates the architecture
const { data: existingChats, error: existingError } = await supabase
  .from("Chat")
  .select(`*`)
  .eq("type", "direct");
```

**Fix:** Replace all Supabase database queries with Prisma queries.

### **2. Inconsistent Error Logging**
Some API routes have detailed logging, others don't.

**Fix:** Standardize error logging across all API routes.

---

## 🎯 **The "Aha!" Moments**

### **1. RLS Errors Are Security Warnings**
When you get RLS errors, it usually means you're trying to access the database from the wrong place.

### **2. Architecture Consistency Matters**
The codebase is 95% consistent with proper patterns. The remaining 5% (one file) shows how easy it is to slip into anti-patterns.

### **3. Storage Requires Special Handling**
Supabase Storage needs authenticated clients, not the shared client.

---

## 📝 **Commit Message Templates**

### **For Architecture Fixes**
```
fix(architecture): migrate remaining Supabase queries to Prisma

- Replace direct Supabase database queries with Prisma in chat.ts
- Ensure consistent data access patterns across the application
- Maintain proper separation of concerns
- Add comprehensive error handling and logging

The chat.ts file was the last remaining location using direct Supabase
database queries instead of the proper API route pattern. This change
ensures all database operations go through Prisma and follow the
established architecture pattern.

Fixes: #architecture-consistency
```

### **For Storage Fixes**
```
fix(storage): enable file upload with Supabase Storage RLS

- Use a new Supabase client with the user's JWT for storage uploads
- Ensure file path matches RLS policy (userId as first folder)
- Fixes RLS 403 error when uploading files
- Add detailed logging for easier debugging

Supabase Storage RLS requires uploads to be performed in the context of
the authenticated user. The shared client did not forward the user's JWT,
causing RLS failures. This change ensures file uploads work securely and
as expected.
```

### **For Deployment Fixes**
```
fix(deployment): resolve Prisma + Supabase connection issues

- Remove custom Prisma output path from schema
- Use standard @prisma/client import instead of custom path
- Add robust retry logic for database connections
- Ensure both DATABASE_URL and DIRECT_URL are configured
- Simplify Vercel build configuration

The deployment was failing due to custom Prisma client generation and
missing DIRECT_URL environment variable. This change restores the working
configuration from commit 84d07de and adds production resilience.

Fixes: #deployment-connection-errors
```

---

## 🔍 **Debugging RLS Issues**

### **Common RLS Error Messages**
- `new row violates row-level security policy` - Insert/Update blocked
- `permission denied for table` - Select blocked
- `403 Forbidden` - Storage access blocked

### **Debugging Steps**
1. **Check Authentication Context**
   - Is the user authenticated?
   - Is the JWT being passed correctly?

2. **Verify RLS Policies**
   - Do the policies match your data structure?
   - Are you using the correct user ID format?

3. **Check Architecture**
   - Are you accessing the database from the right place?
   - Should this be an API route instead?

4. **Review File Paths (Storage)**
   - Does the file path match your RLS policy?
   - Is the user ID the first folder in the path?

---

## 🚀 **Deployment Best Practices**

### **Prisma + Supabase Deployment Checklist**

#### **Pre-Deployment**
- [ ] **Test build locally**: `npm run build` should complete without errors
- [ ] **Verify Prisma schema**: No custom output paths
- [ ] **Check imports**: Use `@prisma/client`, not custom paths
- [ ] **Generate Prisma client**: `npx prisma generate` works locally

#### **Environment Variables**
- [ ] **DATABASE_URL**: Supabase pooled connection (Vercel)
- [ ] **DIRECT_URL**: Supabase direct connection (Vercel)
- [ ] **NEXT_PUBLIC_SUPABASE_URL**: Public Supabase URL
- [ ] **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Public Supabase key
- [ ] **SUPABASE_SERVICE_ROLE_KEY**: Service role key (if needed)

#### **Vercel Configuration**
```json
{
  "buildCommand": "prisma generate && next build",
  "framework": "nextjs"
}
```

#### **Post-Deployment Verification**
- [ ] **Database connections**: Check Vercel logs for connection success
- [ ] **API routes**: Test key endpoints
- [ ] **Authentication**: Verify login/signup works
- [ ] **Database operations**: Test CRUD operations

### **Common Deployment Issues**

#### **1. Database Connection Errors**
```
Can't reach database server at aws-0-ca-central-1.pooler.supabase.com:5432
```

**Causes:**
- Missing `DIRECT_URL` environment variable
- Incorrect `DATABASE_URL` format
- Network connectivity issues

**Solutions:**
- Add `DIRECT_URL` to Vercel environment variables
- Verify both URLs are correct in Supabase dashboard
- Check Supabase project status

#### **2. Prisma Import Errors**
```
Cannot find module '../generated/prisma'
```

**Causes:**
- Custom Prisma output path in schema
- Missing Prisma client generation
- Incorrect import paths

**Solutions:**
- Remove custom output path from schema
- Use standard `@prisma/client` import
- Ensure `prisma generate` runs in build

#### **3. Build Failures**
```
Error: DATABASE_URL environment variable is not set
```

**Causes:**
- Missing environment variables in Vercel
- Incorrect variable names
- Build-time environment access issues

**Solutions:**
- Add all required environment variables to Vercel
- Use correct variable names (case-sensitive)
- Test environment variable access in build

### **Production Monitoring**

#### **Key Metrics to Watch**
- **Database connection success rate**
- **API response times**
- **Error rates by endpoint**
- **Authentication success rate**

#### **Log Analysis**
```bash
# Check for database connection issues
grep -i "database\|prisma\|connection" vercel-logs.txt

# Check for authentication issues
grep -i "auth\|jwt\|token" vercel-logs.txt

# Check for build issues
grep -i "build\|generate\|import" vercel-logs.txt
```

#### **Health Check Endpoints**
Create health check endpoints to monitor:
- Database connectivity
- Authentication service
- Key API functionality

```typescript
// /api/health/route.ts
export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
```

---

## 🎓 **Lessons Learned**

1. **Security systems are your friend** - RLS errors are warnings, not bugs
2. **Architecture matters** - Proper separation of concerns prevents security issues
3. **Consistency is key** - Use the same patterns throughout your application
4. **API routes are the answer** - They provide security, consistency, and maintainability
5. **Documentation saves time** - These patterns should be documented and shared
6. **Storage is special** - Requires authenticated clients, not shared clients
7. **One anti-pattern can slip through** - Always review for consistency
8. **Prisma defaults are best** - Never use custom output paths in production
9. **Supabase needs both URLs** - Always configure DATABASE_URL and DIRECT_URL
10. **Test builds locally** - If it doesn't build locally, it won't deploy
11. **Environment variables are critical** - Missing variables cause silent failures
12. **Retry logic saves deployments** - Add resilience for production environments

---

## 📚 **Further Reading**

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Security Best Practices for Web Applications](https://owasp.org/www-project-top-ten/)

---

## 🚀 **Next Steps**

1. **Fix the remaining anti-pattern** in `src/lib/chat.ts`
2. **Standardize error logging** across all API routes
3. **Add comprehensive testing** for the architecture patterns
4. **Document the patterns** in the team wiki
5. **Set up linting rules** to prevent future anti-patterns 