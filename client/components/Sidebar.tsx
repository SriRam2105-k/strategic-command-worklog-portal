
import React from 'react';
import { UserRole } from '../types';
import { NAVIGATION } from '../constants';
import { Shield, Activity, X } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, userRole, userName, isOpen, onClose }) => {
  const filteredNav = NAVIGATION.filter(item => item.roles.includes(userRole));

  return (
    <div className={`
      fixed inset-y-0 left-0 w-80 bg-gradient-to-b from-slate-900 to-slate-950 text-white z-50 flex flex-col transition-transform duration-500 ease-in-out border-r border-indigo-500/10
      lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="p-10 md:p-12 mb-4 md:mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-5">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-[1rem] md:rounded-[1.25rem] bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-glow-indigo border border-indigo-500/20">
            <Shield className="text-white" size={28} />
          </div>
          <div>
            <h1 className="font-black text-xl md:text-2xl tracking-tighter-custom leading-tight text-white uppercase">WorkLog</h1>
            <p className="text-[8px] md:text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Portal</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-indigo-400 transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 px-6 md:px-8 overflow-y-auto custom-scrollbar">
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6 md:mb-8 px-4">
            <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Navigation</p>
            <Activity size={14} className="text-indigo-500 animate-pulse" />
          </div>
          <div className="space-y-2 md:space-y-3">
            {filteredNav.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`
                  w-full flex items-center gap-4 md:gap-5 px-5 md:px-6 py-4 md:py-5 rounded-[1.25rem] md:rounded-[1.5rem] 
                  transition-all duration-300 group relative animate-stagger
                  hover:bg-white/5 hover:translate-x-1
                  ${activeTab === item.id ? 'bg-blue-600/10 shadow-[inset_0_0_20px_rgba(37,99,235,0.05)]' : ''}
                `}
                style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
              >
                {activeTab === item.id && (
                  <div className="absolute left-0 w-1 md:w-1.5 h-8 md:h-10 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full shadow-glow-indigo"></div>
                )}
                <span className={`${activeTab === item.id ? 'text-indigo-400 scale-110' : 'text-slate-600 group-hover:text-indigo-300'} transition-all`}>
                  {React.cloneElement(item.icon as React.ReactElement<any>, { size: 18 })}
                </span>
                <span className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest ${activeTab === item.id ? 'text-white translate-x-1' : 'text-slate-500 group-hover:text-slate-300'} transition-all`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 mt-auto">
        <div className="p-5 md:p-6 bg-white/5 rounded-[2rem] md:rounded-[2.5rem] flex items-center gap-4 md:gap-5 border border-indigo-500/20 shadow-inner backdrop-blur-sm">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white font-black text-base shadow-glow-indigo shrink-0">
            {userName[0]}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs md:text-sm font-black text-white truncate tracking-tight">{userName}</p>
            <p className="text-[9px] md:text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">{userRole === UserRole.ADMIN ? 'ADMIN' : 'STUDENT'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
