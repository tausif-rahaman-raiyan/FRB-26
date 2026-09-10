interface CircularProgressProps {
  completed: number;
  total: number;
  size?: 'sm' | 'lg';
}

export function CircularProgress({ completed, total, size = 'sm' }: CircularProgressProps) {
  const percentage = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const isLarge = size === 'lg';
  const radius = isLarge ? 45 : 16;
  const strokeWidth = isLarge ? 8 : 3;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`flex items-center ${isLarge ? 'flex-col space-y-4' : 'space-x-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm'}`}>
      <div className={`relative flex items-center justify-center ${isLarge ? 'w-32 h-32' : 'w-9 h-9'}`}>
        <svg className="w-full h-full transform -rotate-90 filter drop-shadow-lg">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-800"
            fill="transparent"
          />
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="url(#progress-gradient)"
            strokeWidth={strokeWidth}
            className="transition-all duration-1000 ease-out"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`${isLarge ? 'text-3xl font-extrabold text-white' : 'text-[10px] font-bold text-white'}`}>
            {percentage}%
          </span>
        </div>
      </div>
      <div className={`${isLarge ? 'text-center' : 'text-xs text-slate-300 font-medium'}`}>
        {isLarge && <div className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Completed</div>}
        <span className={`font-bold ${isLarge ? 'text-2xl text-white' : 'text-cyan-400'}`}>{completed}</span>
        <span className={isLarge ? 'text-lg text-slate-500 mx-1' : 'text-slate-500 mx-1'}>/</span>
        <span className={isLarge ? 'text-lg text-slate-400' : 'text-slate-400'}>{total}</span>
        {!isLarge && " Done"}
      </div>
    </div>
  );
}
