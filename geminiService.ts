import { ChatMessage } from "./types";

/**
 * Global services for MarketerPulse AI.
 * No user-scoping logic is applied here.
 */

export const analyzeLinkedInPost = async (content: string, url?: string) => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, url }),
  });

  const contentType = response.headers.get("content-type");
  
  if (!response.ok) {
    if (contentType && contentType.includes("application/json")) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to analyze post');
    } else {
      const text = await response.text();
      console.error("Server returned non-JSON response:", text);
      throw new Error(`Server error (${response.status}). Check Vercel logs.`);
    }
  }

  return response.json();
};

export const fetchAllPosts = async () => {
  const response = await fetch(`/api/posts`);
  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }
  return response.json();
};

export const sendChatMessage = async (message: string, history: ChatMessage[]) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, history }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Chat failed');
  }

  const data = await response.json();
  return data.text;
};