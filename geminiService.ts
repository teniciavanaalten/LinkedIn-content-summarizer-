import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { ChatMessage, MarketingPost } from "./types";

const LOCAL_STORAGE_KEY = 'marketerpulse_library';

const getSafeEnv = (key: string): string | undefined => {
  try {
    return typeof process !== 'undefined' ? (process.env as any)[key] : undefined;
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
    
    if (response.ok) return await response.json();
    
    const errData = await response.json().catch(() => ({}));
    if (errData.error) throw new Error(errData.error);
  } catch (e: any) {
    console.warn("Server analysis failed:", e.message);
  }

  // Final fallback requires API_KEY
  const apiKey = getSafeEnv('API_KEY');
  if (!apiKey) throw new Error("Server communication failed and no client-side API_KEY is configured.");

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
    console.warn("Posts fetch failed.");
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
    
    if (response.ok) {
      const data = await response.json();
      return data.text;
    }
    
    const errData = await response.json().catch(() => ({}));
    if (errData.error) return `Strategist Error: ${errData.error}`;
  } catch (e: any) {
    console.error("Chat connection error:", e);
  }

  const apiKey = getSafeEnv('API_KEY');
  if (!apiKey) return "The strategist is unavailable. Please check your Vercel logs for API timeout or configuration issues.";

  // Minimal client-side fallback if server fails but local key exists
  const ai = new GoogleGenAI({ apiKey });
  const res = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: message
  });
  return res.text || "I couldn't generate a response.";
};