/*
 * File: src/components/UserProfileForm.js
 * SR-DEV: Interactive User Profile Form
 * Features:
 * - Image Upload with Preview (UploadThing)
 * - Zod Validation via React Hook Form
 * - Notification Preferences
 */

"use client";

import { useState, useTransition, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateUserAction } from "@/actions/user";
import { useUploadThing } from "@/lib/uploadthing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import ProfileImage from "@/components/ProfileImage";
import { Loader2, Camera, Save, User, Bell, Shield } from "lucide-react";

// Schema matching the server action validation
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  profilePicture: z.string().optional(),
  marketing: z.boolean().default(false),
  security: z.boolean().default(true),
  transactional: z.boolean().default(true),
});

export default function UserProfileForm({ user }) {
  const [isPending, startTransition] = useTransition();
  const [previewImage, setPreviewImage] = useState(user.profilePicture || "");
  const fileInputRef = useRef(null);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || "",
      profilePicture: user.profilePicture || "",
      marketing: user.notificationPreferences?.marketing || false,
      security: user.notificationPreferences?.security || true,
      transactional: user.notificationPreferences?.transactional || true,
    },
  });

  // --- File Upload Logic ---
  const { startUpload, isUploading } = useUploadThing("profilePicture", {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        const newUrl = res[0].url;
        setPreviewImage(newUrl);
        setValue("profilePicture", newUrl, { shouldDirty: true });
        toast.success("Image uploaded successfully");
      }
    },
    onUploadError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Optimistic preview (blob)
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);

    // Start upload
    await startUpload([file]);
  };

  // --- Submit Logic ---
  const onSubmit = (data) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("profilePicture", data.profilePicture);
      formData.append("marketing", data.marketing);
      formData.append("security", data.security);
      formData.append("transactional", data.transactional);

      const result = await updateUserAction(formData);

      if (result.success) {
        toast.success("Profile Updated", {
          description: "Your changes have been saved successfully.",
        });
        // Reset form state implicitly by re-rendering or keep as is
      } else {
        toast.error("Update Failed", {
          description: result.message,
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="divide-y divide-zinc-100 dark:divide-zinc-800">
      
      {/* 1. General Info */}
      <div className="p-6 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-zinc-100 dark:border-zinc-800 shadow-sm">
                <ProfileImage 
                  src={previewImage} 
                  name={watch("name")} 
                  sizeClass="h-full w-full" 
                  textClass="text-2xl"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="button"
                disabled={isUploading || isPending}
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
              >
                <Camera className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
            <p className="text-xs text-zinc-500 font-medium">JPG, PNG max 4MB</p>
          </div>

          {/* Text Fields */}
          <div className="flex-1 w-full space-y-6 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-700 dark:text-zinc-300">Display Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input 
                  id="name" 
                  {...register("name")} 
                  className="pl-9 bg-zinc-50/50 dark:bg-zinc-900" 
                  placeholder="Your Name" 
                />
              </div>
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300">Email Address</Label>
              <Input 
                id="email" 
                value={user.email} 
                disabled 
                className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed" 
              />
              <p className="text-xs text-zinc-400">
                Email cannot be changed securely here. Contact support if needed.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Notification Preferences */}
      <div className="p-6 md:p-8">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1 flex items-center gap-2">
          <Bell className="w-4 h-4" /> Notifications
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          Choose what updates you want to receive.
        </p>

        <div className="space-y-4 max-w-2xl">
          
          <div className="flex items-start space-x-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
            <Checkbox id="transactional" checked={watch("transactional")} onCheckedChange={(c) => setValue("transactional", c, { shouldDirty: true })} />
            <div className="grid gap-1.5 leading-none">
              <label htmlFor="transactional" className="text-sm font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer">
                Session Updates
              </label>
              <p className="text-xs text-zinc-500">
                Reminders about upcoming sessions, cancellations, and messages. (Recommended)
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
            <Checkbox id="security" checked={watch("security")} onCheckedChange={(c) => setValue("security", c, { shouldDirty: true })} />
            <div className="grid gap-1.5 leading-none">
              <label htmlFor="security" className="text-sm font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer">
                Security Alerts
              </label>
              <p className="text-xs text-zinc-500">
                Notifications about login attempts and password changes.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
            <Checkbox id="marketing" checked={watch("marketing")} onCheckedChange={(c) => setValue("marketing", c, { shouldDirty: true })} />
            <div className="grid gap-1.5 leading-none">
              <label htmlFor="marketing" className="text-sm font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer">
                Wellness Tips & News
              </label>
              <p className="text-xs text-zinc-500">
                Weekly mental health tips and platform updates.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Actions */}
      <div className="p-6 md:p-8 bg-zinc-50/30 dark:bg-zinc-900/30 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Shield className="w-3.5 h-3.5" />
          Your data is securely encrypted.
        </div>
        <Button 
          type="submit" 
          disabled={isPending || !isDirty}
          className={cn("min-w-[120px]", isDirty && "animate-pulse-slow")}
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save Changes</>
          )}
        </Button>
      </div>

    </form>
  );
}