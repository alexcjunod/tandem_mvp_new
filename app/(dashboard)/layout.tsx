"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { UserButton, useUser, useAuth } from "@clerk/nextjs"
import { Home, Users, Settings, Target } from "lucide-react"
import { updateSupabaseAuthToken } from "@/lib/supabase/client"

const sidebarLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/community", label: "Community", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [isSupabaseReady, setIsSupabaseReady] = useState(false)

  // Set up Supabase auth
  useEffect(() => {
    async function setupSupabase() {
      if (!user || !isLoaded) return
      
      try {
        console.log('Getting Clerk token...')
        const token = await getToken({ template: "supabase" })
        console.log('Clerk token received:', !!token)
        
        if (!token) {
          throw new Error('No auth token available')
        }

        const session = await updateSupabaseAuthToken(token)
        if (!session) {
          throw new Error('Failed to set up Supabase auth')
        }

        setIsSupabaseReady(true)
      } catch (err) {
        console.error('Error setting up Supabase:', err)
        console.warn('Auth setup failed, check configuration')
      }
    }

    if (isLoaded) {
      setupSupabase()
    }
  }, [user, isLoaded, getToken])

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex h-screen">
      <aside className="hidden w-64 border-r bg-card md:block">
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center border-b px-4">
            <span className="font-semibold">Tandem</span>
          </div>
          <nav className="flex-1 space-y-1 p-2">
            {sidebarLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
          </nav>
          <div className="border-t p-4">
            {mounted && isLoaded && (
              <div className="flex items-center gap-3">
                <UserButton afterSignOutUrl="/" />
                {user && (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.fullName}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.emailAddresses[0].emailAddress}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
} 