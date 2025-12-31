
import { GoogleGenAI, Type } from "@google/genai";
import { MARKETING_CATEGORIES } from "./constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_SYSTEM_PROMPT = `You are a high-level marketing analyst. Your goal is to capture the *true substance* of LinkedIn marketing posts.
Ruthlessly remove fluff, hooks, storytelling, emojis, and generic motivation.
Ignore personal backstories unless they introduce a concrete lesson.
Convert vague statements into explicit claims.
Preserve nuance and constraints.
If the post has no real insight, flag it as 'Low-signal / Mostly fluff'.

Classification must be strictly from these primary categories: ${MARKETING_CATEGORIES.map(c => c.name).join(', ')}.
Secondary topics should be specific sub-topics like 'LinkedIn Ads', 'CRO', etc.

Summary rules:
- Use bullet points for distinct, concrete insights.
- No filler, no repetition, no vague advice.
- Prefer clarity over elegance.
`;

export const analyzeLinkedInPost = async (content: string, url?: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this LinkedIn post:
    
    URL: ${url || 'Not provided'}
    Content:
    ${content}
    `,
    config: {
      systemInstruction: ANALYSIS_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Descriptive, factual title (not catchy)' },
          author: { type: Type.STRING, description: 'Name of the author' },
          primaryTopic: { type: Type.STRING, description: 'Primary marketing category' },
          secondaryTopics: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: 'Specific marketing sub-topics'
          },
          coreTakeaway: { type: Type.STRING, description: 'Single sentence factual core takeaway' },
          summary: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: 'Bullet points of concrete insights'
          },
          tactics: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: 'Actionable steps or tests'
          },
          signalQuality: { 
            type: Type.STRING, 
            enum: ['High-signal', 'Medium-signal', 'Low-signal / Mostly fluff']
          },
          cleanedText: { type: Type.STRING, description: 'The original post content with formatting/emojis cleaned up' }
        },
        required: ['title', 'author', 'primaryTopic', 'coreTakeaway', 'summary', 'signalQuality', 'cleanedText'],
      }
    }
  });

  return JSON.parse(response.text);
};
