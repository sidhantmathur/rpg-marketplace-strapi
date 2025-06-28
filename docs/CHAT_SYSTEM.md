# Chat System Implementation

## Overview

The chat system provides real-time messaging capabilities for users to communicate in session-based and direct message conversations. This document outlines the implementation details, architecture decisions, and key learnings.

## 🏗️ Architecture

### Database Schema

```sql
-- Chat table for managing conversations
model Chat {
  id        Int       @id @default(autoincrement())
  type      String    // "session" or "direct"
  sessionId Int?      @unique // Optional, only for session chats
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  messages  Message[]
  session   Session?  @relation("SessionChat", fields: [sessionId], references: [id])
  members   ChatMember[]
}

-- Chat members for managing participants
model ChatMember {
  id        Int      @id @default(autoincrement())
  chatId    Int
  userId    String
  joinedAt  DateTime @default(now())
  chat      Chat     @relation(fields: [chatId], references: [id])
  user      Profile  @relation(fields: [userId], references: [id])

  @@unique([chatId, userId])
}

-- Messages with sender information
model Message {
  id        Int      @id @default(autoincrement())
  chatId    Int
  senderId  String
  content   String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  chat      Chat     @relation(fields: [chatId], references: [id])
  sender    Profile  @relation(fields: [senderId], references: [id])
}
```

### API Endpoints

- `GET /api/chats` - List user's chats
- `GET /api/chats/[chatId]/messages` - Get chat messages
- `POST /api/chats/[chatId]/messages` - Send a message
- `GET /api/chats/[chatId]/messages/[messageId]` - Get single message with sender info
- `POST /api/chat/create-session-chat` - Create session-based chat
- `POST /api/chat/create-direct-chat` - Create direct message chat

## 🎨 UI Components

### ChatWindow Component

**Location**: `src/components/chat/ChatWindow.tsx`

**Key Features**:
- Real-time message updates via Supabase subscriptions
- User identification with profile pictures and names
- Custom message bubbles with different styling for own/other messages
- Responsive design with proper scrolling
- Loading and error states

**Implementation Highlights**:
```tsx
// Custom message component with user identification
function CustomMessage({ message, isOwnMessage }: { message: Message; isOwnMessage: boolean }) {
  const sender = message.sender || { id: message.senderId, email: "Unknown User", avatarUrl: undefined };
  const displayName = sender.email ? sender.email.split('@')[0] : "Unknown User";
  
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      {/* Profile picture, sender name, message content, timestamp */}
    </div>
  );
}
```

### ChatList Component

**Location**: `src/components/chat/ChatList.tsx`

**Features**:
- Lists all user's chats
- Shows chat name, participant count, and avatars
- Handles chat selection
- Real-time updates for new chats

## 🔄 Real-time Updates

### Supabase Realtime Integration

```tsx
// Subscribe to new messages
const channel = supabase
  .channel(`chat:${chatId}`)
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "Message",
      filter: `chatId=eq.${chatId}`,
    },
    async (payload) => {
      // Fetch complete message with sender information
      const response = await fetch(`/api/chats/${chatId}/messages/${payload.new.id}`);
      if (response.ok) {
        const { message } = await response.json();
        setMessages((current) => [...current, message]);
      }
    }
  )
  .subscribe();
```

## 🔐 Security & Authentication

### Row Level Security (RLS)

All database operations are protected with RLS policies:

```sql
-- Chat members can only access their chats
CREATE POLICY "Users can only access their chats" ON "Chat"
FOR ALL USING (
  id IN (
    SELECT "chatId" FROM "ChatMember" 
    WHERE "userId" = auth.uid()
  )
);

-- Users can only send messages to chats they're members of
CREATE POLICY "Users can only send messages to their chats" ON "Message"
FOR INSERT WITH CHECK (
  "chatId" IN (
    SELECT "chatId" FROM "ChatMember" 
    WHERE "userId" = auth.uid()
  )
);
```

### API Route Authentication

All chat API routes verify JWT tokens:

```tsx
// Extract and verify JWT token
const token = authHeader.replace("Bearer ", "");
const { data: { user }, error: authError } = await supabase.auth.getUser(token);

if (authError || !user) {
  return NextResponse.json({ error: "Authentication error" }, { status: 401 });
}
```

## 🎯 Key Learnings

### 1. UI Library Integration Challenges

**Problem**: Initially tried to use `@chatscope/chat-ui-kit-react` for the chat interface, but encountered:
- CSS conflicts with custom styling
- TypeScript type mismatches when passing JSX elements
- Limited customization options for user identification

**Solution**: Created a completely custom chat interface without external dependencies.

**Learning**: When building complex, custom UI features, it's often better to build from scratch rather than fighting against library constraints.

### 2. Real-time Message Handling

**Problem**: Supabase realtime subscriptions only provide raw database records without relations.

**Solution**: Created a separate API endpoint to fetch complete message data with sender information when new messages arrive.

**Learning**: Real-time systems often require additional API calls to fetch complete data that includes relations.

### 3. User Identification Design

**Implementation**: Each message displays:
- Profile picture (avatar or fallback initial)
- Sender name (email prefix)
- Message content in styled bubbles
- Timestamp

**Learning**: Clear user identification is crucial for group conversations. Using email prefixes as display names provides a good balance of readability and privacy.

### 4. Error Handling & Fallbacks

**Implementation**: Graceful handling of missing sender information:

```tsx
const sender = message.sender || { 
  id: message.senderId, 
  email: "Unknown User", 
  avatarUrl: undefined 
};
```

**Learning**: Always provide fallbacks for optional data to prevent UI crashes.

### 5. Performance Considerations

**Optimizations**:
- Messages are loaded in ascending order (oldest first)
- Real-time updates append new messages to the end
- Profile pictures use Next.js Image optimization
- Proper cleanup of Supabase subscriptions

**Learning**: Real-time chat requires careful attention to message ordering and subscription management.

## 🚀 Future Enhancements

### Planned Features

1. **Message Status**: Read receipts, typing indicators
2. **File Attachments**: Image and document sharing
3. **Message Reactions**: Emoji reactions to messages
4. **Message Search**: Search within chat history
5. **Message Editing/Deletion**: Edit and delete own messages
6. **Push Notifications**: Browser and mobile notifications
7. **Message Threading**: Reply to specific messages
8. **Voice Messages**: Audio message support

### Technical Improvements

1. **Message Pagination**: Load messages in chunks for better performance
2. **Message Caching**: Implement client-side caching
3. **Offline Support**: Queue messages when offline
4. **Message Encryption**: End-to-end encryption for sensitive conversations
5. **Message Analytics**: Track engagement and usage patterns

## 📋 Best Practices

### Code Organization

1. **Separation of Concerns**: API routes handle data, components handle UI
2. **Type Safety**: Strong TypeScript interfaces for all data structures
3. **Error Boundaries**: Graceful error handling at all levels
4. **Consistent Naming**: Clear, descriptive component and function names

### Security

1. **Authentication**: JWT verification on all API routes
2. **Authorization**: RLS policies for database access
3. **Input Validation**: Validate all user inputs
4. **Rate Limiting**: Prevent spam and abuse

### Performance

1. **Optimistic Updates**: Update UI immediately, handle errors gracefully
2. **Efficient Queries**: Use Prisma includes for related data
3. **Subscription Management**: Proper cleanup of real-time subscriptions
4. **Image Optimization**: Use Next.js Image component for avatars

## 🔧 Troubleshooting

### Common Issues

1. **Messages not appearing**: Check Supabase subscription and API responses
2. **User identification missing**: Verify sender relation in database queries
3. **Real-time not working**: Ensure proper channel subscription and cleanup
4. **Permission errors**: Verify RLS policies and user authentication

### Debug Tools

- Browser console logs for message loading
- Network tab for API request/response inspection
- Supabase dashboard for real-time subscription monitoring
- Database logs for query performance analysis

## 📚 Related Documentation

- [Database Schema](./DATABASE_SCHEMA.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Authentication Guide](./AUTHENTICATION.md)
- [Real-time Features](./REALTIME_FEATURES.md) 