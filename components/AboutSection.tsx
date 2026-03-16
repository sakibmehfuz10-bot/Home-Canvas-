/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { motion } from 'motion/react';

const AboutSection: React.FC = () => {
  const steps = [
    {
      title: "1. Upload Your Product",
      description: "Start by uploading a high-quality image of the item you want to visualize. For best results, use a clear photo with a solid or transparent background.",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop",
      color: "bg-blue-500"
    },
    {
      title: "2. Choose a Scene",
      description: "Upload a photo of the room or environment where the product will live. Our AI analyzes the lighting, shadows, and perspective of this scene.",
      image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop",
      color: "bg-emerald-500"
    },
    {
      title: "3. Precision Placement",
      description: "Drag and drop your product onto the exact spot in the scene. You can also use the 3D Preview to inspect your product from every angle before placement.",
      image: "https://images.unsplash.com/photo-1581404917879-53e19259fdda?q=80&w=800&auto=format&fit=crop",
      color: "bg-violet-500"
    },
    {
      title: "4. AI Magic",
      description: "Gemini 1.5 Flash takes over, seamlessly blending your product into the scene. It generates realistic shadows, reflections, and lighting adjustments.",
      image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop",
      color: "bg-pink-500"
    }
  ];

  return (
    <section className="w-full max-w-7xl mx-auto mt-24 px-4 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-sm font-bold tracking-widest uppercase text-blue-600 dark:text-blue-400 mb-4">About Home Canvas</h2>
          <h3 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white mb-6 leading-tight">
            Revolutionizing Space <br /> Visualization with AI.
          </h3>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed mb-8">
            Home Canvas is an advanced AI-powered platform designed for interior designers, e-commerce brands, and homeowners. 
            By leveraging Google's Gemini 1.5 Flash model, we bridge the gap between imagination and reality, 
            allowing you to see any product in any environment with photorealistic accuracy.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
              <span className="block text-2xl font-bold text-zinc-900 dark:text-white mb-1">Gemini 1.5</span>
              <span className="text-sm text-zinc-500">State-of-the-art AI core</span>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
              <span className="block text-2xl font-bold text-zinc-900 dark:text-white mb-1">Real-time</span>
              <span className="text-sm text-zinc-500">Instant scene composition</span>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200&auto=format&fit=crop" 
              alt="Beautiful Interior" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-blue-600 rounded-3xl -z-10 hidden md:block"></div>
          <div className="absolute -top-6 -left-6 w-32 h-32 border-4 border-zinc-200 dark:border-zinc-800 rounded-3xl -z-10 hidden md:block"></div>
        </motion.div>
      </div>

      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mb-4">How It Works</h2>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
          Four simple steps to transform your space. Our intuitive interface makes professional-grade visualization accessible to everyone.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group"
          >
            <div className="relative mb-6 aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
              <img 
                src={step.image} 
                alt={step.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className={`absolute top-4 left-4 ${step.color} text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg`}>
                Step {index + 1}
              </div>
            </div>
            <h4 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{step.title}</h4>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-24 p-12 rounded-[3rem] bg-zinc-950 text-white text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
        </div>
        <h3 className="text-3xl md:text-4xl font-black mb-6 relative z-10">Ready to visualize your dream home?</h3>
        <p className="text-zinc-400 max-w-xl mx-auto mb-10 relative z-10">
          Stop guessing and start seeing. Join thousands of users who are making better design decisions with Home Canvas.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="bg-white text-zinc-950 font-bold py-4 px-10 rounded-2xl shadow-xl hover:bg-zinc-100 transition-colors relative z-10"
        >
          Start Designing Now
        </motion.button>
      </motion.div>

      <div className="mt-12 text-center">
        <p className="text-zinc-500 dark:text-zinc-500 text-sm font-medium">
          Created with ❤️ by <span className="text-zinc-900 dark:text-zinc-300 font-bold">Md Sakib Mehfuz</span>
        </p>
      </div>
    </section>
  );
};

export default AboutSection;
