import React, { useState, useEffect } from 'react';
import experiments from '@/data/experiments.json';
import virtualActivities from '@/data/virtualActivities.json';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, FlaskConical, Code, Atom, Leaf, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';
import ExperimentCard from '../components/activities/ExperimentCard';
import ExperimentDetail from '../components/activities/ExperimentDetail';
import VirtualActivityCard from '../components/activities/VirtualActivityCard';
import VirtualActivityDetail from '../components/activities/VirtualActivityDetail';

const topics = [
  { id: 'all', label: 'All Topics', icon: FlaskConical },
  { id: 'physics', label: 'Physics', icon: Atom },
  { id: 'biology', label: 'Biology', icon: Leaf },
  { id: 'chemistry', label: 'Chemistry', icon: FlaskConical },
  { id: 'engineering', label: 'Engineering', icon: Wrench },
];

const activityTypes = [
  { id: 'all', label: 'All' },
  { id: 'Lesson', label: 'Lessons' },
  { id: 'Program', label: 'Programs' },
  { id: 'Project', label: 'Projects' },
];

const codeCourses = [
  { id: 'python', label: 'Python', language: 'Python', color: 'bg-[#3776AB]', available: true },
  { id: 'java', label: 'Java', language: 'Java', color: 'bg-[#ED8B00]', available: true },
  { id: 'html-css', label: 'HTML/CSS', language: 'HTML/CSS', color: 'bg-[#E34F26]', available: true },
];
const courseLanguage = (id) => codeCourses.find((c) => c.id === id)?.language;

export default function Activities() {
  const [mainTab, setMainTab] = useState('hands-on');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedActivityType, setSelectedActivityType] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('python');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [mainTab]);

  // Deduplicate experiments by title
  const uniqueExperiments = experiments.filter((exp, index, self) =>
    index === self.findIndex((e) => e.title === exp.title)
  );

  // Deduplicate virtual activities by title
  const uniqueVirtualActivities = virtualActivities.filter((act, index, self) =>
    index === self.findIndex((a) => a.title === act.title)
  );

  const filteredExperiments = uniqueExperiments.filter((exp) => {
    const matchesTopic = selectedTopic === 'all' || exp.topic === selectedTopic;
    const matchesSearch = !searchQuery || 
      exp.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.what_you_learn?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTopic && matchesSearch;
  });

  const filteredVirtualActivities = uniqueVirtualActivities.filter((act) => {
    const matchesCourse = act.language === courseLanguage(selectedCourse);
    const matchesType = selectedActivityType === 'all' || act.activity_type === selectedActivityType;
    const matchesSearch = !searchQuery ||
      act.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesType && matchesSearch;
  });

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
            className="text-xl text-white/80 max-w-2xl mx-auto"
          >
            Explore hands-on experiments and coding activities designed for curious minds
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="mb-8">
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 h-14 bg-white shadow-sm rounded-xl p-1">
            <TabsTrigger 
              value="hands-on" 
              className="rounded-lg data-[state=active]:bg-[#055b8e] data-[state=active]:text-white text-lg font-medium"
            >
              <FlaskConical className="w-5 h-5 mr-2" />
              Hands-On
            </TabsTrigger>
            <TabsTrigger 
              value="code" 
              className="rounded-lg data-[state=active]:bg-[#055b8e] data-[state=active]:text-white text-lg font-medium"
            >
              <Code className="w-5 h-5 mr-2" />
              Code
            </TabsTrigger>
          </TabsList>

          {/* Search Bar */}
          <div className="relative max-w-md mx-auto mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 rounded-xl text-lg border-gray-200"
            />
          </div>

          {/* Hands-On Experiments */}
          <TabsContent value="hands-on" className="mt-8">
            {/* Topic Filters */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {topics.map((topic) => {
                const Icon = topic.icon;
                return (
                  <Button
                    key={topic.id}
                    variant={selectedTopic === topic.id ? 'default' : 'outline'}
                    onClick={() => setSelectedTopic(topic.id)}
                    className={`rounded-full ${
                      selectedTopic === topic.id 
                        ? 'bg-[#055b8e] hover:bg-[#044a73]' 
                        : 'hover:bg-[#055b8e]/10 hover:text-[#055b8e] hover:border-[#055b8e]'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {topic.label}
                  </Button>
                );
              })}
            </div>

            {filteredExperiments.length === 0 ? (
              <div className="text-center py-20">
                <FlaskConical className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-500 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  No experiments found
                </h3>
                <p className="text-gray-400">
                  Try adjusting your filters or search terms
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExperiments.map((experiment, index) => (
                  <ExperimentCard
                    key={experiment.id}
                    experiment={experiment}
                    index={index}
                    onClick={() => setSelectedExperiment(experiment)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Code Activities */}
          <TabsContent value="code" className="mt-8">
            {/* Course Selection */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {codeCourses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => course.available && setSelectedCourse(course.id)}
                  disabled={!course.available}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                    selectedCourse === course.id
                      ? `${course.color} text-white shadow-lg`
                      : course.available
                        ? 'bg-white border-2 border-gray-200 hover:border-gray-400'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span>{course.label}</span>
                  {!course.available && (
                    <Badge variant="outline" className="ml-2 text-xs">Coming Soon</Badge>
                  )}
                </button>
              ))}
            </div>

            {(
              <>
                {/* Type Filters */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 text-center">Activity Type</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {activityTypes.map((type) => (
                      <Button
                        key={type.id}
                        variant={selectedActivityType === type.id ? 'default' : 'outline'}
                        onClick={() => setSelectedActivityType(type.id)}
                        className={`rounded-full ${
                          selectedActivityType === type.id 
                            ? 'bg-[#055b8e] hover:bg-[#044a73]' 
                            : 'hover:bg-[#055b8e]/10 hover:text-[#055b8e] hover:border-[#055b8e]'
                        }`}
                      >
                        {type.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {filteredVirtualActivities.length === 0 ? (
                  <div className="text-center py-20">
                    <Code className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-500 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      No activities found
                    </h3>
                    <p className="text-gray-400">
                      Try adjusting your filters or search terms
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVirtualActivities.map((activity, index) => (
                      <VirtualActivityCard
                        key={activity.id}
                        activity={activity}
                        index={index}
                        onClick={() => setSelectedActivity(activity)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Modals */}
      {selectedExperiment && (
        <ExperimentDetail
          experiment={selectedExperiment}
          onClose={() => setSelectedExperiment(null)}
        />
      )}
      {selectedActivity && (
        <VirtualActivityDetail
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      )}
    </div>
  );
}