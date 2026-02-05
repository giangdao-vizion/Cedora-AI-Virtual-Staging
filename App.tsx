
import React, { useState, useMemo, useEffect } from 'react';
import { products } from './data';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import ProductDetail from './components/ProductDetail';

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('Featured');
  const [activeCollection, setActiveCollection] = useState<string>('All Products');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // Scroll to top when product is selected or back to list
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedProductId]);

  const collections = useMemo(() => {
    const allCollections = products.flatMap(p => p.collectionNames);
    const unique = Array.from(new Set(allCollections)).sort();
    return ['All Products', ...unique];
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    let result = products;

    // Filter by Collection
    if (activeCollection !== 'All Products') {
      result = result.filter(p => p.collectionNames.includes(activeCollection));
    }

    // Filter by Search Term
    if (searchTerm) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.productType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    result = [...result];
    if (sortBy === 'Price: Low to High') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'Price: High to Low') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [activeCollection, searchTerm, sortBy]);

  const selectedProduct = useMemo(() => 
    products.find(p => p.productId === selectedProductId), 
    [selectedProductId]
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {selectedProduct ? (
        <ProductDetail 
          product={selectedProduct} 
          onBack={() => setSelectedProductId(null)} 
          onSelectProduct={setSelectedProductId}
        />
      ) : (
        <div className="flex-grow flex flex-col md:flex-row max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 gap-4 md:gap-8 animate-in fade-in duration-500">
          
          {/* Enhanced Collections Navigation: Horizontal on Mobile, Sidebar on Desktop */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="md:sticky md:top-24">
              <h2 className="hidden md:block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">
                Collections
              </h2>
              {/* Desktop View */}
              <nav className="hidden md:block space-y-2 mb-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {collections.map((collection) => (
                  <button
                    key={collection}
                    onClick={() => setActiveCollection(collection)}
                    className={`
                      w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-full transition-all
                      ${activeCollection === collection 
                        ? 'bg-red-600 text-white shadow-md' 
                        : 'text-gray-600 hover:bg-white hover:text-red-600 border border-transparent'}
                    `}
                  >
                    <span className="truncate">{collection}</span>
                  </button>
                ))}
              </nav>

              {/* Mobile Horizontal View */}
              <div className="md:hidden flex overflow-x-auto pb-4 gap-2 no-scrollbar -mx-4 px-4">
                {collections.map((collection) => (
                  <button
                    key={collection}
                    onClick={() => setActiveCollection(collection)}
                    className={`
                      flex-shrink-0 px-5 py-2 text-sm font-bold rounded-full transition-all whitespace-nowrap border
                      ${activeCollection === collection 
                        ? 'bg-red-600 text-white border-red-600 shadow-md' 
                        : 'bg-white text-gray-600 border-gray-200'}
                    `}
                  >
                    {collection}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-grow">
            <header className="mb-6 md:mb-8">
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{activeCollection}</h1>
                    <p className="mt-1 text-xs md:text-sm text-gray-500">
                      Showing {filteredAndSortedProducts.length} items.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="relative flex-grow sm:flex-grow-0 group">
                      <input 
                        type="text" 
                        placeholder="Search..." 
                        className="bg-white border border-gray-200 rounded-full pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none transition-all w-full sm:w-48 lg:w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    <select 
                      className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none cursor-pointer appearance-none min-w-[120px]"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option>Featured</option>
                      <option>Price: Low</option>
                      <option>Price: High</option>
                    </select>
                  </div>
                </div>
              </div>
            </header>

            {filteredAndSortedProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredAndSortedProducts.map((product) => (
                  <ProductCard 
                    key={product.productId} 
                    product={product} 
                    onClick={setSelectedProductId}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-8 md:p-12 text-center shadow-sm">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No results found</h3>
                <button 
                  onClick={() => { setActiveCollection('All Products'); setSearchTerm(''); }}
                  className="mt-6 inline-flex items-center px-8 py-2.5 border border-transparent text-sm font-medium rounded-full text-white bg-red-600 hover:bg-red-700 shadow-md transition-all"
                >
                  Reset
                </button>
              </div>
            )}
          </main>
        </div>
      )}

      <footer className="bg-white border-t border-gray-200 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          <img 
            src="https://cedora.com.au/cdn/shop/files/Logo-horizontal-official-1.png?v=1764043430&width=360" 
            alt="Cedora Logo" 
            className="h-6 w-auto opacity-50 grayscale hover:grayscale-0 transition-all mb-4"
          />
          <p className="text-gray-400 text-[10px] text-center">
            &copy; {new Date().getFullYear()} Cedora Furniture Australia.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
