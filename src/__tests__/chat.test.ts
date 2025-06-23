import { createSessionChat } from "@/lib/chat";
import prisma from "@/lib/prisma";

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  session: {
    findUnique: jest.fn(),
  },
  chat: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  chatMember: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}));

describe("Chat Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createSessionChat", () => {
    it("should create a new chat when one doesn't exist", async () => {
      const mockSession = {
        id: 1,
        dm: { userId: "dm-user-id" },
        bookings: [{ userId: "player-1" }, { userId: "player-2" }],
      };

      const mockChat = { id: 1, type: "session", sessionId: 1 };

      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prisma.chat.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.chat.create as jest.Mock).mockResolvedValue(mockChat);
      (prisma.chatMember.create as jest.Mock).mockResolvedValue({});

      const result = await createSessionChat(1, "current-user-id");

      expect(prisma.chat.create).toHaveBeenCalledWith({
        data: {
          type: "session",
          sessionId: 1,
        },
      });

      expect(prisma.chatMember.create).toHaveBeenCalledTimes(4); // DM + 2 players + current user
      expect(result).toEqual(mockChat);
    });

    it("should return existing chat and add current user if not a member", async () => {
      const mockSession = {
        id: 1,
        dm: { userId: "dm-user-id" },
        bookings: [{ userId: "player-1" }],
      };

      const mockChat = { id: 1, type: "session", sessionId: 1 };

      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prisma.chat.findFirst as jest.Mock).mockResolvedValue(mockChat);
      (prisma.chatMember.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.chatMember.create as jest.Mock).mockResolvedValue({});

      const result = await createSessionChat(1, "current-user-id");

      expect(prisma.chat.create).not.toHaveBeenCalled();
      expect(prisma.chatMember.create).toHaveBeenCalledWith({
        data: {
          chatId: 1,
          userId: "current-user-id",
        },
      });
      expect(result).toEqual(mockChat);
    });

    it("should throw error if session not found", async () => {
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(createSessionChat(999)).rejects.toThrow("Session not found");
    });
  });
}); 