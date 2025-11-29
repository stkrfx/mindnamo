/*
 * File: src/components/UserProfileTabs.js
 * SR-DEV: Tabbed layout for User Profile Settings
 * Hosts: General Info, Notifications, and Change Password sections.
 */

"use client";

import UserProfileForm from "@/components/UserProfileForm";
import UserProfileChangePassword from "@/components/UserProfileChangePassword";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UserProfileTabs({ user }) {
  // We use the same component (UserProfileForm) but render different sections
  // based on the tab, or we can use two distinct components for clarity.
  // We will use two distinct components: UserProfileForm (General+Notifications) 
  // and UserProfileChangePassword.
  
  return (
    <div className="w-full">
      <Tabs defaultValue="general" className="w-full">
        
        {/* Tab Headers */}
        <TabsList className="w-full justify-start h-auto p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border-b border-zinc-200 dark:border-zinc-800">
           <TabsTrigger value="general" className={cn("flex-1 py-2.5 rounded-lg font-medium flex items-center gap-2")}>
              <User className="w-4 h-4" /> General
           </TabsTrigger>
           <TabsTrigger value="security" className={cn("flex-1 py-2.5 rounded-lg font-medium flex items-center gap-2")}>
              <Lock className="w-4 h-4" /> Security
           </TabsTrigger>
        </TabsList>

        {/* Tab Content 1: General & Notifications */}
        <TabsContent value="general" className="animate-in fade-in duration-300">
           <UserProfileForm user={user} />
        </TabsContent>
        
        {/* Tab Content 2: Security (Password Change) */}
        <TabsContent value="security" className="animate-in fade-in duration-300">
           <UserProfileChangePassword />
        </TabsContent>
      </Tabs>
    </div>
  );
}