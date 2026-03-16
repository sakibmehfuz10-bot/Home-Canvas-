/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Product } from '../types';
import { motion } from 'motion/react';

interface ObjectCardProps {
    product: Product;
    isSelected: boolean;
    onClick?: () => void;
}

const ObjectCard: React.FC<ObjectCardProps> = ({ product, isSelected, onClick }) => {
    const cardClasses = `
        bg-white dark:bg-zinc-900 rounded-lg shadow-md overflow-hidden
        ${onClick ? 'cursor-pointer' : ''}
        ${isSelected ? 'border-2 border-blue-500 shadow-xl' : 'border border-zinc-200 dark:border-zinc-800'}
    `;

    return (
        <motion.div 
            className={cardClasses} 
            onClick={onClick}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, scale: isSelected ? 1.05 : 1 }}
            whileHover={onClick ? { scale: 1.05, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" } : undefined}
            whileTap={onClick ? { scale: 0.98 } : undefined}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            <div className="aspect-square w-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
            </div>
            <div className="p-3 text-center">
                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 truncate">{product.name}</h4>
            </div>
        </motion.div>
    );
};

export default ObjectCard;