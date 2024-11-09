import Link from "next/link"
import { ArrowRight, BarChart3, Calendar, Target, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function Component() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link className="flex items-center justify-center" href="#">
          <Target className="h-6 w-6" />
          <span className="sr-only">GoalTracker</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#">
            Pricing
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#">
            About
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#">
            Contact
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="/dashboard"
          >
            Sign In
          </Link>
          <Button>Get Started</Button>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Transform Your Goals into Achievements
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    The intelligent goal tracking platform that helps you stay accountable and achieve your dreams.
                    Built for individuals who are serious about success.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline">
                    View Demo
                  </Button>
                </div>
              </div>
              <div className="mx-auto flex items-center justify-center">
                <div className="grid gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="grid gap-4">
                        <div className="flex items-center gap-4">
                          <BarChart3 className="h-6 w-6" />
                          <div className="font-semibold">Daily Progress</div>
                          <div className="ml-auto text-green-500">+28%</div>
                        </div>
                        <div className="grid gap-2">
                          <div className="flex items-center gap-4">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <div className="text-sm">Read for 30 minutes</div>
                          </div>
                          <div className="flex items-center gap-4">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <div className="text-sm">Exercise for 1 hour</div>
                          </div>
                          <div className="flex items-center gap-4">
                            <CheckCircle2 className="h-4 w-4" />
                            <div className="text-sm">Meditate for 10 minutes</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="grid gap-4">
                        <div className="flex items-center gap-4">
                          <Calendar className="h-6 w-6" />
                          <div className="font-semibold">Weekly Overview</div>
                        </div>
                        <div className="grid gap-2">
                          <div className="flex items-center">
                            <div className="flex-1 space-y-1">
                              <div className="text-sm font-medium">Goals Completed</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">This week vs last week</div>
                            </div>
                            <div className="text-2xl font-bold">24/28</div>
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
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="text-sm font-semibold uppercase tracking-wide text-primary">
                  Testimonials
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Loved by Goal-Setters
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Hear from our users who have transformed their lives with our goal tracking platform.
                </p>
              </div>
            </div>
            <div className="mx-auto grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8 mt-12">
              {testimonials.map((testimonial, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="grid gap-4">
                      <div className="flex items-center gap-4">
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{testimonial.title}</div>
                      </div>
                      <div className="text-sm leading-loose text-gray-500 dark:text-gray-400">
                        "{testimonial.quote}"
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                    Start Your Journey Today
                  </h2>
                  <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                    Join thousands of successful individuals who have transformed their lives with our platform.
                    Set goals, track progress, and achieve more than you ever thought possible.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg">
                    Get Started Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mx-auto flex items-center justify-center">
                <Card className="w-full">
                  <CardContent className="p-6">
                    <div className="grid gap-4">
                      <div className="grid gap-1">
                        <div className="font-semibold">Free Forever Plan</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Get started with all the basics
                        </div>
                      </div>
                      <div className="text-3xl font-bold">$0</div>
                      <ul className="grid gap-2.5 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Unlimited goals
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Progress tracking
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Basic analytics
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Mobile app access
                        </li>
                      </ul>
                      <Button size="lg" variant="outline">
                        Get Started
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2024 GoalTracker. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}

const testimonials = [
  {
    name: "Alex Thompson",
    title: "Entrepreneur",
    quote: "This platform has completely transformed how I approach my goals. The accountability features keep me focused and motivated every single day."
  },
  {
    name: "Sarah Chen",
    title: "Fitness Coach",
    quote: "I recommend GoalTracker to all my clients. It's the perfect tool for tracking progress and staying motivated on your fitness journey."
  },
  {
    name: "Marcus Rodriguez",
    title: "Student",
    quote: "The visual progress tracking and streak features make achieving my academic goals feel like a game. I've never been more productive!"
  }
]