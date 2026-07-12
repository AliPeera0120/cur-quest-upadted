import React, { useState, useEffect } from 'react';
import careers from '@/data/careers.json';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Briefcase, Sparkles, ChevronDown, Building2, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const categories = [
  { id: 'all', label: 'All Careers' },
  { id: 'Engineering', label: 'Engineering' },
  { id: 'Computer Science & Coding', label: 'Computer Science & Coding' },
  { id: 'Robotics & AI', label: 'Robotics & AI' },
  { id: 'Space & Physics', label: 'Space & Physics' },
  { id: 'Environmental Science', label: 'Environmental Science' },
  { id: 'Biomedical & Health', label: 'Biomedical & Health' },
  { id: 'Design & UX', label: 'Design & UX' },
];

const categoryImages = {
  'all': 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&q=80',
  'Engineering': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80',
  'Computer Science & Coding': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80',
  'Robotics & AI': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80',
  'Space & Physics': 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80',
  'Environmental Science': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
  'Biomedical & Health': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
  'Design & UX': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
};

const categoryTints = {
  'all': 'from-[#055b8e]/70',
  'Engineering': 'from-[#055b8e]/70',
  'Computer Science & Coding': 'from-[#ed7219]/70',
  'Robotics & AI': 'from-[#055b8e]/70',
  'Space & Physics': 'from-[#ed7219]/70',
  'Environmental Science': 'from-[#055b8e]/70',
  'Biomedical & Health': 'from-[#ed7219]/70',
  'Design & UX': 'from-[#055b8e]/70',
};

function CareerDetailModal({ career, onClose }) {
  if (!career) return null;

  const tint = categoryTints[career.category] || 'from-[#055b8e]/70';
  const image = categoryImages[career.category] || categoryImages['Engineering'];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Image */}
          <div className="relative h-48 overflow-hidden">
            <img 
              src={image} 
              alt={career.category}
              className="w-full h-full object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${tint} to-transparent`}></div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <div className="absolute bottom-4 left-6 right-6">
              <Badge className="bg-white/20 text-white mb-2">
                {career.category}
              </Badge>
              <h2 
                className="text-2xl sm:text-3xl font-bold text-white"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                {career.title}
              </h2>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Description */}
            <div>
              <h3 className="font-bold text-[#055b8e] text-lg mb-2 flex items-center gap-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                <Briefcase className="w-5 h-5 text-[#ed7219]" />
                What They Do
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {career.description}
              </p>
            </div>

            {/* Good Fit For */}
            <div className="bg-[#055b8e]/5 rounded-2xl p-5">
              <h3 className="font-bold text-[#055b8e] text-lg mb-3 flex items-center gap-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                <User className="w-5 h-5 text-[#ed7219]" />
                Good Fit For
              </h3>
              <div className="flex flex-wrap gap-2">
                {career.good_fit_for?.split(',').map((trait, i) => (
                  <Badge key={i} variant="outline" className="bg-white border-[#055b8e]/30 text-[#055b8e]">
                    {trait.trim()}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Employers */}
            <div className="bg-[#ed7219]/5 rounded-2xl p-5">
              <h3 className="font-bold text-[#ed7219] text-lg mb-3 flex items-center gap-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                <Building2 className="w-5 h-5" />
                Example Employers
              </h3>
              <div className="flex flex-wrap gap-2">
                {career.employers?.split(',').map((employer, i) => (
                  <Badge key={i} className="bg-[#ed7219]/10 text-[#ed7219] border-[#ed7219]/30">
                    {employer.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function CareerCard({ career, onClick, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card 
        className="cursor-pointer hover:shadow-lg hover:border-[#055b8e] transition-all group"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <h3 
            className="font-bold text-[#055b8e] text-lg group-hover:text-[#ed7219] transition-colors mb-2"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            {career.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {career.description}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {career.good_fit_for?.split(',').slice(0, 2).map((trait, i) => (
                <Badge key={i} variant="outline" className="text-xs bg-gray-50">
                  {trait.trim()}
                </Badge>
              ))}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-[#ed7219]" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function CareersInSTEM() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCareer, setSelectedCareer] = useState(null);

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedCategory]);

  const filteredCareers = careers.filter((career) => {
    const matchesCategory = selectedCategory === 'all' || career.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      career.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      career.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const currentCategory = categories.find(c => c.id === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#055b8e] to-[#044a73] text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4 text-[#ed7219]" />
            Discover your future
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold mb-4"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            Careers in STEM
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/80 max-w-2xl mx-auto"
          >
            Explore 100+ real-world STEM careers and discover how your curiosity can shape the future!
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="relative max-w-md mx-auto mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search careers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-6 rounded-xl text-lg border-gray-200"
          />
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="w-full flex-wrap h-auto gap-2 bg-transparent justify-center mb-8">
            {categories.map((cat) => (
              <TabsTrigger 
                key={cat.id}
                value={cat.id}
                className="rounded-full px-4 py-2 data-[state=active]:bg-[#055b8e] data-[state=active]:text-white border border-gray-200 data-[state=active]:border-[#055b8e]"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((cat) => (
            <TabsContent key={cat.id} value={cat.id}>
              {/* Category Header Image */}
              <div className="relative h-48 rounded-2xl overflow-hidden mb-8">
                <img 
                  src={categoryImages[cat.id]} 
                  alt={cat.label}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute inset-0 bg-gradient-to-r ${categoryTints[cat.id]} to-transparent`}></div>
                <div className="absolute bottom-6 left-6">
                  <h2 
                    className="text-3xl font-bold text-white"
                    style={{ fontFamily: 'Nunito, sans-serif' }}
                  >
                    {cat.label}
                  </h2>
                  <p className="text-white/80 mt-1">
                    {filteredCareers.length} careers available
                  </p>
                </div>
              </div>

              {filteredCareers.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl">
                  <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-500 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    No careers found
                  </h3>
                  <p className="text-gray-400">
                    Try adjusting your search
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCareers.map((career, index) => (
                    <CareerCard 
                      key={career.id} 
                      career={career} 
                      index={index}
                      onClick={() => setSelectedCareer(career)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Career Detail Modal */}
      {selectedCareer && (
        <CareerDetailModal 
          career={selectedCareer} 
          onClose={() => setSelectedCareer(null)} 
        />
      )}
    </div>
  );
}