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
    return res.status(500).json({ error: 'Environment variables missing.' });
  }

  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    // 1. Fetch the Knowledge Base
    // We fetch the most relevant parts for context (Title, Topic, Takeaway, Insights)
    const { data: posts, error: dbError } = await supabase
      .from('marketing_posts')
      .select('title, primary_topic, core_takeaway, key_insights')
      .order('created_at', { ascending: false })
      .limit(50); // Using top 50 for broad but focused context

    if (dbError) throw dbError;

    // 2. Build Context
    const contextString = posts?.map((p, i) => 
      `POST #${i+1}:
      Title: ${p.title}
      Category: ${p.primary_topic}
      Takeaway: ${p.core_takeaway}
      Insights: ${p.key_insights.join(', ')}`
    ).join('\n\n') || "No posts available in the library yet.";

    const systemInstruction = `You are the MarketerPulse AI Growth Strategist. 
    Your knowledge is strictly limited to the provided marketing library context below.
    Your goal is to help the user synthesize strategies, identify trends, and extract specific tactics from the library.
    
    GUIDELINES:
    1. Only use information from the provided library.
    2. If a question cannot be answered using the library, politely state that the current library doesn't contain that specific information.
    3. Be strategic, professional, and clear. 
    4. Use Markdown for lists and bold text to highlight key tactics.
    
    LIBRARY CONTEXT:
    ${contextString}`;

    // 3. Generate Response
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return res.status(200).json({ text: response.text });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return res.status(500).json({ error: error.message || 'Chat failed' });
  }
}