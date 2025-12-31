export interface MarketingPost {
  id: string;
  title: string;
  url?: string;
  primary_topic: string;
  secondary_topics: string[];
  core_takeaway: string;
  summary: string[];
  key_insights: string[];
  original_text: string;
  dateSaved: string;
}

export interface MarketingCategory {
  name: string;
}

export enum ViewMode {
  Dashboard = 'dashboard',
  NewPost = 'new-post',
  PostDetail = 'post-detail'
}