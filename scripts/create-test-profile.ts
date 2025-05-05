import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const testProfile = await prisma.profile.upsert({
      where: {
        id: "test-user-id",
      },
      update: {},
      create: {
        id: "test-user-id",
        email: "test@example.com",
        roles: ["user"],
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=test-user-id",
        ratingAvg: 0,
        ratingCount: 0,
      },
    });

    console.log("Test profile created:", testProfile);
  } catch (error) {
    console.error("Error creating test profile:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 