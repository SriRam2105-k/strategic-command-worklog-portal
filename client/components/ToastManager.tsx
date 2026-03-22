
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
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-4 pointer-events-none w-full max-w-[380px]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto bg-white/90 backdrop-blur-2xl rounded-2xl p-5 border-l-4 shadow-2xl flex items-start gap-4 animate-in slide-in-from-right-8 duration-500 relative overflow-hidden group ${
            toast.type === 'error' ? 'border-rose-500 shadow-rose-500/10' :
            toast.type === 'warning' ? 'border-amber-500 shadow-amber-500/10' :
            toast.type === 'success' ? 'border-emerald-500 shadow-emerald-500/10' :
            'border-indigo-600 shadow-indigo-500/10'
          }`}
        >
          <div className={`mt-1 shrink-0 p-2 rounded-xl scale-110 ${
            toast.type === 'error' ? 'bg-rose-50' :
            toast.type === 'warning' ? 'bg-amber-50' :
            toast.type === 'success' ? 'bg-emerald-50' :
            'bg-indigo-50'
          }`}>
            {getIcon(toast.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1.5">
              <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${
                toast.type === 'error' ? 'text-rose-600' :
                toast.type === 'warning' ? 'text-amber-600' :
                toast.type === 'success' ? 'text-emerald-600' :
                'text-indigo-600'
              }`}>{toast.type}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg"
              >
                <X size={14} />
              </button>
            </div>
            <p className="font-extrabold text-[13px] text-slate-800 tracking-tight leading-snug">
              {toast.message}
            </p>
          </div>
          {/* Subtle Progress Bar */}
          <div className="absolute bottom-0 left-0 h-1 bg-slate-100/50 w-full">
            <div
              className={`h-full animate-progress ${
                toast.type === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                toast.type === 'error' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 
                'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]'
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
