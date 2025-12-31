import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { ChatMessage, MarketingPost } from "./types";

const LOCAL_STORAGE_KEY = 'marketerpulse_library';

/**
 * Initialize Supabase client with a silent fallback
 */
const getSupabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.warn("Supabase credentials missing. Switching to Local Storage mode.");
    return null;
  }
  
  try {
    return createClient(url, key);
  } catch (e) {
    console.error("Supabase initialization failed:", e);
    return null;
  }
};

/**
 * Extract marketing insights using Gemini 3 Flash
 */
export const analyzeLinkedInPost = async (content: string, url?: string): Promise<MarketingPost> => {
  // Use process.env.API_KEY directly as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const MARKETING_TOPICS = [
    'LinkedIn Ads', 'Meta Ads', 'Google Ads', 'TikTok Ads', 'Creative Testing',
    'Media Buying & Scaling', 'Funnels & CRO', 'Landing Pages', 'Lead Generation',
    'Email & Automation', 'Copywriting', 'Messaging & Positioning',
    'Personal Branding (LinkedIn)', 'Growth Strategy', 'AI in Marketing',
    'Analytics & Attribution', 'Agency & Client Management'
  ];

  const SYSTEM_PROMPT = `You are a professional marketing analyst. 
  Extract high-signal insights from LinkedIn posts. Remove all fluff and emojis.
  Classification: Strictly select ONE category from: ${MARKETING_TOPICS.join(', ')}.
  Response Format: Return raw JSON ONLY.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this LinkedIn post and provide high-signal marketing insights:
    URL: ${url || 'Not provided'}
    Content: ${content}`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
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

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('marketing_posts')
        .insert([postData])
        .select()
        .single();
      if (!error) return data;
      console.error("Supabase insert error:", error);
    } catch (e) {
      console.error("Supabase failed:", e);
    }
  }

  // Fallback to Local Storage
  const localPosts = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  localPosts.unshift(postData);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localPosts));
  return postData;
};

/**
 * Fetch all posts (Supabase with LocalStorage fallback)
 */
export const fetchAllPosts = async (): Promise<MarketingPost[]> => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('marketing_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (e) {
      console.warn("Supabase fetch failed, checking local storage.");
    }
  }

  const localPosts = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  return localPosts;
};

/**
 * Research library using Gemini 3 Pro
 */
export const sendChatMessage = async (message: string, history: ChatMessage[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const posts = await fetchAllPosts();
  
  const limitedPosts = posts.slice(0, 40);
  const contextString = limitedPosts.length > 0 
    ? limitedPosts.map((p, i) => 
        `POST #${i+1}:
        Title: ${p.title}
        Category: ${p.primary_topic}
        Takeaway: ${p.core_takeaway}
        Insights: ${p.key_insights.join(', ')}`
      ).join('\n\n') 
    : "The library is currently empty.";

  const systemInstruction = `You are the MarketerPulse AI Growth Strategist. 
  Your knowledge is strictly limited to the provided marketing library context.
  Research the community knowledge base and synthesize helpful, strategic answers.
  
  GUIDELINES:
  1. Only use information from the provided context.
  2. If the library doesn't have the answer, say so.
  3. Use Markdown for clarity.
  
  LIBRARY CONTEXT:
  ${contextString}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: message,
    config: {
      systemInstruction,
    }
  });

  return response.text || "I couldn't synthesize a response from the library data.";
};