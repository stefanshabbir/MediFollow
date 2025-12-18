import Link from "next/link"
import { SignOutButton } from "@/components/sign-out-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

async function getUserProfile() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single()

    return profile
}

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const profile = await getUserProfile()

    if (!profile) {
        redirect('/login')
    }

    const navLinks = {
        patient: [
            { href: '/patient', label: 'Dashboard' },
            { href: '/patient/book', label: 'Book Appointment' },
        ],
        doctor: [
            { href: '/doctor', label: 'Dashboard' },
            { href: '/doctor/schedule', label: 'My Schedule' },
        ],
        admin: [
            { href: '/admin', label: 'Dashboard' },
            { href: '/admin/invite', label: 'Invite Doctor' },
        ],
    }

    const links = navLinks[profile.role as keyof typeof navLinks] || []

    return (
        <div className="min-h-screen flex flex-col bg-muted/30">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-16 items-center px-6">
                    {/* Logo */}
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                                M
                            </div>
                            <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                                MediFollow
                            </span>
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <nav className="hidden md:flex items-center gap-1 ml-8">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right Side */}
                    <div className="ml-auto flex items-center gap-3">
                        {/* User Info */}
                        <div className="hidden sm:flex items-center gap-3 pr-3 border-r border-border">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="hidden lg:block">
                                <p className="text-sm font-medium text-foreground truncate max-w-[150px]">
                                    {profile.full_name || 'User'}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">
                                    {profile.role}
                                </p>
                            </div>
                        </div>

                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Sign Out */}
                        <SignOutButton />
                    </div>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex md:hidden items-center gap-1 px-6 pb-3 overflow-x-auto">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors whitespace-nowrap"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </header>

            <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8">
                <div className="mx-auto max-w-7xl">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t bg-background py-4 px-6">
                <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} MediFollow. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
                        <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
                        <Link href="#" className="hover:text-foreground transition-colors">Help</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
