import React from 'react';
import { Shield, Eye, Heart, Accessibility } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SafetySection() {
  return (
    <section className="py-20 bg-[#055b8e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 
            className="text-3xl sm:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            Safety & Accessibility
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Creating a safe, welcoming space for every learner
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center"
          >
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#ed7219] flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-white text-xl mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Age-Appropriate Content
            </h3>
            <p className="text-white/80 leading-relaxed">
              All activities are designed specifically for kids ages 8–16, with clear safety guidelines and parent-friendly instructions.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center"
          >
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#ed7219] flex items-center justify-center">
              <Accessibility className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-white text-xl mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Accessible Design
            </h3>
            <p className="text-white/80 leading-relaxed">
              Clear layouts, readable text, and simple navigation make our site easy to use for everyone.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center"
          >
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#ed7219] flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-white text-xl mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Inclusive Learning
            </h3>
            <p className="text-white/80 leading-relaxed">
              We welcome learners of all backgrounds and abilities. STEM is for everyone!
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}