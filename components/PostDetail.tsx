
import React from 'react';
import { MarketingPost } from '../types';

interface PostDetailProps {
  post: MarketingPost;
  onBack: () => void;
}

const PostDetail: React.FC<PostDetailProps> = ({ post, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Library
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 px-3 py-1 rounded-full">
              {post.primaryTopic}
            </span>
            {post.secondaryTopics.map(topic => (
              <span key={topic} className="text-xs font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {topic}
              </span>
            ))}
            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
              post.signalQuality === 'High-signal' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 
              post.signalQuality === 'Medium-signal' ? 'border-amber-200 text-amber-700 bg-amber-50' : 
              'border-slate-200 text-slate-700 bg-slate-50'
            }`}>
              {post.signalQuality}
            </span>
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 mb-4 leading-tight">
            {post.title}
          </h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center">
              <span className="font-semibold text-slate-900 mr-2">Author:</span> {post.author}
            </div>
            {post.url && (
              <a href={post.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-indigo-600 hover:underline">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Original Post
              </a>
            )}
            <div>
              <span className="font-semibold text-slate-900 mr-2">Saved:</span> {post.dateSaved}
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <section>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Core Takeaway</h2>
            <p className="text-lg font-medium text-slate-800 bg-indigo-50/50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
              {post.coreTakeaway}
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">High-Signal Summary</h2>
            <ul className="space-y-4">
              {post.summary.map((point, idx) => (
                <li key={idx} className="flex items-start">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 mr-3"></div>
                  <span className="text-slate-700 leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </section>

          {post.tactics.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Tactical Ideas & Tests</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {post.tactics.map((tactic, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start">
                    <svg className="w-5 h-5 text-indigo-500 mt-0.5 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-sm font-medium text-slate-700">{tactic}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="pt-8 border-t border-slate-100">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Original Cleaned Text</h2>
            <div className="bg-slate-50 p-6 rounded-xl whitespace-pre-wrap text-sm text-slate-600 font-mono leading-relaxed">
              {post.cleanedText}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
