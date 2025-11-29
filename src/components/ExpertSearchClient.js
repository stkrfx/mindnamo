/*
 * File: src/components/ExpertSearchClient.js
 * SR-DEV: Advanced Expert Search (Performance Optimized)
 *
 * IMPROVEMENTS:
 * - Render Performance: Filter/Sort components extracted & memoized to prevent re-renders.
 * - Code Splitting: Dynamic imports for Card/List views to reduce initial bundle size.
 * - Mobile UX: Snappy animations (duration-200), DVH support, and sticky bottom bar.
 * - UI Polish: Cleaner sidebar, subtle "Clear" button, top-aligned search.
 */

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- Dynamic Imports for Code Splitting ---
const ExpertList = dynamic(() => import("@/components/ExpertList"), { 
  loading: () => <div className="h-48 bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
});
const ExpertCard = dynamic(() => import("@/components/ExpertCard"), {
  loading: () => <div className="h-80 bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
});

// --- ICONS ---
const FilterIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>);
const SortIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>);
const SearchIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>);
const XIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>);
const ChevronDown = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>);
const ChevronUp = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>);

// --- CONSTANTS ---
const ROLES = ["Clinical Psychologist", "Psychiatrist", "Therapist", "Counselor", "Life Coach"];
const LANGUAGES = ["English", "Hindi", "Marathi", "Bengali", "Tamil", "Telugu"];
const GENDERS = ["Male", "Female", "Non-Binary"];
const RATINGS = [4, 3];

// --- OPTIMIZED SUB-COMPONENTS ---

const FilterSection = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-zinc-100 dark:border-zinc-800 py-5 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center justify-between w-full text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:text-primary transition-colors group"
      >
        {title}
        {isOpen ? <ChevronUp className="text-zinc-400 group-hover:text-primary" /> : <ChevronDown className="text-zinc-400 group-hover:text-primary" />}
      </button>
      {isOpen && <div className="mt-4 animate-in slide-in-from-top-1 duration-200">{children}</div>}
    </div>
  );
};

const DualRangeSlider = ({ min, max, value, onChange, step = 100 }) => {
  const [minVal, setMinVal] = useState(value[0]);
  const [maxVal, setMaxVal] = useState(value[1]);

  useEffect(() => {
    setMinVal(value[0]);
    setMaxVal(value[1]);
  }, [value]);

  const handleMinChange = (e) => {
    const val = Math.min(Number(e.target.value), maxVal - step);
    setMinVal(val);
  };
  const handleMaxChange = (e) => {
    const val = Math.max(Number(e.target.value), minVal + step);
    setMaxVal(val);
  };
  const handleCommit = () => onChange([minVal, maxVal]);

  const minPercent = ((minVal - min) / (max - min)) * 100;
  const maxPercent = ((maxVal - min) / (max - min)) * 100;

  return (
    <div className="relative w-full h-12 flex items-center touch-none select-none px-1">
      <input type="range" min={min} max={max} step={step} value={minVal} onChange={handleMinChange} onMouseUp={handleCommit} onTouchEnd={handleCommit} className="absolute pointer-events-none w-full h-0 z-30 outline-none appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-zinc-900 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm" />
      <input type="range" min={min} max={max} step={step} value={maxVal} onChange={handleMaxChange} onMouseUp={handleCommit} onTouchEnd={handleCommit} className="absolute pointer-events-none w-full h-0 z-40 outline-none appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-zinc-900 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm" />
      <div className="relative w-full h-1 rounded-full bg-zinc-200 dark:bg-zinc-800 z-10">
        <div className="absolute h-full rounded-full bg-zinc-900 dark:bg-white z-20" style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}></div>
      </div>
      <div className="absolute -bottom-2 left-0 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">₹{minVal}</div>
      <div className="absolute -bottom-2 right-0 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">₹{maxVal}</div>
    </div>
  );
};

// Memoized Content to prevent re-renders
const FilterContent = React.memo(({ selectedRoles, selectedLangs, selectedGenders, minPrice, maxPrice, minRating, expRange, onUpdate, onClear }) => (
  <div className="space-y-2">
    {/* Active Filters / Clear Button */}
    {(selectedRoles.length > 0 || selectedLangs.length > 0 || selectedGenders.length > 0 || minPrice > 0 || maxPrice < 5000 || minRating > 0 || expRange) && (
        <div className="pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-2">
             <button 
               onClick={onClear} 
               className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors bg-zinc-100 dark:bg-zinc-800/50 px-3 py-1.5 rounded-full w-fit"
             >
               <span>Clear Filters</span>
               <XIcon className="w-3 h-3" />
             </button>
        </div>
    )}

    {/* Price */}
    <FilterSection title="Price Range">
        <div className="px-1 pb-4">
           <DualRangeSlider min={0} max={5000} step={100} value={[minPrice, maxPrice]} onChange={([min, max]) => onUpdate({ minPrice: min, maxPrice: max })} />
        </div>
    </FilterSection>

    {/* Role */}
    <FilterSection title="Specialization">
      <div className="space-y-2.5">
        {ROLES.map(role => (
          <div key={role} className="flex items-center space-x-3 group cursor-pointer" onClick={() => {
                const newRoles = selectedRoles.includes(role) ? selectedRoles.filter(r => r !== role) : [...selectedRoles, role];
                onUpdate({ roles: newRoles });
          }}>
            <Checkbox id={role} checked={selectedRoles.includes(role)} className="border-zinc-300 data-[state=checked]:bg-zinc-900 data-[state=checked]:border-zinc-900" />
            <label htmlFor={role} className="text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 cursor-pointer select-none flex-1">{role}</label>
          </div>
        ))}
      </div>
    </FilterSection>

    {/* Gender */}
    <FilterSection title="Gender">
       <div className="flex flex-wrap gap-2">
           {GENDERS.map(g => (
               <button key={g} onClick={() => { const newG = selectedGenders.includes(g) ? selectedGenders.filter(x => x !== g) : [...selectedGenders, g]; onUpdate({ gender: newG }); }} className={cn("px-3 py-1.5 text-xs font-medium rounded-lg border transition-all", selectedGenders.includes(g) ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-black" : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800")}>{g}</button>
           ))}
       </div>
    </FilterSection>

    {/* Experience */}
    <FilterSection title="Experience">
       <div className="flex flex-wrap gap-2">
          {[{ l: "0-5 Yrs", v: "0-5" }, { l: "5-10 Yrs", v: "5-10" }, { l: "10+ Yrs", v: "10-100" }].map(opt => (
             <button key={opt.v} onClick={() => onUpdate({ exp: expRange === opt.v ? null : opt.v })} className={cn("px-3 py-1.5 text-xs font-medium rounded-lg border transition-all", expRange === opt.v ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-black" : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800")}>{opt.l}</button>
          ))}
       </div>
    </FilterSection>

    {/* Rating */}
    <FilterSection title="Rating">
      <div className="space-y-2">
         {RATINGS.map(r => (
           <div key={r} className="flex items-center space-x-2 cursor-pointer group" onClick={() => onUpdate({ rating: minRating === r ? 0 : r })}>
              <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center transition-colors", minRating === r ? "border-zinc-900 bg-zinc-900 dark:bg-white dark:border-white" : "border-zinc-300 group-hover:border-zinc-400")}>
                  {minRating === r && <div className="w-2 h-2 bg-white dark:bg-black rounded-full" />}
              </div>
              <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900">
                 <span className="font-medium">{r}+ Stars</span>
              </div>
           </div>
         ))}
      </div>
    </FilterSection>

    {/* Language */}
    <FilterSection title="Language" defaultOpen={false}>
       <div className="space-y-2.5">
          {LANGUAGES.map(lang => (
             <div key={lang} className="flex items-center space-x-3 group cursor-pointer" onClick={() => {
                const newLangs = selectedLangs.includes(lang) ? selectedLangs.filter(l => l !== lang) : [...selectedLangs, lang];
                onUpdate({ langs: newLangs });
             }}>
               <Checkbox id={lang} checked={selectedLangs.includes(lang)} className="border-zinc-300 data-[state=checked]:bg-zinc-900" />
               <label htmlFor={lang} className="text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 cursor-pointer select-none flex-1">{lang}</label>
             </div>
          ))}
       </div>
    </FilterSection>
  </div>
));
FilterContent.displayName = "FilterContent";

const SortContent = React.memo(({ sort, onUpdate }) => (
  <div className="space-y-1 py-2">
     {[
       { label: "Recommended", val: "recommended" },
       { label: "Price: Low to High", val: "price-low" },
       { label: "Price: High to Low", val: "price-high" },
       { label: "Highest Rated", val: "rating" },
       { label: "Most Experienced", val: "exp-high" }
     ].map(opt => (
        <button key={opt.val} onClick={() => onUpdate({ sort: opt.val })} className={cn("w-full text-left px-4 py-3 text-sm font-medium transition-colors rounded-lg", sort === opt.val ? "bg-zinc-100 text-zinc-900 font-semibold dark:bg-zinc-800 dark:text-white" : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900")}>
          {opt.label}
        </button>
     ))}
  </div>
));
SortContent.displayName = "SortContent";


// --- MAIN COMPONENT ---

export default function ExpertSearchClient({ initialExperts }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Parse Params
  const search = searchParams.get("q") || "";
  const selectedRoles = searchParams.get("roles") ? searchParams.get("roles").split(",") : [];
  const selectedLangs = searchParams.get("langs") ? searchParams.get("langs").split(",") : [];
  const selectedGenders = searchParams.get("gender") ? searchParams.get("gender").split(",") : [];
  const minRating = Number(searchParams.get("rating")) || 0;
  const minPrice = Number(searchParams.get("minPrice")) || 0;
  const maxPrice = Number(searchParams.get("maxPrice")) || 5000;
  const sort = searchParams.get("sort") || "recommended";
  const expRange = searchParams.get("exp"); 

  // 2. Update Helper
  const updateParams = useCallback((updates) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
        params.delete(key);
      } else {
        params.set(key, Array.isArray(value) ? value.join(",") : value);
      }
    });
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const clearAll = useCallback(() => router.replace("/experts", { scroll: false }), [router]);

  // 3. Filter Logic
  const filteredExperts = useMemo(() => {
    let result = [...initialExperts];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e => e.name.toLowerCase().includes(q) || e.specialization.toLowerCase().includes(q) || e.location.toLowerCase().includes(q));
    }
    if (selectedRoles.length) result = result.filter(e => selectedRoles.includes(e.specialization));
    if (selectedLangs.length) result = result.filter(e => e.languages?.some(l => selectedLangs.includes(l)));
    if (selectedGenders.length) result = result.filter(e => selectedGenders.includes(e.gender));
    if (minRating) result = result.filter(e => (e.rating || 0) >= minRating);
    result = result.filter(e => { const p = e.startingPrice || 0; return p >= minPrice && p <= maxPrice; });
    if (expRange) {
       const [minE, maxE] = expRange.split("-").map(Number);
       if (maxE) result = result.filter(e => e.experienceYears >= minE && e.experienceYears <= maxE);
       else if (minE === 10) result = result.filter(e => e.experienceYears >= 10);
    }
    if (sort === "price-low") result.sort((a, b) => (a.startingPrice || 0) - (b.startingPrice || 0));
    else if (sort === "price-high") result.sort((a, b) => (b.startingPrice || 0) - (a.startingPrice || 0));
    else if (sort === "rating") result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sort === "exp-high") result.sort((a, b) => b.experienceYears - a.experienceYears);
    return result;
  }, [initialExperts, search, selectedRoles, selectedLangs, selectedGenders, minRating, minPrice, maxPrice, expRange, sort]);

  return (
    <div className="flex flex-col md:flex-row gap-8 relative min-h-[60vh]">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 h-fit sticky top-24 space-y-6 self-start overflow-y-auto max-h-[calc(100vh-100px)] pr-2 scrollbar-thin">
         <FilterContent 
            selectedRoles={selectedRoles} selectedLangs={selectedLangs} selectedGenders={selectedGenders}
            minPrice={minPrice} maxPrice={maxPrice} minRating={minRating} expRange={expRange}
            onUpdate={updateParams} onClear={clearAll}
         />
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
         {/* Search & Sort Bar (Desktop) */}
         <div className="hidden md:flex flex-col gap-4 mb-6">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input 
                   placeholder="Search experts by name or specialty..." 
                   className="pl-10 h-12 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-base shadow-sm focus-visible:ring-offset-0" 
                   value={search} onChange={(e) => updateParams({ q: e.target.value })} 
                />
            </div>
            <div className="flex justify-between items-center px-1">
                <p className="text-sm text-zinc-500"><strong>{filteredExperts.length}</strong> experts found</p>
                <div className="flex items-center gap-2">
                   <span className="text-sm text-zinc-500">Sort by:</span>
                   <Select value={sort} onValueChange={(val) => updateParams({ sort: val })}>
                      <SelectTrigger className="w-[160px] h-9 text-sm border-zinc-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recommended">Recommended</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                        <SelectItem value="exp-high">Most Experienced</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
            </div>
         </div>

         {/* Mobile Search (Sticky) */}
         <div className="md:hidden mb-6 sticky top-[64px] z-30 bg-zinc-50 dark:bg-zinc-950 py-3 -mx-4 px-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="relative shadow-sm">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input placeholder="Search..." className="pl-10 h-11 rounded-full border-zinc-300 bg-white dark:bg-zinc-900" value={search} onChange={(e) => updateParams({ q: e.target.value })} />
            </div>
            {(selectedRoles.length > 0 || minRating > 0) && (
               <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                  <button onClick={clearAll} className="text-xs text-white bg-zinc-900 px-3 py-1 rounded-full font-medium whitespace-nowrap">Clear Filters</button>
               </div>
            )}
         </div>

         {/* Results List */}
         {filteredExperts.length > 0 ? (
           <div className="space-y-4 pb-24 md:pb-0">
             <div className="hidden md:flex flex-col gap-4">
               {filteredExperts.map((expert) => <ExpertList key={expert._id} expert={expert} />)}
             </div>
             <div className="md:hidden grid grid-cols-1 gap-4">
               {filteredExperts.map((expert) => <ExpertCard key={expert._id} expert={expert} />)}
             </div>
           </div>
         ) : (
           <div className="flex flex-col items-center justify-center py-24 text-center opacity-60">
             <SearchIcon className="w-16 h-16 mb-4 text-zinc-300" />
             <p className="text-lg font-bold text-zinc-900">No experts found</p>
             <Button variant="outline" className="mt-6" onClick={clearAll}>Reset Filters</Button>
           </div>
         )}
      </div>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-3 flex gap-3 z-40 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
          <Sheet>
            <SheetTrigger asChild><Button variant="outline" className="flex-1 h-12 gap-2 text-base font-medium rounded-xl border-zinc-300"><SortIcon className="h-5 w-5" /> Sort</Button></SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8 duration-200"><SheetHeader className="mb-4 text-left pt-4 border-b pb-2"><SheetTitle>Sort By</SheetTitle></SheetHeader><SortContent sort={sort} onUpdate={updateParams} /></SheetContent>
          </Sheet>
          <Sheet>
            <SheetTrigger asChild><Button className="flex-1 h-12 gap-2 text-base font-medium rounded-xl shadow-lg bg-zinc-900 text-white"><FilterIcon className="h-5 w-5" /> Filter</Button></SheetTrigger>
            <SheetContent side="bottom" className="h-[85dvh] rounded-t-3xl px-6 pb-0 overflow-hidden flex flex-col duration-200"><SheetHeader className="mb-6 text-left pt-4 border-b pb-4"><SheetTitle>Filters</SheetTitle></SheetHeader><div className="overflow-y-auto flex-1 pb-24 scrollbar-hide"><FilterContent selectedRoles={selectedRoles} selectedLangs={selectedLangs} selectedGenders={selectedGenders} minPrice={minPrice} maxPrice={maxPrice} minRating={minRating} expRange={expRange} onUpdate={updateParams} onClear={clearAll} /></div><div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t z-50"><SheetTrigger asChild><Button className="w-full h-12 text-lg font-bold shadow-lg">Show Results</Button></SheetTrigger></div></SheetContent>
          </Sheet>
      </div>
    </div>
  );
}