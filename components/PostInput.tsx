
import React, { useState } from 'react';
import { analyzeLinkedInPost } from '../geminiService';
import { MarketingPost, ViewMode } from '../types';

interface PostInputProps {
  onPostCreated: (post: MarketingPost) => void;
  onCancel: () => void;
}

const PostInput: React.FC<PostInputProps> = ({ onPostCreated, onCancel }) => {
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Please paste the post content first.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const analysis = await analyzeLinkedInPost(content, url);
      
      const newPost: MarketingPost = {
        ...analysis,
        id: crypto.randomUUID(),
        url,
        dateSaved: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', month: 'short', day: 'numeric' 
        })
      };

      onPostCreated(newPost);
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Please try again or refine the text.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Extract Insights</h2>
          <p className="text-slate-500">Paste a LinkedIn post below. We'll strip the fluff and keep the signal.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              LinkedIn Post URL (Optional)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.linkedin.com/posts/..."
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Post Content (Required)
            </label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste the full text of the LinkedIn post here..."
              rows={12}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none font-sans"
            />
            <p className="mt-2 text-xs text-slate-400">
              Note: Since direct fetching is restricted by CORS, pasting the text ensures the best analysis results.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={isAnalyzing}
              className="flex-grow bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing Signal...
                </>
              ) : (
                <>
                  Analyze Post
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 font-semibold text-slate-500 hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostInput;
