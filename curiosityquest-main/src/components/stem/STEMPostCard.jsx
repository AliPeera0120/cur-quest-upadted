import React from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Lightbulb, Calendar, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const topicColors = {
  science: 'bg-green-100 text-green-700',
  technology: 'bg-blue-100 text-blue-700',
  engineering: 'bg-orange-100 text-orange-700',
  math: 'bg-purple-100 text-purple-700',
  general: 'bg-gray-100 text-gray-700',
};

export default function STEMPostCard({ post, onClick, featured = false, index = 0 }) {
  const weekDate = post.week_date ? new Date(post.week_date + 'T12:00:00') : new Date();

  if (featured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#055b8e] to-[#044a73] rounded-3xl overflow-hidden cursor-pointer group"
        onClick={onClick}
      >
        <div className="p-8 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#ed7219]" />
            <span className="text-white/80 font-medium">This Week's Topic</span>
          </div>
          
          <h2 
            className="text-3xl sm:text-4xl font-bold mb-4 group-hover:text-[#ed7219] transition-colors"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            {post.title}
          </h2>

          <p className="text-xl text-white/80 mb-6 line-clamp-2">
            {post.summary}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge className="bg-white/20 text-white">
                {post.topic?.charAt(0).toUpperCase() + post.topic?.slice(1)}
              </Badge>
              <span className="flex items-center gap-1 text-white/60 text-sm">
                <Calendar className="w-4 h-4" />
                Week of {format(weekDate, 'MMM d, yyyy')}
              </span>
            </div>
            <ChevronRight className="w-6 h-6 text-white/60 group-hover:text-[#ed7219] group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Badge className={topicColors[post.topic] || topicColors.general}>
            {post.topic?.charAt(0).toUpperCase() + post.topic?.slice(1)}
          </Badge>
          <span className="text-gray-400 text-sm">
            {format(weekDate, 'MMM d')}
          </span>
        </div>

        <h3 
          className="font-bold text-[#055b8e] text-xl mb-2 group-hover:text-[#ed7219] transition-colors"
          style={{ fontFamily: 'Nunito, sans-serif' }}
        >
          {post.title}
        </h3>

        <p className="text-gray-600 mb-4 line-clamp-2">
          {post.summary}
        </p>

        {post.fun_fact && (
          <div className="flex items-start gap-2 bg-[#ed7219]/5 rounded-xl p-3 mb-4">
            <Lightbulb className="w-4 h-4 text-[#ed7219] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600 line-clamp-2">
              <strong className="text-[#ed7219]">Fun fact:</strong> {post.fun_fact}
            </p>
          </div>
        )}

        <div className="flex items-center justify-end">
          <span className="text-[#055b8e] font-medium flex items-center gap-1 group-hover:text-[#ed7219] transition-colors">
            Read more
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}