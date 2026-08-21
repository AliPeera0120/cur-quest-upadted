import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { FlaskConical, Code, BookOpen, ArrowRight } from 'lucide-react';

const sections = [
  {
    icon: FlaskConical,
    title: 'Hands-On Experiments',
    desc: 'Over 70 safe, step-by-step science experiments you can do at home with everyday materials, across physics, chemistry, biology, and engineering.',
    stat: '72 experiments',
    to: createPageUrl('Activities'),
    color: 'bg-[#055b8e]',
    accent: 'text-[#055b8e]',
  },
  {
    icon: Code,
    title: 'Coding Courses',
    desc: 'Learn to code from scratch with full beginner tracks in Python, Java, and HTML and CSS, complete with lessons, programs, and capstone projects.',
    stat: '3 languages · 50 lessons',
    to: `${createPageUrl('Activities')}?tab=code`,
    color: 'bg-[#ed7219]',
    accent: 'text-[#ed7219]',
  },
  {
    icon: BookOpen,
    title: '5 Minutes of STEM',
    desc: 'Quick, fascinating reads that explain science, technology, engineering, and math questions in a way that is simple, surprising, and fun.',
    stat: 'New topics added regularly',
    to: createPageUrl('ThisWeekInSTEM'),
    color: 'bg-[#055b8e]',
    accent: 'text-[#055b8e]',
  },
];

export default function LearnHub() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#055b8e] to-[#044a73] text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-bold mb-4"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            Activities
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/80 text-lg max-w-2xl mx-auto"
          >
            Everything you need to learn by doing. Pick an experiment, start a coding course,
            or read a quick STEM story.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {sections.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={s.to}
                  className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all p-6 group"
                >
                  <div className={`w-14 h-14 rounded-2xl ${s.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-[#055b8e] text-xl mb-2 group-hover:text-[#ed7219] transition-colors" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {s.title}
                  </h3>
                  <p className="text-gray-600 mb-4 flex-1">{s.desc}</p>
                  <div className={`text-sm font-semibold ${s.accent} mb-3`}>{s.stat}</div>
                  <span className="inline-flex items-center gap-1 text-[#ed7219] font-semibold">
                    Explore <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
