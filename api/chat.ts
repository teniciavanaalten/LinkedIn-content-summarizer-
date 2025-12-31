import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ultra-robust key detection: Checks multiple common naming conventions
  const geminiKey = process.env.API_KEY || process.env.GOOGLE_API_KEY || (process.env as any).NEXT_PUBLIC_API_KEY;
  const sbUrl = process.env.SUPABASE_URL;
  const sbKey = process.env.SUPABASE_ANON_KEY;

  if (!geminiKey || !sbUrl || !sbKey) {
    return res.status(500).json({ 
      error: 'Server configuration incomplete.',
      debug: {
        has_api_key: !!geminiKey,
        has_sb_url: !!sbUrl,
        has_sb_key: !!sbKey
      }
    });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Query is required.' });
  }

  try {
    const supabase = createClient(sbUrl, sbKey);
    const ai = new GoogleGenAI({ apiKey: geminiKey });

    // Fetch library context (limit to 15 for stability)
    const { data: posts, error: dbError } = await supabase
      .from('marketing_posts')
      .select('title, primary_topic, core_takeaway, key_insights')
      .order('created_at', { ascending: false })
      .limit(15);

    if (dbError) throw dbError;

    const contextData = posts && posts.length > 0
      ? posts.map(p => `[${p.primary_topic}] ${p.title}: ${p.core_takeaway}. Insights: ${Array.isArray(p.key_insights) ? p.key_insights.join(', ') : 'None'}`).join('\n')
      : "No posts found in the library yet.";

    const systemInstruction = `You are the MarketerPulse Growth Strategist. 
    Use the following library context to provide tactical marketing advice. 
    Be concise, use Markdown, and act as a high-level marketing consultant.

    COMMUNITY LIBRARY CONTEXT:
    ${contextData}`;

    // Standardizing on 'gemini-3-flash-preview' for best availability/reliability
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const outputText = response.text;
    if (!outputText) throw new Error("The AI returned an empty response.");

    return res.status(200).json({ text: outputText });

  } catch (error: any) {
    console.error("Strategist API Internal Error:", error);
    return res.status(500).json({ 
      error: error.message || 'The strategist failed to process the request.' 
    });
  }
}