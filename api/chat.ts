import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const geminiApiKey = process.env.API_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !geminiApiKey) {
    return res.status(500).json({ error: 'Server configuration incomplete.' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Query is required.' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    // 1. Fetch optimized context (Reduced to 15 posts to stay within Vercel execution limits)
    const { data: posts, error: dbError } = await supabase
      .from('marketing_posts')
      .select('title, primary_topic, core_takeaway, key_insights')
      .order('created_at', { ascending: false })
      .limit(15);

    if (dbError) throw dbError;

    // 2. Build lean context string
    const contextString = posts && posts.length > 0 
      ? posts.map((p, i) => 
          `[${p.primary_topic}] ${p.title}: ${p.core_takeaway}. Key Insights: ${p.key_insights.slice(0, 3).join(', ')}`
        ).join('\n') 
      : "The library is currently empty.";

    const systemInstruction = `You are the MarketerPulse Growth Strategist. 
    Use the following library context to answer questions. If the answer isn't in the context, say so.
    Be concise, tactical, and strategic. Use Markdown.

    LIBRARY DATA:
    ${contextString}`;

    // 3. Generate response with Gemini 3 Pro (best for reasoning/synthesis)
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const outputText = response.text;
    if (!outputText) throw new Error("AI failed to synthesize a response.");

    return res.status(200).json({ text: outputText });

  } catch (error: any) {
    console.error("Strategist API Error:", error);
    return res.status(500).json({ error: error.message || 'Strategic synthesis failed.' });
  }
}