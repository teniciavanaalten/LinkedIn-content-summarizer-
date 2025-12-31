import React from 'react';
import { MarketingPost } from '../types';

interface PostCardProps {
  post: MarketingPost;
  onClick: (post: MarketingPost) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onClick }) => {
  const formattedDate = post.created_at 
    ? new Date(post.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Onbekend';

  return (
    <div 
      onClick={() => onClick(post)}
      className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-3 gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
          {post.primary_topic}
        </span>
      </div>
      
      <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 mb-2 leading-tight">
        {post.title}
      </h3>
      
      <p className="text-sm text-slate-600 mb-4 line-clamp-3 flex-grow">
        {post.core_takeaway}
      </p>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
        <span className="text-xs text-slate-400">{formattedDate}</span>
        <div className="flex gap-1">
          {post.secondary_topics && post.secondary_topics.slice(0, 1).map(topic => (
            <span key={topic} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
              {topic}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PostCard;