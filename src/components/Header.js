/*
 * File: src/components/Header.js
 * SR-DEV: Premium Header (Mobile Fixes + Enhanced Menu)
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
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
import { MindNamoLogo } from "@/components/Icons";

// --- Icons ---
import { 
  Menu, User, Calendar, MessageSquare, LogOut, 
  Home, Search, LifeBuoy, MessageCircle 
} from "lucide-react";

const NAV_LINKS = [
  { name: "Home", href: "/", icon: Home },
  { name: "Find Experts", href: "/experts", icon: Search },
  { name: "My Appointments", href: "/appointments", icon: Calendar },
];

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Routes where header should be hidden (e.g. Auth pages often have their own headers)
  const hideHeaderRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/otp"];
  const shouldHide = hideHeaderRoutes.includes(pathname);

  // --- Smart Scroll Logic ---
  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY;
        
        // Show if scrolling up OR if at very top
        if (currentScrollY < lastScrollY || currentScrollY < 50) {
          setIsVisible(true);
        } 
        // Hide if scrolling down AND not at top
        else if (currentScrollY > lastScrollY && currentScrollY > 50) {
          setIsVisible(false);
        }
        setLastScrollY(currentScrollY);
      }
    };

    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

  if (shouldHide) return null;

  const user = session?.user;

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };

  const getLinkClass = (href) =>
    cn(
      "relative text-sm font-medium transition-colors hover:text-primary",
      pathname === href ? "text-foreground font-bold" : "text-muted-foreground"
    );

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 h-16 transition-transform duration-300 ease-in-out",
          isVisible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="container mx-auto h-full grid grid-cols-2 md:grid-cols-3 items-center px-4 md:px-6">
          
          {/* --- LEFT: Logo & Mobile Menu --- */}
          <div className="flex items-center justify-start gap-2">
            
            {/* Mobile Menu Trigger */}
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
                       <ProfileImage 
                          src={user.image} 
                          name={user.name} 
                          sizeClass="h-12 w-12" 
                          className="border-2 border-white shadow-sm"
                          priority
                       />
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
                         <Link href={link.href} className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors", pathname === link.href ? "bg-zinc-100 dark:bg-zinc-800 text-foreground" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-foreground")}>
                           <link.icon className="h-5 w-5" />
                           {link.name}
                         </Link>
                       </SheetClose>
                     ))}
                     {user && (
                       <SheetClose asChild>
                         <Link href="/chat" className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors", pathname === "/chat" ? "bg-zinc-100 dark:bg-zinc-800 text-foreground" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-foreground")}>
                           <MessageSquare className="h-5 w-5" />
                           Messages
                         </Link>
                       </SheetClose>
                     )}
                  </div>

                  {user && (
                    <div className="flex flex-col gap-1 mt-6">
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
            
            {/* Logo */}
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
          <div className="flex items-center justify-end gap-4 min-w-[140px]">
            {status === "loading" ? (
               <div className="h-9 w-24 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                 <Link href="/chat">
                   <Button variant="ghost" size="icon" className="hidden md:flex text-muted-foreground hover:text-primary relative" title="Messages">
                      <MessageSquare className="h-5 w-5" />
                   </Button>
                 </Link>

                 <DropdownMenu modal={false}>
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
                    
                    <DropdownMenuSeparator />
                    
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
      
      {/* Spacer to prevent content from hiding behind fixed header */}
      <div className="h-16 w-full" aria-hidden="true" />
    </>
  );
}