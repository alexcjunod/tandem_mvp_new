"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase/service'

export default function TestSupabase() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('id, title')
        .limit(1)

      console.log('Supabase response:', { data, error })

      if (error) throw error

      setData(data)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching from Supabase:', err)
      setError(err.message)
      setData(null)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Supabase Test</h1>
      <button onClick={testConnection} className="bg-blue-500 text-white px-4 py-2 rounded">
        Test Supabase Connection
      </button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  )
} 