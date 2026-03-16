/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useCallback, useRef, useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageUploaderProps {
  id: string;
  label?: string;
  onFileSelect: (file: File) => void;
  imageUrl: string | null;
  onRemove?: () => void;
  isDropZone?: boolean;
  onProductDrop?: (position: {x: number, y: number}, relativePosition: { xPercent: number; yPercent: number; }) => void;
  persistedOrbPosition?: { x: number; y: number } | null;
  showDebugButton?: boolean;
  onDebugClick?: () => void;
  isTouchHovering?: boolean;
  touchOrbPosition?: { x: number; y: number } | null;
}

const UploadIcon: React.FC = () => (
    <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-all duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-400 group-hover:text-blue-500 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
    </div>
);

const WarningIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);

const GridIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 10h16M4 14h16M10 4v16M14 4v16" />
    </svg>
);

const XIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);


const ImageUploader = forwardRef<HTMLImageElement, ImageUploaderProps>(({ id, label, onFileSelect, imageUrl, onRemove, isDropZone = false, onProductDrop, persistedOrbPosition, showDebugButton, onDebugClick, isTouchHovering = false, touchOrbPosition = null }, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [orbPosition, setOrbPosition] = useState<{x: number, y: number} | null>(null);
  const [fileTypeError, setFileTypeError] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);

  // Expose the internal imgRef to the parent component via the forwarded ref
  useImperativeHandle(ref, () => imgRef.current as HTMLImageElement);
  
  useEffect(() => {
    if (!imageUrl) {
      setFileTypeError(null);
    }
  }, [imageUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setFileTypeError('For best results, please use PNG, JPG, or JPEG formats.');
      } else {
        setFileTypeError(null);
      }
      onFileSelect(file);
    }
  };
  
  // A shared handler for both click and drop placements.
  const handlePlacement = useCallback((clientX: number, clientY: number, currentTarget: HTMLDivElement) => {
    const img = imgRef.current;
    if (!img || !onProductDrop) return;

    const containerRect = currentTarget.getBoundingClientRect();
    const { naturalWidth, naturalHeight } = img;
    const { width: containerWidth, height: containerHeight } = containerRect;

    // Calculate the rendered image's dimensions inside the container (due to object-contain)
    const imageAspectRatio = naturalWidth / naturalHeight;
    const containerAspectRatio = containerWidth / containerHeight;

    let renderedWidth, renderedHeight;
    if (imageAspectRatio > containerAspectRatio) {
      renderedWidth = containerWidth;
      renderedHeight = containerWidth / imageAspectRatio;
    } else {
      renderedHeight = containerHeight;
      renderedWidth = containerHeight * imageAspectRatio;
    }
    
    const offsetX = (containerWidth - renderedWidth) / 2;
    const offsetY = (containerHeight - renderedHeight) / 2;

    const pointX = clientX - containerRect.left;
    const pointY = clientY - containerRect.top;

    const imageX = pointX - offsetX;
    const imageY = pointY - offsetY;

    // Check if the action was outside the image area (in the padding)
    if (imageX < 0 || imageX > renderedWidth || imageY < 0 || imageY > renderedHeight) {
      console.warn("Action was outside the image boundaries.");
      return;
    }

    const xPercent = (imageX / renderedWidth) * 100;
    const yPercent = (imageY / renderedHeight) * 100;

    onProductDrop({ x: pointX, y: pointY }, { xPercent, yPercent });
  }, [onProductDrop]);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDropZone && onProductDrop) {
      // If it's a drop zone, a click should place the product.
      handlePlacement(event.clientX, event.clientY, event.currentTarget);
    } else {
      // Otherwise, it's an uploader, so open the file dialog.
      inputRef.current?.click();
    }
  };
  
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDraggingOver(true);
      if (isDropZone && onProductDrop) {
          const rect = event.currentTarget.getBoundingClientRect();
          setOrbPosition({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top
          });
      }
  }, [isDropZone, onProductDrop]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDraggingOver(false);
      setOrbPosition(null);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDraggingOver(false);
      setOrbPosition(null);

      if (isDropZone && onProductDrop) {
          // Case 1: A product is being dropped onto the scene
          handlePlacement(event.clientX, event.clientY, event.currentTarget);
      } else {
          // Case 2: A file is being dropped to be uploaded
          const file = event.dataTransfer.files?.[0];
          if (file && file.type.startsWith('image/')) {
              const allowedTypes = ['image/jpeg', 'image/png'];
              if (!allowedTypes.includes(file.type)) {
                  setFileTypeError('For best results, please use PNG, JPG, or JPEG formats.');
              } else {
                  setFileTypeError(null);
              }
              onFileSelect(file);
          }
      }
  }, [isDropZone, onProductDrop, onFileSelect, handlePlacement]);
  
  const showHoverState = isDraggingOver || isTouchHovering;
  const currentOrbPosition = orbPosition || touchOrbPosition;
  const isActionable = isDropZone || !imageUrl;

  const uploaderClasses = `w-full aspect-video bg-zinc-50 dark:bg-zinc-900/50 border-2 border-dashed rounded-3xl flex items-center justify-center transition-all duration-500 relative overflow-hidden group ${
      showHoverState ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
    : isDropZone ? 'border-zinc-200 dark:border-zinc-800 cursor-crosshair hover:border-zinc-300 dark:hover:border-zinc-700'
    : 'border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer hover:bg-white dark:hover:bg-zinc-900 shadow-sm hover:shadow-md'
  } ${!isActionable ? 'cursor-default' : ''}`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center w-full"
    >
      {label && <h3 className="text-xl font-semibold mb-4 text-zinc-700 dark:text-zinc-300">{label}</h3>}
      <motion.div
        whileHover={isActionable && !isDropZone ? { scale: 1.02 } : undefined}
        whileTap={isActionable && !isDropZone ? { scale: 0.98 } : undefined}
        className={uploaderClasses}
        onClick={isActionable ? handleClick : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-dropzone-id={id}
      >
        <input
          type="file"
          id={id}
          ref={inputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg"
          className="hidden"
        />
        <AnimatePresence mode="wait">
          {!imageUrl && (
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            </div>
          )}
          {imageUrl ? (
            <motion.div 
              key="image"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full relative"
            >
              <img 
                ref={imgRef}
                src={imageUrl} 
                alt={label || 'Uploaded Scene'} 
                className="w-full h-full object-contain" 
              />
              {showGrid && (
                  <div 
                      className="absolute inset-0 pointer-events-none z-10"
                      style={{
                          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)',
                          backgroundSize: '10% 10%',
                          filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.8))'
                      }}
                  ></div>
              )}
              {isDropZone && (
                  <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                          e.stopPropagation();
                          setShowGrid(!showGrid);
                      }}
                      className={`absolute top-2 right-2 flex items-center text-xs font-semibold px-3 py-1.5 rounded-md transition-all z-20 shadow-lg ${showGrid ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-black bg-opacity-60 text-white hover:bg-opacity-80'}`}
                      aria-label={showGrid ? "Hide grid" : "Show grid"}
                  >
                      <GridIcon />
                      {showGrid ? "Hide Grid" : "Show Grid"}
                  </motion.button>
              )}
              {onRemove && (
                  <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.1, backgroundColor: '#ef4444' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                          e.stopPropagation();
                          onRemove();
                      }}
                      className="absolute top-2 left-2 p-2 bg-black/40 backdrop-blur-md text-white rounded-full transition-colors z-20 shadow-lg border border-white/10"
                      aria-label="Remove image"
                  >
                      <XIcon />
                  </motion.button>
              )}
              <div 
                  className="drop-orb" 
                  style={{ 
                      left: currentOrbPosition ? currentOrbPosition.x : -9999, 
                      top: currentOrbPosition ? currentOrbPosition.y : -9999 
                  }}
              ></div>
              {persistedOrbPosition && (
                  <div 
                      className="drop-orb" 
                      style={{ 
                          left: persistedOrbPosition.x, 
                          top: persistedOrbPosition.y,
                          opacity: 1,
                          transform: 'translate(-50%, -50%) scale(1)',
                          transition: 'none', // Appear instantly without animation
                      }}
                  ></div>
              )}
              {showDebugButton && onDebugClick && (
                  <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                          e.stopPropagation();
                          onDebugClick();
                      }}
                      className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-opacity-80 transition-all z-20 shadow-lg"
                      aria-label="Show debug view"
                  >
                      Debug
                  </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="placeholder"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="text-center p-8 flex flex-col items-center relative z-10"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              >
                <UploadIcon />
              </motion.div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
                  {id === 'product-uploader' ? 'Upload Product' : 'Upload Scene'}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Drag & drop or click to browse
                </p>
              </div>
              <div className="mt-6 flex gap-2">
                <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">PNG</span>
                <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">JPG</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <AnimatePresence>
        {fileTypeError && (
          <motion.div 
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="w-full mt-2 text-sm text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 flex items-center overflow-hidden" 
            role="alert"
          >
              <WarningIcon />
              <span>{fileTypeError}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default ImageUploader;
