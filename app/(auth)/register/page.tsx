import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Sign up | MediFellow",
  description: "Create your MediFellow account to manage appointments.",
};

export default function RegisterPage() {
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
        <RegisterForm />
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

