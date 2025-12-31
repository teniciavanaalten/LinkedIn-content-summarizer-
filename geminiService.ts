import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { ChatMessage, MarketingPost } from "./types";

const LOCAL_STORAGE_KEY = 'marketerpulse_library';

/**
 * Safely access environment variables with a fallback
 */
const getSafeEnv = (key: string): string | undefined => {
  try {
    return typeof process !== 'undefined' ? (process.env as any)[key] : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Initialize Client-side Supabase (Fallback only)
 */
const getSupabaseFallback = () => {
  const url = getSafeEnv('SUPABASE_URL');
  const key = getSafeEnv('SUPABASE_ANON_KEY');
  if (!url || !key) return null;
  try {
    return createClient(url, key);
  } catch (e) {
    return null;
  }
};

/**
 * Extract marketing insights
 * Prioritizes Vercel API Route for security and reliability.
 */
export const analyzeLinkedInPost = async (content: string, url?: string): Promise<MarketingPost> => {
  // 1. Attempt to use Server-Side API
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, url })
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    const errData = await response.json().catch(() => ({}));
    if (errData.error) throw new Error(errData.error);
  } catch (e: any) {
    console.warn("Server-side analysis failed, trying client-side fallback...", e.message);
  }

  // 2. Client-Side Fallback (Requires API_KEY in browser env)
  const apiKey = getSafeEnv('API_KEY');
  if (!apiKey) {
    throw new Error("API configuration missing. Please ensure your Vercel Environment Variables (API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY) are set correctly.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this LinkedIn post and provide insights: ${content}`,
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

  const analysis = JSON.parse(response.text || '{}');
  const postData: MarketingPost = {
    ...analysis,
    url: url || null,
    created_at: new Date().toISOString(),
    id: crypto.randomUUID()
  };

  // Save via fallback
  const supabase = getSupabaseFallback();
  if (supabase) {
    const { data } = await supabase.from('marketing_posts').insert([postData]).select().single();
    if (data) return data;
  }

  const localPosts = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  localPosts.unshift(postData);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localPosts));
  return postData;
};

/**
 * Fetch all posts
 */
export const fetchAllPosts = async (): Promise<MarketingPost[]> => {
  try {
    const response = await fetch('/api/posts');
    if (response.ok) return await response.json();
  } catch (e) {
    console.warn("Could not reach API posts endpoint, using local cache.");
  }

  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
};

/**
 * Research library via AI
 */
export const sendChatMessage = async (message: string, history: ChatMessage[]): Promise<string> => {
  // 1. Try Server-side Chat
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
  } catch (e) {
    console.warn("Server-side chat failed, falling back to local strategist.");
  }

  // 2. Client-side Fallback
  const apiKey = getSafeEnv('API_KEY');
  if (!apiKey) return "I'm having trouble connecting to the strategist. Please verify your API configuration.";

  const ai = new GoogleGenAI({ apiKey });
  const posts = await fetchAllPosts();
  const context = posts.slice(0, 20).map(p => `${p.title}: ${p.core_takeaway}`).join('\n');

  const result = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: message,
    config: {
      systemInstruction: `You are a growth strategist. Use this context: ${context}`
    }
  });

  return result.text || "I couldn't generate a response.";
};