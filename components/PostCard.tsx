
import React from 'react';
import { MarketingPost, SignalQuality } from '../types';

interface PostCardProps {
  post: MarketingPost;
  onClick: (post: MarketingPost) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onClick }) => {
  const getQualityColor = (quality: SignalQuality) => {
    switch (quality) {
      case 'High-signal': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Medium-signal': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div 
      onClick={() => onClick(post)}
      className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-3 gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
          {post.primaryTopic}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${getQualityColor(post.signalQuality)}`}>
          {post.signalQuality.split(' ')[0]}
        </span>
      </div>
      
      <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 mb-2 leading-tight">
        {post.title}
      </h3>
      
      <p className="text-sm text-slate-600 mb-4 line-clamp-2 flex-grow">
        {post.coreTakeaway}
      </p>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
        <span className="text-xs font-medium text-slate-500">{post.author}</span>
        <span className="text-xs text-slate-400">{post.dateSaved}</span>
      </div>
    </div>
  );
};

export default PostCard;
