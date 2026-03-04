
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, ShieldAlert, CheckCircle2, Info, X } from 'lucide-react';
import { dataService } from '../services/dataService';
import { Notification, User } from '../types';

interface Props {
  user: User | null;
}

const ToastManager: React.FC<Props> = ({ user }) => {
  const [toasts, setToasts] = useState<Notification[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const unsubscribe = dataService.subscribeToNotifications((notif) => {
      // Show toast if it is global OR matches current user
      if (!notif.userId || (user && notif.userId === user.id)) {
        setToasts((prev) => [...prev, notif]);
        setTimeout(() => removeToast(notif.id), 5000);
      }
    });

    return unsubscribe;
  }, [user?.id, removeToast]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-emerald-500" size={18} />;
      case 'warning': return <ShieldAlert className="text-amber-500" size={18} />;
      case 'error': return <ShieldAlert className="text-rose-500" size={18} />;
      default: return <Info className="text-indigo-500" size={18} />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none w-full max-w-[350px]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 rounded-2xl p-4 space-y-2 border border-white shadow-lg flex items-start gap-4 animate-stagger relative overflow-hidden group"
        >
          <div className="mt-0.5 shrink-0">
            {getIcon(toast.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{toast.type}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-300 hover:text-slate-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <p className="font-bold text-xs text-slate-800 tracking-tight leading-tight">
              {toast.message}
            </p>
          </div>
          {/* Subtle Progress Bar */}
          <div className="absolute bottom-0 left-0 h-1 bg-slate-100 w-full">
            <div
              className={`h-full animate-progress ${toast.type === 'success' ? 'bg-emerald-500' :
                  toast.type === 'error' ? 'bg-rose-500' : 'bg-indigo-600'
                }`}
            ></div>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-progress {
          animation: progress 5s linear forwards;
        }
      `}</style>
    </div>
  );
};

export default ToastManager;
