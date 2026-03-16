/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Product } from '../types';
import ObjectCard from './ObjectCard';
import { motion, AnimatePresence } from 'motion/react';

interface ProductSelectorProps {
    products: Product[];
    onSelect: (product: Product) => void;
    onAddOwnProductClick: () => void;
}

const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const ProductSelector: React.FC<ProductSelectorProps> = ({ products, onSelect, onAddOwnProductClick }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScrollButtons = useCallback(() => {
        const el = scrollContainerRef.current;
        if (el) {
            const atStart = el.scrollLeft < 10;
            const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10;
            setCanScrollLeft(!atStart);
            setCanScrollRight(!atEnd);
        }
    }, []);
    
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        // Initial check
        checkScrollButtons();
        
        // Handle case where items don't fill the container
        if (el.scrollWidth <= el.clientWidth) {
            setCanScrollRight(false);
        }

        el.addEventListener('scroll', checkScrollButtons);
        window.addEventListener('resize', checkScrollButtons);
        return () => {
            el.removeEventListener('scroll', checkScrollButtons);
            window.removeEventListener('resize', checkScrollButtons);
        };
    }, [products, checkScrollButtons]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-6xl mx-auto text-center"
        >
            <div className="relative flex items-center">
                <AnimatePresence>
                    {canScrollLeft && (
                        <motion.button 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => scroll('left')}
                            className="absolute -left-4 z-10 p-2 bg-white dark:bg-zinc-800 rounded-full shadow-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-zinc-800 dark:text-zinc-200"
                            aria-label="Scroll left"
                        >
                            <ArrowLeftIcon />
                        </motion.button>
                    )}
                </AnimatePresence>
                <div
                    ref={scrollContainerRef}
                    className="flex space-x-6 overflow-x-auto snap-x snap-mandatory py-4 scrollbar-hide"
                >
                    {products.map((product, index) => (
                         <motion.div 
                            key={product.id} 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.4 }}
                            className="snap-center shrink-0 w-52 md:w-64"
                         >
                            <ObjectCard
                                product={product}
                                isSelected={false}
                                onClick={() => onSelect(product)}
                            />
                        </motion.div>
                    ))}
                </div>
                <AnimatePresence>
                    {canScrollRight && (
                        <motion.button 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => scroll('right')}
                            className="absolute -right-4 z-10 p-2 bg-white dark:bg-zinc-800 rounded-full shadow-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-zinc-800 dark:text-zinc-200"
                            aria-label="Scroll right"
                        >
                            <ArrowRightIcon />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mt-8"
            >
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onAddOwnProductClick}
                    className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold py-2 px-6 rounded-lg text-md transition-colors border border-zinc-300 dark:border-zinc-700 shadow-sm"
                >
                    Add Your Own Product!
                </motion.button>
            </motion.div>
        </motion.div>
    );
};

export default ProductSelector;
