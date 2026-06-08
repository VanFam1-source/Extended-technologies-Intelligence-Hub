import React, { useMemo, useState } from 'react';
import { Partner, PartnerCategory } from '../types';

interface SidebarProps {
  partners: Partner[];
  selectedPartnerIds: string[];
  onSelectionChange: (partnerId: string, isSelected: boolean) => void;
  onCategoryToggle: (category: PartnerCategory, isSelected: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  partners, 
  selectedPartnerIds, 
  onSelectionChange, 
  onCategoryToggle,
  onSelectAll, 
  onDeselectAll 
}) => {
  // Accordion state: initialized as empty array so all categories start collapsed
  const [expandedCategories, setExpandedCategories] = useState<PartnerCategory[]>([]);

  const toggleExpansion = (category: PartnerCategory) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  const groupedPartners = useMemo(() => {
    return partners.reduce((acc, partner) => {
      const category = partner.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(partner);
      return acc;
    }, {} as Record<PartnerCategory, Partner[]>);
  }, [partners]);

  const categories = Object.keys(groupedPartners) as PartnerCategory[];

  // Helper to determine the state of the category checkbox
  const getCategoryState = (category: PartnerCategory) => {
    const categoryPartners = groupedPartners[category];
    const total = categoryPartners.length;
    const selectedCount = categoryPartners.filter(p => selectedPartnerIds.includes(p.id)).length;

    if (selectedCount === 0) return 'unchecked';
    if (selectedCount === total) return 'checked';
    return 'indeterminate';
  };

  return (
    <div className="bg-corp-card/50 backdrop-blur-sm border border-corp-border rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-corp-border pb-4 mb-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-corp-text-primary">Partner Filter</h2>
        <div className="flex space-x-3">
          <button onClick={onSelectAll} className="text-xs font-medium text-corp-accent hover:text-corp-highlight transition-colors">All</button>
          <span className="text-corp-border">|</span>
          <button onClick={onDeselectAll} className="text-xs font-medium text-corp-text-secondary hover:text-corp-text-primary transition-colors">None</button>
        </div>
      </div>
      <div className="space-y-2">
        {categories.map(category => {
           const state = getCategoryState(category);
           const isExpanded = expandedCategories.includes(category);

           return (
             <div key={category} className="select-none">
               {/* Category Header Row */}
               <div className="flex items-center justify-between py-2 px-2 -ml-2 rounded-lg hover:bg-corp-card-hover/50 transition-colors group">
                  <div className="flex items-center space-x-3 overflow-hidden">
                      {/* Checkbox for Selection */}
                      <div className="relative flex items-center flex-shrink-0">
                          <input
                            type="checkbox"
                            className="peer h-3.5 w-3.5 appearance-none rounded border border-slate-600 bg-slate-800/50 checked:border-corp-accent checked:bg-corp-accent focus:ring-1 focus:ring-corp-accent focus:ring-offset-0 transition-all cursor-pointer"
                            checked={state === 'checked'}
                            ref={input => {
                              if (input) {
                                input.indeterminate = state === 'indeterminate';
                              }
                            }}
                            onChange={(e) => onCategoryToggle(category, e.target.checked)}
                          />
                           <svg
                              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                      </div>

                      {/* Label for Accordion Expansion */}
                      <button 
                        onClick={() => toggleExpansion(category)}
                        className="text-xs font-bold text-corp-text-secondary group-hover:text-corp-text-primary uppercase tracking-wider transition-colors text-left truncate"
                      >
                        {category}
                      </button>
                  </div>

                  {/* Chevron for Accordion Expansion */}
                  <button 
                    onClick={() => toggleExpansion(category)}
                    className={`text-slate-500 hover:text-corp-accent transition-transform duration-200 flex-shrink-0 ml-2 ${isExpanded ? 'rotate-180' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
               </div>

               {/* Collapsible Partner List */}
               {isExpanded && (
                 <div className="mt-1 space-y-1 pl-2 border-l border-corp-border/50 ml-3.5 mb-3 animate-fade-in-down origin-top">
                   {groupedPartners[category].map(partner => (
                     <label key={partner.id} className="flex items-center space-x-3 cursor-pointer group py-1.5 px-2 hover:bg-corp-card-hover rounded-md transition-colors">
                       <div className="relative flex items-center flex-shrink-0">
                         <input
                           type="checkbox"
                           className="peer h-4 w-4 appearance-none rounded border border-slate-600 bg-slate-800 checked:border-corp-accent checked:bg-corp-accent focus:ring-1 focus:ring-corp-accent focus:ring-offset-0 transition-all"
                           checked={selectedPartnerIds.includes(partner.id)}
                           onChange={(e) => onSelectionChange(partner.id, e.target.checked)}
                         />
                          <svg
                             className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
                             xmlns="http://www.w3.org/2000/svg"
                             viewBox="0 0 24 24"
                             fill="none"
                             stroke="currentColor"
                             strokeWidth="4"
                             strokeLinecap="round"
                             strokeLinejoin="round"
                           >
                             <polyline points="20 6 9 17 4 12"></polyline>
                           </svg>
                       </div>
                       <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors truncate">{partner.name}</span>
                     </label>
                   ))}
                 </div>
               )}
             </div>
           );
        })}
      </div>
    </div>
  );
};

export default Sidebar;