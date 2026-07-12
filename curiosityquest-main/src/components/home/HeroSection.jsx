import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Rocket, ArrowRight, Beaker, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#055b8e] via-[#055b8e] to-[#044a73] min-h-[420px] flex items-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full border-4 border-white" />
        <div className="absolute bottom-40 right-20 w-48 h-48 rounded-full border-4 border-white" />
        <div className="absolute top-40 right-40 w-20 h-20 rounded-full border-4 border-white" />
        <div className="absolute bottom-20 left-40 w-24 h-24 rounded-full border-4 border-white" />
      </div>

      {/* Floating Elements */}
      <motion.div 
        className="absolute top-24 right-[15%] hidden lg:block"
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-16 h-16 rounded-2xl bg-[#ed7219] flex items-center justify-center shadow-xl">
          <Beaker className="w-8 h-8 text-white" />
        </div>
      </motion.div>

      <motion.div 
        className="absolute bottom-32 right-[8%] hidden lg:block"
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-xl">
          <Lightbulb className="w-7 h-7 text-[#ed7219]" />
        </div>
      </motion.div>

      <motion.div 
        className="absolute top-48 left-[10%] hidden lg:block"
        animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
          <Rocket className="w-6 h-6 text-white" />
        </div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-[#ed7219] animate-pulse" />
              Inspiring young minds through STEM
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            Where Curiosity
            <span className="block text-[#ed7219]">Becomes Discovery</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-white/90 leading-relaxed mb-6 max-w-2xl"
          >
            Join us on an exciting journey of exploration! Through hands-on experiments, 
            virtual activities, and community events, we help kids discover the wonder of 
            science, technology, engineering, and math.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to={createPageUrl('Activities')}>
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-[#ed7219] hover:bg-[#d86515] text-white text-lg px-8 py-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all group"
              >
                Explore Activities
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to={createPageUrl('ThisWeekInSTEM')}>
              <Button 
                size="lg" 
                variant="outline"
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/30 text-lg px-8 py-6 rounded-xl font-semibold transition-all"
              >
                This Week in STEM
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}