import React from 'react';
import { Sparkles, Heart, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WhatIsCQ() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 
              className="text-3xl sm:text-4xl font-bold text-[#055b8e] mb-6"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              Our Mission
            </h2>
            <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
              <p>
                CuriosityQuest is a nonprofit program designed to spark a love of learning 
                in kids through hands-on STEM experiences. We believe that every child is 
                naturally curious—and that curiosity is the beginning of all discovery!
              </p>
              <p>
                Instead of just reading about science or watching videos, our activities 
                let you <strong className="text-[#ed7219]">actually do science</strong>. 
                Build circuits, mix colorful chemistry experiments, code your first program, 
                and explore how the world works.
              </p>
              <p>
                Whether you're at home, in a library, or joining one of our community 
                events, CuriosityQuest makes learning an adventure you'll never forget.
              </p>
            </div>
          </motion.div>

          {/* Visual Cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 gap-4"
          >
            <div className="bg-gradient-to-r from-[#055b8e]/5 to-[#055b8e]/10 rounded-2xl p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#055b8e] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[#055b8e] text-lg mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  Learn By Doing
                </h3>
                <p className="text-gray-600">
                  Hands-on experiments and activities that make STEM concepts click
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#ed7219]/5 to-[#ed7219]/10 rounded-2xl p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#ed7219] flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[#ed7219] text-lg mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  Built for Kids
                </h3>
                <p className="text-gray-600">
                  Age-appropriate content designed to be fun, safe, and accessible for everyone
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#055b8e]/5 to-[#055b8e]/10 rounded-2xl p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#055b8e] flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[#055b8e] text-lg mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  Community Powered
                </h3>
                <p className="text-gray-600">
                  Free events at libraries and community centers near you
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}