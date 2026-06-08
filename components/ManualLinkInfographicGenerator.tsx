import React, { useState } from 'react';
import { summarizeUrl } from '../services/geminiService';
import { NewsArticle } from '../types';
import InfographicModal from './InfographicModal';
import LoadingSpinner from './icons/LoadingSpinner';

const ManualLinkInfographicGenerator: React.FC = () => {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [articleForModal, setArticleForModal] = useState<NewsArticle | null>(null);
    
    // Accordion state: default to collapsed to save space
    const [isExpanded, setIsExpanded] = useState(false);

    const handleGenerate = async () => {
        if (!url.trim()) {
            setError('Please enter a valid URL.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const summary = await summarizeUrl(url);
            
            const mockArticle: NewsArticle = {
                id: `manual-${Date.now()}`,
                title: 'External Intelligence Report',
                partnerId: 'custom',
                partnerName: 'External Source',
                url: url,
                contentSnippet: summary,
                summary: summary,
                publishedDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
            };
            setArticleForModal(mockArticle);
            setIsModalOpen(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCloseModal = () => {
      setIsModalOpen(false);
      setArticleForModal(null);
    }

    return (
        <>
            <div className="bg-gradient-to-r from-corp-card to-corp-card-hover border border-corp-border rounded-xl mb-8 shadow-lg overflow-hidden transition-all duration-300">
                {/* Accordion Header */}
                <div 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-4 flex items-center justify-between cursor-pointer group hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 group-hover:text-corp-highlight transition-colors ${isExpanded ? 'bg-slate-700 text-white' : ''}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-corp-text-primary uppercase tracking-wide group-hover:text-corp-highlight transition-colors">Analyze External Source</h2>
                            {!isExpanded && <p className="text-xs text-corp-text-secondary">Click to paste a URL and generate an instant summary.</p>}
                        </div>
                    </div>
                    
                    <button className={`text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-corp-accent' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                {/* Collapsible Content */}
                {isExpanded && (
                    <div className="p-6 pt-2 animate-fade-in-down">
                         <p className="text-xs text-corp-text-secondary mb-4">Paste any URL to generate an instant infographic summary.</p>
                        <div className="flex flex-col sm:flex-row items-stretch space-y-3 sm:space-y-0 sm:space-x-3">
                            <div className="relative flex-grow w-full">
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://example.com/news-article"
                                    className="w-full bg-corp-bg border border-slate-700 rounded-lg py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-corp-accent focus:border-transparent transition-all shadow-inner"
                                    disabled={isLoading}
                                />
                            </div>
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading || !url.trim()}
                                className="w-full sm:w-auto bg-corp-text-primary hover:bg-white text-corp-bg font-bold py-3 px-6 rounded-lg transition-all duration-200 inline-flex items-center justify-center space-x-2 flex-shrink-0 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading && <LoadingSpinner className="w-4 h-4 text-corp-bg" />}
                                <span>Analyze & Generate</span>
                            </button>
                        </div>
                        {error && <p className="text-red-400 mt-3 text-sm flex items-center"><span className="mr-1">⚠️</span> {error}</p>}
                    </div>
                )}
            </div>
            {isModalOpen && articleForModal && <InfographicModal article={articleForModal} onClose={handleCloseModal} />}
        </>
    );
};

export default ManualLinkInfographicGenerator;