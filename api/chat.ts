import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Check environment variables with detailed reporting
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const geminiApiKey = process.env.API_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !geminiApiKey) {
    return res.status(500).json({ 
      error: 'Environment variables are not configured on the server.',
      details: {
        supabaseUrl: supabaseUrl ? 'Set' : 'MISSING',
        supabaseAnonKey: supabaseAnonKey ? 'Set' : 'MISSING',
        geminiApiKey: geminiApiKey ? 'Set' : 'MISSING'
      }
    });
  }

  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    // 2. Fetch the Knowledge Base
    // We fetch the most relevant parts for context (Title, Topic, Takeaway, Insights)
    const { data: posts, error: dbError } = await supabase
      .from('marketing_posts')
      .select('title, primary_topic, core_takeaway, key_insights')
      .order('created_at', { ascending: false })
      .limit(50); // Using top 50 for a rich but manageable context

    if (dbError) throw dbError;

    // 3. Build Context
    const contextString = posts && posts.length > 0 
      ? posts.map((p, i) => 
          `POST #${i+1}:
          Title: ${p.title}
          Category: ${p.primary_topic}
          Takeaway: ${p.core_takeaway}
          Insights: ${p.key_insights.join(', ')}`
        ).join('\n\n') 
      : "The library is currently empty. No marketing insights found.";

    const systemInstruction = `You are the MarketerPulse AI Growth Strategist. 
    Your knowledge is strictly limited to the provided marketing library context below.
    Your goal is to help the user synthesize strategies, identify trends, and extract specific tactics from the library.
    
    GUIDELINES:
    1. Only use information from the provided library context.
    2. If a question cannot be answered using the library, politely state that the current library doesn't contain that specific information.
    3. Be strategic, professional, and clear. 
    4. Use Markdown for lists and bold text to highlight key tactics.
    
    LIBRARY CONTEXT:
    ${contextString}`;

    // 4. Generate Response using Gemini 3 Flash for efficiency
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction,
      }
    });

    const outputText = response.text;
    if (!outputText) throw new Error("The AI strategist failed to generate a response.");

    return res.status(200).json({ text: outputText });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return res.status(500).json({ 
      error: error.message || 'Chat analysis failed. Please verify your database connection and API keys.' 
    });
  }
}