import React from 'react';
import { NewsArticle, Partner } from '../types';
import NewsCard from './NewsCard';

interface NewsFeedProps {
  articles: NewsArticle[];
  partnerMap: Record<string, Partner>;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ articles, partnerMap }) => {
  if (articles.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-96 bg-corp-card/30 border border-corp-border border-dashed rounded-xl p-10 text-center">
            <div className="bg-slate-800/50 p-4 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3h2m-4 3H9m4 10v-2m-4 2v-2m-4-5h16" />
                </svg>
            </div>
            <h3 className="text-lg font-semibold text-corp-text-primary">No Intelligence Data Found</h3>
            <p className="text-corp-text-secondary mt-2 text-sm max-w-xs">Select technology partners from the sidebar to aggregate their latest updates.</p>
        </div>
    );
  }

  return (
    <div className="grid gap-6">
      {articles.map(article => (
        <NewsCard key={article.id} article={article} partner={partnerMap[article.partnerId]} />
      ))}
    </div>
  );
};

export default NewsFeed;