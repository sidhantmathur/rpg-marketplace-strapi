import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import SessionDetails from "@/components/session/SessionDetails";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SessionPage({ params }: PageProps) {
  const resolvedParams = await params;
  const sessionId = Number(resolvedParams.id);
  
  if (Number.isNaN(sessionId)) {
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
      reviews: {
        where: { deleted: false },
        include: {
          author: {
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

  return <SessionDetails session={session} />;
} 