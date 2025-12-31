import React from 'react';
import { MarketingPost } from '../types';

interface PostDetailProps {
  post: MarketingPost;
  onBack: () => void;
}

const PostDetail: React.FC<PostDetailProps> = ({ post, onBack }) => {
  const formattedDate = post.created_at 
    ? new Date(post.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Onbekend';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Growth Library
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 px-3 py-1 rounded-full">
              {post.primary_topic}
            </span>
            {post.secondary_topics && post.secondary_topics.map(topic => (
              <span key={topic} className="text-xs font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {topic}
              </span>
            ))}
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 mb-4 leading-tight">
            {post.title}
          </h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-slate-500">
            {post.url && (
              <a href={post.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-indigo-600 hover:underline">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Original Source
              </a>
            )}
            <div>
              <span className="font-semibold text-slate-900 mr-2">Saved:</span> {formattedDate}
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <section>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Core Takeaway</h2>
            <p className="text-lg font-medium text-slate-800 bg-indigo-50/50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
              {post.core_takeaway}
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">No-Fluff Summary</h2>
            <ul className="space-y-4">
              {post.summary && post.summary.map((point, idx) => (
                <li key={idx} className="flex items-start">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 mr-3"></div>
                  <span className="text-slate-700 leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Key Strategic Insights</h2>
            <div className="grid grid-cols-1 gap-4">
              {post.key_insights && post.key_insights.map((insight, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start">
                  <svg className="w-5 h-5 text-indigo-500 mt-0.5 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="text-sm font-medium text-slate-700">{insight}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="pt-8 border-t border-slate-100">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Original Cleaned Text</h2>
            <div className="bg-slate-50 p-6 rounded-xl whitespace-pre-wrap text-sm text-slate-600 font-mono leading-relaxed">
              {post.original_text}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;