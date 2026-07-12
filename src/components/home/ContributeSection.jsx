import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Button } from '@/components/ui/button';
import { Heart, Users, Book, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const impactAreas = [
  {
    icon: Book,
    title: 'Fund Learning Resources',
    description: 'Provide hands-on experiment kits and learning materials to students'
  },
  {
    icon: Users,
    title: 'Support Community Events',
    description: 'Bring STEM education to libraries and community centers'
  },
  {
    icon: Sparkles,
    title: 'Inspire Future Innovators',
    description: 'Help young minds discover their passion for science and technology'
  },
];

export default function ContributeSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-[#055b8e] to-[#044a73]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#ed7219] mb-6">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h2 
            className="text-3xl sm:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            Make an Impact
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Your support helps us bring STEM education to curious young minds everywhere
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {impactAreas.map((area, index) => {
            const Icon = area.icon;
            return (
              <motion.div
                key={area.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-[#ed7219] flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {area.title}
                </h3>
                <p className="text-white/70 text-sm">
                  {area.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <Link to={createPageUrl('MakeAnImpact')}>
            <Button
              size="lg"
              className="bg-[#ed7219] hover:bg-[#d86515] text-white px-10 py-6 rounded-xl font-semibold text-lg group"
            >
              <Heart className="mr-2 w-5 h-5" />
              Contribute Now
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="text-white/60 text-sm mt-4">
            Every contribution makes a difference
          </p>
        </motion.div>
      </div>
    </section>
  );
}