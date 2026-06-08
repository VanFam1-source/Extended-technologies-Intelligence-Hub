
import React, { useState } from 'react';
import { NewsArticle, Partner, StrategicAnalysis } from '../types';
import InfographicModal from './InfographicModal';
import LightningIcon from './icons/LightningIcon';
import LoadingSpinner from './icons/LoadingSpinner';
import { generateInfographicPrompt, generateStrategicAnalysis, generateImage } from '../services/geminiService';
import { generatePowerPoint } from '../services/slideService';
import { INFOGRAPHIC_STYLES } from '../constants';

interface NewsCardProps {
  article: NewsArticle;
  partner: Partner;
}

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  // Add a time zone to prevent off-by-one day errors
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString(undefined, options);
};

const NewsCard: React.FC<NewsCardProps> = ({ article, partner }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Express Mode State
  const [expressStatus, setExpressStatus] = useState<'idle' | 'analyzing' | 'rendering' | 'packaging' | 'error'>('idle');

  const handleInstantSlide = async () => {
    setExpressStatus('analyzing');
    
    try {
        // 1. Parallel Execution: Run Strategy Analysis AND Prompt Engineering simultaneously.
        // This utilizes the asynchronous nature of the web to cut total wait time significantly.
        const [analysis, prompt] = await Promise.all([
            generateStrategicAnalysis(article.summary),
            // We hardcode "Corporate" style for the Express Mode as it is the safest bet for business presentations.
            generateInfographicPrompt(article.summary, "Corporate") 
        ]);

        setExpressStatus('rendering');

        // 2. Generate Image
        // We use the "Corporate" style prompt fragment hardcoded here for speed.
        const stylePrompt = "professional, blue and grey color palette, clean lines, corporate branding style";
        // We hardcode 16:9 as it is the native aspect ratio for PowerPoint slides.
        const image = await generateImage(prompt, "16:9", stylePrompt);

        setExpressStatus('packaging');

        // 3. Generate PowerPoint
        // We default to the "Executive" layout as it is the most balanced/versatile.
        await generatePowerPoint(article, analysis, image, 'executive');

        setExpressStatus('idle');
    } catch (error) {
        console.error("Express Mode Failed:", error);
        setExpressStatus('error');
        // Reset error state after 3 seconds
        setTimeout(() => setExpressStatus('idle'), 3000);
    }
  };

  return (
    <>
      <div className="group relative bg-corp-card border border-corp-border rounded-xl p-6 hover:border-corp-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/10">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
            <div className="flex items-center space-x-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-200 border border-blue-800">
                  {partner.name}
                </span>
                <span className="text-xs text-corp-text-secondary font-medium">{formatDate(article.publishedDate)}</span>
            </div>
        </div>
        
        <h3 className="text-lg sm:text-xl font-bold text-corp-text-primary mb-3 group-hover:text-corp-highlight transition-colors leading-snug">
          {article.title}
        </h3>
        
        <p className="text-slate-400 text-sm leading-relaxed mb-6 border-l-2 border-slate-700 pl-4">
          {article.summary}
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-corp-border/50">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-corp-text-secondary hover:text-corp-text-primary transition-colors flex items-center space-x-1"
          >
            <span>Read Source</span>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {/* Secondary Button: Custom Builder */}
            <button
                onClick={() => setIsModalOpen(true)}
                disabled={expressStatus !== 'idle'}
                className="flex-1 sm:flex-none bg-transparent border border-corp-border hover:border-corp-text-secondary text-corp-text-secondary hover:text-white text-sm font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span>Custom Builder</span>
            </button>

            {/* Primary Button: Instant Slide (Express Mode) */}
            <button
                onClick={handleInstantSlide}
                disabled={expressStatus !== 'idle'}
                className={`flex-1 sm:flex-none relative overflow-hidden bg-gradient-to-r from-corp-accent to-blue-600 hover:from-corp-accent-hover hover:to-blue-700 text-white text-sm font-bold py-2 px-5 rounded-lg shadow-md shadow-blue-900/20 transition-all duration-200 flex items-center justify-center space-x-2 hover:-translate-y-0.5 hover:shadow-lg ${expressStatus === 'error' ? 'from-red-600 to-red-700' : ''}`}
            >
                {expressStatus === 'idle' && (
                    <>
                        <LightningIcon className="h-4 w-4 text-yellow-300" />
                        <span>Instant Slide</span>
                    </>
                )}
                
                {expressStatus !== 'idle' && expressStatus !== 'error' && (
                    <>
                        <LoadingSpinner className="w-4 h-4" />
                        <span>
                            {expressStatus === 'analyzing' && 'Analyzing...'}
                            {expressStatus === 'rendering' && 'Visualizing...'}
                            {expressStatus === 'packaging' && 'Creating Deck...'}
                        </span>
                    </>
                )}

                {expressStatus === 'error' && (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>Retry</span>
                    </>
                )}
            </button>
          </div>
        </div>
      </div>
      {isModalOpen && <InfographicModal article={article} onClose={() => setIsModalOpen(false)} />}
    </>
  );
};

export default NewsCard;
