import React from 'react';
import { Home, Search, ScanLine, LayoutGrid, Bot } from 'lucide-react';

export default function BottomNav({ activeTab, onSelectTab, onOpenScanner }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-oatmeal-dark shadow-lg">
      <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-around relative">
        
        {/* Tab 1: Home */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'home' ? 'text-forest font-bold' : 'text-slate hover:text-walnut'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${activeTab === 'home' ? 'bg-forest-soft' : ''}`}>
            <Home size={19} />
          </div>
          <span className="text-[10px] font-mono leading-none">Home</span>
        </button>

        {/* Tab 2: Search */}
        <button
          onClick={() => onSelectTab('search')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'search' ? 'text-forest font-bold' : 'text-slate hover:text-walnut'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${activeTab === 'search' ? 'bg-forest-soft' : ''}`}>
            <Search size={19} />
          </div>
          <span className="text-[10px] font-mono leading-none">Search</span>
        </button>

        {/* Floating Center Scanner Button */}
        <div className="relative -mt-6">
          <button
            onClick={onOpenScanner}
            className="w-14 h-14 rounded-full bg-terracotta hover:bg-terracotta-hover text-white flex items-center justify-center shadow-lg shadow-terracotta/40 hover:scale-105 active:scale-95 transition-all border-3 border-white group"
          >
            <ScanLine size={24} className="group-hover:rotate-12 transition-transform" />
          </button>
        </div>

        {/* Tab 3: Categories */}
        <button
          onClick={() => onSelectTab('categories')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'categories' ? 'text-forest font-bold' : 'text-slate hover:text-walnut'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${activeTab === 'categories' ? 'bg-forest-soft' : ''}`}>
            <LayoutGrid size={19} />
          </div>
          <span className="text-[10px] font-mono leading-none">Categories</span>
        </button>

        {/* Tab 4: BiteBot AI */}
        <button
          onClick={() => onSelectTab('bot')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'bot' ? 'text-forest font-bold' : 'text-slate hover:text-walnut'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${activeTab === 'bot' ? 'bg-forest-soft' : ''}`}>
            <Bot size={19} />
          </div>
          <span className="text-[10px] font-mono leading-none">BiteBot</span>
        </button>

      </div>
    </div>
  );
}
