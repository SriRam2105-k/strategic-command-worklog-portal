
import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie,
  Cell,
  Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { dataService } from '../services/dataService';
import {
  Download,
  Activity,
  Search,
  Target,
  Zap,
  Clock,
  TrendingUp,
  Users,
  Award,
  Calendar,
  Layers,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { exportToCSV } from '../services/exportService';
import { UserRole, AttendanceStatus, User, Worklog, Project, Team } from '../types';

interface Props {
  targetUserId?: string | null;
  onResetTarget?: () => void;
}

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

const AnalyticsModule: React.FC<Props> = ({ targetUserId, onResetTarget }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(targetUserId || null);

  const worklogs = dataService.getWorklogs();
  const allOperatives = dataService.getUsers().filter((u: User) => u.role === UserRole.STUDENT);
  const projects = dataService.getProjects();
  const reviews = dataService.getReviews();
  const teams = dataService.getTeams();

  useEffect(() => {
    if (targetUserId) setSelectedUserId(String(targetUserId));
  }, [targetUserId]);

  const selectedOp = useMemo(() => allOperatives.find((u: User) => u.id === String(selectedUserId)), [selectedUserId, allOperatives]);

  // Data Processing for Charts
  const trendData = useMemo(() => {
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d.toISOString().split('T')[0];
    });

    return last14Days.map(date => {
      const dayLogs = worklogs.filter((l: Worklog) => l.date === date);
      const totalHours = dayLogs.reduce((acc, l) => acc + l.hours, 0);
      const studentCount = new Set(dayLogs.map(l => l.studentId)).size;
      return {
        date: date.split('-').slice(1).join('/'),
        hours: totalHours,
        active: studentCount
      };
    });
  }, [worklogs]);

  const projectEffortData = useMemo(() => {
    const data = projects.map(p => {
      const projectLogs = worklogs.filter((l: Worklog) => l.projectId === p.id);
      const totalHrs = projectLogs.reduce((acc, l) => acc + l.hours, 0);
      return { name: p.name, value: totalHrs };
    }).filter(d => d.value > 0);
    return data.length > 0 ? data : [{ name: 'No Active Data', value: 1 }];
  }, [worklogs, projects]);

  const performanceData = useMemo(() => {
    const data = allOperatives.map(op => {
      const totalHrs = dataService.getUserTotalActivity(op.id);
      return { name: op.name, hours: totalHrs, id: op.id };
    }).sort((a, b) => b.hours - a.hours).slice(0, 5);
    return data;
  }, [allOperatives]);

  const radarData = useMemo(() => {
    // Top 3 Teams Readiness
    return teams.slice(0, 3).map(team => {
      const project = projects.find(p => p.id === team.projectId);
      const milestonesPercent = project ? (project.milestones.filter(m => m.isCompleted).length / (project.milestones.length || 1)) * 100 : 0;
      const teamWorklogs = worklogs.filter(l => team.studentIds.includes(l.studentId));
      const effortScore = Math.min((teamWorklogs.reduce((acc, l) => acc + l.hours, 0) / (team.studentIds.length * 10 || 1)) * 100, 100);

      return {
        subject: team.name,
        Readiness: milestonesPercent,
        Consistency: effortScore,
        Engagement: Math.random() * 50 + 50, // Mocking review data for now
        fullMark: 100,
      };
    });
  }, [teams, projects, worklogs]);

  const heatmapData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 0; i < 70; i++) {
      const d = new Date();
      d.setDate(today.getDate() - (69 - i));
      const dateStr = d.toISOString().split('T')[0];
      const count = worklogs.filter(l => l.date === dateStr).length;
      data.push({ date: dateStr, count });
    }
    return data;
  }, [worklogs]);

  const stats = useMemo(() => {
    const totalHours = selectedOp
      ? dataService.getUserTotalActivity(selectedOp.id)
      : allOperatives.reduce((acc, op) => acc + dataService.getUserTotalActivity(op.id), 0);

    const avgHrs = (totalHours / (selectedOp ? 1 : (allOperatives.length || 1))).toFixed(1);

    const today = new Date().toISOString().split('T')[0];
    const reportedToday = new Set(worklogs.filter(l => l.date === today).map(l => l.studentId)).size;
    const compliance = Math.round((reportedToday / (allOperatives.length || 1)) * 100);

    const highRated = reviews.filter(r => r.studentRating >= 4).length;
    const systemHealth = Math.round((highRated / (reviews.length || 1)) * 100);

    return { totalHours, avgHrs, compliance, systemHealth };
  }, [worklogs, allOperatives, selectedOp, reviews]);

  const handleExport = () => {
    const filename = selectedOp ? `Intel_Op_${selectedOp.rollNumber}` : 'Global_Force_Intel';
    const data = allOperatives.map(op => ({
      ServiceID: op.rollNumber,
      Name: op.name,
      Hours: dataService.getUserTotalActivity(op.id),
      Status: op.status
    }));
    exportToCSV(data, filename);
  };

  return (
    <div className="space-y-6 md:space-y-12 py-4 md:py-6 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 animate-stagger">
        <div className="space-y-1.5">
          <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tighter-custom uppercase">
            {selectedOp ? 'Operative' : 'Strategic'} <span className="text-indigo-600">Intel</span>
          </h2>
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-indigo-500" />
            <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">
              {selectedOp ? `DIRECT TELEMETRY: ID ${selectedOp.rollNumber}` : 'GLOBAL COMMAND OVERVIEW ACTIVE'}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {selectedOp && (
            <button onClick={() => { setSelectedUserId(null); onResetTarget?.(); }} className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-200 transition-all">
              <TrendingUp size={16} /> SHOW GLOBAL
            </button>
          )}
          <div className="relative flex-1 sm:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="SEARCH SERVICE ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 md:py-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest focus:border-indigo-500 outline-none transition-all focus:shadow-lg"
            />
          </div>
          <button onClick={handleExport} className="flex items-center justify-center gap-3 px-8 py-3 md:py-4 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase shadow-xl hover:bg-indigo-600 transition-all">
            <Download size={18} /> EXPORT
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        <StatCard label="Live Compliance" value={`${stats.compliance}%`} sub="Daily reporting rate" icon={<Activity size={20} />} color="indigo" />
        <StatCard label="Effort Average" value={`${stats.avgHrs}h`} sub="Daily mission volume" icon={<Zap size={20} />} color="cyan" />
        <StatCard label="System Vitality" value={`${stats.systemHealth}%`} sub="Review satisfaction" icon={<Activity size={20} />} color="emerald" />
        <StatCard label="Total Output" value={stats.totalHours} sub="Cumulative hours" icon={<Clock size={20} />} color="slate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        <div className="lg:col-span-8 space-y-6 md:space-y-10">
          {/* Mission Intensity Heatmap */}
          <div className="glass-panel p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-white">
            <div className="flex justify-between items-center mb-8">
              <div>
                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Operational Density</p>
                <h3 className="text-xl md:text-3xl font-black text-slate-900 uppercase">Mission Intensity</h3>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-[9px] font-black text-slate-500">
                <Layers size={12} /> 70 DAY CYCLE
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 md:gap-2 justify-center lg:justify-start">
              {heatmapData.map((day, i) => {
                const intensity = day.count === 0 ? 'bg-slate-100' :
                  day.count < 3 ? 'bg-indigo-200' :
                    day.count < 6 ? 'bg-indigo-400' :
                      'bg-indigo-600 shadow-glow-indigo';
                return (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.count} logs`}
                    className={`w-3 h-3 md:w-5 md:h-5 rounded-sm transition-all cursor-crosshair hover:scale-125 ${intensity}`}
                  ></div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {/* Force Readiness Radar */}
            <div className="glass-panel p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-white">
              <div className="flex items-center gap-3 mb-8">
                <Target className="text-indigo-600" size={24} />
                <h3 className="text-lg md:text-2xl font-black text-slate-900 uppercase">Force Readiness</h3>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontWeight: 900, fill: '#64748B' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
                    <Radar name="Readiness" dataKey="Readiness" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.5} />
                    <Radar name="Consistency" dataKey="Consistency" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.5} />
                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', background: 'rgba(255,255,255,0.9)', fontSize: '10px', fontWeight: 900 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance Leaderboard */}
            <div className="glass-panel p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-white">
              <div className="flex items-center gap-3 mb-8">
                <Award className="text-indigo-600" size={24} />
                <h3 className="text-lg md:text-2xl font-black text-slate-900 uppercase">MVP Operatives</h3>
              </div>
              <div className="space-y-6">
                {performanceData.map((item, idx) => (
                  <div key={item.id} onClick={() => setSelectedUserId(item.id)} className="group cursor-pointer">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[8px] flex items-center justify-center">{idx + 1}</span>
                        {item.name}
                      </span>
                      <span className="text-[10px] font-black text-indigo-600">{item.hours}h</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-1000 group-hover:shadow-glow-indigo"
                        style={{ width: `${(item.hours / (performanceData[0].hours || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log / Detail Panel */}
        <div className="lg:col-span-4 h-full">
          <div className="glass-panel p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] h-full border border-white overflow-hidden flex flex-col min-h-[500px]">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
              <Users className="text-indigo-600" size={20} />
              <h3 className="text-sm md:text-lg font-black text-slate-900 uppercase tracking-widest">Personnel Status</h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
              {allOperatives
                .filter(u => u.rollNumber.includes(searchTerm.toUpperCase()) || u.name.toUpperCase().includes(searchTerm.toUpperCase()))
                .map(op => {
                  const hrs = dataService.getUserTotalActivity(op.id);
                  const isActive = op.id === selectedUserId;
                  return (
                    <div
                      key={op.id}
                      onClick={() => setSelectedUserId(op.id)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white/50 border-slate-100 hover:bg-white text-slate-900'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${isActive ? 'bg-white/20' : 'bg-indigo-100 text-indigo-600'}`}>
                          {op.name[0]}
                        </div>
                        <div>
                          <p className={`text-[10px] font-black uppercase ${isActive ? 'text-white' : 'text-slate-900'}`}>{op.name}</p>
                          <p className={`text-[8px] font-bold uppercase ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>{op.rollNumber}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-[10px] font-black ${isActive ? 'text-white' : 'text-indigo-600'}`}>{hrs}h</p>
                        <div className={`w-2 h-2 rounded-full ml-auto mt-1 ${op.status === AttendanceStatus.ONLINE ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<any> = ({ label, value, sub, icon, color }) => (
  <div className="glass-panel p-6 md:p-10 rounded-2xl md:rounded-[3rem] border border-white hover:shadow-2xl transition-all group flex flex-col justify-between overflow-hidden relative">
    <div className={`absolute top-0 right-0 w-16 h-16 opacity-5 -translate-y-4 translate-x-4 ${color === 'indigo' ? 'text-indigo-600' : color === 'cyan' ? 'text-cyan-600' : 'text-emerald-500'}`}>{icon}</div>
    <div className="space-y-1 mb-4">
      <p className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <h4 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">{value}</h4>
    </div>
    <p className="text-[7px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sub}</p>
  </div>
);

export default AnalyticsModule;
