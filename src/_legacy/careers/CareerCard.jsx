import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Lightbulb, Target, Wrench, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CareerCard({ career, index }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden border-2 border-gray-100">
        <CardHeader 
          className="cursor-pointer bg-gradient-to-r from-[#055b8e]/5 to-[#ed7219]/5 hover:from-[#055b8e]/10 hover:to-[#ed7219]/10 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-[#ed7219] text-white">
                  {career.category}
                </Badge>
              </div>
              <CardTitle 
                className="text-xl text-[#055b8e]"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                {career.title}
              </CardTitle>
            </div>
            <button className="text-[#055b8e] hover:text-[#ed7219] transition-colors">
              {isExpanded ? (
                <ChevronUp className="w-6 h-6" />
              ) : (
                <ChevronDown className="w-6 h-6" />
              )}
            </button>
          </div>
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="pt-6 space-y-4">
                {/* What They Do */}
                <div>
                  <h4 className="font-bold text-[#055b8e] mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-[#ed7219]" />
                    What They Do
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    {career.what_they_do}
                  </p>
                </div>

                {/* Why It Matters */}
                <div>
                  <h4 className="font-bold text-[#055b8e] mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#ed7219]" />
                    Why It Matters
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    {career.why_it_matters}
                  </p>
                </div>

                {/* STEM Skills */}
                <div>
                  <h4 className="font-bold text-[#055b8e] mb-2 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-[#ed7219]" />
                    STEM Skills Used
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {career.stem_skills?.split(',').map((skill, i) => (
                      <Badge key={i} variant="outline" className="border-[#055b8e] text-[#055b8e]">
                        {skill.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* How to Start */}
                <div className="bg-[#ed7219]/5 rounded-xl p-4 border border-[#ed7219]/20">
                  <h4 className="font-bold text-[#055b8e] mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#ed7219]" />
                    How Kids Can Start Learning Now
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    {career.how_to_start}
                  </p>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}