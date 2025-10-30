
import React, { useState, useMemo } from 'react';
import { BrollAsset } from '../types';
import { Icon } from './Icon';
import ExportModal from './ExportModal';

interface LibraryProps {
  assets: BrollAsset[];
}

type FilterType = 'all' | 'image' | 'video' | 'audio';
type SortType = 'newest' | 'oldest';

const Library: React.FC<LibraryProps> = ({ assets }) => {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<BrollAsset | null>(null);

  const handleOpenExportModal = (asset: BrollAsset) => {
    setSelectedAsset(asset);
    setIsExportModalOpen(true);
  };
  
  const handleCloseExportModal = () => {
    setIsExportModalOpen(false);
    setSelectedAsset(null);
  };

  const filteredAndSortedAssets = useMemo(() => {
    return assets
      .filter(asset => {
        if (filterType === 'all') return true;
        return asset.type === filterType;
      })
      .sort((a, b) => {
        const idA = parseInt(a.id, 10);
        const idB = parseInt(b.id, 10);
        if (sortBy === 'newest') {
          return idB - idA;
        }
        return idA - idB;
      });
  }, [assets, filterType, sortBy]);

  const getFilterButtonClass = (type: FilterType) => {
    const baseClasses = 'px-4 py-2 rounded-md transition-colors duration-200 text-sm font-medium';
    if (filterType === type) {
      return `${baseClasses} bg-indigo-600 text-white shadow-md`;
    }
    return `${baseClasses} text-gray-300 hover:bg-gray-700`;
  };

  if (assets.length === 0) {
    return (
      <div className="text-center text-gray-500 py-16">
        <Icon name="library" className="w-24 h-24 mx-auto opacity-20" />
        <h2 className="mt-4 text-2xl font-bold">Your Library is Empty</h2>
        <p>Generate some images or videos to see them here.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 p-4 bg-gray-800/50 rounded-xl">
        <div className="flex items-center bg-gray-900 p-1.5 rounded-lg">
          {(['all', 'image', 'video', 'audio'] as FilterType[]).map(type => (
            <button key={type} onClick={() => setFilterType(type)} className={getFilterButtonClass(type)}>
              {type.charAt(0).toUpperCase() + type.slice(1)}s
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
           <label htmlFor="sort-by" className="text-sm font-medium text-gray-400">Sort by:</label>
            <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="bg-gray-700 border border-gray-600 rounded-lg py-2 pl-3 pr-8 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
            </select>
        </div>
      </div>
      
      {filteredAndSortedAssets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedAssets.map(asset => (
            <div key={asset.id} className="bg-gray-800 rounded-xl shadow-lg overflow-hidden group transition-transform duration-300 hover:scale-105 relative">
              <div className="aspect-video bg-black flex items-center justify-center">
                {asset.type === 'image' ? (
                  <img src={asset.url} alt={asset.prompt} className="object-contain w-full h-full" />
                ) : asset.type === 'video' ? (
                  <video src={asset.url} controls loop className="w-full h-full" />
                ) : (
                  <div className="w-full h-full p-4 flex items-center">
                    <audio src={asset.url} controls className="w-full" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-xs text-indigo-400 font-semibold uppercase">{asset.type}</p>
                <p className="text-sm text-gray-300 truncate mt-1" title={asset.prompt}>{asset.prompt}</p>
              </div>
               <button 
                onClick={() => handleOpenExportModal(asset)}
                className="absolute top-2 right-2 p-2 bg-gray-900/50 rounded-full text-white hover:bg-indigo-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Export asset"
                aria-label="Export asset"
              >
                <Icon name="export" className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
         <div className="text-center text-gray-500 py-16">
            <Icon name="logo" className="w-24 h-24 mx-auto opacity-20" />
            <h2 className="mt-4 text-2xl font-bold">No Assets Found</h2>
            <p>Try adjusting your filter or sort settings.</p>
        </div>
      )}
      {isExportModalOpen && selectedAsset && (
        <ExportModal asset={selectedAsset} onClose={handleCloseExportModal} />
      )}
    </div>
  );
};

export default Library;
