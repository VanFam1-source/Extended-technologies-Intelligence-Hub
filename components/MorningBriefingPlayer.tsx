import React, { useState, useRef, useMemo } from 'react';
import { NewsArticle, PartnerCategory, BriefingTopic, Partner } from '../types';
import { generateBriefingScript, generateSpeech } from '../services/geminiService';
import LoadingSpinner from './icons/LoadingSpinner';
import NewsCard from './NewsCard';

interface MorningBriefingPlayerProps {
  articles: NewsArticle[];
  partners: Partner[];
}

const MorningBriefingPlayer: React.FC<MorningBriefingPlayerProps> = ({ articles, partners }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<BriefingTopic>('MORNING_BRIEFING');
  
  // Playlist State
  const [playlistArticles, setPlaylistArticles] = useState<NewsArticle[]>([]);
  const [showTracklist, setShowTracklist] = useState(false);

  // Audio Context Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  // Filter Logic based on Topic
  const getFilteredArticles = () => {
    switch (currentTopic) {
      case 'MORNING_BRIEFING':
        return articles;
        
      case 'AI_FOCUS':
        return articles.filter(a => {
           const p = partners.find(p => p.id === a.partnerId);
           return p && (p.category === PartnerCategory.GPU_SERVER || p.category === PartnerCategory.SERVER);
        });

      case 'DCI':
        return articles.filter(a => {
           const p = partners.find(p => p.id === a.partnerId);
           return p && p.category === PartnerCategory.SERVER;
        });

      case 'NET_STO':
        return articles.filter(a => {
           const p = partners.find(p => p.id === a.partnerId);
           return p && (p.category === PartnerCategory.NETWORKING || p.category === PartnerCategory.STORAGE);
        });

      case 'SECURITY_ROUNDUP':
         // Logic: Category is Security OR (Networking/Storage AND contains keywords)
         const keywords = ['security', 'cyber', 'ransomware', 'zero trust', 'protect', 'firewall', 'attack'];
         return articles.filter(a => {
            const p = partners.find(p => p.id === a.partnerId);
            if (!p) return false;
            
            if (p.category === PartnerCategory.SECURITY) return true;
            
            if (p.category === PartnerCategory.NETWORKING || p.category === PartnerCategory.STORAGE) {
               const text = (a.title + ' ' + a.summary).toLowerCase();
               return keywords.some(k => text.includes(k));
            }
            return false;
         });

      default:
        return articles;
    }
  };

  const handlePlay = async () => {
    if (isPlaying) {
       // Stop logic
       if (sourceRef.current) {
         sourceRef.current.stop();
         sourceRef.current = null;
       }
       setIsPlaying(false);
       return;
    }

    setIsLoading(true);

    try {
       // 1. Get Content
       const relevantArticles = getFilteredArticles();
       
       if (relevantArticles.length === 0) {
           alert("No relevant articles found for this topic to generate a briefing.");
           setIsLoading(false);
           return;
       }
       
       // Limit to top 5 recent to keep briefing concise
       const topArticles = relevantArticles.slice(0, 5);
       
       // Update Playlist State immediately so users can see what's coming
       setPlaylistArticles(topArticles);
       setShowTracklist(true); // Auto-expand the drawer

       // 2. Generate Script (Text)
       const script = await generateBriefingScript(topArticles, currentTopic.replace('_', ' '));

       // 3. Generate Speech (PCM Audio)
       const audioBytes = await generateSpeech(script);
       
       if (!audioBytes) throw new Error("Failed to generate audio.");

       // 4. Play Audio
       if (!audioContextRef.current) {
           audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
       }
       
       const ctx = audioContextRef.current;
       
       // Helper to decode PCM
       const decodeAudioData = async (data: Uint8Array): Promise<AudioBuffer> => {
          const dataInt16 = new Int16Array(data.buffer);
          const numChannels = 1;
          const frameCount = dataInt16.length;
          const buffer = ctx.createBuffer(numChannels, frameCount, 24000); // 24kHz is standard for Gemini Flash Audio
          const channelData = buffer.getChannelData(0);
          for (let i = 0; i < frameCount; i++) {
             channelData[i] = dataInt16[i] / 32768.0;
          }
          return buffer;
       };

       const audioBuffer = await decodeAudioData(audioBytes);
       
       const source = ctx.createBufferSource();
       source.buffer = audioBuffer;
       source.connect(ctx.destination);
       
       source.onended = () => {
           setIsPlaying(false);
           sourceRef.current = null;
       };

       source.start();
       sourceRef.current = source;
       setIsPlaying(true);

    } catch (e) {
       console.error(e);
       alert("Failed to play briefing.");
    } finally {
       setIsLoading(false);
    }
  };

  return (
    <div className="mb-8">
        {/* Player Bar */}
        <div className={`bg-gradient-to-r from-slate-900 to-slate-800 border border-corp-border p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300 ${showTracklist ? 'rounded-t-xl border-b-0' : 'rounded-xl'}`}>
        <div className="flex items-center space-x-4 w-full md:w-auto">
            <div className={`p-3 rounded-full shadow-lg shadow-blue-500/20 transition-all duration-500 ${isPlaying ? 'bg-red-600 animate-pulse' : 'bg-corp-accent'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isPlaying ? (
                     <rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none" />
                ) : (
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                )}
                {isPlaying && <rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none" />}
                </svg>
            </div>
            <div>
                <h3 className="text-lg font-bold text-corp-text-primary">Daily Audio Briefing</h3>
                <p className="text-xs text-corp-text-secondary">AI-generated podcast of your partner updates</p>
            </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
                value={currentTopic}
                onChange={(e) => !isPlaying && setCurrentTopic(e.target.value as BriefingTopic)}
                disabled={isPlaying || isLoading}
                className="bg-slate-950 border border-slate-700 text-sm rounded-lg p-2.5 text-white focus:ring-corp-accent focus:border-corp-accent block w-full md:w-48 disabled:opacity-50"
            >
                <option value="MORNING_BRIEFING">Full Morning Briefing</option>
                <option value="AI_FOCUS">AI Focus (Compute)</option>
                <option value="DCI">DCI (Server & Power)</option>
                <option value="SECURITY_ROUNDUP">Security Roundup</option>
                <option value="NET_STO">Networking & Storage</option>
            </select>

            <button
            onClick={handlePlay}
            disabled={isLoading}
            className={`flex items-center justify-center px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md ${isPlaying ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-corp-text-primary hover:bg-white text-corp-bg'}`}
            >
                {isLoading ? (
                    <LoadingSpinner className="w-5 h-5 text-current" />
                ) : isPlaying ? (
                    <div className="flex items-center space-x-2">
                        <span>Stop</span>
                    </div>
                ) : (
                    <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>Play</span>
                    </div>
                )}
            </button>
            
            {/* Tracklist Toggle Button */}
            {playlistArticles.length > 0 && (
                <button 
                    onClick={() => setShowTracklist(!showTracklist)}
                    className={`p-2.5 rounded-lg border transition-colors ${showTracklist ? 'bg-corp-accent text-white border-corp-accent' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'}`}
                    title="Toggle Featured Articles"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            )}
        </div>
        </div>

        {/* Tracklist / Source Drawer */}
        {showTracklist && playlistArticles.length > 0 && (
            <div className="bg-slate-900/50 border-x border-b border-corp-border rounded-b-xl p-6 animate-fade-in-down">
                <h4 className="text-xs font-bold text-corp-highlight uppercase tracking-widest mb-4 flex items-center">
                    <span className="w-2 h-2 bg-corp-highlight rounded-full mr-2"></span>
                    Featured in this Briefing
                </h4>
                <div className="grid gap-4">
                    {playlistArticles.map(article => {
                        // Find the partner object safely
                        const partner = partners.find(p => p.id === article.partnerId) || { id: 'unknown', name: article.partnerName, category: PartnerCategory.SERVER };
                        return (
                            <NewsCard key={`playlist-${article.id}`} article={article} partner={partner} />
                        );
                    })}
                </div>
            </div>
        )}
    </div>
  );
};

export default MorningBriefingPlayer;