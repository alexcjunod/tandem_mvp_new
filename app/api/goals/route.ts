import { NextResponse } from 'next/server'
import { getGoalsServer } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs'

export async function GET() {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const goals = await getGoalsServer(userId)
    return new NextResponse(
      JSON.stringify(goals), 
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('API Error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }), 
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
} 