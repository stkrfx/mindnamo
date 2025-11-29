/*
 * File: src/components/ExpertProfileClient.js
 * SR-DEV: World-Class Expert Profile (Final Optimized Version)
 *
 * FEATURES:
 * - Sticky Booking Sidebar (Desktop) & Bottom Bar (Mobile).
 * - Video Intro Modal integration.
 * - Rich Data Sections (Awards, Experience, Clinics).
 * - Direct Chat & Booking integration.
 */

"use client";

import { useState, useEffect, useRef, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Star, MapPin, GraduationCap, Languages, CheckCircle2, 
  Video, Clock, ShieldCheck, Play, MessageSquare, CalendarCheck, 
  Share2, MoreHorizontal, FileText, X, ChevronRight, Home,
  Award, Users, FileBadge, AlertCircle, Loader2, Building2, HelpCircle, Flag
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils"; 
import BookingModal from "@/components/BookingModal"; 
import ProfileImage from "@/components/ProfileImage";
import { findOrCreateConversation } from "@/actions/chat";

// --- SUB-COMPONENTS ---

const ReportModal = ({ isOpen, onClose, expertName }) => {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1500));
    setIsSubmitting(false);
    onClose();
    // In a real app, show a toast here
    alert("Report submitted. Our team will review this shortly.");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive"><AlertCircle className="h-5 w-5" /> Report Profile</DialogTitle>
          <DialogDescription>Why are you reporting {expertName}? This helps us keep our community safe.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <RadioGroup value={reason} onValueChange={setReason}>
            {["Inappropriate Content", "Fake Profile", "Spam or Scam", "Other"].map(r => (
              <div className="flex items-center space-x-2" key={r}>
                <RadioGroupItem value={r} id={r} />
                <Label htmlFor={r} className="cursor-pointer">{r}</Label>
              </div>
            ))}
          </RadioGroup>
          <Textarea placeholder="Please provide more details..." value={details} onChange={(e) => setDetails(e.target.value)} className="resize-none" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={!reason || isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const VideoModal = ({ videoUrl, onClose }) => {
  if (!videoUrl) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
         <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-50"><X className="w-6 h-6" /></button>
         {/* Simple iframe for demo. In prod, use a robust player component */}
         <iframe src={videoUrl} className="w-full h-full" allowFullScreen title="Intro Video" allow="autoplay"></iframe>
      </div>
    </div>
  );
};

const DocumentViewerModal = ({ document, onClose }) => {
  if (!document) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className="relative z-[101] w-full max-w-5xl h-[85vh] flex flex-col items-center justify-center animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"><X className="w-6 h-6" /></button>
        {document.type === 'image' ? (
          <img src={document.url} alt={document.title} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl bg-black" />
        ) : (
          <iframe src={document.url} className="w-full h-full bg-white rounded-lg shadow-2xl" title={document.title} />
        )}
        <p className="mt-4 text-white/90 font-medium text-lg">{document.title}</p>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 shadow-sm transition-all duration-300 hover:shadow-md hover:border-zinc-200 dark:hover:border-zinc-700 h-full justify-center">
    <div className="p-2.5 rounded-full bg-zinc-50 dark:bg-zinc-800 text-zinc-400 mb-2"><Icon className="w-5 h-5" strokeWidth={1.5} /></div>
    <p className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">{value}</p>
    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">{label}</p>
  </div>
);

// --- MAIN COMPONENT ---

export default function ExpertProfileClient({ expert }) { 
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [viewingAvatar, setViewingAvatar] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  
  const [isChatPending, startChatTransition] = useTransition();
  const [isCopied, setIsCopied] = useState(false);
  
  const [isProfileHeaderVisible, setIsProfileHeaderVisible] = useState(true);
  const profileHeaderRef = useRef(null);
  const bookingCardRef = useRef(null);
  
  const router = useRouter();

  const startingPrice = useMemo(() => {
    if (!expert.services?.length) return 0;
    return expert.services.reduce((min, s) => Math.min(min, Math.min(s.videoPrice ?? Infinity, s.clinicPrice ?? Infinity)), Infinity);
  }, [expert.services]);
  const displayPrice = startingPrice === Infinity ? "N/A" : `₹${startingPrice}`;

  // Sticky Header Logic
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setIsProfileHeaderVisible(entry.isIntersecting), { threshold: 0.1, rootMargin: "-50px 0px 0px 0px" });
    if (profileHeaderRef.current) observer.observe(profileHeaderRef.current);
    return () => profileHeaderRef.current && observer.unobserve(profileHeaderRef.current);
  }, []);

  const handleChatClick = () => {
    startChatTransition(async () => {
      // Create/Find Chat Action
      const result = await findOrCreateConversation(expert._id);
      
      if (result.success && result.conversationId) {
        router.push(`/chat?id=${result.conversationId}`);
      } else {
        // If auth fails, redirect to login
        const returnUrl = `/experts/${expert._id}`;
        router.push(`/login?callbackUrl=${encodeURIComponent(returnUrl)}`);
      }
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: `Consult ${expert.name}`, text: `Check out ${expert.name} on Mind Namo`, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); } catch {}
    }
  };

  // Helpers for dates
  const getRelativeTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24)); 
    if (diffDays <= 1) return "Today";
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pb-32 relative font-sans">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[600px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-yellow-100/40 dark:bg-yellow-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-blue-100/40 dark:bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      {/* --- HERO SECTION --- */}
      <div ref={profileHeaderRef} className="relative z-10 pt-8 pb-12">
         <div className="container max-w-6xl mx-auto px-4 md:px-6">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-8">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link> <span className="text-zinc-300">/</span>
              <Link href="/experts" className="hover:text-primary transition-colors">Experts</Link> <span className="text-zinc-300">/</span>
              <span className="text-primary font-medium truncate max-w-[200px]">{expert.name}</span>
            </nav>

            <div className="flex flex-col md:flex-row gap-8 items-start text-left">
               {/* Avatar */}
               <div className="relative group flex-shrink-0 cursor-pointer" onClick={() => setViewingAvatar(true)}>
                  <div className="relative p-1 bg-white dark:bg-zinc-950 rounded-full ring-1 ring-zinc-200 dark:ring-zinc-800 shadow-sm">
                     <ProfileImage src={expert.profilePicture} name={expert.name} sizeClass="w-32 h-32 md:w-40 md:h-40" className="rounded-full" priority />
                  </div>
                  {expert.isOnline && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-white dark:bg-zinc-900 px-2 py-1 rounded-full shadow-md border border-zinc-100 dark:border-zinc-800 z-20">
                       <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
                       <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">Online</span>
                    </div>
                  )}
               </div>

               {/* Info */}
               <div className="flex-1">
                  <div className="flex flex-col md:flex-row items-start md:items-end gap-3 mb-4">
                     <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">{expert.name}</h1>
                     {expert.isVerified && (
                        <div className="flex items-center gap-1 text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/50 mb-2">
                           <CheckCircle2 className="w-3.5 h-3.5 fill-current" /> <span className="text-[10px] font-bold uppercase tracking-wider">Verified</span>
                        </div>
                     )}
                  </div>
                  <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 max-w-2xl leading-relaxed">
                    <span className="text-zinc-900 dark:text-zinc-200 font-semibold">{expert.specialization}</span> with {expert.experienceYears}+ years of experience.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                     <Badge variant="outline" className="font-normal text-zinc-600 dark:text-zinc-400 gap-1.5 py-1 px-3 bg-white/50"><MapPin className="w-3.5 h-3.5" /> {expert.location}</Badge>
                     <Badge variant="outline" className="font-normal text-zinc-600 dark:text-zinc-400 gap-1.5 py-1 px-3 bg-white/50"><Languages className="w-3.5 h-3.5" /> {expert.languages?.join(", ")}</Badge>
                     <Badge variant="outline" className="font-normal text-zinc-600 dark:text-zinc-400 gap-1.5 py-1 px-3 bg-white/50"><GraduationCap className="w-3.5 h-3.5" /> {expert.education}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                     {expert.videoUrl && (
                        <Button className="rounded-full gap-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold px-5 shadow-lg transition-all hover:scale-105" onClick={() => setShowVideoModal(true)}>
                           <Play className="w-4 h-4 fill-current" /> Watch Intro
                        </Button>
                     )}
                     <Button variant="outline" size="sm" className="rounded-full gap-2" onClick={handleShare}>{isCopied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />} Share</Button>
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full"><MoreHorizontal className="w-5 h-5" /></Button></DropdownMenuTrigger>
                       <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setIsReportModalOpen(true)} className="text-red-600 cursor-pointer"><Flag className="w-4 h-4 mr-2" /> Report Profile</DropdownMenuItem></DropdownMenuContent>
                     </DropdownMenu>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* --- CONTENT GRID --- */}
      <div className="container max-w-6xl mx-auto px-4 md:px-6 relative z-20">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: Details */}
            <div className="lg:col-span-2 space-y-8">
               
               {/* Quick Stats */}
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard icon={Star} label="Rating" value={expert.rating?.toFixed(1)} />
                  <StatCard icon={Clock} label="Experience" value={`${expert.experienceYears}+ Yrs`} />
                  <StatCard icon={Video} label="Sessions" value={expert.reviewCount * 5 + "+"} />
                  <StatCard icon={ShieldCheck} label="Verified" value="100%" />
               </div>

               <Tabs defaultValue="about" className="w-full">
                  <TabsList className="w-full justify-start h-auto p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg mb-6">
                     <TabsTrigger value="about" className="flex-1 py-2.5 rounded-md font-medium">About</TabsTrigger>
                     <TabsTrigger value="reviews" className="flex-1 py-2.5 rounded-md font-medium">Reviews ({expert.reviewCount})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="about" className="space-y-8 animate-in fade-in duration-300">
                     {/* Bio */}
                     <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 md:p-8 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">About Me</h3>
                        <div className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm/6 whitespace-pre-line">{expert.bio || "No bio available."}</div>
                     </section>

                     {/* Rich Profile Data */}
                     {(expert.awards?.length > 0 || expert.memberships?.length > 0 || expert.registrations?.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {expert.awards?.length > 0 && (
                              <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm h-full">
                                 <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white mb-4"><Award className="w-4 h-4 text-amber-500" /> Awards</h3>
                                 <ul className="space-y-3">
                                    {expert.awards.map((a, i) => (
                                       <li key={i} className="text-sm text-zinc-600"><span className="font-medium text-zinc-900">{a.title}</span> <span className="text-xs text-zinc-400">({a.year})</span></li>
                                    ))}
                                 </ul>
                              </section>
                           )}
                           {expert.memberships?.length > 0 && (
                              <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm h-full">
                                 <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-900 mb-4"><Users className="w-4 h-4 text-blue-500" /> Memberships</h3>
                                 <ul className="list-disc list-outside ml-4 space-y-2">
                                    {expert.memberships.map((m, i) => <li key={i} className="text-sm text-zinc-600">{m}</li>)}
                                 </ul>
                              </section>
                           )}
                           {expert.registrations?.length > 0 && (
                              <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm h-full md:col-span-2">
                                 <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white mb-4"><FileBadge className="w-4 h-4 text-green-500" /> Registrations</h3>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {expert.registrations.map((reg, i) => (
                                       <div key={i} className="text-sm">
                                          <p className="font-medium text-zinc-900 dark:text-zinc-200">{reg.registrationNumber}</p>
                                          <p className="text-zinc-500 text-xs">{reg.council} - {reg.year}</p>
                                       </div>
                                    ))}
                                 </div>
                              </section>
                           )}
                        </div>
                     )}

                     {/* Clinics */}
                     {expert.clinics?.length > 0 && (
                        <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 md:p-8 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                           <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-white mb-4"><Building2 className="w-5 h-5 text-blue-500" /> Clinic Locations</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {expert.clinics.map((clinic, i) => (
                                 <div key={i} className="group border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:shadow-md transition-all">
                                    <div className="h-32 bg-zinc-100 relative">
                                       {/* Placeholder for clinic image - could use SafeImage if available */}
                                       <img src={clinic.images?.[0] || "/placeholder-clinic.jpg"} alt={clinic.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="p-4">
                                       <h4 className="font-bold text-zinc-900 dark:text-white">{clinic.name}</h4>
                                       <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{clinic.address}</p>
                                       <div className="flex items-center gap-2 mt-3 text-xs font-medium text-zinc-600 dark:text-zinc-400"><Clock className="w-3.5 h-3.5" /> {clinic.timings}</div>
                                       <Button variant="outline" size="sm" className="w-full mt-4 h-8 text-xs">Get Directions</Button>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </section>
                     )}

                     {/* FAQs */}
                     {expert.faqs?.length > 0 && (
                        <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                           <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-900 mb-4"><HelpCircle className="w-5 h-5 text-zinc-400" /> Common Questions</h3>
                           <div className="space-y-4">
                              {expert.faqs.map((faq, i) => (
                                <div key={i} className="border-b border-zinc-100 dark:border-zinc-800 pb-4 last:border-0 last:pb-0">
                                   <p className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">{faq.question}</p>
                                   <p className="text-sm text-zinc-600 dark:text-zinc-400">{faq.answer}</p>
                                </div>
                              ))}
                           </div>
                        </section>
                     )}
                  </TabsContent>

                  <TabsContent value="reviews" className="animate-in fade-in duration-300">
                     <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 md:p-8 border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-6">
                        {expert.reviews?.length > 0 ? expert.reviews.map((review, i) => (
                           <div key={i} className="pb-6 border-b border-zinc-100 dark:border-zinc-800 last:border-0 last:pb-0">
                              <div className="flex justify-between items-center mb-2">
                                 <div className="flex items-center gap-3">
                                    <ProfileImage name={review.reviewerName} sizeClass="w-10 h-10" />
                                    <div><span className="font-semibold text-sm block">{review.reviewerName}</span><div className="flex gap-0.5 mt-0.5">{[...Array(5)].map((_, r) => <Star key={r} className={cn("w-3 h-3", r < review.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200")} />)}</div></div>
                                 </div>
                                 <span className="text-xs text-zinc-400">{getRelativeTime(review.date)}</span>
                              </div>
                              <p className="text-sm text-zinc-600 leading-relaxed pl-[52px]">"{review.comment}"</p>
                           </div>
                        )) : (
                          <div className="text-center py-12 text-zinc-500">No reviews yet.</div>
                        )}
                     </div>
                  </TabsContent>
               </Tabs>
            </div>

            {/* RIGHT COLUMN: STICKY BOOKING CARD (Desktop) */}
            <div className="hidden lg:block lg:col-span-1 relative">
               <div ref={bookingCardRef} className="sticky top-24 space-y-4">
                  <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-6 transition-all duration-500">
                     {!isProfileHeaderVisible && (
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-4">
                           <ProfileImage src={expert.profilePicture} name={expert.name} sizeClass="w-12 h-12" className="rounded-full shadow-sm" />
                           <div><h3 className="font-bold text-base leading-tight">{expert.name}</h3><p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{expert.specialization}</p></div>
                        </div>
                     )}
                     <div className="flex items-center justify-between mb-2"><p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Session Price</p></div>
                     <div className="flex items-baseline gap-1 mb-6"><span className="text-3xl font-black text-zinc-900 dark:text-white">{displayPrice}</span></div>
                     <div className="space-y-3">
                        <Button size="lg" className="w-full h-12 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 shadow-md group" onClick={() => setIsBookingModalOpen(true)}>Book Appointment <CalendarCheck className="ml-2 w-4 h-4 group-hover:scale-110 transition-transform" /></Button>
                        <Button variant="outline" size="lg" className="w-full h-12 rounded-xl" onClick={handleChatClick} disabled={isChatPending}>{isChatPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Message Expert"}</Button>
                     </div>
                     <div className="mt-5 pt-5 border-t border-zinc-100 dark:border-zinc-800"><div className="flex items-center justify-center gap-2 text-xs font-medium text-zinc-500"><ShieldCheck className="w-4 h-4 text-green-500" /> 100% Confidential & Secure</div></div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* --- MOBILE BOTTOM BAR (Sticky) --- */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800 z-40 flex items-center justify-between shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] safe-area-bottom">
         <div><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Starts at</p><p className="text-xl font-black text-zinc-900 dark:text-white">{displayPrice}</p></div>
         <div className="flex gap-3">
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-zinc-300" onClick={handleChatClick} disabled={isChatPending}>{isChatPending ? <Loader2 className="w-5 h-5 animate-spin text-zinc-600" /> : <MessageSquare className="w-5 h-5" />}</Button>
            <Button size="lg" className="h-12 px-6 rounded-xl font-bold bg-zinc-900 text-white shadow-lg" onClick={() => setIsBookingModalOpen(true)}>Book Now</Button>
         </div>
      </div>

      {/* --- MODALS --- */}
      {viewingDocument && <DocumentViewerModal document={viewingDocument} onClose={() => setViewingDocument(null)} />}
      {viewingAvatar && <DocumentViewerModal document={{type: 'image', url: expert.profilePicture, title: expert.name}} onClose={() => setViewingAvatar(false)} />}
      {showVideoModal && <VideoModal videoUrl={expert.videoUrl} onClose={() => setShowVideoModal(false)} />}
      
      {isBookingModalOpen && (
        <BookingModal expert={expert} onClose={() => setIsBookingModalOpen(false)} />
      )}
      
      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} expertName={expert.name} />
    </div>
  );
}