
import React from 'react';
import { View } from '../types';
import { Icon } from './Icon';

interface HeaderProps {
  currentView: View;
  setView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: View.Video, label: 'Video Generator', icon: 'video' },
    { id: View.Image, label: 'Image Editor', icon: 'image' },
    { id: View.Library, label: 'B-Roll Library', icon: 'library' },
  ];

  const getNavItemClass = (view: View) => {
    const baseClasses = 'flex items-center gap-2 px-4 py-2 rounded-md transition-colors duration-200 text-sm md:text-base';
    if (currentView === view) {
      return `${baseClasses} bg-indigo-600 text-white shadow-lg`;
    }
    return `${baseClasses} text-gray-300 hover:bg-gray-700`;
  };

  return (
    <header className="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10 p-4 shadow-xl">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                 <Icon name="logo" className="w-6 h-6 text-white"/>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">B-Roll Studio <span className="text-indigo-400">AI</span></h1>
        </div>
        <nav className="flex items-center bg-gray-900 p-1.5 rounded-lg">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setView(item.id)} className={getNavItemClass(item.id)}>
              <Icon name={item.icon} className="w-5 h-5" />
              <span className="hidden md:inline">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
