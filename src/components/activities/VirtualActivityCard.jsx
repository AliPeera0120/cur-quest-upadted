import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const typeColors = {
  'Lesson': 'bg-[#055b8e]',
  'Program': 'bg-[#ed7219]',
  'Project': 'bg-gradient-to-r from-[#055b8e] to-[#ed7219]',
};

const typeIcons = {
  'Lesson': '📚',
  'Program': '💻',
  'Project': '🚀',
};

export default function VirtualActivityCard({ activity, onClick, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:shadow-lg hover:border-[#055b8e] transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#055b8e]/5 to-[#ed7219]/5 p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge className={`${typeColors[activity.activity_type]} text-white`}>
            {typeIcons[activity.activity_type]} {activity.activity_type}
          </Badge>
        </div>
      </div>
      
      <div className="p-5">
        <div className="text-sm font-medium text-[#3776AB] mb-1">
          Python - {activity.activity_type} {activity.order}
        </div>
        <h3 
          className="font-bold text-[#055b8e] text-xl mb-2 group-hover:text-[#ed7219] transition-colors"
          style={{ fontFamily: 'Nunito, sans-serif' }}
        >
          {activity.title}
        </h3>

        <p className="text-gray-600 mb-4 line-clamp-2">
          {activity.description}
        </p>

        <div className="flex items-center justify-end">
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#ed7219] group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </motion.div>
  );
}