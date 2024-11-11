"use client"

import { useState } from 'react'
import { useUser, useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"

export default function DebugPage() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [logs, setLogs] = useState<string[]>([])

  const log = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  const testClerk = async () => {
    try {
      log('1. Getting Clerk user info...')
      log(`User ID: ${user?.id}`)
      log(`Email: ${user?.emailAddresses[0].emailAddress}`)

      log('2. Getting Clerk token...')
      const token = await getToken({ template: "supabase" })
      log(`Token received: ${!!token}`)

      if (token) {
        const decoded = JSON.parse(atob(token.split('.')[1]))
        log('3. Decoded token:')
        log(JSON.stringify(decoded, null, 2))
      }
    } catch (error: any) {
      log(`ERROR: ${error.message}`)
    }
  }

  const testSupabase = async () => {
    try {
      log('1. Testing Supabase connection...')
      const { data, error } = await supabase.from('goals').select('count')
      
      if (error) {
        throw error
      }

      log(`2. Connection successful! Count: ${data.length}`)
    } catch (error: any) {
      log(`ERROR: ${error.message}`)
    }
  }

  const clearLogs = () => setLogs([])

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Auth Debug</h1>
          <p>User ID: {user?.id || 'Not logged in'}</p>
        </div>

        <div className="space-x-4">
          <Button onClick={testClerk}>Test Clerk</Button>
          <Button onClick={testSupabase}>Test Supabase</Button>
          <Button variant="outline" onClick={clearLogs}>Clear Logs</Button>
        </div>

        <div className="mt-4 p-4 bg-black/10 rounded-lg">
          <h2 className="font-bold mb-2">Logs:</h2>
          {logs.map((log, i) => (
            <pre key={i} className="text-sm whitespace-pre-wrap">{log}</pre>
          ))}
        </div>
      </div>
    </div>
  )
} 