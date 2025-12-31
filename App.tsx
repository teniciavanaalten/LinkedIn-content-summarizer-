
import React, { useState, useEffect, useMemo } from 'react';
import { MarketingPost, ViewMode } from './types';
import { MARKETING_CATEGORIES } from './constants';
import PostCard from './components/PostCard';
import PostDetail from './components/PostDetail';
import PostInput from './components/PostInput';

const App: React.FC = () => {
  const [posts, setPosts] = useState<MarketingPost[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Dashboard);
  const [selectedPost, setSelectedPost] = useState<MarketingPost | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Persist posts
  useEffect(() => {
    const saved = localStorage.getItem('marketer_pulse_posts');
    if (saved) {
      try {
        setPosts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved posts");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('marketer_pulse_posts', JSON.stringify(posts));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesCategory = activeCategory ? post.primaryTopic === activeCategory : true;
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            post.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            post.coreTakeaway.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [posts, activeCategory, searchQuery]);

  const handlePostCreated = (newPost: MarketingPost) => {
    setPosts(prev => [newPost, ...prev]);
    setSelectedPost(newPost);
    setViewMode(ViewMode.PostDetail);
  };

  const handlePostClick = (post: MarketingPost) => {
    setSelectedPost(post);
    setViewMode(ViewMode.PostDetail);
  };

  const renderDashboard = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Growth Library</h1>
          <p className="text-slate-500">Your high-signal marketing knowledge base.</p>
        </div>
        <button 
          onClick={() => setViewMode(ViewMode.NewPost)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Post
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64 shrink-0 space-y-6">
          <div className="relative">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search insights..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
            />
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Folders</h3>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveCategory(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === null ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Posts
              </button>
              {MARKETING_CATEGORIES.map(cat => (
                <button 
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeCategory === cat.name ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat.name.split(' & ')[0]}
                  {posts.filter(p => p.primaryTopic === cat.name).length > 0 && (
                    <span className="ml-2 bg-slate-200 text-slate-500 px-1.5 rounded text-[10px] font-bold">
                      {posts.filter(p => p.primaryTopic === cat.name).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow">
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredPosts.map(post => (
                <PostCard key={post.id} post={post} onClick={handlePostClick} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-20 px-4 text-center">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No posts found</h3>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                {searchQuery || activeCategory 
                  ? "Try clearing your filters to see more content." 
                  : "Your library is empty. Add your first LinkedIn post to start building your knowledge base."}
              </p>
              {!searchQuery && !activeCategory && (
                <button 
                  onClick={() => setViewMode(ViewMode.NewPost)}
                  className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
                >
                  Create your first analysis →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => {
                setViewMode(ViewMode.Dashboard);
                setActiveCategory(null);
                setSearchQuery('');
              }}
            >
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tight">MarketerPulse<span className="text-indigo-600">AI</span></span>
            </div>
            <div className="hidden sm:flex items-center gap-6">
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">V1.0 BETA</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {viewMode === ViewMode.Dashboard && renderDashboard()}
        {viewMode === ViewMode.NewPost && (
          <PostInput 
            onPostCreated={handlePostCreated} 
            onCancel={() => setViewMode(ViewMode.Dashboard)} 
          />
        )}
        {viewMode === ViewMode.PostDetail && selectedPost && (
          <PostDetail post={selectedPost} onBack={() => setViewMode(ViewMode.Dashboard)} />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-400">© 2024 MarketerPulse AI. Optimized for high-signal growth analysis.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
