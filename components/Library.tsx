
import React from 'react';
import { BrollAsset } from '../types';
import { Icon } from './Icon';

interface LibraryProps {
  assets: BrollAsset[];
}

const Library: React.FC<LibraryProps> = ({ assets }) => {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {assets.map(asset => (
        <div key={asset.id} className="bg-gray-800 rounded-xl shadow-lg overflow-hidden group transition-transform duration-300 hover:scale-105">
          <div className="aspect-video bg-black flex items-center justify-center">
            {asset.type === 'image' ? (
              <img src={asset.url} alt={asset.prompt} className="object-contain w-full h-full" />
            ) : (
              <video src={asset.url} controls loop className="w-full h-full" />
            )}
          </div>
          <div className="p-4">
            <p className="text-xs text-indigo-400 font-semibold uppercase">{asset.type}</p>
            <p className="text-sm text-gray-300 truncate mt-1" title={asset.prompt}>{asset.prompt}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Library;
