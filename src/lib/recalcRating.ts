import prisma from '@/lib/prisma';

export async function recalcRating(targetId: string) {
  const agg = await prisma.review.aggregate({
    where: { targetId, deleted: false },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.profile.update({
    where: { id: targetId },
    data: {
      ratingAvg: agg._avg.rating ?? 0,
      ratingCount: agg._count.rating,
    },
  });
}
