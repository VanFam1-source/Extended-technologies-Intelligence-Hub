import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import NewsFeed from './components/NewsFeed';
import ManualLinkInfographicGenerator from './components/ManualLinkInfographicGenerator';
import MorningBriefingPlayer from './components/MorningBriefingPlayer';
import { PARTNERS } from './constants';
import { Partner, NewsArticle, PartnerCategory } from './types';
import { fetchRecentNews } from './services/geminiService';
import LoadingSpinner from './components/icons/LoadingSpinner';
import RefreshIcon from './components/icons/RefreshIcon';

const App: React.FC = () => {
  const [partners] = useState<Partner[]>(PARTNERS);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  
  // Track which partners we have actually fetched data for
  const [fetchedPartnerIds, setFetchedPartnerIds] = useState<Set<string>>(new Set());

  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('selectedPartnerIds');
      if (saved) {
        return JSON.parse(saved);
      }
      // Default to ONLY 'Server & Power' to save API quota on initial load
      return partners
        .filter(p => p.category === PartnerCategory.SERVER)
        .map(p => p.id);
    } catch (error) {
      console.error("Failed to parse selected partners from localStorage", error);
      // Fallback default
      return partners
        .filter(p => p.category === PartnerCategory.SERVER)
        .map(p => p.id);
    }
  });

  const partnerMap = useMemo(() => {
    return partners.reduce((acc, partner) => {
      acc[partner.id] = partner;
      return acc;
    }, {} as Record<string, Partner>);
  }, [partners]);

  const fetchAndSetNews = useCallback(async (currentSelectedIds: string[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const selectedPartners = partners.filter(p => currentSelectedIds.includes(p.id));
      const partnerNames = selectedPartners.map(p => p.name);
      
      const partnerNameMap = partners.reduce((acc, p) => {
        acc[p.name.toLowerCase()] = p.id;
        return acc;
      }, {} as Record<string, string>);

      const fetchedArticles = await fetchRecentNews(partnerNames);
      
      const articlesWithIds = fetchedArticles.map(article => ({
        ...article,
        // Assign partnerId based on the name returned by the API
        partnerId: partnerNameMap[article.partnerName.toLowerCase()] || 'unknown',
      }));

      setArticles(articlesWithIds);
      // Update the set of partners we have data for
      setFetchedPartnerIds(new Set(currentSelectedIds));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching news.');
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  }, [partners]);

  // INITIAL LOAD ONLY: Fetch news for the default (or saved) selection.
  // We removed the dependency on `selectedPartnerIds` to prevent auto-fetching on checkbox toggle.
  useEffect(() => {
    fetchAndSetNews(selectedPartnerIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    try {
      localStorage.setItem('selectedPartnerIds', JSON.stringify(selectedPartnerIds));
    } catch (error) {
      console.error("Failed to save selected partners to localStorage", error);
    }
  }, [selectedPartnerIds]);

  const handleRefresh = useCallback(() => {
    // Manual sync triggers fetch for whatever is currently selected
    fetchAndSetNews(selectedPartnerIds);
  }, [selectedPartnerIds, fetchAndSetNews]);

  const handlePartnerSelectionChange = (partnerId: string, isSelected: boolean) => {
    setSelectedPartnerIds(prev => {
      if (isSelected) {
        return [...prev, partnerId];
      } else {
        return prev.filter(id => id !== partnerId);
      }
    });
  };

  const handleCategoryToggle = (category: PartnerCategory, isSelected: boolean) => {
    const categoryPartners = partners.filter(p => p.category === category);
    const categoryIds = categoryPartners.map(p => p.id);

    setSelectedPartnerIds(prev => {
      if (isSelected) {
        // Add IDs that aren't already selected
        const newIds = categoryIds.filter(id => !prev.includes(id));
        return [...prev, ...newIds];
      } else {
        // Remove all IDs belonging to this category
        return prev.filter(id => !categoryIds.includes(id));
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedPartnerIds(partners.map(p => p.id));
  };
  
  const handleDeselectAll = () => {
    setSelectedPartnerIds([]);
  };

  const processedArticles = useMemo(() => {
    const filtered = articles.filter(article => selectedPartnerIds.includes(article.partnerId));
    
    filtered.sort((a, b) => {
      const dateA = new Date(a.publishedDate).getTime();
      const dateB = new Date(b.publishedDate).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [articles, selectedPartnerIds, sortBy]);

  // Check if there are selected partners that haven't been fetched yet
  const hasMissingData = useMemo(() => {
    return selectedPartnerIds.some(id => !fetchedPartnerIds.has(id));
  }, [selectedPartnerIds, fetchedPartnerIds]);

  return (
    <div className="min-h-screen bg-corp-bg flex flex-col font-sans">
      <Header onRefresh={handleRefresh} />
      
      {/* Main Layout Container */}
      <div className="flex flex-1 container mx-auto px-4 py-8 max-w-7xl gap-8">
        
        {/* Sidebar Area */}
        <aside className="w-1/4 hidden lg:block relative">
          <div className="sticky top-24">
            <Sidebar
              partners={partners}
              selectedPartnerIds={selectedPartnerIds}
              onSelectionChange={handlePartnerSelectionChange}
              onCategoryToggle={handleCategoryToggle}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
            />
          </div>
        </aside>

        {/* Main Feed Area */}
        <main className="w-full lg:w-3/4 flex flex-col">
          
          {/* NEW: Morning Briefing Player */}
          <MorningBriefingPlayer articles={articles} partners={partners} />

          <ManualLinkInfographicGenerator />
          
          {/* Sort Controls */}
          <div className="flex items-center justify-between mb-6 border-b border-corp-border pb-4">
             <h2 className="text-xl font-semibold text-corp-text-primary">Latest Updates</h2>
             <div className="flex items-center space-x-3">
                <span className="text-xs uppercase tracking-wider font-medium text-corp-text-secondary">Sort by</span>
                <div className="bg-corp-card border border-corp-border p-1 rounded-lg flex">
                  <button
                    type="button"
                    onClick={() => setSortBy('newest')}
                    className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      sortBy === 'newest'
                        ? 'bg-corp-accent text-white shadow-sm'
                        : 'text-corp-text-secondary hover:text-corp-text-primary'
                    }`}
                  >
                    Newest
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy('oldest')}
                    className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      sortBy === 'oldest'
                        ? 'bg-corp-accent text-white shadow-sm'
                        : 'text-corp-text-secondary hover:text-corp-text-primary'
                    }`}
                  >
                    Oldest
                  </button>
                </div>
             </div>
          </div>

          {/* Stale Data Notification - This is now the Primary CTA for fetching data */}
          {!isLoading && hasMissingData && (
             <div className="mb-6 bg-blue-900/20 border border-blue-800 rounded-lg p-4 flex items-center justify-between animate-fade-in">
               <div className="flex items-center space-x-3">
                 <div className="p-2 bg-blue-900/50 rounded-full">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                 </div>
                 <div>
                   <h4 className="text-sm font-bold text-blue-100">New Partners Selected</h4>
                   <p className="text-xs text-blue-300">Sync the feed to retrieve intelligence for your newly selected partners.</p>
                 </div>
               </div>
               <button 
                 onClick={handleRefresh}
                 className="bg-corp-accent hover:bg-corp-accent-hover text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
               >
                 <RefreshIcon />
                 <span>Sync Now</span>
               </button>
             </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-corp-card/50 border border-corp-border border-dashed rounded-xl">
              <LoadingSpinner className="w-10 h-10 text-corp-accent" />
              <h3 className="text-lg font-medium text-corp-text-primary mt-4">Aggregating Intelligence...</h3>
              <p className="text-xs text-corp-text-secondary mt-2">Processing batch requests (Free Tier Optimized)</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 bg-corp-card/50 border border-red-900/30 rounded-xl text-center">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-red-400">Unable to Sync News</h3>
              <p className="text-corp-text-secondary mt-2 text-sm max-w-md">{error}</p>
            </div>
          ) : (
            <NewsFeed articles={processedArticles} partnerMap={partnerMap} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;