-- Enable RLS on chat tables
ALTER TABLE "Chat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

-- Chat policies
CREATE POLICY "Users can view chats they are members of" ON "Chat"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "ChatMember" 
    WHERE "ChatMember"."chatId" = "Chat"."id" 
    AND "ChatMember"."userId" = auth.uid()
  )
);

CREATE POLICY "Users can insert chats" ON "Chat"
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update chats they are members of" ON "Chat"
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM "ChatMember" 
    WHERE "ChatMember"."chatId" = "Chat"."id" 
    AND "ChatMember"."userId" = auth.uid()
  )
);

-- ChatMember policies
CREATE POLICY "Users can view their own chat memberships" ON "ChatMember"
FOR SELECT USING ("userId" = auth.uid());

CREATE POLICY "Users can view memberships of chats they belong to" ON "ChatMember"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "ChatMember" cm2
    WHERE cm2."chatId" = "ChatMember"."chatId" 
    AND cm2."userId" = auth.uid()
  )
);

CREATE POLICY "Users can insert chat memberships" ON "ChatMember"
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their own chat memberships" ON "ChatMember"
FOR DELETE USING ("userId" = auth.uid());

-- Message policies
CREATE POLICY "Users can view messages in chats they are members of" ON "Message"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "ChatMember" 
    WHERE "ChatMember"."chatId" = "Message"."chatId" 
    AND "ChatMember"."userId" = auth.uid()
  )
);

CREATE POLICY "Users can insert messages in chats they are members of" ON "Message"
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM "ChatMember" 
    WHERE "ChatMember"."chatId" = "Message"."chatId" 
    AND "ChatMember"."userId" = auth.uid()
  )
  AND "senderId" = auth.uid()
);

CREATE POLICY "Users can update their own messages" ON "Message"
FOR UPDATE USING ("senderId" = auth.uid());

CREATE POLICY "Users can delete their own messages" ON "Message"
FOR DELETE USING ("senderId" = auth.uid()); 