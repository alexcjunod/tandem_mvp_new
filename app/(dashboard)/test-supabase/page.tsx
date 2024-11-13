"use client"

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/nextjs"

export default function TestSupabase() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  const { user } = useUser()

  const testConnection = async () => {
    try {
      console.log('Test page - User ID:', user?.id)
      
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user?.id)

      console.log('Test page - Supabase response:', { data, error })

      if (error) throw error

      setData(data)
      setError(null)
    } catch (err: any) {
      console.error('Test page - Error:', err)
      setError(err.message)
      setData(null)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Supabase Test</h1>
      <div className="mb-4">
        <p>Clerk User ID: {user?.id || 'Not logged in'}</p>
      </div>
      <Button onClick={testConnection} className="mb-4">
        Test Supabase Connection
      </Button>
      {data && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  )
}