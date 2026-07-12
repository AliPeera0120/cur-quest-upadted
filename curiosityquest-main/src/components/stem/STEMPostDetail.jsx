import React from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Globe, Lightbulb, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const topicColors = {
  science: 'bg-green-100 text-green-700',
  technology: 'bg-blue-100 text-blue-700',
  engineering: 'bg-orange-100 text-orange-700',
  math: 'bg-purple-100 text-purple-700',
  general: 'bg-gray-100 text-gray-700',
};

export default function STEMPostDetail({ post, onClose }) {
  if (!post) return null;

  const weekDate = post.week_date ? new Date(post.week_date) : new Date();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="bg-white rounded-3xl max-w-3xl w-full my-8 overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#055b8e] to-[#0a7bc0] p-6 text-white relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </Button>
            
            <div className="flex items-center gap-2 mb-3">
              <Badge className={topicColors[post.topic] || topicColors.general}>
                {post.topic?.charAt(0).toUpperCase() + post.topic?.slice(1)}
              </Badge>
              <span className="flex items-center gap-1 text-white/80 text-sm">
                <Calendar className="w-4 h-4" />
                Week of {format(weekDate, 'MMM d, yyyy')}
              </span>
            </div>
            <h2 
              className="text-2xl sm:text-3xl font-bold"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              {post.title}
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Summary */}
            <div className="bg-[#055b8e]/5 rounded-2xl p-5">
              <p className="text-lg text-gray-700 leading-relaxed">
                {post.summary}
              </p>
            </div>

            {/* Main Content */}
            <div className="prose prose-lg max-w-none prose-a:text-[#ed7219]">
              <ReactMarkdown
                components={{
                  h2: ({children}) => (
                    <h2 className="text-2xl font-bold text-[#055b8e] mt-8 mb-4 pb-2 border-b-2 border-[#055b8e]/20" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {children}
                    </h2>
                  ),
                  h3: ({children}) => (
                    <h3 className="text-xl font-bold text-[#055b8e] mt-6 mb-3" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {children}
                    </h3>
                  ),
                  h4: ({children}) => (
                    <h4 className="text-lg font-semibold text-[#ed7219] mt-4 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {children}
                    </h4>
                  ),
                  p: ({children}) => (
                    <p className="my-4 leading-relaxed text-gray-700">{children}</p>
                  ),
                  ul: ({children}) => (
                    <ul className="list-disc list-inside space-y-2 my-4 ml-4 text-gray-700">{children}</ul>
                  ),
                  ol: ({children}) => (
                    <ol className="list-decimal list-inside space-y-2 my-4 ml-4 text-gray-700">{children}</ol>
                  ),
                  strong: ({children}) => (
                    <strong className="font-bold text-[#055b8e]">{children}</strong>
                  ),
                  hr: () => (
                    <hr className="my-8 border-t-2 border-gray-200" />
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            {/* Fun Fact */}
            {post.fun_fact && (
              <div className="bg-[#ed7219]/10 border border-[#ed7219]/30 rounded-2xl p-5">
                <h3 className="font-bold text-[#ed7219] text-lg mb-2 flex items-center gap-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  <Lightbulb className="w-5 h-5" />
                  Fun Fact!
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {post.fun_fact}
                </p>
              </div>
            )}

            {/* Real World Connection */}
            {post.real_world_connection && (
              <div className="bg-[#055b8e]/5 border border-[#055b8e]/20 rounded-2xl p-5">
                <h3 className="font-bold text-[#055b8e] text-lg mb-2 flex items-center gap-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  <Globe className="w-5 h-5 text-[#ed7219]" />
                  Real-World Connection
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {post.real_world_connection}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 p-6">
            <Button
              onClick={onClose}
              className="w-full bg-[#055b8e] hover:bg-[#044a73] text-white py-6 rounded-xl font-semibold text-lg"
            >
              Back to This Week in STEM
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}