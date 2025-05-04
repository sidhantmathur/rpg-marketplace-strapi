import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { recalcRating } from "@/lib/recalcRating";

const gp = global as unknown as { prisma?: PrismaClient };
const prisma = gp.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") gp.prisma = prisma;

/* PATCH /api/reviews/[id] ------------------------------------------------ */
export async function PATCH(req: NextRequest, context: any) {
  try {
    const id = Number(context.params.id);
    const { authorId, rating, comment } = await req.json();

    if (!authorId)
      return NextResponse.json({ error: "authorId required" }, { status: 400 });
    if (rating !== undefined && (rating < 1 || rating > 5))
      return NextResponse.json(
        { error: "rating must be 1‑5" },
        { status: 400 },
      );
    if (rating === undefined && comment === undefined)
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing || existing.deleted)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.authorId !== authorId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.review.update({
        where: { id },
        data: { rating, comment },
      });
      await recalcRating(r.targetId);
      return r;
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/reviews/[id] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/* DELETE /api/reviews/[id] ---------------------------------------------- */
export async function DELETE(req: NextRequest, context: any) {
  try {
    const id = Number(context.params.id);
    const { authorId } = await req.json();

    if (!authorId)
      return NextResponse.json({ error: "authorId required" }, { status: 400 });

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review || review.deleted)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (review.authorId !== authorId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.$transaction(async (tx) => {
      await tx.review.update({ where: { id }, data: { deleted: true } });
      await recalcRating(review.targetId);
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/reviews/[id] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
