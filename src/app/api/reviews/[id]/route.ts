import { PrismaClient, Review } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { recalcRating } from "@/lib/recalcRating";

const gp = global as unknown as { prisma?: PrismaClient };
const prisma = gp.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") gp.prisma = prisma;

interface ReviewUpdateRequest {
  authorId: string;
  rating?: number;
  comment?: string;
}

interface ReviewDeleteRequest {
  authorId: string;
}

function handleError(err: unknown): NextResponse<{ error: string }> {
  console.error("[Review API] Error:", err);
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<Review | { error: string }>> {
  try {
    const { id } = await params;
    const reviewId = Number(id);
    if (Number.isNaN(reviewId)) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
    }

    const { authorId, rating, comment } = (await req.json()) as ReviewUpdateRequest;

    if (!authorId) return NextResponse.json({ error: "authorId required" }, { status: 400 });
    if (rating !== undefined && (rating < 1 || rating > 5))
      return NextResponse.json({ error: "rating must be 1‑5" }, { status: 400 });
    if (rating === undefined && comment === undefined)
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

    const existing = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!existing || existing.deleted)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.authorId !== authorId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.review.update({
        where: { id: reviewId },
        data: { rating, comment },
      });
      await recalcRating(r.targetId);
      return r;
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<Review | { error: string }>> {
  try {
    const { id } = await params;
    const reviewId = Number(id);
    if (Number.isNaN(reviewId)) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
    }

    const { authorId } = (await req.json()) as ReviewDeleteRequest;

    if (!authorId) return NextResponse.json({ error: "authorId required" }, { status: 400 });

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review || review.deleted)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (review.authorId !== authorId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const deleted = await prisma.$transaction(async (tx) => {
      const r = await tx.review.update({
        where: { id: reviewId },
        data: { deleted: true },
      });
      await recalcRating(r.targetId);
      return r;
    });

    return NextResponse.json(deleted);
  } catch (err) {
    return handleError(err);
  }
}
