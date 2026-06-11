import React, { useState } from 'react';
import { Sparkles, Trophy, Flame } from 'lucide-react';

export default function StarterApp() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-radial from-slate-900 to-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
      
      <div className="relative z-10 flex flex-col items-center max-w-md mx-auto">
        <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 mb-6 animate-pulse">
          <Sparkles className="w-8 h-8" />
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-200 via-slate-100 to-indigo-200 bg-clip-text text-transparent mb-3">
          React Sandbox Starter
        </h1>
        
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          Your uploaded project will run live in this preview. Direct structural edits made here or by the AI assistant will render immediately!
        </p>

        <div className="flex items-center gap-6 mb-8 px-6 py-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-medium text-slate-300">Live Previewing</span>
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <button
            onClick={() => setCount(prev => prev + 1)}
            className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all duration-200 cursor-pointer"
          >
            Clicks: {count}
          </button>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-indigo-400/80" />
          <span>Upload a ZIP in the panel above to swap with your own app!</span>
        </div>
      </div>
    </div>
  );
}
