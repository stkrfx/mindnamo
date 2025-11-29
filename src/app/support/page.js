/*
 * File: src/app/support/page.js
 * SR-DEV: Help & Support Page
 */

import SupportClient from "./SupportClient";

export const metadata = {
  title: "Help Center | Mind Namo",
  description: "Find answers to your questions, manage your appointments, or contact our support team.",
};

export default function SupportPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-zinc-50 dark:bg-zinc-950">
      <SupportClient />
    </div>
  );
}