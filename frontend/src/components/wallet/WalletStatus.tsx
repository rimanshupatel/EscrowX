import { useFreighter } from '@/hooks/useFreighter';

export function WalletStatus() {
  const { isConnected, network } = useFreighter();

  if (!isConnected) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Pulse Green Dot */}
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A865] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#16A865]"></span>
      </span>

      {/* Network Badge */}
      {network && (
        <span
          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[4px] border transition-all duration-200 ${
            network === 'Mainnet'
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40'
              : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40'
          }`}
        >
          {network}
        </span>
      )}
    </div>
  );
}
