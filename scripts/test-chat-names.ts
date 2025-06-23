import prisma from "../src/lib/prisma";

async function testChatNames() {
  try {
    console.log("Testing chat names with session information...");
    
    // Get all chats with session information
    const chatMemberships = await prisma.chatMember.findMany({
      include: {
        chat: {
          include: {
            session: {
              select: {
                id: true,
                title: true,
                date: true,
              },
            },
          },
        },
      },
      take: 10,
    });

    console.log(`Found ${chatMemberships.length} chat memberships:`);
    
    chatMemberships.forEach((membership, index) => {
      const chat = membership.chat;
      console.log(`${index + 1}. Chat ID: ${chat.id}, Type: ${chat.type}`);
      
      if (chat.type === "session" && chat.session) {
        const sessionName = `${chat.session.title} - ${new Date(chat.session.date).toLocaleDateString()}`;
        console.log(`   Session Chat Name: "${sessionName}"`);
        console.log(`   Session: ${chat.session.title} (${chat.session.id})`);
        console.log(`   Date: ${new Date(chat.session.date).toLocaleDateString()}`);
      } else if (chat.type === "session") {
        console.log(`   Session Chat Name: "Session Chat" (no session info)`);
      } else {
        console.log(`   Direct Chat`);
      }
      console.log("");
    });

  } catch (error) {
    console.error("Error testing chat names:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testChatNames(); 