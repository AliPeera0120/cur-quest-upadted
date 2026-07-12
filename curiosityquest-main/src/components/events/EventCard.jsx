import React from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Library, School, Building2, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';

const typeConfig = {
  library: { icon: Library, label: 'Library', color: 'bg-blue-100 text-blue-700' },
  school: { icon: School, label: 'School', color: 'bg-green-100 text-green-700' },
  community_center: { icon: Building2, label: 'Community Center', color: 'bg-purple-100 text-purple-700' },
  virtual: { icon: Monitor, label: 'Virtual', color: 'bg-orange-100 text-orange-700' },
};

export default function EventCard({ event, isPast = false, index = 0 }) {
  const config = typeConfig[event.type] || typeConfig.community_center;
  const Icon = config.icon;
  const eventDate = event.date ? new Date(event.date) : new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all ${isPast ? 'opacity-80' : ''}`}
    >
      <div className="flex flex-col md:flex-row">
        {/* Date Block */}
        <div className={`p-6 flex flex-col items-center justify-center md:w-32 ${isPast ? 'bg-gray-100' : 'bg-[#055b8e]'}`}>
          <span className={`text-sm font-medium ${isPast ? 'text-gray-500' : 'text-white/80'}`}>
            {format(eventDate, 'MMM')}
          </span>
          <span className={`text-4xl font-bold ${isPast ? 'text-gray-700' : 'text-white'}`} style={{ fontFamily: 'Nunito, sans-serif' }}>
            {format(eventDate, 'd')}
          </span>
          <span className={`text-sm ${isPast ? 'text-gray-500' : 'text-white/80'}`}>
            {format(eventDate, 'yyyy')}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge className={config.color}>
              <Icon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
            {isPast && (
              <Badge variant="outline" className="text-gray-500">
                Past Event
              </Badge>
            )}
          </div>

          <h3 
            className="font-bold text-[#055b8e] text-xl mb-2"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            {event.title}
          </h3>

          <p className="text-gray-600 mb-4 line-clamp-2">
            {isPast && event.highlights ? event.highlights : event.description}
          </p>

          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            {event.time && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {event.time}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {event.location}
            </span>
          </div>
        </div>

        {/* Image if available */}
        {event.image_url && (
          <div className="md:w-48 h-40 md:h-auto">
            <img 
              src={event.image_url} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}