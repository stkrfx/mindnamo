/*
 * File: src/components/auth/RegisterForm.js
 * SR-DEV: Client Component for Registration
 *
 * Responsibilities:
 * 1. Form State Management
 * 2. Input Validation (Zod)
 * 3. Google Auth Integration
 * 4. Server Action Invocation
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { registerAction } from "@/actions/auth";
import { z } from "zod";
import { cn } from "@/lib/utils";

// UI Components
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2Icon, GoogleIcon, EyeIcon, EyeOffIcon } from "@/components/Icons";

// Zod Schema
const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  marketing: z.boolean().optional(),
});

export default function RegisterForm() {
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "", marketing: false });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();
  
  const router = useRouter();

  const handleGoogleSignIn = () => {
    startGoogleTransition(async () => {
      await signIn("google", { callbackUrl: "/" });
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setServerError("");

    // 1. Client Validation
    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // 2. Server Action
    const submitData = new FormData();
    submitData.append("fullName", formData.fullName);
    submitData.append("email", formData.email);
    submitData.append("password", formData.password);
    submitData.append("marketing", formData.marketing ? "true" : "false");

    startTransition(async () => {
      try {
        const response = await registerAction(submitData);

        if (response.success) {
          // Redirect to OTP page with email pre-filled
          router.push(`/otp?email=${encodeURIComponent(response.email)}`);
        } else {
          setServerError(response.message || "Registration failed. Please try again.");
        }
      } catch (err) {
        setServerError("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <div className="grid gap-6">
      {/* Google Button */}
      <Button 
        variant="outline" 
        type="button" 
        onClick={handleGoogleSignIn} 
        disabled={isPending || isGooglePending}
        className="w-full gap-2 h-11 text-base font-medium border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
      >
        {isGooglePending ? <Loader2Icon className="h-5 w-5 animate-spin" /> : <GoogleIcon className="h-5 w-5" />}
        Sign up with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-zinc-950 px-3 text-zinc-500 font-medium">
            Or continue with email
          </span>
        </div>
      </div>

      {/* Email Form */}
      <form onSubmit={handleSubmit} className="grid gap-5">
        {serverError && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg font-medium text-center dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400 animate-in fade-in zoom-in duration-300">
            {serverError}
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="fullName" className="text-zinc-700 dark:text-zinc-300">Full Name</Label>
          <Input
            id="fullName"
            placeholder="e.g. John Doe"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            disabled={isPending}
            className={cn(
              "h-11 transition-all focus:ring-2 focus:ring-offset-1", 
              errors.fullName ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-primary"
            )}
          />
          {errors.fullName && <p className="text-xs text-red-500 font-medium ml-1">{errors.fullName}</p>}
        </div>

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
          <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Min 8 characters"
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

        {/* Marketing Checkbox */}
        <div className="flex items-start space-x-3 pt-2">
            <Checkbox 
              id="marketing" 
              checked={formData.marketing} 
              onCheckedChange={(checked) => setFormData({...formData, marketing: checked})} 
              disabled={isPending}
              className="mt-0.5 border-zinc-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <div className="grid gap-1.5 leading-none">
              <label htmlFor="marketing" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                Keep me updated
              </label>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Receive promotional emails. You can unsubscribe anytime.
              </p>
            </div>
        </div>

        <div className="grid gap-4">
            <Button type="submit" className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all mt-2" disabled={isPending || isGooglePending}>
              {isPending ? <><Loader2Icon className="mr-2 h-5 w-5 animate-spin" /> Creating Account...</> : "Create Account"}
            </Button>
            
            <p className="text-xs text-center text-zinc-500 dark:text-zinc-400 px-4 leading-relaxed">
              By clicking "Create Account", you agree to our{" "}
              <Link href="/terms" className="underline underline-offset-2 hover:text-primary transition-colors">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-primary transition-colors">Privacy Policy</Link>.
            </p>
        </div>
      </form>
    </div>
  );
}