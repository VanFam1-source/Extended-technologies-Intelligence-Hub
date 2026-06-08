import React from 'react';
import RefreshIcon from './icons/RefreshIcon';

interface HeaderProps {
  onRefresh: () => void;
}

const Header: React.FC<HeaderProps> = ({ onRefresh }) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-corp-bg/80 border-b border-corp-border">
      <div className="container mx-auto px-4 h-20 max-w-7xl flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2.5 bg-gradient-to-br from-corp-accent to-blue-700 rounded-lg shadow-lg shadow-blue-900/20">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3h2m-4 3H9m4 10v-2m-4 2v-2m-4-5h16" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-corp-text-primary tracking-tight leading-tight">
              Extended Technologies
            </h1>
            <p className="text-xs text-corp-highlight font-medium uppercase tracking-widest">News & Intelligence Hub</p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="group bg-corp-card hover:bg-corp-card-hover border border-corp-border text-corp-text-primary text-sm font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2 hover:border-corp-accent/50"
          aria-label="Refresh news feed"
        >
          <div className="text-corp-text-secondary group-hover:text-corp-accent transition-colors">
            <RefreshIcon />
          </div>
          <span className="hidden sm:inline">Sync Feed</span>
        </button>
      </div>
    </header>
  );
};

export default Header;