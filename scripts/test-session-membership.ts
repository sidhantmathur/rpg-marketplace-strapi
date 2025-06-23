import prisma from "../src/lib/prisma";

async function testSessionMembership() {
  try {
    console.log("Testing session membership...");
    
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

    console.log(`Session: ${session.title} (ID: ${session.id})`);
    console.log(`DM: ${session.dm.userId}`);
    console.log(`Participants: ${session.bookings.length}`);
    session.bookings.forEach((booking, index) => {
      console.log(`  ${index + 1}. ${booking.user.email} (${booking.userId})`);
    });

    // Test membership check for DM
    const isDM = session.dm.userId === session.dm.userId;
    console.log(`\nDM membership check: ${isDM}`);

    // Test membership check for participants
    session.bookings.forEach((booking) => {
      const isParticipant = session.bookings.some(b => b.userId === booking.userId);
      console.log(`Participant ${booking.user.email} membership: ${isParticipant}`);
    });

    // Test membership check for a non-member
    const nonMemberId = "non-existent-user-id";
    const isNonMember = session.dm.userId === nonMemberId || 
                       session.bookings.some(b => b.userId === nonMemberId);
    console.log(`Non-member ${nonMemberId} membership: ${isNonMember}`);

  } catch (error) {
    console.error("Error testing session membership:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testSessionMembership(); 