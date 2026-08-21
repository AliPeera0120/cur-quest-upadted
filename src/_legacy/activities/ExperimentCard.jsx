import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, FlaskConical } from 'lucide-react';
import { motion } from 'framer-motion';

const topicColors = {
  physics: { bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-200' },
  biology: { bg: 'bg-green-500', light: 'bg-green-50', border: 'border-green-200' },
  chemistry: { bg: 'bg-purple-500', light: 'bg-purple-50', border: 'border-purple-200' },
  engineering: { bg: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-200' },
};

const topicLabels = {
  physics: 'Physics',
  biology: 'Biology',
  chemistry: 'Chemistry',
  engineering: 'Engineering',
};

const difficultyColors = {
  'Beginner': 'bg-green-100 text-green-800 border-green-300',
  'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Advanced': 'bg-red-100 text-red-800 border-red-300',
};

export default function ExperimentCard({ experiment, onClick, index = 0 }) {
  const colors = topicColors[experiment.topic] || topicColors.physics;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white rounded-2xl border-2 ${colors.border} overflow-hidden hover:shadow-lg transition-all cursor-pointer group`}
      onClick={onClick}
    >
      {/* Header */}
      <div className={`${colors.light} p-4 flex items-center justify-between gap-2`}>
        <div className="flex items-center gap-2">
          <FlaskConical className={`w-4 h-4 ${colors.bg.replace('bg-', 'text-')}`} />
          <Badge className={`${colors.bg} text-white`}>
            {topicLabels[experiment.topic] || experiment.topic}
          </Badge>
        </div>
        <Badge variant="outline" className={difficultyColors[experiment.difficulty] || 'bg-gray-100 text-gray-800'}>
          {experiment.difficulty}
        </Badge>
      </div>
      
      <div className="p-5">
        <h3 
          className="font-bold text-[#055b8e] text-xl mb-3 group-hover:text-[#ed7219] transition-colors"
          style={{ fontFamily: 'Nunito, sans-serif' }}
        >
          {experiment.title}
        </h3>

        <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
          {experiment.what_you_learn}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">
            {experiment.materials?.split('\n').filter(m => m.trim()).length || 0} materials needed
          </span>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#ed7219] group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </motion.div>
  );
}