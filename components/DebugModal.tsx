/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  prompt: string | null;
}

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const DebugModal: React.FC<DebugModalProps> = ({ isOpen, onClose, imageUrl, prompt }) => {
  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <AnimatePresence>
      {isOpen && imageUrl && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
          aria-modal="true"
          role="dialog"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-4xl p-6 md:p-8 relative transform flex flex-col border border-zinc-200 dark:border-zinc-800"
            style={{ maxHeight: '90vh' }}
            onClick={handleModalContentClick}
            role="document"
          >
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors z-10 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 p-2 rounded-full"
              aria-label="Close modal"
            >
              <CloseIcon />
            </motion.button>
            <div className="text-center mb-6 flex-shrink-0">
              <h2 className="text-2xl font-extrabold text-zinc-800 dark:text-zinc-100">Debug View</h2>
            </div>
            
            <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
              <div>
                <p className="text-zinc-600 dark:text-zinc-400 mb-3 font-medium">This is the image sent to the AI, with a red marker indicating the placement.</p>
                <div className="rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-inner">
                    <img src={imageUrl} alt="Debug view of marked scene" className="w-full h-full object-contain max-h-[50vh]" />
                </div>
              </div>
              
              {prompt && (
                <div>
                    <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
                      Final Prompt to Image Model
                    </h3>
                    <pre className="bg-zinc-900 dark:bg-black text-zinc-300 p-5 rounded-xl text-sm whitespace-pre-wrap font-mono shadow-inner overflow-x-auto border border-zinc-800">
                        <code>{prompt}</code>
                    </pre>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DebugModal;
