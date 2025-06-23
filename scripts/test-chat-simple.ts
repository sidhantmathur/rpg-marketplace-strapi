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
    
    // Check if chat already exists
    const existingChat = await prisma.chat.findFirst({
      where: {
        sessionId: testSession.id,
        type: "session",
      },
    });

    if (existingChat) {
      console.log(`Chat already exists: ${existingChat.id}`);
    } else {
      console.log("No chat exists for this session yet.");
    }

    // Check if there are any chats at all
    const allChats = await prisma.chat.findMany({
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    console.log(`\nTotal chats in database: ${allChats.length}`);
    allChats.forEach((chat, index) => {
      console.log(`${index + 1}. Chat ID: ${chat.id}, Type: ${chat.type}, Session ID: ${chat.sessionId}`);
      console.log(`   Members: ${chat.members.length}`);
      chat.members.forEach((member) => {
        console.log(`     - ${member.user.email} (${member.userId})`);
      });
    });

  } catch (error) {
    console.error("Error testing chat creation:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testChatCreation(); 