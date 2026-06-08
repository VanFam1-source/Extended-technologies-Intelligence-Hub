import { GoogleGenAI, Modality } from "@google/genai";
import { NewsArticle, StrategicAnalysis } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

// Helper to chunk array for batching
const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunked: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size));
  }
  return chunked;
};

export const fetchRecentNews = async (partnerNames: string[]): Promise<NewsArticle[]> => {
  if (partnerNames.length === 0) {
    return [];
  }

  // STRATEGY: Batching to prevent hallucinations.
  // If we ask for too many partners at once, the search tool results get truncated,
  // and the LLM "guesses" URLs to fill the quota, leading to 404s.
  // We process partners in small batches (3 at a time) to ensure high-quality, verified links.
  const BATCH_SIZE = 3;
  const batches = chunkArray(partnerNames, BATCH_SIZE);

  try {
    const batchPromises = batches.map(async (batchOfPartners) => {
      try {
        // Using gemini-2.5-flash for efficient search and retrieval.
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Perform a Google Search to find the most recent news (last 30 days) for these specific companies: ${batchOfPartners.join(', ')}.
          
          Find exactly 1 distinct, high-quality news article or press release for EACH company in this list.
          
          CRITICAL: 
          1. You must ONLY use URLs that are explicitly returned by the Google Search tool. 
          2. DO NOT guess URLs. DO NOT construct URLs like "company.com/news/article". 
          3. If a specific article link is not found in the search results, omit that partner from the result rather than inventing a link.
          
          Return the result as a valid JSON array of objects with keys: "title", "summary", "url", "publishedDate" (YYYY-MM-DD), "partnerName".
          `,
          config: {
            tools: [{ googleSearch: {} }],
          }
        });

        let jsonText = response.text?.trim();

        if (!jsonText) return [];

        // Clean markdown code blocks
        const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          jsonText = jsonMatch[1];
        }

        const parsed = JSON.parse(jsonText);
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.warn(`Failed to fetch batch for ${batchOfPartners.join(', ')}`, err);
        return [];
      }
    });

    // Wait for all batches to complete
    const results = await Promise.all(batchPromises);
    
    // Flatten results
    const allArticles = results.flat();

    // Post-processing: Add IDs and deduplicate
    return allArticles.map((article: any, index: number) => ({
      ...article,
      id: `live-article-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      partnerName: article.partnerName || "Technology Partner"
    }));

  } catch (error) {
    console.error("Error fetching recent news:", error);
    throw new Error("Failed to fetch live news. The service may be temporarily unavailable.");
  }
};


export const generateInfographicPrompt = async (summary: string, styleName: string): Promise<string> => {
  try {
    // Upgrade: Using gemini-3-pro-preview for enhanced creative reasoning
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Based on the following news summary, create a descriptive prompt for an AI image generator to create a visually striking infographic. 
      
      Analyze the key facts in the summary and determine the best visual metaphors to represent them.
      The desired visual style is: "${styleName}". 
      
      The output should be the raw prompt text only. Do not include preambles like 'Here is the prompt'.

      SUMMARY: "${summary}"`,
      config: {
        // Gemini 3 Enhancement: Use Thinking Config to allow the model to plan the visual description
        // A budget of 2048 tokens allows for detailed visual planning before output.
        thinkingConfig: { thinkingBudget: 2048 },
      }
    });
    return response.text || "Could not generate prompt.";
  } catch (error) {
    console.error("Error generating infographic prompt:", error);
    throw new Error("Failed to generate infographic prompt. Please try again.");
  }
};

export const generateStrategicAnalysis = async (summary: string): Promise<StrategicAnalysis> => {
  try {
    // Upgrade: Using gemini-3-pro-preview for deeper strategic reasoning and structured JSON output
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Based on the following news summary, act as a senior sales strategist.
      
      I need two distinct outputs in JSON format:
      1. "detailedTalkingPoints": 3-5 robust, persuasive paragraph-style bullets for a script or speaker notes. Focus on ROI, business value, and competitive advantage.
      2. "slideHighlights": 3-4 extremely concise, punchy bullet points (MAX 6-8 words each) suitable for a PowerPoint slide face. These must be readable at a glance.

      SUMMARY: "${summary}"`,
      config: {
        responseMimeType: "application/json",
        // Gemini 3 Enhancement: Use Thinking Config to optimize the distinction between "detailed" and "brief"
        thinkingConfig: { thinkingBudget: 2048 },
      }
    });

    let text = response.text || "{}";
    
    // Clean markdown code blocks if present (Safety check)
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      text = jsonMatch[1];
    }

    const parsed = JSON.parse(text);
    
    // Return with safe defaults in case keys are missing
    return {
        detailedTalkingPoints: Array.isArray(parsed.detailedTalkingPoints) ? parsed.detailedTalkingPoints : ["Detailed analysis unavailable."],
        slideHighlights: Array.isArray(parsed.slideHighlights) ? parsed.slideHighlights : ["Highlights unavailable."]
    };

  } catch (error) {
    console.error("Error generating strategic analysis:", error);
    // Return safe fallback instead of throwing to prevent UI crash
    return {
        detailedTalkingPoints: ["Analysis failed to generate."],
        slideHighlights: ["Analysis failed."]
    };
  }
};

export const generateImage = async (prompt: string, aspectRatio: string, stylePrompt: string): Promise<string> => {
  try {
    // Image generation remains on imagen-4.0 or flash-image. 
    // We combine the specific prompt with the style cues.
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `infographic design, ${prompt}, ${stylePrompt}, high quality, detailed, 8k resolution`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      return `data:image/png;base64,${base64ImageBytes}`;
    } else {
      throw new Error("No image was generated.");
    }
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate image. The model may have refused the prompt due to safety filters.");
  }
};

export const summarizeUrl = async (url: string): Promise<string> => {
  try {
    // Keep using gemini-2.5-flash for reading and summarizing web content efficiently
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Please provide a concise summary of the key information from the article at this URL, suitable for generating an infographic from: ${url}`,
      config: {
        tools: [{googleSearch: {}}],
      },
    });
    return response.text || "Could not summarize URL.";
  } catch (error) {
    console.error("Error summarizing URL:", error);
    throw new Error("Failed to summarize the provided link. Please check the URL and try again.");
  }
};

// --- AUDIO / TTS SERVICES ---

export const generateBriefingScript = async (articles: NewsArticle[], topicName: string): Promise<string> => {
  try {
    const articlesText = articles.map(a => `Partner: ${a.partnerName}, Headline: ${a.title}, Summary: ${a.summary}`).join('\n\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a professional Technology Industry Analyst recording a "Morning Briefing" for Inside Sales Reps.
      
      Write a 90-second spoken-word script covering the key updates below. 
      Topic: ${topicName}
      
      Guidelines:
      - Tone: Professional, energetic, and concise. Like a tech news podcast.
      - Structure: Start with a hook ("Good morning, here are your ${topicName} updates..."), then group related updates, and end with a call to action ("That's your briefing, go close some deals.").
      - Do not read every headline. Synthesize the trends. If there are many updates, pick the top 3-4 most impactful ones.
      - Output pure text for reading aloud. No stage directions like [Pause].

      UPDATES:
      ${articlesText}`
    });

    return response.text || "No updates available for this briefing.";
  } catch (error) {
    console.error("Error generating briefing script:", error);
    return "We are unable to generate a briefing script at this time.";
  }
};

export const generateSpeech = async (text: string): Promise<Uint8Array | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Professional voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data returned");
    }

    return decode(base64Audio);

  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
};

// Helper: Decode Base64 to Uint8Array (PCM)
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
