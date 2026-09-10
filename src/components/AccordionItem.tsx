import { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { CircularProgress } from './CircularProgress';

interface AccordionItemProps {
  key?: string;
  title: ReactNode;
  progressInfo?: { completed: number; total: number };
  children: ReactNode;
  isSubject?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  itemRef?: (el: HTMLDivElement | null) => void;
}

export function AccordionItem({
  title,
  progressInfo,
  children,
  isSubject = false,
  isOpen,
  onToggle,
  itemRef,
}: AccordionItemProps) {
  const baseClasses = isSubject
    ? 'bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur-md border border-slate-700/60 shadow-xl rounded-2xl'
    : 'bg-slate-900/50 border border-slate-800/60 rounded-xl';
  const headerClasses = isSubject
    ? 'text-[15px] sm:text-base font-bold text-white'
    : 'text-xs sm:text-sm font-semibold text-slate-200';

  return (
    <div
      ref={itemRef}
      className={`mb-3 overflow-hidden transition-all duration-300 ${baseClasses} ${isOpen ? 'ring-1 ring-cyan-500/20' : ''}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-white/5 transition-colors text-left focus:outline-none ${
          isOpen && isSubject ? 'border-b border-slate-700/50' : ''
        }`}
      >
        <span className={`flex-1 pr-2 ${headerClasses}`}>{title}</span>
        <div className="flex items-center space-x-3 shrink-0">
          {progressInfo && <CircularProgress completed={progressInfo.completed} total={progressInfo.total} />}
          <div
            className={`p-1.5 rounded-full bg-white/5 transition-transform duration-300 ${
              isOpen ? 'bg-cyan-500/20 text-cyan-400 rotate-180' : 'text-slate-400'
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </button>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className={`p-2.5 sm:p-3.5 ${isSubject ? 'bg-slate-950/40' : 'bg-black/20'}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
