import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function NotificationToast() {
  const { notifications, removeNotification } = useProject();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {notifications.map((n) => {
        const isSuccess = n.type === 'success';
        const isError = n.type === 'error';

        return (
          <div
            key={n.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border glass-modal shadow-2xl transition-all duration-300 animate-slide-up ${
              isSuccess
                ? 'border-emerald-500/40 text-emerald-200'
                : isError
                ? 'border-rose-500/40 text-rose-200'
                : 'border-cyan-500/40 text-cyan-200'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {isError && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {!isSuccess && !isError && <Info className="w-4 h-4 text-cyan-400" />}
            </div>

            <div className="flex-1 text-xs font-medium leading-relaxed">
              {n.message}
            </div>

            <button
              onClick={() => removeNotification(n.id)}
              className="text-slate-400 hover:text-white transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
