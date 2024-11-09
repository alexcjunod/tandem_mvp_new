import Link from "next/link"
import { ArrowRight, BarChart3, Calendar, Target, CheckCircle2, Users, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link className="flex items-center justify-center gap-2" href="/">
          <Target className="h-6 w-6" />
          <span className="font-bold text-xl">Tandem</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#community">
            Community
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#about">
            About
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="/sign-in"
          >
            Sign In
          </Link>
          <Button asChild>
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Turn Goals into Reality, Together
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    Set SMART goals, track progress, and achieve more with AI-powered guidance and community support. 
                    Transform your aspirations into achievements—not alone, but in tandem.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" asChild>
                    <Link href="/sign-up">
                      Start Your Journey
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Feature Preview Cards */}
              <div className="mx-auto flex items-center justify-center">
                <div className="grid gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="grid gap-4">
                        <div className="flex items-center gap-4">
                          <Brain className="h-6 w-6" />
                          <div className="font-semibold">AI-Guided Goal Setting</div>
                        </div>
                        <div className="grid gap-2">
                          <div className="flex items-center gap-4">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <div className="text-sm">SMART Goal Framework</div>
                          </div>
                          <div className="flex items-center gap-4">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <div className="text-sm">Personalized Milestones</div>
                          </div>
                          <div className="flex items-center gap-4">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <div className="text-sm">Progress Analytics</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="grid gap-4">
                        <div className="flex items-center gap-4">
                          <Users className="h-6 w-6" />
                          <div className="font-semibold">Community Support</div>
                        </div>
                        <div className="grid gap-2">
                          <div className="flex items-center">
                            <div className="flex-1 space-y-1">
                              <div className="text-sm font-medium">Active Communities</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Connect with like-minded achievers
                              </div>
                            </div>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                            <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Transform Your Journey
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Discover how Tandem helps you achieve your goals with powerful features and community support.
                </p>
              </div>
            </div>
            {/* Feature cards would go here */}
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Ready to Achieve More?
                </h2>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Join thousands of achievers who are transforming their goals into reality with Tandem.
                </p>
              </div>
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2024 Tandem. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="/terms">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="/privacy">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
} 