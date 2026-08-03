import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { Swords, FlaskConical, Award, ArrowRight } from 'lucide-react';

const games = [
  {
    icon: Swords,
    title: 'Science Arena',
    desc: 'A battle campaign where correct science answers power your elixir. Deploy units, topple the enemy tower, and climb through curriculum-aligned levels.',
    tag: 'Battle campaign',
    to: createPageUrl('ScienceArena'),
    color: 'bg-[#055b8e]',
    accent: 'text-[#055b8e]',
  },
  {
    icon: FlaskConical,
    title: 'Science Lab Tycoon',
    desc: 'Answer questions from a bank of 186 science questions to earn Research Coins, then build your dream laboratory one instrument at a time.',
    tag: 'Quiz game',
    to: createPageUrl('ScienceLab'),
    color: 'bg-[#ed7219]',
    accent: 'text-[#ed7219]',
  },
  {
    icon: Award,
    title: 'Quest Passport',
    desc: 'Track everything you learn in one place. Earn XP, level up, collect badges, and take topic quizzes as you complete activities across the site.',
    tag: 'Progress tracker',
    to: createPageUrl('QuestPassport'),
    color: 'bg-[#055b8e]',
    accent: 'text-[#055b8e]',
  },
];

export default function PlayHub() {
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
            Interactive Play
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/80 text-lg max-w-2xl mx-auto"
          >
            Learning that feels like playing. Explore physics, build a virtual lab, and watch
            your progress grow, all saved right in your browser.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {games.map((g, i) => {
            const Icon = g.icon;
            return (
              <motion.div
                key={g.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={g.to}
                  className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all p-6 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-14 h-14 rounded-2xl ${g.color} flex items-center justify-center`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{g.tag}</span>
                  </div>
                  <h3 className="font-bold text-[#055b8e] text-xl mb-2 group-hover:text-[#ed7219] transition-colors" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {g.title}
                  </h3>
                  <p className="text-gray-600 mb-4 flex-1">{g.desc}</p>
                  <span className="inline-flex items-center gap-1 text-[#ed7219] font-semibold">
                    Play now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
