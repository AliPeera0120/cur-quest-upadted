import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { Calendar, Briefcase, Heart, ArrowRight } from 'lucide-react';
import WhatIsCQ from '../components/home/WhatIsCQ';
import WhatWeDo from '../components/home/WhatWeDo';
import OurTeam from '../components/home/OurTeam';
import SafetySection from '../components/home/SafetySection';

const getInvolved = [
  {
    icon: Calendar,
    title: 'Events',
    desc: 'Join us at free STEM events at libraries and community centers near you.',
    page: 'Events',
    color: 'bg-[#055b8e]',
  },
  {
    icon: Briefcase,
    title: 'Careers in STEM',
    desc: 'Explore the many exciting career paths that a love of science can lead to.',
    page: 'CareersInSTEM',
    color: 'bg-[#ed7219]',
  },
  {
    icon: Heart,
    title: 'Make an Impact',
    desc: 'Support our mission, volunteer, or bring CuriosityQuest to your community.',
    page: 'MakeAnImpact',
    color: 'bg-[#055b8e]',
  },
];

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#055b8e] to-[#044a73] text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-bold mb-4"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            About CuriosityQuest
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/80 text-lg max-w-2xl mx-auto"
          >
            We are a nonprofit on a mission to spark a lifelong love of learning by making
            hands-on STEM education fun, free, and accessible for every curious kid.
          </motion.p>
        </div>
      </div>

      <WhatIsCQ />
      <OurTeam />
      <WhatWeDo />
      <SafetySection />

      {/* Get Involved */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#055b8e] mb-3" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Get Involved
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              There are many ways to be part of the CuriosityQuest community.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {getInvolved.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.page}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    to={createPageUrl(item.page)}
                    className="block h-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all p-6 group"
                  >
                    <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-bold text-[#055b8e] text-xl mb-2 group-hover:text-[#ed7219] transition-colors" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {item.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{item.desc}</p>
                    <span className="inline-flex items-center gap-1 text-[#ed7219] font-semibold">
                      Learn more <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
