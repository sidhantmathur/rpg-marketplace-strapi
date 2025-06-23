import prisma from "../src/lib/prisma";

async function testDirectChat() {
  try {
    console.log("Testing direct chat functionality...");
    
    // First, let's see what users exist
    const profiles = await prisma.profile.findMany({
      where: {
        roles: {
          has: "dm"
        }
      },
      take: 5,
    });

    console.log(`Found ${profiles.length} DM profiles:`);
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. User ID: ${profile.id}, Email: ${profile.email}, Roles: ${profile.roles.join(", ")}`);
    });

    if (profiles.length === 0) {
      console.log("No DM profiles found. Please create some DM profiles first.");
      return;
    }

    // Check if there are any existing direct chats
    const existingChats = await prisma.chat.findMany({
      where: {
        type: "direct"
      },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    });

    console.log(`\nFound ${existingChats.length} existing direct chats:`);
    existingChats.forEach((chat, index) => {
      console.log(`${index + 1}. Chat ID: ${chat.id}`);
      console.log(`   Members: ${chat.members.map(m => m.user.email).join(", ")}`);
    });

    // Check if there are any chat members
    const chatMembers = await prisma.chatMember.findMany({
      include: {
        chat: true,
        user: true
      },
      take: 10
    });

    console.log(`\nFound ${chatMembers.length} chat memberships:`);
    chatMembers.forEach((member, index) => {
      console.log(`${index + 1}. Chat ID: ${member.chatId}, Type: ${member.chat.type}, User: ${member.user.email}`);
    });

  } catch (error) {
    console.error("Error testing direct chat:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testDirectChat(); 