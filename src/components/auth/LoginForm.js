/*
 * File: src/components/auth/LoginForm.js
 * SR-DEV: Client Component for Login
 *
 * Features:
 * - Handles Credentials & Google Auth.
 * - Parses URL errors from NextAuth.
 * - Zod Validation & Loading States.
 */

"use client";

import { useState, useTransition, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { cn } from "@/lib/utils";

// UI Components
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2Icon, GoogleIcon, EyeIcon, EyeOffIcon } from "@/components/Icons";

// Validation Schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState("");

  const [isPending, startTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // Handle NextAuth URL Errors (e.g. ?error=CredentialsSignin)
  useEffect(() => {
    const errorType = searchParams.get("error");
    if (errorType === "CredentialsSignin") {
      setAuthError("Invalid email or password.");
    } else if (errorType === "OAuthAccountNotLinked") {
      setAuthError("Email already in use with a different provider.");
    } else if (errorType) {
      setAuthError("Authentication failed. Please try again.");
    }
  }, [searchParams]);

  const handleGoogleSignIn = () => {
    startGoogleTransition(async () => {
      await signIn("google", { callbackUrl });
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setAuthError("");

    // 1. Client Validation
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // 2. Sign In
    startTransition(async () => {
      try {
        const res = await signIn("credentials", {
          redirect: false, // We handle redirect manually for better UX control
          email: formData.email,
          password: formData.password,
          callbackUrl,
        });

        if (res?.error) {
          // If logic in [...nextauth] throws, it comes back here
          if (res.error.includes("verified")) {
            setAuthError("Email not verified. Please check your inbox.");
          } else {
            setAuthError("Invalid email or password.");
          }
        } else {
          // Success - Hard redirect to ensure session cookies are set correctly
          router.push(callbackUrl);
          router.refresh();
        }
      } catch (err) {
        setAuthError("An unexpected error occurred.");
      }
    });
  };

  return (
    <div className="grid gap-6">
      <Button 
        variant="outline" 
        type="button" 
        onClick={handleGoogleSignIn} 
        disabled={isPending || isGooglePending}
        className="w-full gap-2 h-11 text-base font-medium border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
      >
        {isGooglePending ? <Loader2Icon className="h-5 w-5 animate-spin" /> : <GoogleIcon className="h-5 w-5" />}
        Sign in with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200 dark:border-zinc-800" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-zinc-950 px-3 text-zinc-500 font-medium">Or continue with email</span></div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5">
        {authError && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg font-medium text-center dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400 animate-in fade-in zoom-in duration-300">
            {authError}
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={isPending}
            className={cn(
              "h-11 transition-all focus:ring-2 focus:ring-offset-1", 
              errors.email ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-primary"
            )}
          />
          {errors.email && <p className="text-xs text-red-500 font-medium ml-1">{errors.email}</p>}
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
             <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300">Password</Label>
             <Link href={`/forgot-password?email=${encodeURIComponent(formData.email)}`} className="text-xs font-medium text-primary hover:underline">
               Forgot password?
             </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="********"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={isPending}
              className={cn(
                "h-11 pr-10 transition-all focus:ring-2 focus:ring-offset-1", 
                errors.password ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-primary"
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-11 w-11 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </Button>
          </div>
          {errors.password && <p className="text-xs text-red-500 font-medium ml-1">{errors.password}</p>}
        </div>

        <Button type="submit" className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all mt-2" disabled={isPending || isGooglePending}>
          {isPending ? <><Loader2Icon className="mr-2 h-5 w-5 animate-spin" /> Logging in...</> : "Login"}
        </Button>
      </form>
    </div>
  );
}