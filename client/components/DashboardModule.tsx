

import React, { useMemo } from 'react';
import { User, UserRole, AttendanceStatus } from '../types';
import { dataService } from '../services/dataService';
import {
  Zap,
  Target,
  Users,
  Clock,
  Activity,
  LayoutGrid,
  TrendingUp,
  Award,
  ShieldCheck,
  Server,
  Globe,
  Cpu,
  Trophy
} from 'lucide-react';
import UserProfileCard from './UserProfileCard';
import ProgressTracker from './ProgressTracker';
import ActivityFeed from './ActivityFeed';
import TeamCollaborationPanel from './TeamCollaborationPanel';
import CalendarWidget from './CalendarWidget';
import ActivityTimeline from './ActivityTimeline';

interface Props {
  user: User;
  onNavigate?: (tab: string) => void;
  onSelectUser?: (userId: string) => void;
}

const DashboardModule: React.FC<Props> = ({ user, onNavigate, onSelectUser }) => {
  // Fix: UserRole.ADMIN does not exist, using UserRole.COMMANDER
  const isAdmin = user.role === UserRole.ADMIN;

  const team = dataService.getTeams().find(t => t.id === user.teamId);
  const project = dataService.getProjects().find(p => p.id === team?.projectId);
  const teamMembers = dataService.getUsers().filter(u => team?.studentIds.includes(u.id));
  const myLogs = dataService.getWorklogs().filter(l => l.studentId === user.id);
  const totalHours = dataService.getUserTotalActivity(user.id);
  const recentLogs = myLogs.slice(-5).reverse();
  const rank = useMemo(() => dataService.calculateUserRank(user), [user, myLogs]);

  const getTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const hrs = diff / (1000 * 60 * 60);
    if (hrs < 1) return `${Math.floor(diff / (1000 * 60))}M AGO`;
    if (hrs < 24) return `${hrs.toFixed(1)}H AGO`;
    return `${Math.floor(hrs / 24)}D AGO`;
  };

  // ... (keeping progress logic same)

  const allUsers = dataService.getUsers();
  const allProjects = dataService.getProjects();
  const allLogs = dataService.getWorklogs();
  // Fix: UserRole.STUDENT does not exist, using UserRole.OPERATIVE
  const activeStudents = allUsers.filter(u => u.status === AttendanceStatus.ONLINE && u.role === UserRole.STUDENT);
  const globalRecentLogs = allLogs.slice(-8).reverse();

  return (
    <div className="space-y-6 md:space-y-12 py-2 md:py-6 pb-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 md:gap-8 animate-stagger">
        <div className="space-y-1.5 md:space-y-3">
          <div className="flex items-center gap-3 md:gap-4">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-white shrink-0 ${isAdmin ? 'bg-gradient-to-br from-cyan-600 to-cyan-700 shadow-glow-cyan' : 'bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-glow-indigo'}`}>
              {isAdmin ? <ShieldCheck size={20} /> : <LayoutGrid size={20} />}
            </div>
            <div>
              <h1 className="text-2xl md:text-5xl font-black text-slate-900 tracking-tighter-custom uppercase leading-none">
                {isAdmin ? 'Admin' : 'Student'} <span className={isAdmin ? 'text-cyan-600' : 'text-indigo-600'}>Dashboard</span>
              </h1>
              <p className="text-slate-500 text-[9px] md:text-sm font-semibold mt-0.5 md:mt-1 flex items-center gap-1.5">
                {isAdmin ? <Globe size={12} className="text-cyan-500" /> : <Target size={12} className="text-indigo-500" />}
                {isAdmin ? 'SYSTEM OVERVIEW' : `Team: ${team?.name || 'NONE'} • Roll No: ${user.rollNumber}`}
              </p>
            </div>
          </div>
        </div>

        {isAdmin ? (
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-3 md:p-4 px-5 md:px-8 rounded-2xl md:rounded-[2rem] shadow-2xl border border-cyan-500/20 flex items-center gap-4" >
            <Server size={20} className="text-cyan-400" />
            <div className="text-left">
              <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-70">System</p>
              <p className="text-sm md:text-lg font-black tracking-tight uppercase text-emerald-400">ONLINE</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 md:gap-5 bg-gradient-to-br from-indigo-700 to-indigo-800 text-white p-4 md:p-5 px-6 md:px-10 rounded-2xl md:rounded-[2.5rem] shadow-glow-indigo border border-indigo-500/30 relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
              <Trophy size={40} />
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Award size={24} />
            </div>
            <div className="text-left relative z-10">
              <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Current Rank</p>
              <p className="text-sm md:text-xl font-black tracking-tight uppercase">{rank.title}</p>
              <div className="flex gap-0.5 mt-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`h-1 w-4 rounded-full ${i < rank.level ? 'bg-indigo-400' : 'bg-white/10'}`}></div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div >

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        <MetricCard label={isAdmin ? "Total Students" : "Total Activity"} value={isAdmin ? allUsers.length.toString() : `${totalHours}h`} sub={isAdmin ? "Enrolled" : "Combined Effort"} icon={isAdmin ? <Users size={18} /> : <Clock size={18} />} color={isAdmin ? "cyan" : "indigo"} delay="delay-100" />
        <MetricCard label={isAdmin ? "Online" : "Worklogs"} value={isAdmin ? activeStudents.length.toString() : myLogs.length.toString()} sub={isAdmin ? "Active Now" : "Submitted"} icon={isAdmin ? <Activity size={18} /> : <TrendingUp size={18} />} color={isAdmin ? "emerald" : "cyan"} delay="delay-200" />
        <MetricCard label={isAdmin ? "Active Projects" : "System"} value={isAdmin ? allProjects.length.toString() : "Online"} sub={isAdmin ? "Ongoing" : "Status"} icon={isAdmin ? <Target size={18} /> : <Zap size={18} />} color={isAdmin ? "indigo" : "emerald"} delay="delay-300" />
        <MetricCard label={isAdmin ? "Sync Status" : "Status"} value={isAdmin ? "Active" : user.status} sub={isAdmin ? "Verified" : "Current"} icon={isAdmin ? <Cpu size={18} /> : <Activity size={18} />} color="slate" delay="delay-400" />
      </div>

      {/* New Widget Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-1">
          <UserProfileCard user={user} />
        </div>
        <div className="lg:col-span-2">
          <ProgressTracker user={user} />
        </div>
      </div>

      {/* Activity and Team Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <ActivityFeed user={user} />
        {user.role === UserRole.STUDENT && onNavigate && (
          <TeamCollaborationPanel user={user} onNavigate={onNavigate} />
        )}
        {user.role === UserRole.ADMIN && (
          <CalendarWidget user={user} onNavigate={onNavigate || (() => { })} />
        )}
      </div>

      {/* Calendar and Timeline Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {user.role === UserRole.STUDENT && onNavigate && (
          <div className="lg:col-span-1">
            <CalendarWidget user={user} onNavigate={onNavigate} />
          </div>
        )}
        <div className={user.role === UserRole.STUDENT ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <ActivityTimeline user={user} limit={8} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        <div className="lg:col-span-8 space-y-6 md:space-y-10 animate-stagger delay-100">
          <div className="glass-panel p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] relative overflow-hidden group border border-white">
            <div className={`absolute top-0 right-0 w-[200px] md:w-[500px] h-[200px] md:h-[500px] rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl opacity-60 ${isAdmin ? 'bg-cyan-600/10' : 'bg-indigo-600/10'}`}></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6 md:mb-12">
                <div className="space-y-1 md:space-y-2">
                  <p className={`text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] ${isAdmin ? 'text-cyan-600' : 'text-indigo-600'}`}>
                    {isAdmin ? 'System Progress' : 'Project Status'}
                  </p>
                  <h2 className="text-xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-tight md:leading-[0.95]">
                    {isAdmin ? 'Performance' : (project?.name || 'Assigned Project')}
                  </h2>
                </div>
              </div>

              <div className="glass-panel p-6 md:p-10 rounded-[2rem] md:rounded-[3.5rem] border border-white">
                <div className="flex items-center justify-between mb-6 md:mb-10 px-2">
                  <h3 className="text-[9px] md:text-xs font-black text-slate-900 uppercase tracking-[0.3em]">
                    {isAdmin ? 'High Performance Students' : 'Team Members'}
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
                  {/* Fix: UserRole.STUDENT does not exist, using UserRole.OPERATIVE */}
                  {(isAdmin ? allUsers.filter(u => u.role === UserRole.STUDENT).slice(0, 4) : teamMembers).map((member) => (
                    <div key={member.id} onClick={() => isAdmin && onSelectUser?.(member.id)} className={`flex items-center gap-3 md:gap-5 p-4 md:p-6 bg-white/40 rounded-2xl md:rounded-[2.5rem] border border-white transition-all hover:shadow-lg ${isAdmin ? 'cursor-pointer hover:bg-white/60' : 'cursor-default'}`}>
                      <div className="relative shrink-0">
                        <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-3xl flex items-center justify-center font-black text-white ${isAdmin ? 'bg-gradient-to-br from-cyan-600 to-cyan-700' : 'bg-gradient-to-br from-indigo-600 to-indigo-700'}`}>
                          {member.name[0]}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 md:w-6 md:h-6 rounded-full border-[2px] md:border-[4px] border-white ${member.status === AttendanceStatus.ONLINE ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-300'}`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-base font-black text-slate-900 uppercase truncate">{member.name}</p>
                        <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{member.rollNumber}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 h-full animate-stagger delay-200">
            <div className="glass-panel-dark p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] text-white h-full relative overflow-hidden flex flex-col min-h-[350px]">
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6 md:mb-12 pb-4 md:pb-8 border-b border-indigo-500/10">
                  <h3 className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                    <Activity size={16} className={isAdmin ? 'text-cyan-400' : 'text-indigo-400'} /> {isAdmin ? 'System Logs' : 'Recent Activity'}
                  </h3>
                </div>

                <div className="flex-1 space-y-6 md:space-y-12 overflow-y-auto custom-scrollbar">
                  {(isAdmin ? globalRecentLogs : recentLogs).map((log, idx) => (
                    <div key={log.id} className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${isAdmin ? 'text-cyan-400' : 'text-indigo-400'}`}>
                          {isAdmin ? (allUsers.find(u => u.id === log.studentId)?.name.split(' ')[0].toUpperCase() || 'USER') : `LOG_${idx + 1}`}
                        </span>
                        <span className="text-[7px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">{getTimeAgo(log.timestamp)}</span>
                      </div>
                      <div className="p-3.5 md:p-5 bg-white/5 rounded-2xl border border-indigo-500/10 hover:border-indigo-500/20 transition-colors">
                        <p className="text-[11px] md:text-sm font-medium text-slate-300 leading-relaxed line-clamp-2">{log.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<any> = ({ label, value, sub, icon, color, delay }) => (
  <div className={`glass-panel p-5 md:p-10 rounded-2xl md:rounded-[3rem] transition-all animate-stagger border border-white hover:shadow-lg ${delay}`}>
    <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 ${color === 'indigo' ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-glow-indigo' :
      color === 'cyan' ? 'bg-gradient-to-br from-cyan-600 to-cyan-700 text-white shadow-glow-cyan' :
        color === 'emerald' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white' :
          'bg-gradient-to-br from-slate-700 to-slate-800 text-white'
      }`}>
      {icon}
    </div>
    <p className="text-[8px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">{label}</p>
    <p className="text-xl md:text-4xl font-black text-slate-900 uppercase">{value}</p>
    <p className="text-[7px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{sub}</p>
  </div>
);

export default DashboardModule;
