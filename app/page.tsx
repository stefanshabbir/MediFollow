import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted px-4 py-20 lg:py-32">
        <div className="w-full max-w-5xl space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Healthcare management
              <br />
              <span className="text-primary">made simple</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground lg:text-xl">
              Streamline your medical appointments and follow-ups with MediFollow.
              A modern platform designed for patients, doctors, and healthcare organizations.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/register">Get Started Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            No credit card required • Free for patients
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-background px-4 py-16 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground lg:text-4xl">
              Everything you need to manage healthcare
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Simple, powerful tools for patients and healthcare providers
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border bg-card p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-foreground">Easy Scheduling</h3>
              <p className="text-muted-foreground">
                Book and manage your appointments effortlessly with our intuitive calendar interface.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-foreground">Smart Reminders</h3>
              <p className="text-muted-foreground">
                Never miss an appointment with automated reminders and follow-up notifications.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-foreground">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your health information is protected with enterprise-grade security and encryption.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary px-4 py-16 lg:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-primary-foreground lg:text-4xl">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/90">
            Join thousands of users managing their healthcare with MediFollow
          </p>
          <div className="mt-8">
            <Button asChild size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <Link href="/register">Create Free Account</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
