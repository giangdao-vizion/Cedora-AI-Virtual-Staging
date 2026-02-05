
import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../types';
import { products } from '../data';
import AIPreviewModal from './AIPreviewModal';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onSelectProduct: (id: number) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onBack, onSelectProduct }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showAIPreview, setShowAIPreview] = useState(false);

  // Reset image index when product changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [product.productId]);

  const formattedPrice = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(product.price);

  const relatedProducts = useMemo(() => {
    return products
      .filter(p => p.productType === product.productType && p.productId !== product.productId)
      .slice(0, 4);
  }, [product]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Navigation */}
      <button 
        onClick={onBack}
        className="flex items-center text-sm font-medium text-gray-500 hover:text-red-600 transition-colors mb-8 group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Collection
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        {/* Left: Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-[4/5] bg-gray-100 rounded-3xl overflow-hidden border border-gray-100 shadow-sm relative flex items-center justify-center">
            <img 
              src={product.imageUrls[activeImageIndex]} 
              alt={product.name}
              className="w-full h-full object-contain transition-opacity duration-300"
            />
            {product.collectionNames.includes('New Arrivals') && (
              <span className="absolute top-4 left-4 px-4 py-1.5 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg">
                New Arrival
              </span>
            )}
            
            {/* AI Shortcut Button - Prominent for both Mobile and Desktop */}
            <button 
              onClick={() => setShowAIPreview(true)}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 bg-white/95 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 font-bold text-sm"
            >
              <div className="bg-red-600 text-white p-1 rounded-full group-hover:bg-white group-hover:text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              AI Room Preview
            </button>
          </div>
          
          {product.imageUrls.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {product.imageUrls.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImageIndex(index)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-full overflow-hidden border-2 transition-all bg-gray-50 ${
                    activeImageIndex === index ? 'border-red-600 ring-2 ring-red-100' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`${product.name} view ${index + 1}`} className="w-full h-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info */}
        <div className="flex flex-col">
          <div className="mb-8 border-b border-gray-100 pb-8">
            <p className="text-xs font-bold text-red-600 uppercase tracking-[0.2em] mb-3">
              {product.room} • {product.productType}
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
              {product.name}
            </h1>
            <p className="text-3xl font-light text-gray-900 mb-6">{formattedPrice}</p>
            
            <div className="flex flex-wrap gap-2">
              {product.collectionNames.map(name => (
                <span key={name} className="px-4 py-1 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full">
                  {name}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Product Details</h3>
              <ul className="space-y-3">
                <li className="flex justify-between text-sm py-2 border-b border-gray-50">
                  <span className="text-gray-500">Product ID</span>
                  <span className="text-gray-900 font-medium">{product.productId}</span>
                </li>
                <li className="flex justify-between text-sm py-2 border-b border-gray-50">
                  <span className="text-gray-500">Category</span>
                  <span className="text-gray-900 font-medium">{product.productType}</span>
                </li>
              </ul>
            </div>

            <div className="pt-8 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href={product.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-grow bg-black text-white text-center py-4 rounded-full font-bold shadow-lg hover:bg-gray-800 hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
                >
                  Buy now
                </a>
                <button 
                  onClick={() => setShowAIPreview(true)}
                  className="flex-grow border-2 border-red-600 text-red-600 text-center py-4 rounded-full font-bold shadow-sm hover:bg-red-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  AI Room Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-gray-100 pt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Related Products</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map((rp) => (
              <div 
                key={rp.productId}
                onClick={() => onSelectProduct(rp.productId)}
                className="group cursor-pointer bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="aspect-[4/5] bg-gray-50 overflow-hidden relative flex items-center justify-center">
                  <img 
                    src={rp.imageUrls[0]} 
                    alt={rp.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-gray-900 line-clamp-1 mb-1 group-hover:text-red-600 transition-colors">
                    {rp.name}
                  </h3>
                  <p className="text-red-600 font-bold text-xs">
                    {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(rp.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {showAIPreview && (
        <AIPreviewModal 
          product={product} 
          onClose={() => setShowAIPreview(false)} 
        />
      )}
    </div>
  );
};

export default ProductDetail;
