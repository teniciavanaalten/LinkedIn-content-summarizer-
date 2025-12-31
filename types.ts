
export type SignalQuality = 'High-signal' | 'Medium-signal' | 'Low-signal / Mostly fluff';

export interface MarketingPost {
  id: string;
  title: string;
  url?: string;
  author: string;
  primaryTopic: string;
  secondaryTopics: string[];
  coreTakeaway: string;
  summary: string[];
  tactics: string[];
  cleanedText: string;
  dateSaved: string;
  signalQuality: SignalQuality;
}

export interface MarketingCategory {
  name: string;
  subTopics: string[];
}

export enum ViewMode {
  Dashboard = 'dashboard',
  NewPost = 'new-post',
  PostDetail = 'post-detail',
  Category = 'category'
}
