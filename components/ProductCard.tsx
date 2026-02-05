
import React, { useState, useEffect } from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onClick: (id: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const [imgError, setImgError] = useState(false);
  
  const formattedPrice = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(product.price);

  const isNew = product.collectionNames.includes('New Arrivals');
  const isPreOrder = product.collectionNames.includes('Pre-order');

  useEffect(() => {
    setImgError(false);
  }, [product.imageUrls[0]]);

  return (
    <div 
      onClick={() => onClick(product.productId)}
      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full transform hover:-translate-y-1 cursor-pointer"
    >
      <div className="aspect-[4/5] w-full bg-gray-100 overflow-hidden relative">
        {!imgError ? (
          <img
            src={product.imageUrls[0]}
            alt={product.name}
            className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
            loading="lazy"
            onError={(e) => {
              setImgError(true);
            }}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-gray-50 to-gray-200 flex flex-col items-center justify-center p-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Image Unavailable</span>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none">
          {isNew && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-red-600 text-white shadow-lg uppercase tracking-wider">
              New
            </span>
          )}
          {isPreOrder && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-lg uppercase tracking-wider">
              Pre-order
            </span>
          )}
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-medium bg-white/90 text-gray-600 shadow-sm backdrop-blur-sm">
            {product.room}
          </span>
        </div>

        {/* Action Overlay */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
           <span className="bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-red-600 hover:text-white">
             View Details
           </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="mb-2">
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">{product.productType}</p>
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>
        </div>
        <div className="mt-auto pt-4 flex justify-between items-center border-t border-gray-50">
          <p className="text-lg font-bold text-gray-900">{formattedPrice}</p>
          <button 
            className="p-2 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all focus:outline-none" 
            aria-label="Add to wishlist"
            onClick={(e) => e.stopPropagation()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
