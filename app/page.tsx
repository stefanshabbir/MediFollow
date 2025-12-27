import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Bar */}
      <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              M
            </div>
            <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
              MediFollow
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center bg-gradient-to-b from-background via-background to-muted px-4 py-24 lg:py-40 mt-16">
        <div className="w-full max-w-5xl space-y-8 text-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground mb-4">
              <span className="relative flex h-2 w-2">
                <span className="inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Now available for healthcare providers
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Healthcare management
              <br />
              <span className="text-primary">
                made simple
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground lg:text-xl">
              Streamline your medical appointments and follow-ups with MediFollow.
              A modern platform designed for patients, doctors, and healthcare organizations.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="min-w-[200px]">
              <Link href="/register">Get Started Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-w-[200px]">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            No credit card required • Free for patients • HIPAA compliant
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-muted/30 px-4 py-16 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground lg:text-4xl">
              Everything you need to manage healthcare
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Simple, powerful tools for patients and healthcare providers
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="group rounded-lg border bg-card p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Easy Scheduling</h3>
              <p className="text-sm text-muted-foreground">
                Book and manage your appointments effortlessly with our intuitive calendar interface.
              </p>
            </div>

            <div className="group rounded-lg border bg-card p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Smart Reminders</h3>
              <p className="text-sm text-muted-foreground">
                Never miss an appointment with automated reminders and follow-up notifications.
              </p>
            </div>

            <div className="group rounded-lg border bg-card p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Secure & Private</h3>
              <p className="text-sm text-muted-foreground">
                Your health information is protected with enterprise-grade security and encryption.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-background px-4 py-16 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">10K+</div>
              <p className="mt-2 text-muted-foreground">Active Patients</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">500+</div>
              <p className="mt-2 text-muted-foreground">Healthcare Providers</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">50K+</div>
              <p className="mt-2 text-muted-foreground">Appointments Booked</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">99.9%</div>
              <p className="mt-2 text-muted-foreground">Uptime</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary px-4 py-16 lg:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-primary-foreground lg:text-3xl">
            Ready to get started?
          </h2>
          <p className="mt-3 text-primary-foreground/90">
            Join thousands of users managing their healthcare with MediFollow
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="min-w-[180px] bg-white text-primary hover:bg-white/90">
              <Link href="/register">Create Free Account</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-w-[180px] border-white/30 text-primary-foreground hover:bg-white/10">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-background py-8 px-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground font-bold text-xs">
              M
            </div>
            <span className="font-semibold text-foreground">MediFollow</span>
          </div>
          <p>&copy; {new Date().getFullYear()} MediFollow. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
