import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Use the specific environment variable names provided by Vercel/Supabase
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const apiKey = process.env.API_KEY;

  // Provide detailed error messaging for easier debugging
  if (!supabaseUrl || !supabaseAnonKey || !apiKey) {
    const missing = [];
    if (!supabaseUrl) missing.push('SUPABASE_URL');
    if (!supabaseAnonKey) missing.push('SUPABASE_ANON_KEY');
    if (!apiKey) missing.push('API_KEY');
    
    return res.status(500).json({ 
      error: `Server configuration incomplete. Missing: ${missing.join(', ')}`,
      status: 'Error'
    });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Query is required.' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    // Use strict SDK initialization format
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    // Fetch context
    const { data: posts, error: dbError } = await supabase
      .from('marketing_posts')
      .select('title, primary_topic, core_takeaway, key_insights')
      .order('created_at', { ascending: false })
      .limit(15);

    if (dbError) throw dbError;

    const contextString = posts && posts.length > 0 
      ? posts.map((p, i) => 
          `[${p.primary_topic}] ${p.title}: ${p.core_takeaway}. Key Insights: ${p.key_insights.slice(0, 3).join(', ')}`
        ).join('\n') 
      : "The library is currently empty.";

    const systemInstruction = `You are the MarketerPulse Growth Strategist. 
    Your role is to help marketers synthesize insights from their saved LinkedIn library.
    Use the following library context to answer questions strategically. 
    If the answer isn't in the context, be honest and say so.
    Be concise, tactical, and strategic. Use Markdown for formatting.

    LIBRARY DATA:
    ${contextString}`;

    // Use Gemini 3 Pro for complex synthesis as per model selection guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const outputText = response.text;
    if (!outputText) throw new Error("The strategist was unable to generate a response at this time.");

    return res.status(200).json({ text: outputText });

  } catch (error: any) {
    console.error("Strategist API Error:", error);
    return res.status(500).json({ 
      error: error.message || 'Strategic synthesis failed.' 
    });
  }
}