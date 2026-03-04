
import React, { useState, useEffect, useMemo } from 'react';
import { Bell, ShieldAlert, CheckCircle2, Info, X, Trash2, Clock, Check, ChevronRight, Filter } from 'lucide-react';
import { dataService } from '../services/dataService';
import { Notification, User } from '../types';

interface Props {
  user: User;
  onNavigate?: (tab: string) => void;
}

const NotificationCenter: React.FC<Props> = ({ user, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    const updateNotifs = () => {
      const allNotifs = dataService.getNotifications();
      // Only care about notifications meant for this user or global ones
      const current = allNotifs.filter(n => !n.userId || n.userId === user.id);

      if (current.some(n => !n.isRead && !notifications.find(prev => prev.id === n.id))) {
        setHasNew(true);
      }
      setNotifications(current);
    };

    updateNotifs();
    const interval = setInterval(updateNotifs, 3000);
    return () => clearInterval(interval);
  }, [notifications, user.id]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const displayedNotifications = useMemo(() => {
    return filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;
  }, [notifications, filter]);

  const maxPriority = useMemo(() => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.some(n => n.priority === 'high')) return 'high';
    if (unread.some(n => n.priority === 'medium')) return 'medium';
    return 'low';
  }, [notifications]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasNew(false);
  };

  const handleMarkRead = (id: string) => {
    dataService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllRead = () => {
    dataService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearAll = () => {
    // Note: This clears the global store in our simple dataService.
    // In a real app, this would only clear current user's.
    dataService.clearNotifications();
    setNotifications([]);
    setIsOpen(false);
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-emerald-500" size={16} />;
      case 'warning': return <ShieldAlert className="text-amber-500" size={16} />;
      case 'error': return <ShieldAlert className="text-rose-500" size={16} />;
      case 'admin': return <Bell className="text-indigo-500" size={16} />;
      default: return <Info className="text-indigo-500" size={16} />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high': return 'bg-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.5)]';
      case 'medium': return 'bg-amber-500';
      default: return 'bg-indigo-500';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className={`p-2.5 md:p-4 rounded-xl md:rounded-2xl transition-all shadow-sm border border-white relative ${unreadCount > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-white/50 text-slate-500 hover:text-indigo-600 hover:bg-white'
          }`}
      >
        <Bell size={18} className={unreadCount > 0 ? 'animate-bounce' : ''} />
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 text-white text-[8px] md:text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white ${maxPriority === 'high' ? 'bg-rose-600' : 'bg-indigo-600'
            }`}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/5 backdrop-blur-[1px]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-4 w-[320px] md:w-[420px] z-[70] animate-in slide-in-from-top-4 duration-300">
            <div className="glass-glossy rounded-[2.5rem] border border-white shadow-2xl overflow-hidden flex flex-col max-h-[600px]">
              {/* Header */}
              <div className="p-6 bg-white/20 border-b border-white/40">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      Notifications
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">System Connected</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleMarkAllRead}
                      className="p-2 text-slate-400 hover:text-indigo-600 transition-colors bg-white/50 rounded-lg border border-white"
                      title="Mark All Read"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={clearAll}
                      className="p-2 text-slate-400 hover:text-rose-500 transition-colors bg-white/50 rounded-lg border border-white"
                      title="Clear All"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-white/30 p-1 rounded-xl border border-white/50">
                  <button
                    onClick={() => setFilter('all')}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all relative ${filter === 'unread' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    Unread
                    {unreadCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-600 text-white rounded-full text-[7px]">{unreadCount}</span>}
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {displayedNotifications.length > 0 ? displayedNotifications.map((notif, idx) => (
                  <div
                    key={notif.id}
                    onClick={() => handleMarkRead(notif.id)}
                    className={`p-4 rounded-2xl border transition-all animate-stagger relative group cursor-pointer ${notif.isRead
                        ? 'bg-white/30 border-white/40'
                        : 'bg-white border-indigo-100 shadow-md hover:shadow-indigo-100/50'
                      }`}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex gap-4 items-start">
                      <div className="mt-1 shrink-0 relative">
                        {getIcon(notif.type)}
                        {!notif.isRead && (
                          <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white ${getPriorityColor(notif.priority)}`}></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-[8px] font-black uppercase tracking-widest ${notif.isRead ? 'text-slate-400' : 'text-indigo-600'}`}>
                            {notif.type} • {notif.priority} priority
                          </span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Clock size={8} />
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className={`text-[10px] md:text-[11px] leading-relaxed ${notif.isRead ? 'text-slate-500' : 'text-slate-800 font-bold'}`}>
                          {notif.message}
                        </p>

                        {notif.actionTab && !notif.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkRead(notif.id);
                              onNavigate?.(notif.actionTab!);
                              setIsOpen(false);
                            }}
                            className="mt-3 flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-black text-[9px] uppercase tracking-widest group/btn"
                          >
                            {notif.actionLabel || 'View Details'}
                            <ChevronRight size={10} className="group-hover/btn:translate-x-0.5 transition-transform" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-24 text-center space-y-4 opacity-20">
                    <Filter size={40} className="mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No notifications</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-white/20 border-t border-white/40 text-center">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">End of Notifications</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
