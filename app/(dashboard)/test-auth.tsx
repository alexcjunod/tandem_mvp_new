"use client"

import { useState, useEffect } from 'react'
import { useUser, useAuth } from "@clerk/nextjs"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function TestAuth() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  const testAuth = async () => {
    try {
      // Step 1: Get Clerk token
      addLog('Getting Clerk token...')
      const token = await getToken({ 
        template: "supabase",
        skipCache: true
      })
      addLog(`Clerk token received: ${!!token}`)
      
      if (!token) {
        throw new Error('No token received from Clerk')
      }

      // Log the token for debugging (remove in production)
      addLog(`Token preview: ${token.substring(0, 50)}...`)
      console.log('Full token:', token)

      // Step 2: Set up Supabase session
      addLog('Setting up Supabase session...')
      
      // First sign out
      await supabase.auth.signOut()
      addLog('Cleared existing sessions')

      // Then set up new session
      const { data, error } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: token
      })

      if (error) {
        throw error
      }

      addLog(`Supabase session created: ${data.session?.user?.id}`)
      addLog(`User role: ${data.session?.user?.role}`)

      // Step 3: Test a simple query
      addLog('Testing Supabase query...')
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .limit(1)

      if (goalsError) {
        throw goalsError
      }

      addLog(`Query successful! Found ${goals.length} goals`)

    } catch (error: any) {
      addLog(`ERROR: ${error.message}`)
      console.error('Full error:', error)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Auth Test</h1>
          <p>User ID: {user?.id || 'Not logged in'}</p>
        </div>

        <Button onClick={testAuth}>Test Auth Flow</Button>

        <div className="mt-4 p-4 bg-black/10 rounded-lg">
          <h2 className="font-bold mb-2">Logs:</h2>
          {logs.map((log, i) => (
            <pre key={i} className="text-sm">{log}</pre>
          ))}
        </div>
      </div>
    </div>
  )
} 