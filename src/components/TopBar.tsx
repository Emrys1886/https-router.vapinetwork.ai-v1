import { Menu, Plus } from 'lucide-react';
import type { ActiveView } from '../types/router';

interface TopBarProps {
  activeView: ActiveView;
  onChangeView: (view: ActiveView) => void;
  onNewThread: () => void;
  onToggleMobileSidebar: () => void;
}

const NAV_ITEMS: Array<{ id: ActiveView; label: string }> = [
  { id: 'playground', label: 'Playground' },
  { id: 'sdk', label: 'SDK Code' },
  { id: 'history', label: 'History' },
  { id: 'docs', label: 'Endpoint' },
];

export function TopBar({
  activeView,
  onChangeView,
  onNewThread,
  onToggleMobileSidebar,
}: TopBarProps) {
  return (
    <header className="flex items-center justify-between gap-8 px-5 lg:px-6 h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle workspace sidebar"
          className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <Menu className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onChangeView('playground')}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
        >
          vAPI Router
        </button>
      </div>

      <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeView(item.id)}
              className={`relative py-4 whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 ${
                isActive
                  ? 'text-slate-900 dark:text-slate-100'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {item.label}
              {isActive && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600 dark:bg-blue-500" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onNewThread}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <Plus className="w-3.5 h-3.5" />
          New Thread
        </button>
      </div>
    </header>
  );
}
