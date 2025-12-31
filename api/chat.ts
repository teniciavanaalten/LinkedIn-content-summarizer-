import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Access keys exactly as they are accessed in the working analyze.ts
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const geminiApiKey = process.env.API_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !geminiApiKey) {
    const missing = [];
    if (!supabaseUrl) missing.push('SUPABASE_URL');
    if (!supabaseAnonKey) missing.push('SUPABASE_ANON_KEY');
    if (!geminiApiKey) missing.push('API_KEY');
    
    return res.status(500).json({ 
      error: `Server configuration incomplete. Missing: ${missing.join(', ')}`,
      debug: {
        supabaseUrl: !!supabaseUrl,
        supabaseAnonKey: !!supabaseAnonKey,
        geminiApiKey: !!geminiApiKey
      }
    });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Question is required.' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    // Fetch library context (limit to 15 for speed and token efficiency)
    const { data: posts, error: dbError } = await supabase
      .from('marketing_posts')
      .select('title, primary_topic, core_takeaway, key_insights')
      .order('created_at', { ascending: false })
      .limit(15);

    if (dbError) throw dbError;

    const contextString = (posts && posts.length > 0) 
      ? posts.map((p) => {
          const insights = Array.isArray(p.key_insights) ? p.key_insights.slice(0, 2).join(', ') : "None";
          return `[${p.primary_topic}] ${p.title}: ${p.core_takeaway}. Insights: ${insights}`;
        }).join('\n') 
      : "The library is currently empty.";

    const systemInstruction = `You are the MarketerPulse Growth Strategist. 
    Analyze the community library and answer questions tactically. 
    Use Markdown. Be concise. If no library data exists, provide general expert marketing advice.

    CURRENT LIBRARY DATA:
    ${contextString}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const outputText = response.text;
    if (!outputText) throw new Error("Strategist failed to generate a response.");

    return res.status(200).json({ text: outputText });

  } catch (error: any) {
    console.error("Strategist API Error:", error);
    return res.status(500).json({ 
      error: error.message || 'The strategist encountered an unexpected error.' 
    });
  }
}