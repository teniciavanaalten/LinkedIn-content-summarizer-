import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Exact same access pattern as analyze.ts to ensure consistency
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
      details: "Check Vercel environment variables. If they are set, try a fresh redeploy."
    });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Question is required.' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    // Fetch library context (limit 15 for stability)
    const { data: posts, error: dbError } = await supabase
      .from('marketing_posts')
      .select('title, primary_topic, core_takeaway, key_insights')
      .order('created_at', { ascending: false })
      .limit(15);

    if (dbError) throw dbError;

    // Safety mapping for potentially null/undefined fields in database
    const contextString = (posts && posts.length > 0)
      ? posts.map((p) => {
          const title = p.title || "Untitled Post";
          const topic = p.primary_topic || "General";
          const takeaway = p.core_takeaway || "No takeaway provided.";
          const insights = Array.isArray(p.key_insights) ? p.key_insights.slice(0, 2).join(', ') : "None";
          return `[${topic}] ${title}: ${takeaway}. Insights: ${insights}`;
        }).join('\n') 
      : "The library is currently empty.";

    const systemInstruction = `You are the MarketerPulse Growth Strategist. 
    Analyze the community library and answer questions tactically. 
    Use Markdown. Be concise and helpful. 
    If library data is missing, provide general expert marketing strategy advice.

    CURRENT LIBRARY DATA:
    ${contextString}`;

    // Standardizing on 'gemini-3-flash-preview' for initial troubleshooting
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const outputText = response.text;
    if (!outputText) throw new Error("Strategist failed to generate a response text.");

    return res.status(200).json({ text: outputText });

  } catch (error: any) {
    console.error("Strategist API Error:", error);
    return res.status(500).json({ 
      error: error.message || 'The strategist encountered an internal processing error.' 
    });
  }
}