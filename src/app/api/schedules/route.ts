import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { auth } from '@/lib/auth';
import { eq, desc, or, isNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    let result;
    if (session?.user?.id) {
      result = await db
        .select()
        .from(schema.schedules)
        .where(
          or(
            eq(schema.schedules.userId, session.user.id),
            isNull(schema.schedules.userId)
          )
        )
        .orderBy(desc(schema.schedules.createdAt));
    } else {
      result = await db
        .select()
        .from(schema.schedules)
        .where(isNull(schema.schedules.userId))
        .orderBy(desc(schema.schedules.createdAt));
    }

    return NextResponse.json({ success: true, schedules: result });
  } catch (error: any) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const body = await request.json();
    const { id, name, method, url, headers, queryParams, body: reqBody, auth: reqAuth, config, stats, status } = body;

    if (!name || !url) {
      return NextResponse.json(
        { success: false, error: 'Schedule name and target URL are required' },
        { status: 400 }
      );
    }

    const scheduleId = id || uuidv4();
    const newSchedule = {
      id: scheduleId,
      userId: session?.user?.id || null,
      name: name.trim(),
      method: method || 'GET',
      url: url.trim(),
      headers: headers || [],
      queryParams: queryParams || [],
      body: reqBody || { type: 'none', content: '' },
      auth: reqAuth || { type: 'none' },
      config: config,
      stats: stats || null,
      status: status || 'idle',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schema.schedules).values(newSchedule);

    return NextResponse.json({ success: true, schedule: newSchedule });
  } catch (error: any) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create schedule' },
      { status: 500 }
    );
  }
}
