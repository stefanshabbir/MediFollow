import type { Metadata } from "next";
import Link from "next/link";
import { OrgRegisterForm } from "./org-register-form";

export const metadata: Metadata = {
    title: "Register Organization | MediFellow",
    description: "Register your organization with MediFellow.",
};

export default function RegisterOrgPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <Link
                        href="/"
                        className="inline-block text-2xl font-bold text-primary transition-colors hover:text-primary/90"
                    >
                        MediFellow
                    </Link>
                </div>
                <OrgRegisterForm />
                <p className="mt-6 text-center text-xs text-muted-foreground">
                    By continuing, you agree to MediFellow's{" "}
                    <Link href="/terms" className="font-medium text-primary underline-offset-4 hover:underline">
                        Terms
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
                        Privacy Policy
                    </Link>
                    .
                </p>
            </div>
        </div>
    );
}
