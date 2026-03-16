/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1616137422495-1e9e46e2aa77?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1616046229478-9901c5536a45?q=80&w=2000&auto=format&fit=crop"
];

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full max-w-7xl mx-auto rounded-3xl overflow-hidden shadow-2xl mb-12 flex flex-col md:flex-row bg-zinc-950 text-white min-h-[400px] md:min-h-[500px] relative"
    >
      {/* Theme Toggle Button */}
      <div className="absolute top-6 left-6 z-20">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-zinc-300 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </motion.button>
      </div>

      {/* Left Side: Centered Text */}
      <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center items-center text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-4 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-semibold tracking-widest uppercase text-zinc-300"
        >
          AI-Powered Design
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, type: "spring", stiffness: 100 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500"
        >
          Home Canvas
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-lg text-zinc-400 max-w-md leading-relaxed"
        >
          Upload a product and a scene. Drag your item to the perfect spot, and let Gemini create a photorealistic composite instantly.
        </motion.p>
      </div>

      {/* Right Side: Background Image Slider */}
      <div className="w-full md:w-1/2 relative min-h-[300px] md:min-h-full overflow-hidden">
        {/* Gradient overlays for smooth blending */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/20 to-transparent z-10 hidden md:block w-32" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent z-10 md:hidden h-32 top-auto" />
        
        <AnimatePresence mode="wait">
          <motion.img 
            key={currentImageIndex}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            src={HERO_IMAGES[currentImageIndex]} 
            alt={`Interior Design ${currentImageIndex + 1}`} 
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>

        {/* Slider Indicators */}
        <div className="absolute bottom-6 right-6 z-20 flex gap-2">
          {HERO_IMAGES.map((_, index) => (
            <div 
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === currentImageIndex ? 'bg-white w-4' : 'bg-white/30'}`}
            />
          ))}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
