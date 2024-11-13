"use client"

import { useUser } from "@clerk/nextjs"

export default function TestClerk() {
  const { user } = useUser()

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Clerk User Test</h1>
      <p>User ID: {user?.id || 'Not logged in'}</p>
      <p>Email: {user?.primaryEmailAddress?.emailAddress || 'No email'}</p>
    </div>
  )
} 