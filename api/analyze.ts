import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { content, url } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Post content is required for analysis.' });
  }

  // Use the pre-configured API_KEY from the environment
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const MARKETING_TOPICS = [
    'LinkedIn Ads', 'Meta Ads', 'Google Ads', 'TikTok Ads', 'Creative Testing',
    'Media Buying & Scaling', 'Funnels & CRO', 'Landing Pages', 'Lead Generation',
    'Email & Automation', 'Copywriting', 'Messaging & Positioning',
    'Personal Branding (LinkedIn)', 'Growth Strategy', 'AI in Marketing',
    'Analytics & Attribution', 'Agency & Client Management'
  ];

  const SYSTEM_PROMPT = `You are a high-level marketing analyst. Your goal is to capture the *true substance* of LinkedIn marketing posts.
  Ruthlessly remove fluff, hooks, storytelling, emojis, and generic motivation.
  Ignore personal backstories unless they introduce a concrete lesson.
  Convert vague statements into explicit claims.
  Preserve nuance and constraints.
  
  Classification must be strictly from these primary categories: ${MARKETING_TOPICS.join(', ')}.
  
  Summary rules:
  - Use bullet points for distinct, concrete insights.
  - No filler, no repetition, no vague advice.
  - Prefer clarity over elegance.
  - Be as detailed as necessary in the summary and key insights.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this LinkedIn post:
      
      URL: ${url || 'Not provided'}
      Content:
      ${content}
      `,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Descriptive, factual title (not catchy)' },
            primary_topic: { type: Type.STRING, description: 'The single most relevant category' },
            secondary_topics: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: 'Relevant marketing sub-topics'
            },
            core_takeaway: { type: Type.STRING, description: 'Single sentence factual core takeaway' },
            summary: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: 'Bullet points of concrete insights and learnings'
            },
            key_insights: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: 'Deeper strategic or tactical insights extracted'
            },
            original_text: { type: Type.STRING, description: 'The original post content cleaned of emojis and fluff' }
          },
          required: ['title', 'primary_topic', 'secondary_topics', 'core_takeaway', 'summary', 'key_insights', 'original_text'],
        }
      }
    });

    if (!response.text) {
      throw new Error("Empty response from AI model.");
    }

    return res.status(200).json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    return res.status(500).json({ error: error.message || 'Analysis failed. Please try again.' });
  }
}