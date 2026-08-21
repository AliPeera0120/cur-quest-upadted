import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Users, Book, Mail, Send, Check, UserPlus, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MakeAnImpact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const CONTACT_EMAIL = 'curiosity.quest25@gmail.com';

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(formData.subject || `Message from ${formData.name}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSubmitted(false), 5000);
  };

  const impactAreas = [
    {
      icon: Book,
      title: 'Students & Families',
      description: 'Your support provides free STEM activities and learning resources to curious young minds, helping them discover their potential through hands-on exploration.'
    },
    {
      icon: Users,
      title: 'Local Communities',
      description: 'We partner with libraries and community centers to bring science education to underserved areas, ensuring every child has access to quality STEM programming.'
    },
    {
      icon: Heart,
      title: 'Future Innovators',
      description: 'By supporting CuriosityQuest, you\'re investing in the next generation of scientists, engineers, and problem-solvers who will shape tomorrow\'s world.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* Start a Chapter Section */}
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-[#055b8e] to-[#044a73] border-0 text-white overflow-hidden">
              <CardContent className="p-8 md:p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  Start Your Own CuriosityQuest Chapter
                </h2>
                <p className="text-white/90 text-lg mb-4 max-w-2xl mx-auto leading-relaxed">
                  Are you excited to make an impact in your own community? You can bring hands-on STEM education to kids in your area by starting a local CuriosityQuest chapter!
                </p>
                <p className="text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Whether you're a student, educator, or passionate community member, you have the power to spark curiosity and inspire the next generation of scientists and engineers right in your own neighborhood.
                </p>
                <Button
                  onClick={() => window.open('https://forms.gle/mfcEBdKKnDAXUS9EA', '_blank')}
                  size="lg"
                  className="bg-[#ed7219] hover:bg-[#d86515] text-white px-10 py-6 rounded-xl font-semibold text-lg"
                >
                  <UserPlus className="mr-2 w-5 h-5" />
                  Apply to Start a Chapter
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* Donation Section */}
        <section className="mb-16">
          <Card className="bg-gradient-to-br from-[#ed7219]/5 to-[#055b8e]/5 border-2">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-[#055b8e] mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Support Our Mission
              </h3>
              <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
                Your donation directly funds hands-on experiments, virtual learning resources, community events, and library partnerships that make STEM education accessible to all.
              </p>
              <Button
                onClick={() => window.open('https://hcb.hackclub.com/donations/start/curiosityquest', '_blank')}
                size="lg"
                className="bg-[#ed7219] hover:bg-[#d86515] text-white px-10 py-6 rounded-xl font-semibold text-lg"
              >
                <Heart className="mr-2 w-5 h-5" />
                Make a Donation
              </Button>
              <p className="text-sm text-gray-500 mt-4">
                All contributions support educational programming
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Who Benefits */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#055b8e] text-center mb-12" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Who Benefits From Your Support
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {impactAreas.map((area, index) => {
              const Icon = area.icon;
              return (
                <motion.div
                  key={area.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#055b8e] to-[#ed7219] flex items-center justify-center mb-4">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <CardTitle className="text-xl text-[#055b8e]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        {area.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 leading-relaxed">
                        {area.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Join Our Team Section */}
        <section>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-[#055b8e]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  <Mail className="inline-block mr-2 w-6 h-6" />
                  Contact Us
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 leading-relaxed">
                  Have questions about donations, volunteering, or partnerships? We'd love to hear from you!
                </p>
                <div className="bg-[#055b8e]/5 rounded-xl p-4">
                  <p className="font-semibold text-[#055b8e] mb-2">Email</p>
                  <a 
                    href="mailto:curiosity.quest25@gmail.com" 
                    className="text-[#ed7219] hover:underline"
                  >
                    curiosity.quest25@gmail.com
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Connect With Us Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-[#055b8e]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  <Send className="inline-block mr-2 w-6 h-6" />
                  Connect With Us
                </CardTitle>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-lg font-semibold text-green-600 mb-2">Opening your email app...</p>
                    <p className="text-gray-600">Hit send there and we'll get back to you soon.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Input
                        placeholder="Your Name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Input
                        type="email"
                        placeholder="Your Email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Textarea
                        placeholder="Your Message"
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        required
                        className="rounded-xl min-h-32"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-[#055b8e] hover:bg-[#044a73] rounded-xl py-6"
                    >
                      Send Message
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}