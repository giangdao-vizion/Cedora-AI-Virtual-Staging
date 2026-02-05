
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { GoogleGenAI } from "@google/genai";

interface AIPreviewModalProps {
  product: Product;
  onClose: () => void;
}

const ROOM_TEMPLATES: Record<string, string[]> = {
  "Living Room": [
    "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=1200",
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200",
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=1200"
  ],
  "Bedroom": [
    "https://images.unsplash.com/photo-1616594111721-396b16601f08?q=80&w=1200",
    "https://images.unsplash.com/photo-1540518614846-7eba43376461?q=80&w=1200",
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1200",
    "https://images.unsplash.com/photo-1505691938895-1758d7eaa511?q=80&w=1200"
  ],
  "Dining Room": [
    "https://images.unsplash.com/photo-1617806118233-18e1db208fa0?q=80&w=1200",
    "https://images.unsplash.com/photo-1520699049698-cdf2f7105bc5?q=80&w=1200",
    "https://images.unsplash.com/photo-1556912177-f547c12dd0ee?q=80&w=1200",
    "https://images.unsplash.com/photo-1604014237800-1c9102c219da?q=80&w=1200"
  ],
  "General": [
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1200",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1200",
    "https://images.unsplash.com/photo-1615529328331-f8917597711f?q=80&w=1200",
    "https://images.unsplash.com/photo-1513519247388-193ad513d746?q=80&w=1200"
  ]
};

const AIPreviewModal: React.FC<AIPreviewModalProps> = ({ product, onClose }) => {
  const [step, setStep] = useState<'select' | 'place' | 'result'>('select');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [marker, setMarker] = useState<{ x: number, y: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  
  // View & Panning States
  const [isFocusedView, setIsFocusedView] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const templates = ROOM_TEMPLATES[product.room] || ROOM_TEMPLATES["General"];

  // Handle Drag/Pan Events
  const handleStart = (clientX: number, clientY: number) => {
    if (!isFocusedView) return;
    setIsDragging(true);
    dragStart.current = { x: clientX, y: clientY };
    panStart.current = { ...pan };
  };

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !isFocusedView) return;
    // Sensivity adjusted for zoomed state
    const sensitivity = 0.8;
    const dx = (clientX - dragStart.current.x) * sensitivity;
    const dy = (clientY - dragStart.current.y) * sensitivity;
    
    setPan({
      x: panStart.current.x + dx,
      y: panStart.current.y + dy
    });
  }, [isDragging, isFocusedView]);

  const handleEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onEnd = () => handleEnd();

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging, handleMove]);

  const handleTemplateClick = (url: string) => {
    setSelectedRoom(url);
    setStep('place');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedRoom(event.target?.result as string);
        setStep('place');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMarker({ x, y });
  };

  const toBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (url.startsWith('data:')) {
        resolve(url.split(',')[1]);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataURL.split(',')[1]);
      };
      img.onerror = () => {
        reject(new Error("Image failed to load"));
      };
      img.src = url;
    });
  };

  const handleProcess = async () => {
    if (!selectedRoom || !marker) return;
    setIsProcessing(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const roomBase64 = await toBase64(selectedRoom);
      const productBase64 = await toBase64(product.imageUrls[0]);

      const prompt = `Task: Professional AI Furniture Inpainting & Virtual Staging.
1. Input: Image 1 is the base room. Image 2 is the exact product: "${product.name}".
2. Target Placement: Center the furniture item exactly at the position: [X:${marker.x.toFixed(1)}%, Y:${marker.y.toFixed(1)}%].
3. Erase & Clean: If any existing furniture or object is currently at or near the marked location, cleanly erase it. Reconstruct the room floor and background where the object was removed to look natural.
4. Faithful Reproduction (CRITICAL): Do NOT hallucinate or alter the furniture design. The product in the final image must be a 100% faithful reproduction of the item in Image 2. Maintain its exact shape, textures, colors, and unique features. It must look like the real Cedora product.
5. Integration: Adjust the furniture's scale, rotation, and perspective to match the room's geometry. Apply lighting, reflections, and soft contact shadows so it appears physically present in the space.
6. Quality: Generate a single, photorealistic output. Output ONLY the image data.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: roomBase64, mimeType: 'image/jpeg' } },
            { inlineData: { data: productBase64, mimeType: 'image/jpeg' } },
            { text: prompt }
          ]
        }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          setResultImage(`data:image/png;base64,${part.inlineData.data}`);
          setIsFocusedView(false); 
          setPan({ x: 0, y: 0 });
          setStep('result');
          break;
        }
      }
    } catch (error) {
      console.error("AI Staging Error:", error);
      alert("Failed to process image. Try a different room template or upload your own photo.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `cedora-preview-${product.handle}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!resultImage) return;
    try {
      const blob = await (await fetch(resultImage)).blob();
      const file = new File([blob], 'cedora-preview.png', { type: 'image/png' });
      if (navigator.share) {
        await navigator.share({
          title: `My Cedora Interior: ${product.name}`,
          text: `Check out how this ${product.name} looks in my space!`,
          files: [file]
        });
      } else {
        handleSave();
      }
    } catch (err) {
      handleSave();
    }
  };

  const toggleFocus = () => {
    setIsFocusedView(!isFocusedView);
    setPan({ x: 0, y: 0 }); // Reset pan when toggling
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white w-full h-full sm:h-auto sm:max-w-4xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-screen sm:max-h-[95vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">AI Virtual Preview</h2>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{product.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-90">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 no-scrollbar relative bg-gray-50/50">
          {step === 'select' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <section>
                <h3 className="text-xs font-bold mb-4 text-center text-gray-400 uppercase tracking-[0.2em]">Step 1: Choose Room Style</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {templates.map((url, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleTemplateClick(url)}
                      className="aspect-[4/3] rounded-2xl overflow-hidden border-2 border-transparent hover:border-red-600 transition-all group relative bg-gray-200 shadow-sm"
                    >
                      <img 
                        src={url} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                    </button>
                  ))}
                </div>
              </section>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <div className="relative flex justify-center text-xs"><span className="px-3 bg-gray-50 text-gray-400 font-bold uppercase tracking-widest">or</span></div>
              </div>

              <section className="text-center">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-gray-300 rounded-2xl hover:border-red-600 hover:bg-red-50 transition-all flex flex-col items-center justify-center gap-3 bg-white shadow-sm group"
                >
                  <div className="bg-gray-100 p-4 rounded-full group-hover:bg-red-100 group-hover:scale-110 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 group-hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-gray-600 group-hover:text-red-600">Upload Your Own Space</span>
                </button>
              </section>
            </div>
          )}

          {step === 'place' && (
            <div className="flex flex-col items-center animate-in zoom-in-95 duration-500 h-full">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Step 2: Mark Replacement Area</p>
              
              <div className="relative cursor-crosshair rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-white group" onClick={handleCanvasClick}>
                <img ref={imageRef} src={selectedRoom!} className="max-h-[55vh] sm:max-h-[50vh] w-auto block object-contain" />
                {marker && (
                  <div className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none" style={{ left: `${marker.x}%`, top: `${marker.y}%` }}>
                    <div className="absolute inset-0 bg-red-600/40 rounded-full animate-ping" />
                    <div className="w-5 h-5 bg-red-600 rounded-full border-4 border-white shadow-2xl z-10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 pointer-events-none transition-colors" />
              </div>

              <div className="mt-10 flex gap-4 w-full max-w-sm px-4">
                <button onClick={() => setStep('select')} className="flex-1 py-4 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-600 active:scale-95 transition-all">
                  Back
                </button>
                <button onClick={handleProcess} disabled={!marker || isProcessing} className={`flex-1 py-4 rounded-full text-sm font-bold text-white shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all ${!marker ? 'bg-gray-300' : 'bg-red-600 hover:bg-red-700'}`}>
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      AI Designing...
                    </div>
                  ) : 'Visualize Now'}
                </button>
              </div>
            </div>
          )}

          {step === 'result' && resultImage && (
            <div className="flex flex-col items-center animate-in zoom-in-95 duration-500 h-full">
               <div className="relative w-full aspect-[4/5] sm:aspect-[16/10] max-h-[65vh] sm:max-h-[70vh] rounded-3xl overflow-hidden shadow-2xl border border-gray-200 bg-black/10 group touch-none">
                 <div 
                   className={`w-full h-full relative overflow-hidden ${isFocusedView ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                   onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
                   onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
                 >
                    <img 
                      src={resultImage} 
                      className={`w-full h-full block transition-all duration-500 ease-out select-none pointer-events-none object-contain`}
                      style={{
                        transform: isFocusedView 
                          ? `scale(3) translate(${pan.x}px, ${pan.y}px)` 
                          : 'scale(1) translate(0, 0)',
                        transformOrigin: marker ? `${marker.x}% ${marker.y}%` : 'center center'
                      }}
                    />
                 </div>
                 
                 {/* Tooltips & Controls */}
                 <div className="absolute bottom-6 right-6 flex flex-col gap-3">
                   {isFocusedView && (
                     <div className="bg-black/80 backdrop-blur-lg px-4 py-2 rounded-full text-[10px] text-white font-bold uppercase tracking-wider animate-in fade-in slide-in-from-right-2 shadow-xl border border-white/10">
                       Drag to explore details
                     </div>
                   )}
                   <button 
                     onClick={toggleFocus}
                     className={`p-4 rounded-full shadow-2xl border transition-all active:scale-90 flex items-center justify-center ${
                       isFocusedView 
                         ? 'bg-red-600 border-red-500 text-white' 
                         : 'bg-white border-gray-100 text-gray-900 hover:bg-red-600 hover:text-white'
                     }`}
                   >
                     {isFocusedView ? (
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                       </svg>
                     ) : (
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                       </svg>
                     )}
                   </button>
                 </div>
               </div>
               
               <div className="mt-8 grid grid-cols-2 gap-3 w-full max-w-sm px-4">
                  <button onClick={handleSave} className="py-4 bg-white border border-gray-200 text-gray-900 rounded-full text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Save Photo
                  </button>
                  <button onClick={handleShare} className="py-4 bg-white border border-gray-200 text-gray-900 rounded-full text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </button>
                  <button onClick={() => { setStep('place'); setResultImage(null); }} className="col-span-1 py-4 bg-gray-100 text-gray-500 rounded-full text-xs font-bold active:scale-95 transition-all">
                    Retry Position
                  </button>
                  <button onClick={onClose} className="col-span-1 py-4 bg-black text-white rounded-full text-xs font-bold shadow-xl active:scale-95 transition-all">
                    Finish Preview
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIPreviewModal;
