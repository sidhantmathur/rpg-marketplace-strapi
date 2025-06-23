import { createSessionChat } from "../src/lib/chat";
import prisma from "../src/lib/prisma";

async function testChatCreation() {
  try {
    console.log("Testing chat creation...");
    
    // First, let's see what sessions exist
    const sessions = await prisma.session.findMany({
      include: {
        dm: true,
        bookings: true,
      },
      take: 5,
    });

    console.log(`Found ${sessions.length} sessions:`);
    sessions.forEach((session, index) => {
      console.log(`${index + 1}. Session ID: ${session.id}, Title: ${session.title}`);
      console.log(`   DM: ${session.dm.userId}, Participants: ${session.bookings.length}`);
    });

    if (sessions.length === 0) {
      console.log("No sessions found. Please create a session first.");
      return;
    }

    // Test with the first session
    const testSession = sessions[0];
    console.log(`\nTesting chat creation for session ${testSession.id}...`);
    
    const chat = await createSessionChat(testSession.id, testSession.dm.userId);
    console.log(`Chat created/found:`, chat);

    // Check if chat members were created
    const members = await prisma.chatMember.findMany({
      where: { chatId: chat.id },
      include: { user: true },
    });

    console.log(`\nChat members:`);
    members.forEach((member) => {
      console.log(`- ${member.user.email} (${member.userId})`);
    });

  } catch (error) {
    console.error("Error testing chat creation:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testChatCreation(); 