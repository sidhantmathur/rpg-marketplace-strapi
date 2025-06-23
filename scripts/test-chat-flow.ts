import prisma from "../src/lib/prisma";

async function testChatFlow() {
  try {
    console.log("Testing chat flow...");
    
    // Get a session with participants
    const session = await prisma.session.findFirst({
      include: {
        dm: true,
        bookings: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!session) {
      console.log("No sessions found");
      return;
    }

    console.log(`\nSession: ${session.title} (ID: ${session.id})`);
    console.log(`DM: ${session.dm.userId}`);
    console.log(`Participants: ${session.bookings.length}`);
    session.bookings.forEach((booking, index) => {
      console.log(`  ${index + 1}. ${booking.user.email} (${booking.userId})`);
    });

    // Test what happens when each user tries to access the chat
    const testUsers = [
      { id: session.dm.userId, email: "DM", role: "DM" },
      ...session.bookings.map(b => ({ id: b.userId, email: b.user.email, role: "Participant" }))
    ];

    console.log("\nTesting chat access for each user:");
    
    for (const user of testUsers) {
      console.log(`\n--- Testing ${user.role}: ${user.email} (${user.id}) ---`);
      
      // Check if user is DM
      const isDM = session.dm.userId === user.id;
      
      // Check if user is participant
      const isParticipant = session.bookings.some(booking => booking.userId === user.id);
      
      console.log(`Is DM: ${isDM}`);
      console.log(`Is Participant: ${isParticipant}`);
      console.log(`Has access: ${isDM || isParticipant}`);
      
      if (isDM || isParticipant) {
        // Check if chat exists
        const existingChat = await prisma.chat.findFirst({
          where: {
            sessionId: session.id,
            type: "session",
          },
        });
        
        if (existingChat) {
          console.log(`Chat exists: ${existingChat.id}`);
          
          // Check if user is a member of the chat
          const chatMember = await prisma.chatMember.findUnique({
            where: {
              chatId_userId: {
                chatId: existingChat.id,
                userId: user.id,
              },
            },
          });
          
          console.log(`User is chat member: ${!!chatMember}`);
        } else {
          console.log("No chat exists yet");
        }
      } else {
        console.log("User has no access to this session");
      }
    }

  } catch (error) {
    console.error("Error testing chat flow:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testChatFlow(); 