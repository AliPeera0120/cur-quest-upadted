import React from 'react';
import { format } from 'date-fns';
import { BookOpen, Sparkles, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function STEMWordCard({ word, featured = false }) {
  const wordDate = word.word_date ? new Date(word.word_date) : (word.week_date ? new Date(word.week_date) : new Date());

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-6 ${featured ? 'bg-[#ed7219] text-white' : 'bg-white border border-gray-200'}`}
    >
      <div className="flex items-center gap-2 mb-3">
        {featured ? (
          <Sparkles className="w-5 h-5 text-white/80" />
        ) : (
          <BookOpen className="w-5 h-5 text-[#055b8e]" />
        )}
        <span className={`text-sm font-medium ${featured ? 'text-white/80' : 'text-gray-500'}`}>
          {featured ? "STEM Word of the Day" : format(wordDate, 'MMM d')}
        </span>
      </div>

      <h3 
        className={`text-2xl font-bold mb-2 ${featured ? 'text-white' : 'text-[#055b8e]'}`}
        style={{ fontFamily: 'Nunito, sans-serif' }}
      >
        {word.word}
      </h3>

      <p className={`mb-3 ${featured ? 'text-white/90' : 'text-gray-700'}`}>
        {word.definition}
      </p>

      <div className={`text-sm mb-3 ${featured ? 'text-white/70' : 'text-gray-500'}`}>
        <strong>Example:</strong> {word.example}
      </div>

      {word.fields && (
        <div className="flex items-center gap-2 flex-wrap">
          <Tag className={`w-4 h-4 ${featured ? 'text-white/60' : 'text-gray-400'}`} />
          {word.fields.split(',').map((field, i) => (
            <Badge 
              key={i} 
              variant="outline" 
              className={featured 
                ? 'bg-white/20 text-white border-white/30 text-xs' 
                : 'bg-gray-100 text-gray-600 border-gray-200 text-xs'
              }
            >
              {field.trim()}
            </Badge>
          ))}
        </div>
      )}
    </motion.div>
  );
}