export const analyzeLinkedInPost = async (content: string, userId: string, url?: string) => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, url, userId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to analyze post');
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