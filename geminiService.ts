export const analyzeLinkedInPost = async (content: string, userId: string, url?: string) => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, url, userId }),
  });

  const contentType = response.headers.get("content-type");
  
  if (!response.ok) {
    if (contentType && contentType.includes("application/json")) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to analyze post');
    } else {
      // Als de server HTML teruggeeft (Vercel error page)
      const text = await response.text();
      console.error("Server returned non-JSON response:", text);
      throw new Error(`Server error (${response.status}). Check Vercel logs.`);
    }
  }

  return response.json();
};

export const fetchUserPosts = async (userId: string) => {
  const response = await fetch(`/api/posts?userId=${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }
  return response.json();
};