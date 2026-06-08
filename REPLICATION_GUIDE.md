# Extended Technologies News Hub — Replication & Duplication Guide

This document provides a comprehensive blueprint, architecture breakdown, and implementation guide for duplicating or recreating the **Extended Technologies News Hub** in another instance or environment.

---

## 📅 System Information & Metadata
- **Project Name:** Extended Technologies News Hub
- **Purpose:** An AI-powered partner sales enablement platform and intelligence hub. It curates real-time news across key tech partner hardware and software categories, synthesizes summaries, hosts an interactive Morning Audio Briefing Player, and allows reps to generate visual infographics and downloadable custom-styled presentations with speaker notes.
- **Visual Palette:** Slate-Zinc Corporate Dark Theme (`#020617` main bg, `#0f172a` cards, `#3b82f6` accent, `#f8fafc` primary text, `#94a3b8` muted text).

---

## 📁 Source Directory Structure
Any replicating LLM should reconstruct the directory tree as follows:

```text
/
├── .gitignore                   # Ignore node_modules, build outputs, and local env files
├── package.json                 # Project dependencies, scripts, and type declarations
├── tsconfig.json                # Bundler-mode TypeScript environment rules
├── vite.config.ts               # Vite configuration with API key injection and aliases
├── index.html                   # Entry point index, custom Tailwind CDN styling, and import map
├── index.tsx                    # React bootstrapper mounting the App component
├── metadata.json                # Project capabilities and permissions details
├── types.ts                     # Strongly-typed data contract definitions
├── constants.ts                 # Pre-configured partner entities and visual infographic presets
├── App.tsx                      # Primary layout orchestrator, multi-view controller and global state
├── components/
│   ├── Header.tsx               # Top navigation rail containing title, manual updates, and status
│   ├── Sidebar.tsx              # Segmented partner filtering panel with class category selectors
│   ├── NewsCard.tsx             # Interactive story cards with action triggers for slides / graphics
│   ├── NewsFeed.tsx             # Main container displaying the filtered feed of active stories
│   ├── MorningBriefingPlayer.tsx # Podcasts-inspired player with synthesis and PCM audio playback
│   ├── ManualLinkInfographicGenerator.tsx # Arbitrary link importer with slide and infographic generators
│   ├── InfographicModal.tsx     # Overlay viewer for generated Imagen infographics and download cues
│   └── icons/
│       ├── CloseIcon.tsx        # Standard clean closure representation
│       ├── LightningIcon.tsx    # Impact / high energy visual vector graphic
│       ├── LoadingSpinner.tsx   # SVG rotate animation spinner for active requests 
│       └── RefreshIcon.tsx      # Sync actions feedback circle indicator
└── services/
    ├── geminiService.ts         # Google GenAI API integration (Search Grounding & TTS)
    └── slideService.ts          # PPTXGenJS slideshow layout generator and exporter
```

---

## 📦 Dependency Manifest (`package.json`)
The application relies on official, latest-generation libraries. Rebuild the environment using:

```json
{
  "name": "extended-technologies-news-hub",
  "private": true,
  "type": "module",
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "@google/genai": "^1.26.0",
    "jszip": "3.10.1",
    "pptxgenjs": "3.12.0"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  }
}
```

---

## ⚙️ Configuration Declarations

### `vite.config.ts`
Vite compiles and injects client environment variables during build. Ensure the Gemini keys are bound correctly:
```typescript
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
```

### `index.html` Import Maps
Since imports are resolved directly via ESM inside the AI Studio preview browser, the import maps must map imports correctly dynamically:
```html
<script type="importmap">
{
  "imports": {
    "react/": "https://aistudiocdn.com/react@^19.2.0/",
    "react": "https://aistudiocdn.com/react@^19.2.0",
    "react-dom/": "https://aistudiocdn.com/react-dom@^19.2.0/",
    "@google/genai": "https://aistudiocdn.com/@google/genai@^1.26.0",
    "jszip": "https://esm.sh/jszip@3.10.1",
    "pptxgenjs": "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.es.js"
  }
}
</script>
```

---

## 📋 Data Contract Rules (`types.ts`)
Strict model interfaces are declared for partners, news content, and summaries:

```typescript
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
  partnerId: string;
  partnerName: string;
  url: string;
  contentSnippet?: string;
  summary: string;
  publishedDate: string;
}

export interface StrategicAnalysis {
  detailedTalkingPoints: string[];
  slideHighlights: string[];
}

export type BriefingTopic = 'MORNING_BRIEFING' | 'AI_FOCUS' | 'DCI' | 'SECURITY_ROUNDUP' | 'NET_STO';
```

---

## 🔍 Core Logic Implementations

### 1. Gemini AI Integration Service (`services/geminiService.ts`)
This service uses the next-generation `@google/genai` SDK. Ensure the replicating LLM adheres to the proper model definitions, thinking configurations, and batch sizes:

```typescript
import { GoogleGenAI, Modality } from "@google/genai";
import { NewsArticle, StrategicAnalysis } from "../types";

const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY! });

// Strategy: Process in batches of 3 to avoid search result clutter and URL hallucinations.
const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunked: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size));
  }
  return chunked;
};

// FETCH RECENT LATEST STORIES WITH GOOGLE SEARCH GROUNDING
export const fetchRecentNews = async (partnerNames: string[]): Promise<NewsArticle[]> => {
  if (partnerNames.length === 0) return [];
  const BATCH_SIZE = 3;
  const batches = chunkArray(partnerNames, BATCH_SIZE);

  try {
    const batchPromises = batches.map(async (batchOfPartners) => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Perform a Google Search to find the most recent news (last 30 days) for these specific companies: ${batchOfPartners.join(', ')}.
        Find exactly 1 distinct, high-quality news article or press release for EACH company in this list.
        CRITICAL: 1. You must ONLY use URLs that are explicitly returned by the Google Search tool. No guesses. 
        Return the result as a valid JSON array: {"title", "summary", "url", "publishedDate" (YYYY-MM-DD), "partnerName"}.`,
        config: { tools: [{ googleSearch: {} }] }
      });

      let jsonText = response.text?.trim() || "[]";
      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) jsonText = jsonMatch[1];
      return JSON.parse(jsonText);
    });

    const results = await Promise.all(batchPromises);
    return results.flat().map((article: any, index: number) => ({
      ...article,
      id: `live-article-${Date.now()}-${index}`,
      partnerName: article.partnerName || "Technology Partner"
    }));
  } catch (err) {
    console.error("News query error:", err);
    throw new Error("Failed to query live news.");
  }
};

// STRATEGIC REASONING VIA GEMINI 3 THINKING MODEL
export const generateStrategicAnalysis = async (summary: string): Promise<StrategicAnalysis> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Based on this summary, act as a senior sales strategist. Provide output in JSON:
    1. "detailedTalkingPoints": 3-5 persuasive paragraph-style bullets for speaker notes.
    2. "slideHighlights": 3-4 concise, punchy bullet points (MAX 6-8 words each) for slide faces.
    
    SUMMARY: "${summary}"`,
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 2048 } // Allows deep tactical analysis
    }
  });

  let text = response.text || "{}";
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) text = jsonMatch[1];
  const parsed = JSON.parse(text);
  return {
    detailedTalkingPoints: parsed.detailedTalkingPoints || ["Analysis failing."],
    slideHighlights: parsed.slideHighlights || ["Analysis failed."]
  };
};

// INFOGRAPHIC GENERATION (IMAGEN 4.0)
export const generateImage = async (prompt: string, aspectRatio: string, stylePrompt: string): Promise<string> => {
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: `infographic design, ${prompt}, ${stylePrompt}, high quality, detailed, 8k resolution`,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/png',
      aspectRatio: aspectRatio as any,
    },
  });

  if (response.generatedImages && response.generatedImages.length > 0) {
    return `data:image/png;base64,${response.generatedImages[0].image.imageBytes}`;
  }
  throw new Error("No image returned.");
};

// AUDIO BRIEFINGS (SCRIPT & TEXT-TO-SPEECH)
export const generateBriefingScript = async (articles: NewsArticle[], topicName: string): Promise<string> => {
  const textBody = articles.map(a => `Partner: ${a.partnerName}, Title: ${a.title}, Summary: ${a.summary}`).join('\n\n');
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Write a 90-second spoken podcast script hook starting "Good morning, here is your ${topicName} update" and ending with sales motivation. Synthesize the top 3-4 trends. Clear text, no speaker brackets.
    
    UPDATES: ${textBody}`
  });
  return response.text || "No script produced.";
};

export const generateSpeech = async (text: string): Promise<Uint8Array | null> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) return null;
  
  // Decoding helper
  const binaryString = atob(base64Audio);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};
```

---

### 2. Slide Rendering & Export Engine (`services/slideService.ts`)
This engine maps generated sales insights directly into a sleek, clean slide layout matching the corporate color theme. It places heavy detailed text inside **Speaker Notes** to enforce a clean-slide presentation design code standard:

```typescript
import pptxgen from "pptxgenjs";
import { NewsArticle, StrategicAnalysis } from "../types";

export type SlideLayoutType = 'executive' | 'visual' | 'detail';

export const generatePowerPoint = async (
  article: NewsArticle,
  analysis: StrategicAnalysis,
  imageBase64: string,
  layout: SlideLayoutType = 'executive'
) => {
  const pres = new pptxgen();
  pres.author = "Extended Technologies";
  
  const BG_COLOR = "020617";
  const ACCENT_COLOR = "3b82f6";
  const TEXT_MAIN = "f8fafc";
  const TEXT_MUTED = "94a3b8";
  const CARD_BG = "1e293b";

  pres.defineSlideMaster({
    title: "MASTER_SLIDE",
    background: { color: BG_COLOR },
    objects: [
      { rect: { x: 0, y: 0, w: "100%", h: 0.75, fill: { color: CARD_BG } } },
      { text: { text: "PARTNER INTELLIGENCE BRIEF", options: { x: 0.3, y: 0.2, w: 5, h: 0.4, fontSize: 10, color: TEXT_MUTED, bold: true, charSpacing: 3 } } },
      { line: { x: 0.3, y: 5.2, w: 9.4, h: 0, line: { color: ACCENT_COLOR, width: 2 } } },
      { text: { text: `Source: ${article.partnerName} | ${article.publishedDate}`, options: { x: 0.3, y: 5.3, w: 8, h: 0.3, fontSize: 9, color: "64748b" } } }
    ]
  });

  const slide = pres.addSlide({ masterName: "MASTER_SLIDE" });

  // Inject detail talking points strictly inside speaker notes
  const notesText = `
EXECUTIVE SUMMARY:
${article.summary}

DETAILED TALKING POINTS:
${analysis.detailedTalkingPoints.map(pt => `- ${pt}`).join('\n')}
  `.trim();
  slide.addNotes(notesText);

  // Title rendering
  slide.addText(article.title, { x: 0.3, y: 0.5, w: 9.4, h: 0.8, fontSize: 22, color: TEXT_MAIN, bold: true, valign: "middle" });

  // Map highlights onto the slide body
  const bullets = analysis.slideHighlights.map(pt => ({ text: pt, options: { breakLine: true } }));

  if (layout === 'visual' && imageBase64) {
    slide.addImage({ data: imageBase64, x: 0.5, y: 1.4, w: 8.9, h: 2.8, sizing: { type: "contain", w: 8.9, h: 2.8 } });
    slide.addShape(pres.ShapeType.rect, { x: 0.3, y: 4.3, w: 9.4, h: 0.8, fill: { color: "0f172a" }, line: { color: "1e293b" } });
    const briefString = analysis.slideHighlights.slice(0, 3).map(p => "• " + p).join("   ");
    slide.addText(briefString, { x: 0.4, y: 4.3, w: 9.2, h: 0.8, fontSize: 12, color: TEXT_MAIN, align: "center", valign: "middle" });
  } else if (layout === 'detail') {
    if (imageBase64) slide.addImage({ data: imageBase64, x: 0.3, y: 1.5, w: 3.0, h: 3.0, sizing: { type: "contain", w: 3.0, h: 3.0 } });
    slide.addText("KEY HIGHLIGHTS", { x: 3.5, y: 1.5, w: 6, h: 0.3, fontSize: 10, color: ACCENT_COLOR, bold: true, charSpacing: 2 });
    slide.addText(bullets, { x: 3.5, y: 1.8, w: 6.0, h: 2.0, fontSize: 14, color: TEXT_MAIN, bullet: { type: "number", color: ACCENT_COLOR }, paraSpaceAfter: 10 });
  } else {
    // Executive Layout (Default)
    if (imageBase64) slide.addImage({ data: imageBase64, x: 0.3, y: 1.6, w: 4.5, h: 3.5, sizing: { type: "contain", w: 4.5, h: 3.5 } });
    slide.addText("STRATEGIC SUMMARY", { x: 5, y: 1.6, w: 4.5, h: 0.3, fontSize: 10, color: ACCENT_COLOR, bold: true, charSpacing: 2 });
    slide.addText(bullets, { x: 5, y: 2.0, w: 4.7, h: 3, fontSize: 16, color: TEXT_MAIN, bullet: { type: "number", color: ACCENT_COLOR }, paraSpaceAfter: 15, lineSpacing: 20 });
  }

  const safeTitle = article.title.replace(/[^a-z0-9]/gi, '_').substring(0, 20);
  await pres.writeFile({ fileName: `Brief_${article.partnerName}_${safeTitle}.pptx` });
};
```

---

## 🎧 Interactive Audio Player Logic
Inside `components/MorningBriefingPlayer.tsx`:
- It manages high fidelity state cycles: `idle` ➔ `generating_script` ➔ `generating_audio` ➔ `playing` ➔ `paused`.
- Receives the raw binary `Uint8Array` from `generateSpeech`, wraps it into a Web Audio API `AudioContext` buffer, or parses it to a standard Object URL Blob containing synthesized audio bytes.
- Displays an inline micro-visualizer representing active speaking lines: an array of fluctuating bars reflecting audio timestamps.

```typescript
// To play Uint8Array bytes returned by Gemini flash preview TTS:
const playAudioBytes = async (audioBytes: Uint8Array) => {
  const blob = new Blob([audioBytes], { type: 'audio/mp3' });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.play();
};
```

---

## 🎯 LLM Duplication Blueprint & Step-by-Step Instructions

If you are a generative model tasked with replicating, importing, or editing this workspace:

1. **Setup the Configuration Manifests First:** Ensure `tsconfig.json` and `vite.config.ts` are established to map aliases and bind `process.env.GEMINI_API_KEY`.
2. **Build the State Synchronizer:** Implement the tracking pattern for checked partners (`selectedPartnerIds`) and persist to browser `localStorage` on update.
3. **Recreate the Gemini Batched Fetcher:** Ensure queries are batched (max 3 at a time) and restricted only to search tool groundings (`tools: [{ googleSearch: {} }]`).
4. **Implement the Morning Audio Briefing Loop:** Connect `generateBriefingScript` (to create the spoken outline) with `generateSpeech` (the synthesizer). Decode base64 to binary bytes safely into an audio player.
5. **Implement slide generators:** Import `pptxgen` to mount details in the Speaker Notes block (`addNotes`) and style visual vectors with Imagen infographics in layouts.
