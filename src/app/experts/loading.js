/*
 * File: src/app/experts/loading.js
 * SR-DEV: Experts List Loading Skeleton
 * Ensures the user sees the grid layout instantly while the DB query runs.
 */

export default function Loading() {
    return (
      <div className="flex flex-col w-full bg-zinc-50 dark:bg-zinc-950 min-h-screen">
        <main className="container mx-auto max-w-7xl px-4 py-8 md:py-12 flex-1">
          
          {/* Header Skeleton */}
          <div className="mb-8 space-y-4 animate-pulse">
            <div className="h-10 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-4 w-96 max-w-full bg-zinc-100 dark:bg-zinc-900 rounded" />
          </div>
  
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* Sidebar Filter Skeleton (Desktop) */}
            <div className="hidden md:block w-64 shrink-0 space-y-6">
               {[1, 2, 3, 4].map((i) => (
                 <div key={i} className="space-y-3 animate-pulse">
                    <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="space-y-2">
                       <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-900 rounded" />
                       <div className="h-3 w-3/4 bg-zinc-100 dark:bg-zinc-900 rounded" />
                    </div>
                    <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800 my-4" />
                 </div>
               ))}
            </div>
  
            {/* Main Content Skeleton */}
            <div className="flex-1 min-w-0 space-y-6">
               
               {/* Search Bar Skeleton */}
               <div className="hidden md:flex flex-col gap-4">
                  <div className="h-12 w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl animate-pulse" />
                  <div className="flex justify-between items-center">
                     <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-900 rounded" />
                     <div className="h-9 w-40 bg-zinc-100 dark:bg-zinc-900 rounded-md" />
                  </div>
               </div>
  
               {/* Mobile Search Skeleton */}
               <div className="md:hidden h-12 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full animate-pulse mb-4" />
  
               {/* Expert Cards Grid Skeleton */}
               <div className="space-y-4">
                 {[1, 2, 3, 4].map((i) => (
                   <div 
                     key={i} 
                     className="flex flex-col md:flex-row h-auto md:h-48 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden animate-pulse shadow-sm"
                   >
                      {/* Avatar Section */}
                      <div className="p-6 w-full md:w-[40%] flex items-center gap-4 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800">
                         <div className="h-20 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                         <div className="flex-1 space-y-2">
                            <div className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                            <div className="h-4 w-1/2 bg-zinc-100 dark:bg-zinc-900 rounded" />
                            <div className="flex gap-1 mt-2">
                               <div className="h-5 w-10 bg-zinc-100 dark:bg-zinc-900 rounded" />
                               <div className="h-5 w-24 bg-zinc-100 dark:bg-zinc-900 rounded" />
                            </div>
                         </div>
                      </div>
  
                      {/* Stats Section */}
                      <div className="flex-1 p-6 flex flex-col justify-center gap-4 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                         <div className="space-y-3">
                            <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                            <div className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded" />
                            <div className="h-4 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
                         </div>
                      </div>
  
                      {/* Price/Action Section */}
                      <div className="p-6 w-full md:w-48 flex flex-row md:flex-col items-center justify-between md:justify-center gap-4">
                         <div className="space-y-1 text-center">
                            <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-900 rounded mx-auto" />
                            <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto" />
                         </div>
                         <div className="h-10 w-32 md:w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                      </div>
                   </div>
                 ))}
               </div>
  
            </div>
          </div>
  
        </main>
      </div>
    );
  }