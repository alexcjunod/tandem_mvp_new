import { NextResponse } from 'next/server'
import { getGoalsServer } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const goals = await getGoalsServer(userId)
    return NextResponse.json(goals, { status: 200 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 