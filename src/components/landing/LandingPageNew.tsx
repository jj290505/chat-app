'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { MessageCircle, Zap, Users, Brain, Shield, Cloud, ArrowRight, Sparkles, CheckCircle, TrendingUp, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';

const HologramSphere = dynamic(() => import('./HologramSphere'), {
  ssr: false,
  loading: () => <div className="w-full h-96 bg-slate-800/50 rounded-3xl animate-pulse" />
});

interface LandingPageNewProps {
  user?: User | null;
}

export default function LandingPageNew({ user }: LandingPageNewProps) {
  const [scrollY, setScrollY] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl"></div>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full backdrop-blur-md bg-slate-900/60 border-b border-slate-700/30 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/">
            <motion.div
              className="flex items-center gap-3 cursor-pointer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Nexus AI</span>
            </motion.div>
          </Link>
          <div className="flex gap-4">
            <Link href="/auth">
              <Button variant="ghost" className="text-slate-300 hover:text-cyan-400 transition">Sign In</Button>
            </Link>
            <Link href="/auth">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/20">
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        className="max-w-7xl mx-auto px-6 pt-32 pb-20 relative"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div variants={fadeInUp} className="space-y-8">
            <div>
              <motion.div
                className="inline-block mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400 text-sm font-semibold">✨ The Future of AI Chat</span>
              </motion.div>
              <h1 className="text-6xl lg:text-7xl font-bold text-white leading-tight">
                Meet <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">Nexus AI</span>
              </h1>
              <p className="text-xl text-slate-400 mt-6 leading-relaxed">
                Experience next-generation AI conversations with persistent memory, real-time messaging, and seamless 1v1 contact communication. Your intelligent companion that learns, adapts, and serves your needs.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/chat">
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-6 text-lg shadow-lg shadow-cyan-500/20 w-full sm:w-auto">
                  Start Chatting Now <Sparkles className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button variant="outline" className="border-cyan-500/30 text-slate-300 hover:bg-slate-800/50 px-8 py-6 text-lg">
                Watch Demo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8">
              <div>
                <div className="text-3xl font-bold text-cyan-400">100%</div>
                <div className="text-sm text-slate-400">Real-Time</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-cyan-400">15+</div>
                <div className="text-sm text-slate-400">Knowledge Domains</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-cyan-400">24/7</div>
                <div className="text-sm text-slate-400">Available</div>
              </div>
            </div>
          </motion.div>

          {/* Interactive 3D Hologram */}
          <motion.div
            variants={fadeInUp}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 blur-3xl rounded-3xl"></div>
            <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl h-96">
              <HologramSphere />
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Core Services Section */}
      <motion.section
        className="max-w-7xl mx-auto px-6 py-20 relative"
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="text-center mb-16">
          <motion.h2 variants={fadeInUp} className="text-5xl font-bold text-white mb-4">
            Turning Your Ideas Into <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Real AI Success</span>
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-lg text-slate-400 max-w-2xl mx-auto">
            Comprehensive features designed for intelligent conversations and seamless communication
          </motion.p>
        </div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          {[
            {
              icon: Brain,
              title: 'Advanced AI Assistant',
              desc: 'Powered by llama-3.3-70b with expertise across 15+ domains',
              color: 'from-cyan-500/20 to-blue-600/20'
            },
            {
              icon: Cloud,
              title: 'Persistent Memory',
              desc: 'Auto-saves conversations to Supabase with auto-load on refresh',
              color: 'from-blue-500/20 to-purple-600/20'
            },
            {
              icon: Users,
              title: '1v1 Messaging',
              desc: 'Real-time contact messaging with Supabase subscriptions',
              color: 'from-purple-500/20 to-pink-600/20'
            },
            {
              icon: Zap,
              title: 'Lightning Fast',
              desc: 'Real-time streaming responses with ChatGPT-style formatting',
              color: 'from-cyan-500/20 to-blue-600/20'
            },
            {
              icon: Shield,
              title: 'Secure Auth',
              desc: 'Supabase Auth with Google OAuth and RLS policies',
              color: 'from-blue-500/20 to-purple-600/20'
            },
            {
              icon: Sparkles,
              title: 'Cultural Intelligence',
              desc: 'Global holidays and cultural events knowledge',
              color: 'from-purple-500/20 to-pink-600/20'
            }
          ].map((service, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10"
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${service.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <service.icon className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{service.title}</h3>
              <p className="text-slate-400">{service.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Tech Stack Section */}
      <motion.section
        className="max-w-7xl mx-auto px-6 py-20"
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="text-center mb-16">
          <motion.h2 variants={fadeInUp} className="text-5xl font-bold text-white mb-4">
            Cutting-Edge <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Technology Stack</span>
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-lg text-slate-400">
            Built with modern tools for reliability and performance
          </motion.p>
        </div>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          {[
            { name: 'Next.js 16.1', icon: '⚡' },
            { name: 'TypeScript', icon: '🔷' },
            { name: 'Groq API', icon: '🧠' },
            { name: 'Supabase', icon: '🔒' },
            { name: 'React 19', icon: '⚛️' },
            { name: 'Tailwind CSS', icon: '🎨' },
            { name: 'WebSockets', icon: '🔌' },
            { name: 'PostgreSQL', icon: '🗄️' },
          ].map((tech, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700/30 rounded-xl p-6 text-center hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all group cursor-pointer"
            >
              <div className="text-3xl mb-3 group-hover:scale-125 transition-transform">{tech.icon}</div>
              <h4 className="text-white font-semibold text-sm">{tech.name}</h4>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section
        className="max-w-7xl mx-auto px-6 py-20"
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="text-center mb-16">
          <motion.h2 variants={fadeInUp} className="text-5xl font-bold text-white mb-4">
            Why Choose <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Nexus AI</span>
          </motion.h2>
        </div>

        <motion.div
          className="grid md:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          {[
            { icon: CheckCircle, title: 'Always Available', desc: '24/7 access to your AI assistant, whenever you need support' },
            { icon: TrendingUp, title: 'Smart Learning', desc: 'AI improves with every conversation and remembers context' },
            { icon: Lock, title: 'Data Privacy', desc: 'Your conversations are secure with encrypted storage' }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-8 hover:border-cyan-500/50 transition-all"
            >
              <item.icon className="w-12 h-12 text-cyan-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-slate-400">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="max-w-7xl mx-auto px-6 py-20 mb-20"
        variants={fadeInUp}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 blur-2xl rounded-3xl"></div>
          <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-cyan-500/30 rounded-3xl p-16 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready for Intelligent Conversations?
            </h2>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              Start chatting with Nexus AI and experience the future of conversational AI
            </p>
            <Link href="/chat">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-10 py-6 text-lg shadow-lg shadow-cyan-500/30">
                Launch App Now <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-slate-700/30 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">Nexus AI</h3>
              <p className="text-slate-400 text-sm">Your intelligent AI companion with real-time messaging and persistent memory.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/chat" className="hover:text-cyan-400 transition">AI Chat</Link></li>
                <li><Link href="/chat" className="hover:text-cyan-400 transition">Contacts</Link></li>
                <li><Link href="/chat" className="hover:text-cyan-400 transition">Real-time</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-cyan-400 transition">About</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Blog</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-cyan-400 transition">Privacy</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700/30 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2026 Nexus AI. All rights reserved. | Built with ❤️ using Next.js & Groq</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
