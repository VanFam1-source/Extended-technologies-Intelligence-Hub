export enum PartnerCategory {
  SERVER = 'Server & Power',
  GPU_SERVER = 'Compute & AI',
  NETWORKING = 'Networking',
  STORAGE = 'Storage',
  SECURITY = 'Security',
  PERIPHERALS = 'Peripherals & Displays',
}

export interface Partner {
  id: string;
  name: string;
  category: PartnerCategory;
}

export interface NewsArticle {
  id: string;
  title: string;
  partnerId: string; // The ID of the partner from our constants
  partnerName: string; // The name returned by the API
  url: string;
  contentSnippet?: string; // This may not be available from the live API
  summary: string;
  publishedDate: string;
}

export interface StrategicAnalysis {
  detailedTalkingPoints: string[];
  slideHighlights: string[];
}

export type BriefingTopic = 'MORNING_BRIEFING' | 'AI_FOCUS' | 'DCI' | 'SECURITY_ROUNDUP' | 'NET_STO';