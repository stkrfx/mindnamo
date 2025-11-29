/*
 * File: src/components/UserProfileChangePassword.js
 * SR-DEV: Dedicated form for securely changing user password.
 * Imports: Assumes changePasswordAction is available in "@/actions/password".
 */

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2Icon, EyeIcon, EyeOffIcon } from "@/components/Icons";
import { Lock, Save } from "lucide-react";

// Placeholder import for the Server Action (File 97)
// This file needs to exist for the code to run correctly.
import { changePasswordAction } from "@/actions/password"; 

// --- Validation Schema ---
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Your current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
  confirmPassword: z.string().min(8, "Confirmation is required."),
})
.refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match.",
  path: ["confirmPassword"], // Apply error message to this field
});

export default function UserProfileChangePassword() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data) => {
    startTransition(async () => {
      // Create FormData to send to the Server Action
      const formData = new FormData();
      formData.append("currentPassword", data.currentPassword);
      formData.append("newPassword", data.newPassword);

      const result = await changePasswordAction(formData);

      if (result.success) {
        toast.success("Password Updated", {
          description: "Your password has been changed successfully.",
        });
        reset(); // Clear the form fields on success
      } else {
        toast.error("Update Failed", {
          description: result.message || "An unexpected error occurred.",
        });
      }
    });
  };

  return (
    <div className="p-6 md:p-8">
      <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <Lock className="w-5 h-5 text-zinc-500" /> Change Password
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
        
        {/* Current Password */}
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current Password</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              placeholder="Enter your current password"
              {...register("currentPassword")}
              disabled={isPending}
              className={cn("h-11 pr-10", errors.currentPassword && "border-red-500")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-11 w-11 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? <EyeOffIcon /> : <EyeIcon />}
            </Button>
          </div>
          {errors.currentPassword && <p className="text-xs text-red-500">{errors.currentPassword.message}</p>}
        </div>

        {/* New Password */}
        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              placeholder="Minimum 8 characters"
              {...register("newPassword")}
              disabled={isPending}
              className={cn("h-11 pr-10", errors.newPassword && "border-red-500")}
            />
             <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-11 w-11 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
            </Button>
          </div>
          {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword.message}</p>}
        </div>

        {/* Confirm New Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter new password"
            {...register("confirmPassword")}
            disabled={isPending}
            className={cn("h-11", errors.confirmPassword && "border-red-500")}
          />
          {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button 
            type="submit" 
            disabled={isPending || !isDirty || !!errors.newPassword}
            className="min-w-[140px] shadow-md bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Change Password</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}