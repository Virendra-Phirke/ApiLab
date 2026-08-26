import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.method !== undefined) updateData.method = body.method;
    if (body.url !== undefined) updateData.url = body.url.trim();
    if (body.headers !== undefined) updateData.headers = body.headers;
    if (body.queryParams !== undefined) updateData.queryParams = body.queryParams;
    if (body.body !== undefined) updateData.body = body.body;
    if (body.auth !== undefined) updateData.auth = body.auth;
    if (body.config !== undefined) updateData.config = body.config;
    if (body.stats !== undefined) updateData.stats = body.stats;
    if (body.status !== undefined) updateData.status = body.status;

    await db
      .update(schema.schedules)
      .set(updateData)
      .where(eq(schema.schedules.id, id));

    return NextResponse.json({ success: true, id, updated: updateData });
  } catch (error: any) {
    console.error('Error updating schedule in DB:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db
      .delete(schema.schedules)
      .where(eq(schema.schedules.id, id));

    return NextResponse.json({ success: true, id, deleted: true });
  } catch (error: any) {
    console.error('Error deleting schedule from DB:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}
