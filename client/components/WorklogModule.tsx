
import React, { useState, useMemo } from 'react';
import { ChevronRight, ArrowRight, FileText } from 'lucide-react';
import { User, UserRole } from '../types';
import { dataService } from '../services/dataService';

interface Props {
  user: User;
}

const WorklogModule: React.FC<Props> = ({ user }) => {
  const [content, setContent] = useState('');
  const [hours, setHours] = useState(1);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [showArchive, setShowArchive] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchId, setSearchId] = useState('');

  // Fix: UserRole.ADMIN does not exist, using UserRole.COMMANDER
  const isAdmin = user.role === UserRole.ADMIN;
  const activeProjects = dataService.getProjects().filter(p => p.status === 'ACTIVE');

  const getTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const hrs = diff / (1000 * 60 * 60);
    if (hrs < 1) return `${Math.floor(diff / (1000 * 60))}M AGO`;
    if (hrs < 24) return `${hrs.toFixed(1)}H AGO`;
    return `${Math.floor(hrs / 24)}D AGO`;
  };

  let logs = useMemo(() => {
    let filtered = dataService.getWorklogs().filter(l => isAdmin ? true : l.studentId === user.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (isAdmin) {
      if (filterDate) filtered = filtered.filter(l => l.date === filterDate);
      if (searchId.trim()) {
        const targetIds = dataService.getUsers().filter(u => u.rollNumber.toLowerCase().includes(searchId.toLowerCase())).map(u => u.id);
        filtered = filtered.filter(l => targetIds.includes(l.studentId));
      }
    }
    return filtered;
  }, [isAdmin, user.id, filterDate, searchId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content || !selectedProjectId) return;
    dataService.submitWorklog({ studentId: user.id, projectId: selectedProjectId, date: new Date().toISOString().split('T')[0], content, hours });
    dataService.logAction(user.id, user.name, `Worklog Submitted`, "Worklogs");
    setContent('');
    setSelectedProjectId('');
  };

  if (isAdmin) {
    return (
      <div className="space-y-6 md:space-y-10 py-4 animate-stagger">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 glass-glossy p-6 md:p-10 rounded-[2.5rem] border border-white shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white"><FileText size={20} /></div>
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 uppercase">Worklog <span className="text-indigo-600">History</span></h2>
            </div>
            <p className="text-slate-500 font-bold text-[10px] uppercase-tracking">Reviewing all submitted logs</p>
          </div>
          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
            <input type="text" placeholder="ROLL NUMBER..." value={searchId} onChange={(e) => setSearchId(e.target.value)} className="flex-1 min-w-[120px] px-6 py-3 bg-white border rounded-xl text-[10px] font-black uppercase outline-none" />
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="px-6 py-3 bg-white border rounded-xl text-[10px] font-black uppercase outline-none" />
          </div>
        </div>
        <div className="space-y-6">
          {logs.map((log) => {
            const student = dataService.getUsers().find(u => u.id === log.studentId);
            return (
              <div key={log.id} className="glass-glossy p-6 md:p-8 rounded-[2.5rem] border border-white/60">
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  <div className="flex items-center gap-4 min-w-[200px]">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black">{student?.name[0]}</div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black uppercase truncate">{student?.name}</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{student?.rollNumber}</p>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[8px] font-black uppercase tracking-widest">{log.hours} HOURS • {getTimeAgo(log.timestamp)}</span>
                    <p className="text-sm font-medium text-slate-700 italic leading-relaxed">"{log.content}"</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-8 animate-stagger">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 uppercase">Daily <span className="text-indigo-600">Worklog</span></h2>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
          <button onClick={() => setShowArchive(false)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!showArchive ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-500'}`}>Form</button>
          <button onClick={() => setShowArchive(true)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showArchive ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-500'}`}>Past Logs</button>
        </div>
      </div>

      {!showArchive ? (
        <div className="glass-glossy p-6 md:p-14 rounded-[2.5rem] shadow-2xl border border-white">
          <form onSubmit={handleSubmit} className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="px-8 py-6 rounded-2xl border-2 border-slate-100 font-black text-xs uppercase outline-none focus:border-blue-600 transition-all">
                <option value="">SELECT PROJECT</option>
                {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" value={hours} onChange={(e) => setHours(parseFloat(e.target.value))} className="px-8 py-6 rounded-2xl border-2 border-slate-100 font-black text-xs outline-none focus:border-blue-600 transition-all" />
            </div>
            <textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} placeholder="ENTER WORK DETAILS..." className="w-full px-10 py-8 rounded-[2rem] border-2 border-slate-100 font-bold text-slate-700 outline-none focus:border-blue-600 transition-all text-sm" />
            <button type="submit" className="w-full py-8 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-[2.5rem] font-black text-[11px] uppercase shadow-xl hover:bg-slate-950 transition-all flex items-center justify-center gap-4 group">SUBMIT WORKLOG <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" /></button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          {logs.map((log) => (
            <div key={log.id} className="glass-glossy p-8 rounded-[2.5rem] border border-white">
              <div className="flex justify-between items-center mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">LOGGED {getTimeAgo(log.timestamp)}</p>
                <span className="px-4 py-1.5 bg-indigo-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest">{log.hours} HOURS</span>
              </div>
              <p className="text-slate-800 text-sm md:text-lg font-bold italic leading-relaxed">"{log.content}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorklogModule;
