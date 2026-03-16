/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateCompositeImage } from './services/geminiService';
import { Product } from './types';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ObjectCard from './components/ObjectCard';
import Spinner from './components/Spinner';
import DebugModal from './components/DebugModal';
import TouchGhost from './components/TouchGhost';
import Product3DPreview from './components/Product3DPreview';
import AboutSection from './components/AboutSection';
import { motion, AnimatePresence } from 'motion/react';

// Pre-load a transparent image to use for hiding the default drag ghost.
// This prevents a race condition on the first drag.
const transparentDragImage = new Image();
transparentDragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// Helper to convert a data URL string to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

const loadingMessages = [
    "Analyzing your product...",
    "Surveying the scene...",
    "Describing placement location with AI...",
    "Crafting the perfect composition prompt...",
    "Generating photorealistic options...",
    "Assembling the final scene..."
];


interface HistoryState {
  sceneImage: File;
  debugImageUrl: string | null;
  debugPrompt: string | null;
}

const App: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [sceneImage, setSceneImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [persistedOrbPosition, setPersistedOrbPosition] = useState<{x: number, y: number} | null>(null);
  const [debugImageUrl, setDebugImageUrl] = useState<string | null>(null);
  const [debugPrompt, setDebugPrompt] = useState<string | null>(null);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);

  const [is3DMode, setIs3DMode] = useState(false);

  // History state for Undo/Redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);

  // State for touch drag & drop
  const [isTouchDragging, setIsTouchDragging] = useState<boolean>(false);
  const [touchGhostPosition, setTouchGhostPosition] = useState<{x: number, y: number} | null>(null);
  const [isHoveringDropZone, setIsHoveringDropZone] = useState<boolean>(false);
  const [touchOrbPosition, setTouchOrbPosition] = useState<{x: number, y: number} | null>(null);
  const sceneImgRef = useRef<HTMLImageElement>(null);
  
  const sceneImageUrl = sceneImage ? URL.createObjectURL(sceneImage) : null;
  const productImageUrl = selectedProduct ? selectedProduct.imageUrl : null;

  const handleProductImageUpload = useCallback((file: File) => {
    // useEffect will handle cleaning up the previous blob URL
    setError(null);
    try {
        const imageUrl = URL.createObjectURL(file);
        const product: Product = {
            id: Date.now(),
            name: file.name,
            imageUrl: imageUrl,
        };
        setProductImageFile(file);
        setSelectedProduct(product);
    } catch(err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Could not load the product image. Details: ${errorMessage}`);
      console.error(err);
    }
  }, []);

  const handleInstantStart = useCallback(async () => {
    setError(null);
    try {
      // Fetch the default images
      const [objectResponse, sceneResponse] = await Promise.all([
        fetch('/assets/object.jpeg'),
        fetch('/assets/scene.jpeg')
      ]);

      if (!objectResponse.ok || !sceneResponse.ok) {
        throw new Error('Failed to load default images');
      }

      // Convert to blobs then to File objects
      const [objectBlob, sceneBlob] = await Promise.all([
        objectResponse.blob(),
        sceneResponse.blob()
      ]);

      const objectFile = new File([objectBlob], 'object.jpeg', { type: 'image/jpeg' });
      const sceneFile = new File([sceneBlob], 'scene.jpeg', { type: 'image/jpeg' });

      // Update state with the new files
      setSceneImage(sceneFile);
      handleProductImageUpload(objectFile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Could not load default images. Details: ${errorMessage}`);
      console.error(err);
    }
  }, [handleProductImageUpload]);

  const handleRemoveProduct = useCallback(() => {
    setProductImageFile(null);
    setSelectedProduct(null);
    setPersistedOrbPosition(null);
  }, []);

  const handleRemoveScene = useCallback(() => {
    setSceneImage(null);
    setPersistedOrbPosition(null);
  }, []);

  const handleProductDrop = useCallback(async (position: {x: number, y: number}, relativePosition: { xPercent: number; yPercent: number; }) => {
    if (!productImageFile || !sceneImage || !selectedProduct) {
      setError('An unexpected error occurred. Please try again.');
      return;
    }
    setPersistedOrbPosition(position);
    setIsLoading(true);
    setError(null);
    try {
      const { finalImageUrl, debugImageUrl: newDebugImageUrl, finalPrompt: newFinalPrompt } = await generateCompositeImage(
        productImageFile, 
        selectedProduct.name,
        sceneImage,
        sceneImage.name,
        relativePosition
      );
      
      const newSceneFile = dataURLtoFile(finalImageUrl, `generated-scene-${Date.now()}.jpeg`);

      setHistory(prev => [...prev, {
        sceneImage,
        debugImageUrl,
        debugPrompt
      }].slice(-10)); // Keep last 10 steps
      setFuture([]);

      setDebugImageUrl(newDebugImageUrl);
      setDebugPrompt(newFinalPrompt);
      setSceneImage(newSceneFile);

    } catch (err)
 {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate the image. ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
      setPersistedOrbPosition(null);
    }
  }, [productImageFile, sceneImage, selectedProduct]);


  const handleUndo = useCallback(() => {
    if (history.length === 0 || !sceneImage) return;
    
    const previousState = history[history.length - 1];
    
    setFuture(prev => [...prev, {
      sceneImage,
      debugImageUrl,
      debugPrompt
    }]);
    
    setHistory(prev => prev.slice(0, -1));
    
    setSceneImage(previousState.sceneImage);
    setDebugImageUrl(previousState.debugImageUrl);
    setDebugPrompt(previousState.debugPrompt);
  }, [history, sceneImage, debugImageUrl, debugPrompt]);

  const handleRedo = useCallback(() => {
    if (future.length === 0 || !sceneImage) return;
    
    const nextState = future[future.length - 1];
    
    setHistory(prev => [...prev, {
      sceneImage,
      debugImageUrl,
      debugPrompt
    }]);
    
    setFuture(prev => prev.slice(0, -1));
    
    setSceneImage(nextState.sceneImage);
    setDebugImageUrl(nextState.debugImageUrl);
    setDebugPrompt(nextState.debugPrompt);
  }, [future, sceneImage, debugImageUrl, debugPrompt]);

  const handleReset = useCallback(() => {
    // Let useEffect handle URL revocation
    setSelectedProduct(null);
    setProductImageFile(null);
    setSceneImage(null);
    setError(null);
    setIsLoading(false);
    setPersistedOrbPosition(null);
    setDebugImageUrl(null);
    setDebugPrompt(null);
    setHistory([]);
    setFuture([]);
  }, []);

  const handleChangeProduct = useCallback(() => {
    // Let useEffect handle URL revocation
    setSelectedProduct(null);
    setProductImageFile(null);
    setPersistedOrbPosition(null);
    setDebugImageUrl(null);
    setDebugPrompt(null);
    setHistory([]);
    setFuture([]);
  }, []);
  
  const handleChangeScene = useCallback(() => {
    setSceneImage(null);
    setPersistedOrbPosition(null);
    setDebugImageUrl(null);
    setDebugPrompt(null);
    setHistory([]);
    setFuture([]);
  }, []);

  useEffect(() => {
    // Clean up the scene's object URL when the component unmounts or the URL changes
    return () => {
        if (sceneImageUrl) URL.revokeObjectURL(sceneImageUrl);
    };
  }, [sceneImageUrl]);
  
  useEffect(() => {
    // Clean up the product's object URL when the component unmounts or the URL changes
    return () => {
        if (productImageUrl && productImageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(productImageUrl);
        }
    };
  }, [productImageUrl]);

  useEffect(() => {
    let messageInterval: ReturnType<typeof setInterval> | undefined;
    let progressInterval: ReturnType<typeof setInterval> | undefined;
    
    if (isLoading) {
        setLoadingMessageIndex(0); // Reset on start
        setProgress(0);
        
        messageInterval = setInterval(() => {
            setLoadingMessageIndex(prevIndex => Math.min(prevIndex + 1, loadingMessages.length - 1));
        }, 3000);

        // Simulate progress up to 95%
        progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) return prev;
                // Slow down as it gets closer to 95
                const increment = (95 - prev) * 0.05;
                return prev + Math.max(increment, 0.5);
            });
        }, 100);
    }
    return () => {
        if (messageInterval) clearInterval(messageInterval);
        if (progressInterval) clearInterval(progressInterval);
    };
  }, [isLoading]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!selectedProduct) return;
    // Prevent page scroll
    e.preventDefault();
    setIsTouchDragging(true);
    const touch = e.touches[0];
    setTouchGhostPosition({ x: touch.clientX, y: touch.clientY });
  };

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouchDragging) return;
      const touch = e.touches[0];
      setTouchGhostPosition({ x: touch.clientX, y: touch.clientY });
      
      const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
      const dropZone = elementUnderTouch?.closest<HTMLDivElement>('[data-dropzone-id="scene-uploader"]');

      if (dropZone) {
          const rect = dropZone.getBoundingClientRect();
          setTouchOrbPosition({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
          setIsHoveringDropZone(true);
      } else {
          setIsHoveringDropZone(false);
          setTouchOrbPosition(null);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isTouchDragging) return;
      
      const touch = e.changedTouches[0];
      const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
      const dropZone = elementUnderTouch?.closest<HTMLDivElement>('[data-dropzone-id="scene-uploader"]');

      if (dropZone && sceneImgRef.current) {
          const img = sceneImgRef.current;
          const containerRect = dropZone.getBoundingClientRect();
          const { naturalWidth, naturalHeight } = img;
          const { width: containerWidth, height: containerHeight } = containerRect;

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

          const dropX = touch.clientX - containerRect.left;
          const dropY = touch.clientY - containerRect.top;

          const imageX = dropX - offsetX;
          const imageY = dropY - offsetY;
          
          if (!(imageX < 0 || imageX > renderedWidth || imageY < 0 || imageY > renderedHeight)) {
            const xPercent = (imageX / renderedWidth) * 100;
            const yPercent = (imageY / renderedHeight) * 100;
            
            handleProductDrop({ x: dropX, y: dropY }, { xPercent, yPercent });
          }
      }

      setIsTouchDragging(false);
      setTouchGhostPosition(null);
      setIsHoveringDropZone(false);
      setTouchOrbPosition(null);
    };

    if (isTouchDragging) {
      document.body.style.overflow = 'hidden'; // Prevent scrolling
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isTouchDragging, handleProductDrop]);

  const renderContent = () => {
    if (error) {
       return (
           <motion.div 
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-8 rounded-lg max-w-2xl mx-auto"
           >
            <h2 className="text-3xl font-extrabold mb-4 text-red-800 dark:text-red-400">An Error Occurred</h2>
            <p className="text-lg text-red-700 dark:text-red-300 mb-6">{error}</p>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
              >
                Try Again
            </motion.button>
          </motion.div>
        );
    }
    
    if (!productImageFile || !sceneImage) {
      return (
        <motion.div 
          key="upload"
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, y: -20 }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.2
              }
            }
          }}
          className="w-full max-w-6xl mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
              }}
              className="flex flex-col"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Product Image</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Upload a high-resolution image of your furniture or decor item.
                </p>
              </div>
              <ImageUploader 
                id="product-uploader"
                onFileSelect={handleProductImageUpload}
                imageUrl={productImageUrl}
                onRemove={handleRemoveProduct}
              />
            </motion.div>

            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
              }}
              className="flex flex-col"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Background Scene</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Select a room or outdoor scene to visualize your product in.
                </p>
              </div>
              <ImageUploader 
                id="scene-uploader"
                onFileSelect={setSceneImage}
                imageUrl={sceneImageUrl}
                onRemove={handleRemoveScene}
              />
            </motion.div>
          </div>
          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0, transition: { delay: 0.4 } }
            }}
            className="text-center mt-10 min-h-[4rem] flex flex-col justify-center items-center"
          >
            <p className="text-zinc-500 dark:text-zinc-400">
              Upload a product image and a scene image to begin.
            </p>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">
              Or click{' '}
              <button
                onClick={handleInstantStart}
                className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
              >
                here
              </button>
              {' '}for an instant start.
            </p>
          </motion.div>
        </motion.div>
      );
    }

    return (
      <motion.div 
        key="editor"
        initial="hidden"
        animate="visible"
        exit={{ opacity: 0, y: -20 }}
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.15
            }
          }
        }}
        className="w-full max-w-7xl mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Product Column */}
          <motion.div 
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100 } }
            }}
            className="md:col-span-1 flex flex-col"
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-extrabold text-zinc-800 dark:text-zinc-100">Product</h2>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIs3DMode(!is3DMode)}
                className="text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1"
              >
                {is3DMode ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" />
                    </svg>
                    2D View
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                    </svg>
                    3D Preview
                  </>
                )}
              </motion.button>
            </div>
            <div className="flex-grow flex items-center justify-center">
              {is3DMode ? (
                <div className="w-full max-w-xs aspect-square">
                  <Product3DPreview imageUrl={productImageUrl!} />
                  <div className="text-center mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                    Switch to 2D View to drag and place
                  </div>
                </div>
              ) : (
                <div 
                    draggable="true" 
                    onDragStart={(e: React.DragEvent) => {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setDragImage(transparentDragImage, 0, 0);
                    }}
                    onTouchStart={handleTouchStart}
                    className="cursor-move w-full max-w-xs"
                >
                  <motion.div 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                  >
                      <ObjectCard product={selectedProduct!} isSelected={true} />
                  </motion.div>
                </div>
              )}
            </div>
            <div className="text-center mt-4">
               <div className="h-5 flex items-center justify-center">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleChangeProduct}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold"
                >
                    Change Product
                </motion.button>
               </div>
            </div>
          </motion.div>
          {/* Scene Column */}
          <motion.div 
            variants={{
              hidden: { opacity: 0, x: 20 },
              visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100 } }
            }}
            className="md:col-span-2 flex flex-col"
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-extrabold text-zinc-800 dark:text-zinc-100">Scene</h2>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUndo}
                  disabled={history.length === 0 || isLoading}
                  className="text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Undo
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRedo}
                  disabled={future.length === 0 || isLoading}
                  className="text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                  </svg>
                  Redo
                </motion.button>
              </div>
            </div>
            <div className="flex-grow flex items-center justify-center">
              <ImageUploader 
                  ref={sceneImgRef}
                  id="scene-uploader" 
                  onFileSelect={setSceneImage} 
                  imageUrl={sceneImageUrl}
                  isDropZone={!!sceneImage && !isLoading}
                  onProductDrop={handleProductDrop}
                  persistedOrbPosition={persistedOrbPosition}
                  showDebugButton={!!debugImageUrl && !isLoading}
                  onDebugClick={() => setIsDebugModalOpen(true)}
                  isTouchHovering={isHoveringDropZone}
                  touchOrbPosition={touchOrbPosition}
              />
            </div>
            <div className="text-center mt-4">
              <div className="h-5 flex items-center justify-center">
                {sceneImage && !isLoading && (
                  <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleChangeScene}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold"
                  >
                      Change Scene
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { delay: 0.3 } }
          }}
          className="text-center mt-10 min-h-[8rem] flex flex-col justify-center items-center"
        >
           <AnimatePresence mode="wait">
             {isLoading ? (
               <motion.div 
                  key="loading"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm w-full max-w-md mx-auto"
               >
                  <Spinner />
                  <div className="h-10 mt-6 relative w-full flex justify-center items-center overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.p 
                        key={loadingMessageIndex}
                        initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-violet-600 to-pink-600 absolute text-center w-full"
                      >
                        {loadingMessages[loadingMessageIndex]}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full mt-6 bg-zinc-200 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                    <motion.div 
                      className="bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 h-2.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "linear", duration: 0.1 }}
                    />
                  </div>
                  <div className="w-full text-right mt-2">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{Math.round(progress)}%</span>
                  </div>
               </motion.div>
             ) : (
               <motion.p 
                  key="instruction"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-zinc-500 dark:text-zinc-400"
               >
                  Drag the product onto a location in the scene, or simply click where you want it.
               </motion.p>
             )}
           </AnimatePresence>
        </motion.div>
      </motion.div>
    );
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 flex items-center justify-center p-4 md:p-8 transition-colors duration-300"
    >
      <TouchGhost 
        imageUrl={isTouchDragging ? productImageUrl : null} 
        position={touchGhostPosition}
      />
      <div className="flex flex-col items-center gap-8 w-full">
        <Header />
        <main className="w-full">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </main>
        <AboutSection />
      </div>
      <DebugModal 
        isOpen={isDebugModalOpen} 
        onClose={() => setIsDebugModalOpen(false)}
        imageUrl={debugImageUrl}
        prompt={debugPrompt}
      />
    </motion.div>
  );
};

export default App;
