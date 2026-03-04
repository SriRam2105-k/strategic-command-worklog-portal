
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Play, Square, History, Zap, Download, Target, Activity, BarChart3, Search, X, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { User, UserRole, AttendanceStatus, AttendanceRecord } from '../types';
import { dataService } from '../services/dataService';
import { exportToCSV } from '../services/exportService';

interface Props {
  user: User;
  onStatusChange: (status: AttendanceStatus) => void;
  onSelectUser?: (userId: string) => void;
}

const AttendanceModule: React.FC<Props> = ({ user, onStatusChange, onSelectUser }) => {
  const [sessionTime, setSessionTime] = useState(0);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [searchId, setSearchId] = useState('');
  // Fix: UserRole.ADMIN does not exist, using UserRole.COMMANDER
  const isAdmin = user.role === UserRole.ADMIN;

  const todayStr = new Date().toISOString().split('T')[0];

  const hasSubmittedToday = useMemo(() => {
    return dataService.getWorklogs().some(l => l.studentId === user.id && l.date === todayStr);
  }, [user.id, todayStr]);

  useEffect(() => {
    setRecords(dataService.getAttendance());
    let interval: any;
    if (user.status === AttendanceStatus.ONLINE) {
      const record = dataService.getAttendance().find(a => a.studentId === user.id && a.date === todayStr);
      if (record) {
        const login = new Date(record.loginTime).getTime();
        interval = setInterval(() => {
          setSessionTime(Math.floor((Date.now() - login) / 1000));
        }, 1000);
      }
    } else {
      setSessionTime(0);
    }
    return () => clearInterval(interval);
  }, [user.status, user.id, todayStr]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleLogin = () => {
    onStatusChange(AttendanceStatus.ONLINE);
    dataService.logAction(user.id, user.name, "Attendance: Login", "Attendance");
  };

  const handleLogout = () => {
    if (!hasSubmittedToday) {
      dataService.addNotification({ type: 'error', message: 'NOTICE: Please submit worklog before logout.', priority: 'high', actionTab: 'worklogs', actionLabel: 'GO TO WORKLOGS' });
      return;
    }
    onStatusChange(AttendanceStatus.OFFLINE);
    dataService.logAction(user.id, user.name, "Attendance: Logout", "Attendance");
  };

  const filteredUsers = useMemo(() => {
    // Fix: UserRole.STUDENT does not exist, using UserRole.OPERATIVE
    const students = dataService.getUsers().filter(u => u.role === UserRole.STUDENT);
    if (!searchId.trim()) return students;
    return students.filter(s => s.rollNumber.toLowerCase().includes(searchId.toLowerCase()));
  }, [searchId]);

  if (isAdmin) {
    // Fix: UserRole.STUDENT does not exist, using UserRole.OPERATIVE
    const allStudents = dataService.getUsers().filter(u => u.role === UserRole.STUDENT);
    const onlineCount = allStudents.filter(s => s.status === AttendanceStatus.ONLINE).length;

    return (
      <div className="space-y-6 md:space-y-12 animate-stagger pb-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center glass-glossy p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] gap-6">
          <div className="flex-1">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter-custom uppercase">Attendance System</h2>
            <p className="text-slate-600 font-bold text-[9px] md:text-xs uppercase-tracking mt-1">Real-time Presence Monitoring</p>
          </div>
          <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-4">
            <div className="relative group w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="ROLL NUMBER SEARCH..." value={searchId} onChange={(e) => setSearchId(e.target.value)} className="w-full pl-11 pr-10 py-3 md:py-4 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase focus:border-blue-500 transition-all outline-none" />
            </div>
            <button onClick={() => exportToCSV(filteredUsers, 'Attendance_Roster')} className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-slate-950 text-white text-[9px] md:text-[10px] font-black uppercase rounded-xl shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3"><Download size={16} /> Export</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
          <StatusMetric label="Online Students" value={onlineCount} total={allStudents.length} color="blue" icon={<Activity size={20} />} />
          <StatusMetric label="Check-in Status" value={`${Math.round((allStudents.length > 0 ? onlineCount / allStudents.length : 0) * 100)}%`} total="Active" color="emerald" icon={<Zap size={20} />} />
          <StatusMetric label="System Status" value="Online" total="Nominal" color="indigo" icon={<Target size={20} />} />
        </div>

        <div className="glass-glossy rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden bg-white border border-slate-100 shadow-xl">
          <div className="p-6 md:p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3"><History size={18} className="text-indigo-600" /> Student Roster</h3>
            <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredUsers.length} Recorded</span>
          </div>
          <div className="divide-y divide-slate-100">
            {filteredUsers.map((student) => (
              <div key={student.id} className="p-6 md:p-8 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-sm group-hover:bg-indigo-600 transition-colors">
                    {student.name[0]}
                  </div>
                  <div>
                    <h4 className="text-sm md:text-lg font-black text-slate-900 uppercase tracking-tight">{student.name}</h4>
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">{student.rollNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`px-4 md:px-6 py-2 md:py-3 rounded-xl border flex items-center gap-2 transition-all ${student.status === AttendanceStatus.ONLINE ? 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                    <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${student.status === AttendanceStatus.ONLINE ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                    <span className="text-[9px] md:text-[11px] font-black uppercase tracking-widest">{student.status}</span>
                  </div>
                  <button onClick={() => onSelectUser?.(student.id)} className="p-2 md:p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"><BarChart3 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 py-4 md:py-8 animate-stagger">
      <div className="text-center space-y-2 md:space-y-4">
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter-custom uppercase">Attendance <span className="text-indigo-600">Check-In</span></h2>
        <p className="text-slate-500 font-bold text-xs md:text-sm uppercase-tracking">Login to begin session</p>
      </div>
      <div className="glass-glossy p-8 md:p-16 rounded-[3rem] md:rounded-[5rem] shadow-2xl border border-white text-center relative overflow-hidden group">
        <div className="relative z-10 space-y-8 md:space-y-12">
          <div className="flex flex-col items-center gap-4 md:gap-6">
            <div className={`w-24 h-24 md:w-32 md:h-32 rounded-[2rem] md:rounded-[3rem] flex items-center justify-center transition-all duration-700 ${user.status === AttendanceStatus.ONLINE ? 'bg-emerald-500 shadow-glow-blue scale-110' : 'bg-slate-900 shadow-2xl'}`}>
              {user.status === AttendanceStatus.ONLINE ? <Activity size={40} className="text-white animate-pulse" /> : <Clock size={40} className="text-white" />}
            </div>
            <div>
              <p className="text-[10px] md:text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Session Duration</p>
              <h3 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter tabular-nums">{formatTime(sessionTime)}</h3>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6">
            {user.status !== AttendanceStatus.ONLINE ? (
              <button onClick={handleLogin} className="w-full sm:w-64 py-5 md:py-8 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3"><Play size={20} fill="currentColor" /> LOGIN</button>
            ) : (
              <button onClick={handleLogout} className={`w-full sm:w-64 py-5 md:py-8 text-white rounded-2xl font-black text-xs uppercase shadow-xl transition-all flex items-center justify-center gap-3 ${hasSubmittedToday ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-400 cursor-not-allowed opacity-80'}`}><Square size={20} fill="currentColor" /> LOGOUT</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusMetric: React.FC<{ label: string, value: string | number, total: string | number, color: 'blue' | 'emerald' | 'indigo', icon: React.ReactNode }> = ({ label, value, total, color, icon }) => (
  <div className="glass-glossy p-6 md:p-10 rounded-[2.5rem] border border-white hover:shadow-2xl transition-all group flex items-center justify-between">
    <div className="space-y-1">
      <p className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="flex items-baseline gap-2">
        <h4 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">{value}</h4>
        <span className="text-[10px] md:text-xs font-bold text-slate-400">/ {total}</span>
      </div>
    </div>
    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center shadow-lg ${color === 'blue' ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white' : color === 'emerald' ? 'bg-emerald-500 text-white' : 'bg-gradient-to-br from-cyan-600 to-cyan-700 text-white'}`}>
      {icon}
    </div>
  </div>
);

export default AttendanceModule;
