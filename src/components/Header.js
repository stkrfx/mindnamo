/*
 * File: src/components/Header.js
 * SR-DEV: Header Refactor (Final Polish)
 * UPGRADES: 
 * - Replaced scroll state with useRef for performance.
 * - Added scroll threshold (10px) to prevent jitter.
 * - Added top buffer (100px) so header stays visible at top.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import ProfileImage from "@/components/ProfileImage";
import DarkModeToggle from "@/components/DarkModeToggle"; 
import { MindNamoLogo, BuildingIcon } from "@/components/Icons"; 
import UnreadChatIndicator from "@/components/UnreadChatIndicator"; 

// --- Icons ---
import { 
  Menu, User, Calendar, MessageSquare, LogOut, 
  Home, Search, LifeBuoy, MessageCircle, Moon, Sun 
} from "lucide-react";

const NAV_LINKS = [
  { name: "Home", href: "/", icon: Home },
  { name: "Experts", href: "/experts", icon: Search }, 
  { name: "Organizations", href: "/organizations", icon: BuildingIcon }, 
  { name: "My Appointments", href: "/appointments", icon: Calendar },
];

export default function Header() {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const [isVisible, setIsVisible] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Use Refs for scroll tracking to avoid re-renders during scroll
  const lastScrollY = useRef(0);

  const hasUnreadMessages = false; 
  const hideHeaderRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/otp"];
  const shouldHide = hideHeaderRoutes.includes(pathname);

  // --- Industry Standard Smart Scroll Logic ---
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const lastY = lastScrollY.current;
      
      // Calculate how much we scrolled
      const scrollDelta = Math.abs(currentScrollY - lastY);
      const isScrollingDown = currentScrollY > lastY;
      const isScrollingUp = currentScrollY < lastY;

      // 1. THRESHOLD: Ignore tiny scrolls (e.g., < 10px) to prevent "jitter"
      // This solves "hides too fast on a little scroll"
      if (scrollDelta < 10) {
        return;
      }

      // 2. LOGIC
      if (isScrollingDown) {
        // Only hide if we are passed the "Top Buffer" (e.g., 100px)
        // This ensures header stays visible while reading the Hero section
        if (currentScrollY > 100) {
           setIsVisible(false);
        }
        
        // Close dropdowns if scrolling down
        if (isProfileOpen) setIsProfileOpen(false);
      } 
      else if (isScrollingUp) {
        // Always show immediately when scrolling up
        setIsVisible(true);
      }

      // Update Ref
      lastScrollY.current = currentScrollY;
    };

    // Optimization: Throttling using requestAnimationFrame
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [isProfileOpen]);

  if (shouldHide) return null;

  const user = session?.user;

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };

  // Helper for active link styles
  const getLinkClass = (href) => {
    const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return cn(
      "relative text-sm font-medium transition-colors hover:text-primary",
      isActive ? "text-foreground font-bold" : "text-muted-foreground"
    );
  };

  const getMobileLinkClass = (href) => {
    const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors", 
      isActive ? "bg-zinc-100 dark:bg-zinc-800 text-foreground" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-foreground"
    );
  };

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 h-16 transition-transform duration-300 ease-in-out",
          // Apply transform based on visibility state
          isVisible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="container mx-auto h-full grid grid-cols-2 md:grid-cols-3 items-center px-4 md:px-6">
          
          {/* --- LEFT: Logo & Mobile Menu --- */}
          <div className="flex items-center justify-start gap-2">
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden shrink-0 -ml-2 mr-2">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              
              <SheetContent side="left" className="w-[300px] sm:w-[350px] flex flex-col p-0 gap-0">
                <SheetHeader className="p-6 border-b border-zinc-100 dark:border-zinc-900 text-left">
                  {user ? (
                    <div className="flex items-center gap-4">
                       <ProfileImage src={user.image} name={user.name} sizeClass="h-12 w-12" className="border-2 border-white shadow-sm" priority />
                       <div className="flex-1 overflow-hidden">
                         <SheetTitle className="font-bold text-lg truncate">{user.name}</SheetTitle>
                         <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                       </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                       <div className="bg-primary/10 p-2 rounded-lg">
                          <MindNamoLogo className="h-6 w-6 text-primary" />
                       </div>
                       <SheetTitle className="text-xl font-bold">Mind Namo</SheetTitle>
                    </div>
                  )}
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-6 px-4">
                  <div className="flex flex-col gap-1">
                     <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Menu</p>
                     {NAV_LINKS.map((link) => (
                       <SheetClose asChild key={link.href}>
                         <Link href={link.href} className={getMobileLinkClass(link.href)}>
                           <link.icon className="h-5 w-5" />
                           {link.name}
                         </Link>
                       </SheetClose>
                     ))}
                     {user && (
                       <SheetClose asChild>
                         <Link href="/chat" className={getMobileLinkClass("/chat")}>
                           <MessageSquare className="h-5 w-5" />
                           Messages
                           {hasUnreadMessages && <span className="absolute top-3.5 right-5 h-2 w-2 rounded-full bg-red-500" />}
                         </Link>
                       </SheetClose>
                     )}
                  </div>

                  <div className="flex flex-col gap-1 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                    <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Settings</p>
                    <button 
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-foreground transition-colors w-full text-left"
                    >
                       <div className="relative h-5 w-5">
                          <Sun className="absolute h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                       </div>
                       <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                  </div>

                  {user && (
                    <div className="flex flex-col gap-1 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                       <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Account</p>
                       <SheetClose asChild>
                         <Link href="/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-foreground transition-colors">
                            <User className="h-5 w-5" /> Profile Settings
                         </Link>
                       </SheetClose>
                       <SheetClose asChild>
                         <Link href="/support" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-foreground transition-colors">
                            <LifeBuoy className="h-5 w-5" /> Help & Support
                         </Link>
                       </SheetClose>
                       <SheetClose asChild>
                         <Link href="/feedback" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-foreground transition-colors">
                            <MessageCircle className="h-5 w-5" /> Give Feedback
                         </Link>
                       </SheetClose>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50">
                  {user ? (
                     <SheetClose asChild>
                       <Button variant="destructive" className="w-full justify-start gap-3 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/30 border border-red-100 dark:border-red-900/50" onClick={handleLogout}>
                          <LogOut className="h-5 w-5" /> Log out
                       </Button>
                     </SheetClose>
                  ) : (
                     <div className="flex flex-col gap-3">
                        <SheetClose asChild>
                          <Link href="/login" className="w-full">
                             <Button variant="outline" className="w-full justify-center">Log in</Button>
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link href="/register" className="w-full">
                             <Button className="w-full justify-center">Sign up</Button>
                          </Link>
                        </SheetClose>
                     </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight shrink-0">
              <MindNamoLogo className="h-6 w-6 text-primary" />
              <span className="inline-block">Mind Namo</span>
            </Link>
          </div>

          {/* --- CENTER: Desktop Navigation --- */}
          <nav className="hidden md:flex items-center justify-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={getLinkClass(link.href)}>
                {link.name}
              </Link>
            ))}
          </nav>

          {/* --- RIGHT: User Actions --- */}
          <div className="flex items-center justify-end gap-3 min-w-[140px]">
            <DarkModeToggle className="hidden md:inline-flex" />

            {status === "loading" ? (
               <div className="h-9 w-24 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                 <UnreadChatIndicator />

                 <DropdownMenu modal={false} open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-primary">
                      <ProfileImage 
                        src={user.image} 
                        name={user.name} 
                        sizeClass="h-full w-full" 
                        textClass="text-sm"
                        priority={true}
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal p-3">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-bold leading-none truncate">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer w-full flex items-center py-2.5">
                          <User className="mr-3 h-4 w-4" /> Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/appointments" className="cursor-pointer w-full flex items-center py-2.5">
                          <Calendar className="mr-3 h-4 w-4" /> My Appointments
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem asChild>
                      <Link href="/support" className="cursor-pointer w-full flex items-center py-2.5">
                          <LifeBuoy className="mr-3 h-4 w-4" /> Help & Support
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/feedback" className="cursor-pointer w-full flex items-center py-2.5">
                          <MessageCircle className="mr-3 h-4 w-4" /> Give Feedback
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer w-full flex items-center py-2.5">
                      <LogOut className="mr-3 h-4 w-4" /> Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex gap-3">
                 <Link href="/login">
                   <Button variant="ghost" size="sm" className="hidden sm:inline-flex font-medium">Log in</Button>
                 </Link>
                 <Link href="/register">
                   <Button size="sm" className="font-medium shadow-sm">Sign up</Button>
                 </Link>
              </div>
            )}
          </div>

        </div>
      </header>
      
      {/* Spacer */}
      <div className="h-16 w-full" aria-hidden="true" />
    </>
  );
}