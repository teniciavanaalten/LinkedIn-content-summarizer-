export interface MarketingPost {
  id: string;
  user_id?: string;
  title: string;
  url?: string;
  primary_topic: string;
  secondary_topics: string[];
  core_takeaway: string;
  summary: string[];
  key_insights: string[];
  original_text: string;
  created_at: string;
}

export interface MarketingCategory {
  name: string;
}

export enum ViewMode {
  Dashboard = 'dashboard',
  NewPost = 'new-post',
  PostDetail = 'post-detail'
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}