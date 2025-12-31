import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// Initialiseer Supabase client (Server-side)
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { content, url, userId } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Post content is required.' });
  }

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required for storage.' });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const MARKETING_TOPICS = [
    'LinkedIn Ads', 'Meta Ads', 'Google Ads', 'TikTok Ads', 'Creative Testing',
    'Media Buying & Scaling', 'Funnels & CRO', 'Landing Pages', 'Lead Generation',
    'Email & Automation', 'Copywriting', 'Messaging & Positioning',
    'Personal Branding (LinkedIn)', 'Growth Strategy', 'AI in Marketing',
    'Analytics & Attribution', 'Agency & Client Management'
  ];

  const SYSTEM_PROMPT = `You are a high-level marketing analyst.
  Extract high-signal insights from LinkedIn posts. Remove all fluff and emojis.
  
  Classification: Strictly one of ${MARKETING_TOPICS.join(', ')}.
  
  Output MUST be valid JSON.`;

  try {
    // 1. Analyseer met Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this LinkedIn post:
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

    // 2. Sla op in Supabase
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

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Analysis/Storage Error:", error);
    return res.status(500).json({ error: error.message || 'Processing failed.' });
  }
}