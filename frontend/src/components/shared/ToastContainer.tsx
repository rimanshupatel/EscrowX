import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-[12px] border bg-white/90 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:bg-slate-900/90 dark:border-slate-800 ${
              toast.type === 'success'
                ? 'border-emerald-200 text-emerald-800 dark:text-emerald-400'
                : toast.type === 'error'
                ? 'border-red-200 text-red-800 dark:text-red-400'
                : 'border-blue-200 text-blue-800 dark:text-blue-400'
            }`}
          >
            {toast.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            )}
            {toast.type === 'error' && (
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            )}
            {toast.type === 'info' && (
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 text-xs font-semibold leading-relaxed text-gray-700 dark:text-gray-300">
              {toast.message}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0 cursor-pointer p-0.5 rounded-[4px] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
