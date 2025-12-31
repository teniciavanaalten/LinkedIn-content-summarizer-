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
    body: JSON.stringify({ content, url }), // userId removed from request body
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
  // Fetching all records without any query parameters
  const response = await fetch(`/api/posts`);
  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }
  return response.json();
};