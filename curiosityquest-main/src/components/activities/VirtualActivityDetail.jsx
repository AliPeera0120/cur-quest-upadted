import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const typeColors = {
  'Lesson': 'bg-[#055b8e]',
  'Program': 'bg-[#ed7219]',
  'Project': 'bg-gradient-to-r from-[#055b8e] to-[#ed7219]',
};

export default function VirtualActivityDetail({ activity, onClose }) {
  if (!activity) return null;

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
          className="bg-white rounded-3xl max-w-4xl w-full my-8 overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#055b8e] to-[#044a73] p-6 text-white relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </Button>
            
            <div className="flex items-center gap-3 mb-3">
              <Code className="w-8 h-8" />
              <Badge className={`${typeColors[activity.activity_type]} text-white border-0`}>
                {activity.activity_type}
              </Badge>
              <Badge className="bg-[#3776AB] text-white border-0">
                Python
              </Badge>
            </div>
            <div className="text-white/80 text-sm mb-2">
              Python - {activity.activity_type} {activity.order}
            </div>
            <h2 
              className="text-2xl sm:text-3xl font-bold"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              {activity.title}
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Description */}
            <div className="bg-gray-50 rounded-2xl p-5">
              <p className="text-gray-700 text-lg leading-relaxed">
                {activity.description}
              </p>
            </div>

            {/* Main Content */}
            <div className="prose prose-lg max-w-none 
              prose-headings:font-bold prose-headings:text-[#055b8e] 
              prose-a:text-[#ed7219] 
              prose-code:bg-gray-800 prose-code:text-green-400 prose-code:px-2 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
              prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:p-6 prose-pre:overflow-x-auto prose-pre:my-6
              prose-p:leading-relaxed prose-p:my-4
              prose-ul:my-4 prose-li:my-1
              prose-ol:my-4
              prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-2xl prose-h2:border-b prose-h2:border-[#055b8e]/20 prose-h2:pb-2
              prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-xl
              prose-h4:mt-4 prose-h4:mb-2 prose-h4:text-lg prose-h4:text-[#ed7219]
            ">
              <ReactMarkdown
                components={{
                  code({node, inline, className, children, ...props}) {
                    return inline ? (
                      <code className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                        {children}
                      </code>
                    ) : (
                      <code {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre({node, children, ...props}) {
                    return (
                      <pre className="bg-gray-900 text-gray-100 rounded-xl p-6 overflow-x-auto my-6 text-sm" {...props}>
                        {children}
                      </pre>
                    );
                  },
                  h2({children, ...props}) {
                    return (
                      <h2 className="text-2xl font-bold text-[#055b8e] mt-10 mb-4 pb-2 border-b-2 border-[#055b8e]/20" {...props}>
                        {children}
                      </h2>
                    );
                  },
                  h3({children, ...props}) {
                    return (
                      <h3 className="text-xl font-bold text-[#055b8e] mt-8 mb-3" {...props}>
                        {children}
                      </h3>
                    );
                  },
                  h4({children, ...props}) {
                    return (
                      <h4 className="text-lg font-semibold text-[#ed7219] mt-6 mb-2" {...props}>
                        {children}
                      </h4>
                    );
                  },
                  ul({children, ...props}) {
                    return (
                      <ul className="list-disc list-inside space-y-2 my-4 ml-4" {...props}>
                        {children}
                      </ul>
                    );
                  },
                  ol({children, ...props}) {
                    return (
                      <ol className="list-decimal list-inside space-y-2 my-4 ml-4" {...props}>
                        {children}
                      </ol>
                    );
                  },
                  p({children, ...props}) {
                    return (
                      <p className="my-4 leading-relaxed text-gray-700" {...props}>
                        {children}
                      </p>
                    );
                  }
                }}
              >
                {activity.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 p-6">
            <Button
              onClick={onClose}
              className="w-full bg-[#055b8e] hover:bg-[#044a73] text-white py-6 rounded-xl font-semibold text-lg"
            >
              Back to Activities
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}