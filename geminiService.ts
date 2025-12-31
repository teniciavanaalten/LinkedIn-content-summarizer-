import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, MarketingPost } from "./types";

const LOCAL_STORAGE_KEY = 'marketerpulse_library';

/**
 * Safely check for browser-exposed environment variables
 */
const getBrowserApiKey = (): string | undefined => {
  try {
    return (window as any).process?.env?.API_KEY || (process.env as any)?.API_KEY;
  } catch {
    return undefined;
  }
};

export const analyzeLinkedInPost = async (content: string, url?: string): Promise<MarketingPost> => {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, url })
    });
    
    const data = await response.json();
    if (response.ok) return data;
    if (data.error) throw new Error(data.error);
  } catch (e: any) {
    console.warn("Server analysis failed:", e.message);
  }

  // Client-side fallback (requires local API_KEY)
  const apiKey = getBrowserApiKey();
  if (!apiKey) throw new Error("Connection failed. Please check your internet or Vercel API configuration.");

  const ai = new GoogleGenAI({ apiKey });
  const result = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: content,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          primary_topic: { type: Type.STRING },
          secondary_topics: { type: Type.ARRAY, items: { type: Type.STRING } },
          core_takeaway: { type: Type.STRING },
          summary: { type: Type.ARRAY, items: { type: Type.STRING } },
          key_insights: { type: Type.ARRAY, items: { type: Type.STRING } },
          original_text: { type: Type.STRING }
        },
        required: ['title', 'primary_topic', 'secondary_topics', 'core_takeaway', 'summary', 'key_insights', 'original_text'],
      }
    }
  });

  return JSON.parse(result.text || '{}');
};

export const fetchAllPosts = async (): Promise<MarketingPost[]> => {
  try {
    const response = await fetch('/api/posts');
    if (response.ok) return await response.json();
  } catch (e) {
    console.warn("Library fetch failed.");
  }
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
};

export const sendChatMessage = async (message: string, history: ChatMessage[]): Promise<string> => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history })
    });
    
    const data = await response.json();
    if (response.ok) {
      return data.text;
    }
    
    if (data.error) {
      console.error("Strategist Debug Info:", data.debug);
      return `Strategist Error: ${data.error}`;
    }
  } catch (e: any) {
    console.error("Chat connection error:", e);
  }

  // Client-side fallback if server fails
  const apiKey = getBrowserApiKey();
  if (!apiKey) return "The strategist is unavailable. This is usually due to missing API_KEY or database connection issues in Vercel.";

  try {
    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message
    });
    return res.text || "No insights found.";
  } catch (err: any) {
    return `Strategist Connection Error: ${err.message}`;
  }
};