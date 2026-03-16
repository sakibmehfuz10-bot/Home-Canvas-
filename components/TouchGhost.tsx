/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TouchGhostProps {
  imageUrl: string | null;
  position: { x: number; y: number } | null;
}

const TouchGhost: React.FC<TouchGhostProps> = ({ imageUrl, position }) => {
  return (
    <AnimatePresence>
      {imageUrl && position && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -50%)',
            width: '120px',
            height: '120px',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
          className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl shadow-2xl p-2 border border-zinc-200 dark:border-zinc-800"
        >
          <img
            src={imageUrl}
            alt="Dragging product"
            className="w-full h-full object-contain"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TouchGhost;
