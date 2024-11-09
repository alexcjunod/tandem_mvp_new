"use client"

import { useUser } from "@clerk/nextjs"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function ProfilePage() {
  const { user } = useUser()

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback>
                  {user?.fullName?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{user?.fullName}</h3>
                <p className="text-sm text-muted-foreground">{user?.emailAddresses[0].emailAddress}</p>
              </div>
            </div>
            
            {/* Add more profile settings here */}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 