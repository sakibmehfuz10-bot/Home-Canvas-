/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { motion } from 'motion/react';

const Spinner: React.FC = () => {
  return (
    <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
      {/* Outer rotating dashed ring */}
      <motion.svg
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
        className="absolute inset-0 w-full h-full text-zinc-200 dark:text-zinc-700"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="46"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="4 8"
        />
      </motion.svg>

      {/* Inner fast rotating gradient ring */}
      <motion.svg
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 100 100"
      >
        <defs>
          <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <circle
          cx="50"
          cy="50"
          r="42"
          stroke="url(#spinner-gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="60 200"
        />
      </motion.svg>

      {/* Center pulsing core */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1], 
          opacity: [0.7, 1, 0.7],
          boxShadow: [
            "0 0 10px rgba(139, 92, 246, 0.3)",
            "0 0 30px rgba(139, 92, 246, 0.8)",
            "0 0 10px rgba(139, 92, 246, 0.3)"
          ]
        }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 via-violet-500 to-pink-500"
      />
    </div>
  );
};

export default Spinner;