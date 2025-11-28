"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { signup } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type FormFields = {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  role: "patient" | "doctor" | "admin";
};

const initialState: FormFields = {
  email: "",
  password: "",
  confirmPassword: "",
  fullName: "",
  role: "patient",
};

export function RegisterForm() {
  const [form, setForm] = useState<FormFields>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const emailIsValid = /\S+@\S+\.\S+/.test(form.email);
  const passwordIsValid = form.password.trim().length >= 6;
  const passwordsMatch = form.password === form.confirmPassword;
  const nameIsValid = form.fullName.trim().length >= 2;
  const formIsValid = emailIsValid && passwordIsValid && passwordsMatch && nameIsValid;

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formIsValid) {
      if (!passwordsMatch) {
        setError("Passwords do not match.");
      } else {
        setError("Please fill in all fields correctly.");
      }
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('email', form.email);
        formData.append('password', form.password);
        // role is handled on server

        const result = await signup(formData);

        if (result?.error) {
          setError(result.error);
          return;
        }

        setSuccess("Account created successfully! Please check your email to verify your account.");
      } catch (submissionError) {
        if (isRedirectError(submissionError)) {
          throw submissionError;
        }
        console.error(submissionError);
        setError("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-semibold">Create an account</CardTitle>
        <CardDescription>
          Enter your information to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              value={form.fullName}
              onChange={handleInputChange}
              placeholder="John Doe"
              className="h-11"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={form.email}
              onChange={handleInputChange}
              placeholder="you@example.com"
              className="h-11"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleInputChange}
              placeholder="At least 6 characters"
              className="h-11"
              required
            />
            <p className="text-xs text-muted-foreground">
              Must be at least 6 characters long
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              className="h-11"
              required
            />
            {form.confirmPassword && !passwordsMatch && (
              <p className="text-xs text-destructive">
                Passwords do not match
              </p>
            )}
          </div>

          {error && (
            <div
              aria-live="polite"
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              aria-live="polite"
              className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400"
            >
              {success}
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending || !formIsValid}
            className="w-full h-11 text-base font-medium"
          >
            {isPending ? "Creating account..." : "Create account"}
          </Button>

          <div className="text-center text-sm text-muted-foreground pt-2">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </div>
          <div className="text-center text-sm text-muted-foreground pt-1">
            <Link
              href="/register-org"
              className="font-medium text-primary hover:underline"
            >
              Register an Organization
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

