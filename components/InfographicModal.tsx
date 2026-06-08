import React, { useState, useEffect, useCallback } from 'react';
import { NewsArticle, StrategicAnalysis } from '../types';
import { generateInfographicPrompt, generateImage, generateStrategicAnalysis } from '../services/geminiService';
import { generatePowerPoint, SlideLayoutType } from '../services/slideService';
import { ASPECT_RATIOS, INFOGRAPHIC_STYLES } from '../constants';
import LoadingSpinner from './icons/LoadingSpinner';
import CloseIcon from './icons/CloseIcon';
import RefreshIcon from './icons/RefreshIcon';

interface InfographicModalProps {
  article: NewsArticle;
  onClose: () => void;
}

type Status = 'idle' | 'prompting' | 'imaging' | 'success' | 'error';
type AnalysisStatus = 'idle' | 'generating' | 'success' | 'error';

const InfographicModal: React.FC<InfographicModalProps> = ({ article, onClose }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [selectedStyle, setSelectedStyle] = useState<string>(INFOGRAPHIC_STYLES[0].name);

  const [analysis, setAnalysis] = useState<StrategicAnalysis | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  // New state for Slide Layout selection
  const [slideLayout, setSlideLayout] = useState<SlideLayoutType>('executive');


  const handleGeneratePrompt = useCallback(async () => {
    setStatus('prompting');
    setError(null);
    try {
      const generatedPrompt = await generateInfographicPrompt(article.summary, selectedStyle);
      setPrompt(generatedPrompt);
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setStatus('error');
    }
  }, [article.summary, selectedStyle]);

  useEffect(() => {
    handleGeneratePrompt();
  }, [handleGeneratePrompt]);
  
  const handleGenerateImage = async () => {
    if (!prompt) return;
    setStatus('imaging');
    setError(null);
    setImage('');
    setAnalysis(null);
    setAnalysisStatus('idle');
    setAnalysisError(null);

    try {
      const style = INFOGRAPHIC_STYLES.find(s => s.name === selectedStyle);
      const stylePrompt = style ? style.promptFragment : '';
      const generatedImage = await generateImage(prompt, aspectRatio, stylePrompt);
      setImage(generatedImage);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setStatus('error');
    }
  };

  const handleGenerateAnalysis = async () => {
    setAnalysisStatus('generating');
    setAnalysisError(null);
    try {
      const result = await generateStrategicAnalysis(article.summary);
      setAnalysis(result);
      setAnalysisStatus('success');
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setAnalysisStatus('error');
    }
  }

  const handleExportSlide = async () => {
      if (!analysis) return;
      try {
          await generatePowerPoint(article, analysis, image, slideLayout);
      } catch (e) {
          console.error(e);
          alert("Failed to export slide.");
      }
  }

  const isGenerating = status === 'prompting' || status === 'imaging';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-corp-card border border-corp-border rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-5 border-b border-corp-border bg-corp-bg/50">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-corp-accent rounded-full animate-pulse"></div>
            <h2 className="text-lg font-bold text-corp-text-primary tracking-tight">Asset Generator</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-md">
            <CloseIcon />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-gradient-to-b from-corp-card to-corp-bg">
          {/* Left Panel: Controls */}
          <div className="flex flex-col space-y-6">
            <div>
              <h3 className="text-xs font-bold text-corp-highlight uppercase tracking-widest mb-2">Context Source</h3>
              <p className="text-slate-300 bg-slate-950/50 border border-slate-800 p-4 rounded-lg text-sm leading-relaxed shadow-inner">{article.summary}</p>
            </div>
             <div>
              <div className="flex items-center justify-between mb-2">
                 <h3 className="text-xs font-bold text-corp-highlight uppercase tracking-widest">Visual Blueprint (AI Prompt)</h3>
                 <button
                  onClick={handleGeneratePrompt}
                  className="text-xs text-corp-accent hover:text-white transition-colors inline-flex items-center space-x-1 disabled:text-gray-600 disabled:cursor-not-allowed"
                  disabled={status === 'prompting'}
                >
                  <RefreshIcon />
                  <span>Regenerate</span>
                </button>
              </div>
              
              {status === 'prompting' ? (
                 <div className="flex items-center space-x-3 text-slate-400 bg-slate-950/30 p-4 rounded-lg border border-slate-800 border-dashed"><LoadingSpinner /><p className="text-sm">Analyzing context and designing prompt...</p></div>
              ) : (
                <div className="relative group">
                   <p className="text-slate-400 bg-slate-950/50 border border-slate-800 p-4 rounded-lg text-sm italic shadow-inner">{prompt || 'Prompt will appear here...'}</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-bold text-corp-text-secondary uppercase tracking-widest mb-2">Visual Style</h3>
                  <div className="grid grid-cols-2 gap-2">
                      {INFOGRAPHIC_STYLES.map(style => (
                          <button key={style.name} onClick={() => setSelectedStyle(style.name)}
                              className={`py-2 px-3 text-xs font-medium rounded-md transition-all border ${selectedStyle === style.name ? 'bg-corp-accent border-corp-accent text-white shadow-md' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}>
                              {style.name}
                          </button>
                      ))}
                  </div>
                </div>
                 <div>
                    <h3 className="text-xs font-bold text-corp-text-secondary uppercase tracking-widest mb-2">Dimensions</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {ASPECT_RATIOS.map(ratio => (
                            <button key={ratio} onClick={() => setAspectRatio(ratio)}
                                className={`py-2 px-1 text-xs font-medium rounded-md transition-all border ${aspectRatio === ratio ? 'bg-corp-text-primary border-corp-text-primary text-corp-bg' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}>
                                {ratio}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="pt-2">
               <button 
                onClick={handleGenerateImage} 
                disabled={isGenerating || !prompt}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-lg transition-all shadow-lg hover:shadow-emerald-900/20 flex items-center justify-center space-x-2 text-sm tracking-wide uppercase">
                  {status === 'imaging' && <LoadingSpinner />}
                  <span>{status === 'imaging' ? 'Rendering Visuals...' : 'Generate High-Res Infographic'}</span>
               </button>
            </div>
          </div>

          {/* Right Panel: Image Display & Talking Points */}
          <div className="flex flex-col h-full">
             <div className="bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center min-h-[350px] lg:h-[400px] overflow-hidden relative shadow-inner">
                {status === 'imaging' && (
                    <div className="text-center text-slate-500">
                        <LoadingSpinner className="w-8 h-8 mx-auto text-corp-accent" />
                        <p className="mt-4 text-sm font-medium animate-pulse">Synthesizing pixels...</p>
                    </div>
                )}
                 {status === 'success' && image && (
                    <img src={image} alt="Generated infographic" className="w-full h-full object-contain" />
                )}
                 {status === 'error' && (
                    <div className="text-center text-red-400 px-4">
                        <h4 className="font-bold text-sm uppercase tracking-widest mb-2">Generation Error</h4>
                        <p className="text-sm text-slate-500">{error}</p>
                    </div>
                )}
                {status !== 'imaging' && status !== 'success' && status !== 'error' && (
                     <div className="text-center text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">Preview area</p>
                    </div>
                )}
             </div>

             {status === 'success' && (
               <div className="mt-6 pt-6 border-t border-slate-800/50">
                 {analysisStatus === 'idle' && (
                   <button onClick={handleGenerateAnalysis} className="w-full bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 hover:text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center space-x-2 text-sm">
                     <span>Generate Strategic Analysis & Slide Data</span>
                   </button>
                 )}
                 {analysisStatus === 'generating' && (
                   <div className="flex items-center justify-center space-x-2 text-indigo-400 py-2">
                     <LoadingSpinner />
                     <p className="text-sm">formulating strategy...</p>
                   </div>
                 )}
                 {analysisStatus === 'error' && (
                   <div className="text-center text-red-400">
                     <p className="text-xs">{analysisError}</p>
                     <button onClick={handleGenerateAnalysis} className="mt-2 text-xs text-indigo-400 hover:underline">Retry</button>
                   </div>
                 )}
                 {analysisStatus === 'success' && analysis && (
                   <div className="flex flex-col gap-4 animate-fade-in">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {/* Speaker Notes Column */}
                           <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-lg p-4 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                                <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3 border-b border-indigo-500/20 pb-1">Speaker Notes (Script)</h4>
                                <ul className="space-y-2">
                                {analysis.detailedTalkingPoints.map((point, index) => (
                                    <li key={index} className="flex items-start space-x-2 text-xs text-slate-300 leading-relaxed">
                                    <span className="mt-1 h-1 w-1 rounded-full bg-indigo-500 flex-shrink-0"></span>
                                    <span>{point}</span>
                                    </li>
                                ))}
                                </ul>
                           </div>
                           
                           {/* Slide Content Column */}
                           <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                                <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3 border-b border-blue-500/20 pb-1">Slide Content (Visuals)</h4>
                                <ul className="space-y-2">
                                {analysis.slideHighlights.map((point, index) => (
                                    <li key={index} className="flex items-start space-x-2 text-xs text-slate-300 font-medium">
                                    <span className="mt-1 h-1 w-1 rounded-full bg-blue-500 flex-shrink-0"></span>
                                    <span>{point}</span>
                                    </li>
                                ))}
                                </ul>
                           </div>
                       </div>

                       {/* Slide Format Selector */}
                       <div>
                         <h4 className="text-xs font-bold text-corp-text-secondary uppercase tracking-widest mb-2">Slide Format</h4>
                         <div className="grid grid-cols-3 gap-3">
                            <button 
                              onClick={() => setSlideLayout('executive')}
                              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${slideLayout === 'executive' ? 'bg-corp-accent/10 border-corp-accent text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                            >
                              <div className="flex space-x-1 mb-1">
                                <div className="w-2 h-3 bg-current opacity-50 rounded-sm"></div>
                                <div className="w-3 h-3 bg-current opacity-80 rounded-sm"></div>
                              </div>
                              <span className="text-[10px] font-medium uppercase">Brief</span>
                            </button>

                            <button 
                              onClick={() => setSlideLayout('visual')}
                              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${slideLayout === 'visual' ? 'bg-corp-accent/10 border-corp-accent text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                            >
                               <div className="flex flex-col space-y-0.5 mb-1">
                                <div className="w-5 h-3 bg-current opacity-80 rounded-sm"></div>
                                <div className="w-5 h-0.5 bg-current opacity-50 rounded-sm"></div>
                              </div>
                              <span className="text-[10px] font-medium uppercase">Visual</span>
                            </button>

                            <button 
                              onClick={() => setSlideLayout('detail')}
                              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${slideLayout === 'detail' ? 'bg-corp-accent/10 border-corp-accent text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                            >
                               <div className="flex space-x-1 mb-1">
                                <div className="w-1.5 h-3 bg-current opacity-50 rounded-sm"></div>
                                <div className="w-3.5 h-3 flex flex-col space-y-0.5">
                                    <div className="w-full h-1 bg-current opacity-80 rounded-[1px]"></div>
                                    <div className="w-full h-1.5 bg-current opacity-80 rounded-[1px]"></div>
                                </div>
                              </div>
                              <span className="text-[10px] font-medium uppercase">Deep Dive</span>
                            </button>
                         </div>
                       </div>

                       <button 
                        onClick={handleExportSlide}
                        className="w-full bg-corp-text-primary hover:bg-white text-corp-bg font-bold py-3 px-4 rounded-lg shadow-lg transition-all flex items-center justify-center space-x-2"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                           </svg>
                           <span>Download Slide Deck (.pptx)</span>
                       </button>
                   </div>
                 )}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfographicModal;