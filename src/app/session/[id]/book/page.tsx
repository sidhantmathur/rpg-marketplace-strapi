import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import BookingConfirmation from "@/components/session/BookingConfirmation";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function BookingPage({ params }: PageProps) {
  const sessionId = parseInt(params.id);
  if (isNaN(sessionId)) {
    notFound();
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      dm: true,
      bookings: {
        include: {
          user: {
            select: {
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    notFound();
  }

  return <BookingConfirmation session={session} />;
} 