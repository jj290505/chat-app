'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Zap, Users, Brain, Shield, Cloud, ArrowRight, Sparkles, Star, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { User as UserType } from '@supabase/supabase-js';

const HologramSphere = dynamic(() => import('./HologramSphere'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 z-0 bg-[#0F0A1F] flex items-center justify-center text-amber-500 font-mono animate-pulse text-xs tracking-[0.3em]">SYNCHRONIZING NEURAL CORE...</div>
});

export default function LandingPage({ user }: { user?: UserType | null }) {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: "easeOut" }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0A1F] text-slate-200 selection:bg-amber-500/30 overflow-x-hidden">
      {/* FIXED 3D BACKGROUND */}
      <div className="fixed inset-0 z-0 lg:pointer-events-auto">
        <HologramSphere />
      </div>

      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 bg-transparent py-8">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <span className="text-3xl font-black tracking-tighter text-white">
              NEXUS
            </span>
          </motion.div>

          <div className="flex items-center gap-1 bg-white/5 backdrop-blur-md rounded-full px-4 md:px-6 py-2 border border-white/10">
            {['AI Agent', 'Services', 'Tech', 'Industries', 'Company'].map((item) => (
              <Button key={item} variant="ghost" className="text-slate-400 hover:text-white text-[10px] md:text-xs font-bold px-3 md:px-4 h-8 rounded-full">
                {item}
              </Button>
            ))}
          </div>

          <div className="flex gap-4 items-center">
            {user ? (
              <Link href="/chat">
                <div className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all group">
                  <User className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                </div>
              </Link>
            ) : null}
          </div>
        </div>
      </nav>

      {/* Hero Section - Bottom Focused */}
      <section className="relative min-h-[100vh] flex flex-col justify-end pb-48 px-6 z-10">
        <div className="max-w-7xl mx-auto text-center space-y-12">
          <motion.div
            initial="initial"
            animate="animate"
            variants={stagger}
            className="space-y-16"
          >
            <div className="space-y-6">
              <motion.p variants={fadeIn} className="text-3xl text-slate-400 max-w-3xl mx-auto font-medium tracking-wide">
                Beyond Intelligence. Pure Neural Synergies.
              </motion.p>
            </div>

            <motion.div variants={fadeIn} className="pt-8">
              <Link href={user ? "/chat" : "/auth"}>
                <Button className="w-24 h-24 rounded-full bg-white/5 hover:bg-white/10 text-white backdrop-blur-xl border border-white/20 shadow-2xl transition-all flex items-center justify-center p-0 mx-auto group">
                  <ArrowRight className="w-10 h-10 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white/[0.02] border-y border-white/5 py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
              Precision Crafted <span className="text-indigo-500">Intelligence</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              We've rebuilt the chat experience from the ground up for power users.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {[
              {
                icon: <Brain className="w-6 h-6 text-amber-500" />,
                title: "Deep Memory",
                desc: "Powered by llama-3.3-70b-versatile. Remembers your preferences and past conversations effortlessly."
              },
              {
                icon: <Cloud className="w-6 h-6 text-indigo-400" />,
                title: "Cloud Sync",
                desc: "Integrated with Supabase for bulletproof data persistence. Access your chats on any device instantly."
              },
              {
                icon: <Users className="w-6 h-6 text-purple-400" />,
                title: "1v1 Messaging",
                desc: "Real-time communication with your contacts. Switch between AI and Human chats in one click."
              },
              {
                icon: <Zap className="w-6 h-6 text-blue-400" />,
                title: "Flash Stream",
                desc: "Experience zero-latency streaming. See the AI's thought process as it happens, not after."
              },
              {
                icon: <Shield className="w-6 h-6 text-green-400" />,
                title: "Steel Privacy",
                desc: "Enterprise-grade protection with Row Level Security. Your data belongs to you, and only you."
              },
              {
                icon: <Sparkles className="w-6 h-6 text-pink-400" />,
                title: "Context Aware",
                desc: "Culturally intelligent AI with deep knowledge of global holidays, business, and tech domains."
              }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all cursor-default"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-[40px] bg-indigo-600 p-24 overflow-hidden text-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-800 opacity-50" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />

          <div className="relative space-y-8 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-7xl font-black text-white leading-tight">
              Ready to Upgrade Your <span className="text-amber-400">Conversations?</span>
            </h2>
            <p className="text-xl text-indigo-100 font-medium opacity-90">
              Join the thousands who are already chatting with the next generation of AI.
            </p>
            <div className="flex flex-wrap justify-center gap-6 pt-4">
              <Link href={user ? "/chat" : "/auth"}>
                <Button className="bg-white text-indigo-600 hover:bg-indigo-50 px-12 py-8 text-xl font-black rounded-2xl shadow-2xl transition-all">
                  {user ? "Continue to Chat" : "Get Started Now"}
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0A0714] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-black text-white tracking-tighter">NEXUS AI</span>
              </div>
              <p className="text-slate-500 max-w-sm mb-6">
                The next generation of intelligent communication. Built for creators, developers, and thinkers.
              </p>
              <div className="flex gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer" />
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Product</h4>
              <ul className="space-y-4 text-slate-500 font-medium">
                <li><a href="#" className="hover:text-indigo-400 transition">Features</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">Integrations</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">Pricing</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Resources</h4>
              <ul className="space-y-4 text-slate-500 font-medium">
                <li><a href="#" className="hover:text-indigo-400 transition">Documentation</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">Help Center</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">Community</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">API Reference</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex justify-between items-center gap-4 text-slate-600 text-sm">
            <p>&copy; 2026 Nexus AI. Crafting the future of chat.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition">Privacy Policy</a>
              <a href="#" className="hover:text-white transition">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
