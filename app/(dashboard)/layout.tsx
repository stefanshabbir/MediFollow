import Link from "next/link"
import { SignOutButton } from "@/components/sign-out-button"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex flex-col bg-muted/30">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
                <div className="flex h-16 items-center px-6">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2">
                            <span className="text-xl font-bold text-primary">MediFellow</span>
                        </Link>
                    </div>
                    <div className="ml-auto flex items-center gap-4">
                        <SignOutButton />
                    </div>
                </div>
            </header>
            <main className="flex-1 px-6 py-8">
                <div className="mx-auto max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    )
}
