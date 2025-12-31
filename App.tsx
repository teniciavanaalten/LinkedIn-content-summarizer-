import React, { useState, useEffect, useMemo } from 'react';
import { MarketingPost, ViewMode } from './types';
import { MARKETING_CATEGORIES } from './constants';
import PostCard from './components/PostCard';
import PostDetail from './components/PostDetail';
import PostInput from './components/PostInput';
import ChatInterface from './components/ChatInterface';
import { fetchAllPosts } from './geminiService';

const App: React.FC = () => {
  const [posts, setPosts] = useState<MarketingPost[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Dashboard);
  const [selectedPost, setSelectedPost] = useState<MarketingPost | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllPosts();
      setPosts(data);
    } catch (e: any) {
      console.error("Error loading library:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesCategory = activeCategory ? post.primary_topic === activeCategory : true;
      const matchesSearch = 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        post.core_takeaway.toLowerCase().includes(searchQuery.toLowerCase());
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Growth Strategy Library</h1>
          <p className="text-slate-500">Your AI-powered knowledge hub for high-signal marketing tactics.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsChatOpen(true)}
            className="bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 group"
          >
            <svg className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Research Library
          </button>
          <button 
            onClick={() => setViewMode(ViewMode.NewPost)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Analyze Post
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 shrink-0 space-y-6">
          <div className="relative">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search library..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
            />
            <svg className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <nav>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Strategy Folders</h3>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveCategory(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === null ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Community Posts
              </button>
              {MARKETING_CATEGORIES.map(cat => (
                <button 
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                    activeCategory === cat.name ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  {posts.filter(p => p.primary_topic === cat.name).length > 0 && (
                    <span className="ml-2 bg-slate-200 text-slate-500 px-1.5 rounded text-[10px] font-bold">
                      {posts.filter(p => p.primary_topic === cat.name).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </nav>
        </aside>

        <section className="flex-grow">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              <p className="text-slate-400 text-sm font-medium">Accessing Growth Library...</p>
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredPosts.map(post => (
                <PostCard key={post.id} post={post} onClick={handlePostClick} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-24 px-4 text-center">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No results found</h3>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
                {searchQuery || activeCategory 
                  ? "We couldn't find anything matching your filters. Try broadening your search or choosing a different folder." 
                  : "Your marketing library is empty. Start adding LinkedIn posts to extract and save strategic insights."}
              </p>
              <button 
                onClick={() => setViewMode(ViewMode.NewPost)}
                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold py-3 px-8 rounded-xl transition-all inline-flex items-center gap-2"
              >
                Analyze Your First Post
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div 
              className="flex items-center gap-2.5 cursor-pointer group" 
              onClick={() => {
                setViewMode(ViewMode.Dashboard);
                setActiveCategory(null);
                setSearchQuery('');
              }}
            >
              <div className="bg-indigo-600 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tight">MarketerPulse<span className="text-indigo-600">AI</span></span>
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

      <footer className="bg-white border-t border-slate-200 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-400 font-medium tracking-wide">© 2024 MARKETERPULSE AI • INTELLIGENT GROWTH SYSTEMS</p>
        </div>
      </footer>

      <ChatInterface isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default App;