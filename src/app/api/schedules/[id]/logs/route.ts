import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const logs = await db
      .select()
      .from(schema.scheduleLogs)
      .where(eq(schema.scheduleLogs.scheduleId, id))
      .orderBy(desc(schema.scheduleLogs.timestamp))
      .limit(100);

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error('Error fetching schedule logs:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch logs' },
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
      .delete(schema.scheduleLogs)
      .where(eq(schema.scheduleLogs.scheduleId, id));

    return NextResponse.json({ success: true, cleared: true });
  } catch (error: any) {
    console.error('Error clearing schedule logs:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to clear logs' },
      { status: 500 }
    );
  }
}
