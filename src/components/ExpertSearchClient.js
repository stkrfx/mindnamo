/*
 * File: src/components/ExpertSearchClient.js
 * SR-DEV: Advanced Expert Search (Production Ready)
 * ACTION: FIXED TypeError (reading 'length') by providing safe defaults to arrays in FilterContent.
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
import { getExpertsAction } from "@/actions/experts"; // File 138
import useInfiniteScroll from "@/hooks/useInfiniteScroll"; // File 134
import useStickyHeaderOffset from "@/hooks/useStickyHeaderOffset"; // File 133

// --- Dynamic Imports ---
const ExpertList = dynamic(() => import("@/components/ExpertList"));
const ExpertCard = dynamic(() => import("@/components/ExpertCard"));

// --- ICONS ---
const FilterIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>);
const SearchIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>);
const XIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>);
const ChevronDown = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>);
const ChevronUp = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>);
const Loader2 = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>);


// --- OPTIMIZED SUB-COMPONENTS ---

const FilterSection = React.memo(({ title, children, defaultOpen = true }) => {
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
});
FilterSection.displayName = "FilterSection";

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

const FilterContent = React.memo(({ filterData, selectedFilters, onUpdate, onClear, isMobile }) => {
  // Use safe array defaults during destructuring to prevent TypeError
  const { 
    roles = [], 
    languages = [], 
    genders = [], 
    minPrice, 
    maxPrice, 
    minRating, 
    expRange, 
    sort 
  } = selectedFilters;
  
  // Hardcoded Genders/Ratings for consistent display, Dynamic lists for everything else
  const GENDERS = ["Male", "Female", "Non-Binary"];
  const RATINGS = [4, 3];
  const EXP_RANGES = [{ l: "0-5 Yrs", v: "0-5" }, { l: "5-10 Yrs", v: "5-10" }, { l: "10+ Yrs", v: "10-100" }];


  // Filter roles/languages based on what is actually present in the DB
  const availableRoles = filterData?.specializations || [];
  const availableLangs = filterData?.languages || [];

  return (
    <div className="space-y-2">
      {/* Sort Control (Only visible in mobile modal) */}
      {isMobile && (
          <FilterSection title="Sort By" defaultOpen={true}>
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
          </FilterSection>
      )}


      {/* Active Filters / Clear Button */}
      {/* FIXED ERROR: roles, languages, genders are now guaranteed arrays */}
      {(roles.length > 0 || languages.length > 0 || genders.length > 0 || minPrice > 0 || maxPrice < 5000 || minRating > 0 || expRange) && (
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
      <FilterSection title="Price Range (per session)">
          <div className="px-1 pb-4">
             <DualRangeSlider min={0} max={5000} step={100} value={[minPrice, maxPrice]} onChange={([min, max]) => onUpdate({ minPrice: min, maxPrice: max })} />
          </div>
          <p className="text-xs text-zinc-500">
             ₹{minPrice} - ₹{maxPrice}
          </p>
      </FilterSection>

      {/* Role (Dynamic List) */}
      <FilterSection title="Specialization" defaultOpen={true}>
        <div className="space-y-2.5 max-h-48 overflow-y-auto scrollbar-thin">
          {availableRoles.sort().map(role => (
            <div key={role} className="flex items-center space-x-3 group cursor-pointer" onClick={() => {
                  const newRoles = roles.includes(role) ? roles.filter(r => r !== role) : [...roles, role];
                  onUpdate({ roles: newRoles });
            }}>
              <Checkbox id={role} checked={roles.includes(role)} className="border-zinc-300 data-[state=checked]:bg-zinc-900 data-[state=checked]:border-zinc-900" />
              <label htmlFor={role} className="text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 cursor-pointer select-none flex-1">{role}</label>
            </div>
          ))}
        </div>
      </FilterSection>

      {/* Gender */}
      <FilterSection title="Gender">
         <div className="flex flex-wrap gap-2">
             {GENDERS.map(g => (
                 <button key={g} onClick={() => { const newG = genders.includes(g) ? genders.filter(x => x !== g) : [...genders, g]; onUpdate({ gender: newG }); }} className={cn("px-3 py-1.5 text-xs font-medium rounded-lg border transition-all", genders.includes(g) ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-black" : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800")}>{g}</button>
             ))}
         </div>
      </FilterSection>

      {/* Experience */}
      <FilterSection title="Experience">
         <div className="flex flex-wrap gap-2">
            {EXP_RANGES.map(opt => (
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

      {/* Language (Dynamic List) */}
      <FilterSection title="Language" defaultOpen={false}>
         <div className="space-y-2.5 max-h-48 overflow-y-auto scrollbar-thin">
            {availableLangs.sort().map(lang => (
               <div key={lang} className="flex items-center space-x-3 group cursor-pointer" onClick={() => {
                  const newLangs = languages.includes(lang) ? languages.filter(l => l !== lang) : [...languages, lang];
                  onUpdate({ langs: newLangs });
               }}>
                 <Checkbox id={lang} checked={languages.includes(lang)} className="border-zinc-300 data-[state=checked]:bg-zinc-900" />
                 <label htmlFor={lang} className="text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 cursor-pointer select-none flex-1">{lang}</label>
               </div>
            ))}
         </div>
      </FilterSection>
    </div>
  );
});
FilterContent.displayName = "FilterContent";

// --- MAIN COMPONENT ---

export default function ExpertSearchClient({ initialExperts, initialTotal, initialHasMore, dynamicFilters }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { offset, transition } = useStickyHeaderOffset(); // Hook for sticky offset

  // 1. State for Infinite Scroll/Filtering
  const [experts, setExperts] = useState(initialExperts);
  const [total, setTotal] = useState(initialTotal);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // 2. Parsed Filter State (Derived from URL/searchParams)
  const filters = useMemo(() => ({
    q: searchParams.get("q") || "",
    roles: searchParams.get("roles") ? searchParams.get("roles").split(",") : [],
    langs: searchParams.get("langs") ? searchParams.get("langs").split(",") : [],
    gender: searchParams.get("gender") ? searchParams.get("gender").split(",") : [],
    minRating: Number(searchParams.get("rating")) || 0,
    minPrice: Number(searchParams.get("minPrice")) || 0,
    maxPrice: Number(searchParams.get("maxPrice")) || 5000,
    sort: searchParams.get("sort") || "recommended",
    expRange: searchParams.get("exp"),
  }), [searchParams]);

  // 3. Update Helpers
  const updateParams = useCallback((updates) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
        params.delete(key);
      } else {
        params.set(key, Array.isArray(value) ? value.join(",") : value);
      }
    });
    // Resets to page 1 on filter/sort change
    router.replace(`?${params.toString()}`, { scroll: false }); 
  }, [searchParams, router]);

  const clearAll = useCallback(() => router.replace("/experts", { scroll: false }), [router]);

  // 4. Infinite Scroll Handler (Logic that fetches next page)
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    const nextPage = currentPage + 1;
    
    const result = await getExpertsAction({ page: nextPage, limit: 10, filters: filters, sort: filters.sort });
    
    if (result.success) {
      setExperts(prev => [...prev, ...result.experts]);
      setTotal(result.total);
      setHasMore(result.hasMore);
      setCurrentPage(nextPage);
    } else {
      console.error("Load More Failed:", result.message);
    }
    setIsLoading(false);
  }, [isLoading, hasMore, currentPage, filters]);
  
  // 5. Reset on Filter/Sort Change (Logic that triggers a re-fetch of page 1)
  useEffect(() => {
    // Check if any filter/sort parameters are set in the URL
    const isFiltered = searchParams.toString() !== "";
    
    // If the URL has filters, and we are not on page 1, fetch page 1 again
    if (isFiltered && currentPage !== 1) {
        const refetch = async () => {
            setIsLoading(true);
            const result = await getExpertsAction({ page: 1, limit: 10, filters: filters, sort: filters.sort });
            
            if (result.success) {
                setExperts(result.experts);
                setTotal(result.total);
                setHasMore(result.hasMore);
                setCurrentPage(1);
            } else {
                 setExperts([]);
                 setTotal(0);
                 setHasMore(false);
            }
            setIsLoading(false);
        };
        refetch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]); // Only trigger when the actual URL changes

  // 6. Intersection Observer Setup
  const sentinelRef = useInfiniteScroll({ loadMore, hasMore, isLoading });


  return (
    <div className="flex flex-col md:flex-row gap-8 relative min-h-[60vh]">
      
      {/* --- Desktop Sidebar: FIXED FILTER CONTAINER (Amazon-style) --- */}
      <aside 
        className="hidden lg:block w-64 shrink-0 h-full overflow-y-auto pr-4 border-r border-zinc-100 dark:border-zinc-800 transition-all duration-300"
        style={{ position: 'sticky', top: offset, transition: transition, maxHeight: `calc(100vh - ${offset} - 20px)` }}
      >
         <FilterContent 
            filterData={dynamicFilters}
            selectedFilters={filters}
            onUpdate={updateParams} 
            onClear={clearAll} 
            isMobile={false}
         />
      </aside>

      {/* --- Main Content --- */}
      <div className="flex-1 min-w-0">
         {/* Search Bar & Sort Control (Sticky UX) */}
         <div 
           className="sticky z-30 bg-zinc-50 dark:bg-zinc-950 pt-2 pb-4 -mx-4 px-4 md:mx-0 md:px-0 flex flex-col gap-4 border-b border-zinc-200 dark:border-zinc-800 md:border-none transition-all duration-300"
           style={{ top: offset, transition: transition }}
         >
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input 
                   placeholder="Search experts by name or specialty..." 
                   className="pl-10 h-12 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-base shadow-sm focus-visible:ring-offset-0" 
                   value={filters.q} onChange={(e) => updateParams({ q: e.target.value })} 
                />
            </div>
            
            <div className="flex justify-between items-center px-1">
                <p className="text-sm text-zinc-500">
                   Showing <strong>{experts.length}</strong> of {total} {total === 1 ? 'expert' : 'experts'}
                </p>
                <div className="flex items-center gap-4">
                   {/* Mobile Filter Button */}
                   <Sheet>
                     <SheetTrigger asChild>
                        <Button variant="outline" className="lg:hidden h-10 gap-2 text-sm font-medium rounded-xl border-zinc-300">
                           <FilterIcon className="h-4 w-4" /> Filter ({[...(filters.roles || []), ...(filters.langs || []), ...(filters.gender || [])].length})
                        </Button>
                     </SheetTrigger>
                     <SheetContent side="bottom" className="h-[85dvh] rounded-t-3xl px-6 pb-0 overflow-hidden flex flex-col duration-200">
                         <SheetHeader className="mb-6 text-left pt-4 border-b pb-4"><SheetTitle>Filters & Sort</SheetTitle></SheetHeader>
                         <div className="overflow-y-auto flex-1 pb-24 scrollbar-hide">
                           <FilterContent 
                             filterData={dynamicFilters}
                             selectedFilters={filters}
                             onUpdate={updateParams} 
                             onClear={clearAll} 
                             isMobile={true}
                           />
                         </div>
                         <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-zinc-950 border-t z-50">
                            <SheetTrigger asChild><Button className="w-full h-12 text-lg font-bold shadow-lg">Show Results</Button></SheetTrigger>
                         </div>
                     </SheetContent>
                   </Sheet>

                   {/* Desktop Sort Dropdown */}
                   <div className="hidden md:flex items-center gap-2">
                       <span className="text-sm text-zinc-500">Sort by:</span>
                       <Select value={filters.sort} onValueChange={(val) => updateParams({ sort: val })}>
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
         </div>

         {/* Results List */}
         {experts.length > 0 ? (
           <div className="space-y-4 pt-4">
             {experts.map((expert) => <ExpertList key={expert._id} expert={expert} />)}
             
             {/* --- Infinite Scroll Sentinel --- */}
             <div ref={sentinelRef} className="text-center py-6">
                {isLoading && <Loader2 className="w-6 h-6 text-zinc-400 animate-spin mx-auto" />}
                {!isLoading && !hasMore && <p className="text-zinc-500 text-sm">You've reached the end of the list.</p>}
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
    </div>
  );
}