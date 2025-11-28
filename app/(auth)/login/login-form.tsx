"use client";

import Link from "next/link";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { useState, useTransition } from "react";
import { login } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type FormFields = {
  email: string;
  password: string;
  remember: boolean;
};

const initialState: FormFields = {
  email: "",
  password: "",
  remember: false,
};

export function LoginForm() {
  const [form, setForm] = useState<FormFields>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const emailIsValid = /\S+@\S+\.\S+/.test(form.email);
  const passwordIsValid = form.password.trim().length >= 6;
  const formIsValid = emailIsValid && passwordIsValid;

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formIsValid) {
      setError("Please enter a valid email and password (min 6 characters).");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('email', form.email);
        formData.append('password', form.password);

        const result = await login(formData);

        if (result?.error) {
          setError(result.error);
          return;
        }

        // Success is handled by redirect in action
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
        <CardTitle className="text-2xl font-semibold">Welcome back</CardTitle>
        <CardDescription>
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
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
              autoComplete="current-password"
              value={form.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              className="h-11"
              required
            />
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  name="remember"
                  checked={form.remember}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, remember: checked as boolean }))
                  }
                />
                <Label
                  htmlFor="remember"
                  className="text-sm font-normal cursor-pointer"
                >
                  Remember me
                </Label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
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
            {isPending ? "Signing in..." : "Sign in"}
          </Button>

          <div className="text-center text-sm text-muted-foreground pt-2">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

