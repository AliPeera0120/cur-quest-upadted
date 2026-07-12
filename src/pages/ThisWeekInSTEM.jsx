import React, { useState } from 'react';
import posts from '@/data/stemPosts.json';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, Archive, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import STEMPostCard from '../components/stem/STEMPostCard';
import STEMPostDetail from '../components/stem/STEMPostDetail';

const topicFilters = [
  { id: 'all', label: 'All Topics' },
  { id: 'science', label: 'Science' },
  { id: 'technology', label: 'Technology' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'math', label: 'Math' },
];

export default function ThisWeekInSTEM() {
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);

  // Get most recent post
  const featuredPost = posts[0];
  const archivePosts = posts.slice(1);

  const filteredPosts = archivePosts.filter((post) => {
    const matchesTopic = selectedTopic === 'all' || post.topic === selectedTopic;
    const matchesSearch = !searchQuery || 
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTopic && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#055b8e] to-[#044a73] text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-bold mb-2"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            5 Minutes of STEM
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/80 max-w-2xl mx-auto"
          >
            Explore fascinating questions about science, technology, engineering, and math—made simple and fun!
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <>
            {/* Featured Section */}
            <div className="mb-16">
              {featuredPost ? (
                <STEMPostCard 
                  post={featuredPost} 
                  featured 
                  onClick={() => setSelectedPost(featuredPost)} 
                />
              ) : (
                <div className="bg-white rounded-3xl p-8 text-center">
                  <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-500 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    Coming Soon
                  </h3>
                  <p className="text-gray-400">
                    Check back for this week's topic!
                  </p>
                </div>
              )}
            </div>

            {/* Archive Section */}
            {archivePosts.length > 0 && (
              <section>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                  <h2 
                    className="text-2xl font-bold text-[#055b8e] flex items-center gap-2"
                    style={{ fontFamily: 'Nunito, sans-serif' }}
                  >
                    <Archive className="w-6 h-6" />
                    Archive
                  </h2>

                  {/* Search */}
                  <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search posts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 rounded-xl border-gray-200"
                    />
                  </div>
                </div>

                {/* Topic Filters */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {topicFilters.map((topic) => (
                    <Button
                      key={topic.id}
                      variant={selectedTopic === topic.id ? 'default' : 'outline'}
                      onClick={() => setSelectedTopic(topic.id)}
                      className={`rounded-full ${
                        selectedTopic === topic.id 
                          ? 'bg-[#055b8e] hover:bg-[#044a73]' 
                          : 'hover:bg-[#055b8e]/10 hover:text-[#055b8e] hover:border-[#055b8e]'
                      }`}
                    >
                      {topic.label}
                    </Button>
                  ))}
                </div>

                {filteredPosts.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl">
                    <Search className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-500 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      No posts found
                    </h3>
                    <p className="text-gray-400">
                      Try adjusting your search or filter
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPosts.map((post, index) => (
                      <STEMPostCard
                        key={post.id}
                        post={post}
                        index={index}
                        onClick={() => setSelectedPost(post)}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
      </div>

      {/* Detail Modal */}
      {selectedPost && (
        <STEMPostDetail
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}

      {/* Floating Subscribe Button */}
      <a
        href="https://curiosityquest25.substack.com/?utm_campaign=profile&utm_medium=profile-page"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#ed7219] hover:bg-[#d86515] text-white px-5 py-3 rounded-full shadow-lg font-semibold transition-all hover:scale-105"
        style={{ fontFamily: 'Nunito, sans-serif' }}
      >
        <Sparkles className="w-4 h-4" />
        Subscribe to Newsletter
      </a>
    </div>
  );
}