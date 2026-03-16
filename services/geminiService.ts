/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenerativeAI } from "@google/generative-ai"; // Standard package usage recommended

// Helper to get intrinsic image dimensions from a File object
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            if (!event.target?.result) {
                return reject(new Error("Failed to read file."));
            }
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                resolve({ width: img.naturalWidth, height: img.naturalHeight });
            };
            img.onerror = (err) => reject(new Error(`Image load error: ${err}`));
        };
        reader.onerror = (err) => reject(new Error(`File reader error: ${err}`));
    });
};

// Helper to crop a square image back to an original aspect ratio
const cropToOriginalAspectRatio = (
    imageDataUrl: string,
    originalWidth: number,
    originalHeight: number,
    targetDimension: number
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = imageDataUrl;
        img.onload = () => {
            const aspectRatio = originalWidth / originalHeight;
            let contentWidth, contentHeight;
            if (aspectRatio > 1) { // Landscape
                contentWidth = targetDimension;
                contentHeight = targetDimension / aspectRatio;
            } else { // Portrait or square
                contentHeight = targetDimension;
                contentWidth = targetDimension * aspectRatio;
            }

            const x = (targetDimension - contentWidth) / 2;
            const y = (targetDimension - contentHeight) / 2;

            const canvas = document.createElement('canvas');
            canvas.width = contentWidth;
            canvas.height = contentHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Could not get canvas context.'));
            
            ctx.drawImage(img, x, y, contentWidth, contentHeight, 0, 0, contentWidth, contentHeight);
            resolve(canvas.toDataURL('image/jpeg', 0.95));
        };
        img.onerror = (err) => reject(new Error(`Crop error: ${err}`));
    });
};

// Resize logic for consistent model input
const resizeImage = (file: File, targetDimension: number): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            if (!event.target?.result) return reject(new Error("Failed to read file."));
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = targetDimension;
                canvas.height = targetDimension;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Canvas context failed.'));

                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, targetDimension, targetDimension);

                const aspectRatio = img.width / img.height;
                let newWidth, newHeight;

                if (aspectRatio > 1) {
                    newWidth = targetDimension;
                    newHeight = targetDimension / aspectRatio;
                } else {
                    newHeight = targetDimension;
                    newWidth = targetDimension * aspectRatio;
                }

                const x = (targetDimension - newWidth) / 2;
                const y = (targetDimension - newHeight) / 2;
                ctx.drawImage(img, x, y, newWidth, newHeight);

                canvas.toBlob((blob) => {
                    if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                    else reject(new Error('Blob conversion failed.'));
                }, 'image/jpeg', 0.95);
            };
        };
    });
};

// Helper for Gemini API Parts
const fileToPart = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
    });
    return {
        inlineData: {
            mimeType: file.type,
            data: dataUrl.split(',')[1]
        }
    };
};

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
    });
};

const markImage = async (
    paddedSquareFile: File, 
    position: { xPercent: number; yPercent: number; },
    originalDimensions: { originalWidth: number; originalHeight: number; }
): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(paddedSquareFile);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Canvas error.'));

                ctx.drawImage(img, 0, 0);
                const { originalWidth, originalHeight } = originalDimensions;
                const aspectRatio = originalWidth / originalHeight;
                let contentWidth, contentHeight;

                if (aspectRatio > 1) {
                    contentWidth = canvas.width;
                    contentHeight = canvas.width / aspectRatio;
                } else {
                    contentHeight = canvas.height;
                    contentWidth = canvas.height * aspectRatio;
                }
                
                const offsetX = (canvas.width - contentWidth) / 2;
                const offsetY = (canvas.height - contentHeight) / 2;
                const finalX = offsetX + (position.xPercent / 100) * contentWidth;
                const finalY = offsetY + (position.yPercent / 100) * contentHeight;

                const radius = Math.max(5, canvas.width * 0.015);
                ctx.beginPath();
                ctx.arc(finalX, finalY, radius, 0, 2 * Math.PI);
                ctx.fillStyle = 'red';
                ctx.fill();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = radius * 0.2;
                ctx.stroke();

                canvas.toBlob((blob) => {
                    if (blob) resolve(new File([blob], `marked.jpg`, { type: 'image/jpeg' }));
                }, 'image/jpeg', 0.95);
            };
        };
    });
};

export const generateCompositeImage = async (
    objectImage: File, 
    objectDescription: string,
    environmentImage: File,
    environmentDescription: string,
    dropPosition: { xPercent: number; yPercent: number; }
): Promise<{ finalImageUrl: string; debugImageUrl: string; finalPrompt: string; }> => {
    
    // API Initialization (Stable Version)
    const genAI = new GoogleGenerativeAI(process.env.API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const { width: originalWidth, height: originalHeight } = await getImageDimensions(environmentImage);
    const MAX_DIMENSION = 1024;
    
    const resizedObjectImage = await resizeImage(objectImage, MAX_DIMENSION);
    const resizedEnvironmentImage = await resizeImage(environmentImage, MAX_DIMENSION);
    const markedEnvImage = await markImage(resizedEnvironmentImage, dropPosition, { originalWidth, originalHeight });
    const debugImageUrl = await fileToDataUrl(markedEnvImage);

    // STEP 1: Get Semantic Description
    const markedPart = await fileToPart(markedEnvImage);
    const descriptionPrompt = `Analyze the red marker location in this image. Describe the surface and surroundings densely for an AI image generator.`;
    
    let semanticLocation = 'at the center point';
    try {
        const result = await model.generateContent([descriptionPrompt, markedPart]);
        semanticLocation = result.response.text();
    } catch (e) {
        console.error("Description failed, using fallback.");
    }

    // STEP 2: Generate Composite Image
    const objectPart = await fileToPart(resizedObjectImage);
    const envPart = await fileToPart(resizedEnvironmentImage);
    
    const compositePrompt = `
    Role: Visual Composition Expert.
    Task: Place the product from the first image into the scene of the second image at this location: "${semanticLocation}".
    Requirements: Match lighting, shadows, and perspective. Return ONLY the new composite image.
    `;

    const result = await model.generateContent([compositePrompt, objectPart, envPart]);
    const response = await result.response;
    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

    if (imagePart?.inlineData) {
        const base64Data = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        const finalImageUrl = await cropToOriginalAspectRatio(base64Data, originalWidth, originalHeight, MAX_DIMENSION);
        return { finalImageUrl, debugImageUrl, finalPrompt: compositePrompt };
    }

    throw new Error("The model did not return an image. Check if your Tier supports image generation output.");
};
