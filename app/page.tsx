"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { SignInButton, SignUpButton } from "@clerk/nextjs"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && user) {
      router.push('/dashboard')
    }
  }, [isLoaded, user, router])

  if (!isLoaded) return null

  if (!user) {
    return (
      <>
        {/* Mobile Layout */}
        <div className="md:hidden min-h-screen bg-background relative">
          <>
            <Image
              src="/hero-mobile.jpg"
              alt="Tandem App"
              fill
              style={{ objectFit: 'cover' }}
              priority
              className="block dark:hidden"
            />
            <Image
              src="/hero-mobile-dark.jpg"
              alt="Tandem App"
              fill
              style={{ objectFit: 'cover' }}
              priority
              className="hidden dark:block"
            />
          </>
          <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6">
            <div className="w-full max-w-sm space-y-6">
              <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  Welcome to Tandem
                </h1>
                <p className="text-sm text-gray-200">
                  Track your goals, manage tasks, and achieve more together
                </p>
              </div>
              <div className="grid gap-4">
                <SignUpButton mode="modal" afterSignUpUrl="/dashboard" afterSignInUrl="/dashboard">
                  <Button className="w-full">
                    Create Account
                  </Button>
                </SignUpButton>
                <SignInButton mode="modal" afterSignInUrl="/dashboard">
                  <Button variant="outline" className="w-full bg-white/10 hover:bg-white/20">
                    Sign In
                  </Button>
                </SignInButton>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="container relative hidden min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
          <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex">
            <div className="absolute inset-0 bg-zinc-900" />
            <div className="relative z-20 flex items-center text-lg font-medium">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-6 w-6"
              >
                <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
              </svg>
              Tandem
            </div>
            <div className="relative z-20 mt-auto">
              <blockquote className="space-y-2">
                <p className="text-lg">
                  &ldquo;Tandem has revolutionized how I track my goals and manage my daily tasks. 
                  The collaborative features make it easy to stay accountable and achieve more.&rdquo;
                </p>
                <footer className="text-sm">Alex Johnson</footer>
              </blockquote>
            </div>
          </div>
          <div className="lg:p-8 h-full flex items-center">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
              <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Welcome to Tandem
                </h1>
                <p className="text-sm text-muted-foreground">
                  Track your goals, manage tasks, and achieve more together
                </p>
              </div>
              <div className="grid gap-4">
                <SignUpButton mode="modal" afterSignUpUrl="/dashboard" afterSignInUrl="/dashboard">
                  <Button 
                    className="w-full"
                    onClick={() => console.log('Sign Up clicked')}
                  >
                    Create Account
                  </Button>
                </SignUpButton>
                <SignInButton mode="modal" afterSignInUrl="/dashboard">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => console.log('Sign In clicked')}
                  >
                    Sign In
                  </Button>
                </SignInButton>
              </div>
              <p className="px-8 text-center text-sm text-muted-foreground">
                By clicking continue, you agree to our{" "}
                <Link
                  href="/terms"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </>
    )
  }

  return null
} 
