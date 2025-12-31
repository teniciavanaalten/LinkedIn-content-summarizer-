import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// Verify environment variables are present
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const geminiApiKey = process.env.API_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseAnonKey || !geminiApiKey) {
    return res.status(500).json({ error: 'Missing environment variables. Check Vercel configuration.' });
  }

  const { content, url, userId } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Post content is required.' });
  }

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required for storage.' });
  }

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });
  
  const MARKETING_TOPICS = [
    'LinkedIn Ads', 'Meta Ads', 'Google Ads', 'TikTok Ads', 'Creative Testing',
    'Media Buying & Scaling', 'Funnels & CRO', 'Landing Pages', 'Lead Generation',
    'Email & Automation', 'Copywriting', 'Messaging & Positioning',
    'Personal Branding (LinkedIn)', 'Growth Strategy', 'AI in Marketing',
    'Analytics & Attribution', 'Agency & Client Management'
  ];

  const SYSTEM_PROMPT = `You are a professional marketing analyst. 
  Extract high-signal insights from LinkedIn posts. Remove all fluff, generic motivation, and emojis.
  
  Classification: Strictly select ONE category from: ${MARKETING_TOPICS.join(', ')}.
  
  Response Format: You MUST return a raw JSON object ONLY. Do not include markdown formatting or backticks.`;

  try {
    // 1. Generate Content with Gemini
    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this LinkedIn post and provide the results in the specified JSON format:
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

    if (!result.text) {
      throw new Error("AI returned an empty response.");
    }

    // Clean potential markdown formatting from the response string
    let cleanJson = result.text.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
    }

    let analysis;
    try {
      analysis = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("JSON Parsing Error. Raw output:", result.text);
      throw new Error("Failed to parse AI response as JSON.");
    }

    // 2. Save result to Supabase
    const { data, error } = await supabase
      .from('marketing_posts')
      .insert([
        {
          user_id: userId,
          url: url || null,
          title: analysis.title,
          primary_topic: analysis.primary_topic,
          secondary_topics: analysis.secondary_topics,
          core_takeaway: analysis.core_takeaway,
          summary: analysis.summary,
          key_insights: analysis.key_insights,
          original_text: analysis.original_text
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase Storage Error:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Backend Error in analyze endpoint:", error);
    return res.status(500).json({ error: error.message || 'An unexpected error occurred during processing.' });
  }
}