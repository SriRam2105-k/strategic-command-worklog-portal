
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
        Engagement: 0, // Replaced mock review data with 0 until real data available
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

  const teamDistributionData = useMemo(() => {
    return teams.map(team => {
      const teamWorklogs = worklogs.filter(l => team.studentIds.includes(l.studentId));
      const totalHrs = teamWorklogs.reduce((acc, l) => acc + l.hours, 0);
      return { name: team.name, hours: totalHrs };
    }).filter(d => d.hours > 0);
  }, [teams, worklogs]);

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
    <div className="space-y-10 md:space-y-16 py-4 md:py-6 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 animate-stagger">
        <div className="space-y-1.5">
          <h2 className="text-2xl md:text-5xl font-black text-slate-800 tracking-tighter-custom uppercase">
            {selectedOp ? 'Operative' : 'Strategic'} <span className="text-indigo-600">Intel</span>
          </h2>
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-indigo-500" />
            <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">
              {selectedOp ? `DIRECT ANALYTICS: ID ${selectedOp.rollNumber}` : 'GLOBAL COMMAND OVERVIEW ACTIVE'}
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
        <StatCard label="Live Compliance" value={`${stats.compliance}%`} sub="Daily reporting rate" icon={<Activity size={24} />} color="indigo" />
        <StatCard label="Effort Average" value={`${stats.avgHrs}h`} sub="Daily mission volume" icon={<Zap size={24} />} color="cyan" />
        <StatCard label="System Vitality" value={`${stats.systemHealth}%`} sub="Review satisfaction" icon={<Activity size={24} />} color="emerald" />
        <StatCard label="Total Output" value={stats.totalHours} sub="Cumulative hours" icon={<Clock size={24} />} color="slate" />
      </div>

      <div className="grid grid-cols-12 gap-8 md:gap-12">
        {/* Row 1: Operational Trend Full Width */}
        <div className="col-span-12">
          <div className="glass-panel p-8 md:p-12 rounded-[3rem] border border-white">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-100 p-3 rounded-2xl"><TrendingUp className="text-indigo-600" size={28} /></div>
                <h3 className="text-xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">Operational Trend</h3>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance Matrix</p>
                <p className="text-sm font-black text-indigo-600 uppercase">14-Day Cycle</p>
              </div>
            </div>
            <div className="h-[450px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{fontSize: 10, fontWeight: 900, fill: '#64748B'}} dy={10} />
                  <YAxis tick={{fontSize: 10, fontWeight: 900, fill: '#64748B'}} dx={-10} />
                  <Tooltip contentStyle={{borderRadius: '1.5rem', border: 'none', background: 'rgba(255,255,255,0.95)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 900}} />
                  <Area type="monotone" dataKey="hours" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorHours)" strokeWidth={4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 2: Strategic Breakdown */}
        <div className="col-span-12 lg:col-span-6">
          <div className="glass-panel p-8 md:p-12 rounded-[3rem] border border-white h-full">
            <div className="flex items-center gap-4 mb-10">
              <div className="bg-indigo-100 p-3 rounded-2xl"><Layers className="text-indigo-600" size={28} /></div>
              <h3 className="text-xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">Project Allocation</h3>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={projectEffortData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={8} dataKey="value">
                    {projectEffortData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '1.5rem', border: 'none', background: 'rgba(255,255,255,0.95)', fontSize: '12px', fontWeight: 900}} />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{paddingTop: '20px'}} formatter={(value) => <span className="text-[11px] font-black uppercase text-slate-600 tracking-wider">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <div className="glass-panel p-8 md:p-12 rounded-[3rem] border border-white h-full">
            <div className="flex items-center gap-4 mb-10">
              <div className="bg-indigo-100 p-3 rounded-2xl"><Users className="text-indigo-600" size={28} /></div>
              <h3 className="text-xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">Division Output</h3>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 900, fill: '#64748B'}} dy={10} />
                  <YAxis tick={{fontSize: 10, fontWeight: 900, fill: '#64748B'}} dx={-10} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '1.5rem', border: 'none', background: 'rgba(255,255,255,0.95)', fontSize: '12px', fontWeight: 900}} />
                  <Bar dataKey="hours" radius={[15, 15, 0, 0]} barSize={40}>
                    {teamDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 3: Mission Intensity Full Width */}
        <div className="col-span-12">
          <div className="glass-panel p-8 md:p-12 rounded-[3rem] border border-white">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-100 p-3 rounded-2xl"><Activity className="text-indigo-600" size={28} /></div>
                <div>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">Operational Density</p>
                  <h3 className="text-xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">Mission Intensity</h3>
                </div>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-full text-[10px] font-black tracking-widest">
                <Calendar size={14} className="text-indigo-400" /> 70 DAY INTEL CYCLE
              </div>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
              {heatmapData.map((day, i) => {
                const intensity = day.count === 0 ? 'bg-slate-100' :
                  day.count < 3 ? 'bg-indigo-200' :
                    day.count < 6 ? 'bg-indigo-400' :
                      'bg-indigo-600 shadow-glow-indigo';
                return (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.count} logs`}
                    className={`w-4 h-4 md:w-6 md:h-6 rounded-md transition-all cursor-crosshair hover:scale-150 z-10 hover:shadow-2xl ${intensity}`}
                  ></div>
                );
              })}
            </div>
            <div className="flex justify-center gap-6 mt-10 text-[9px] font-black uppercase text-slate-400 tracking-widest">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-100 rounded-sm"></div> NO DATA</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-200 rounded-sm"></div> LOW</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-400 rounded-sm"></div> MED</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-600 rounded-sm"></div> CRITICAL</div>
            </div>
          </div>
        </div>

        {/* Row 4: Readiness & MVP */}
        <div className="col-span-12 lg:col-span-12 xl:col-span-6">
          <div className="glass-panel p-8 md:p-12 rounded-[3rem] border border-white h-full">
            <div className="flex items-center gap-4 mb-10">
              <div className="bg-indigo-100 p-3 rounded-2xl"><Target className="text-indigo-600" size={28} /></div>
              <h3 className="text-xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">Force Readiness</h3>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fontWeight: 900, fill: '#64748B' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
                  <Radar name="Readiness" dataKey="Readiness" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} strokeWidth={3} />
                  <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', background: 'rgba(255,255,255,0.95)', fontSize: '12px', fontWeight: 900 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-12 xl:col-span-6">
          <div className="glass-panel p-8 md:p-12 rounded-[3rem] border border-white h-full">
            <div className="flex items-center gap-4 mb-10">
              <div className="bg-indigo-100 p-3 rounded-2xl"><Award className="text-indigo-600" size={28} /></div>
              <h3 className="text-xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">MVP Operatives</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {performanceData.map((item, idx) => (
                <div key={item.id} onClick={() => setSelectedUserId(item.id)} className="group cursor-pointer">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[12px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-[10px] flex items-center justify-center shadow-lg">{idx + 1}</span>
                      {item.name}
                    </span>
                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{item.hours}h</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 transition-all duration-1000 group-hover:shadow-glow-indigo group-hover:scale-x-105 origin-left"
                      style={{ width: `${(item.hours / (performanceData[0].hours || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 5: Personnel Status Relocated to Bottom */}
        <div className="col-span-12 mt-12">
          <div className="glass-panel p-8 md:p-12 rounded-[3rem] border border-white">
            <div className="flex items-center justify-between mb-10 border-b border-slate-100 pb-8">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-100 p-3 rounded-2xl"><Users className="text-indigo-600" size={28} /></div>
                <h3 className="text-xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">Active Personnel Directory</h3>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Status Registry</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
              {allOperatives
                .filter(u => u.rollNumber.includes(searchTerm.toUpperCase()) || u.name.toUpperCase().includes(searchTerm.toUpperCase()))
                .map(op => {
                  const hrs = dataService.getUserTotalActivity(op.id);
                  const isActive = op.id === selectedUserId;
                  return (
                    <div
                      key={op.id}
                      onClick={() => setSelectedUserId(op.id)}
                      className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all cursor-pointer ${isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl scale-105 z-20' : 'bg-white/50 border-slate-100 hover:bg-white text-slate-900 hover:shadow-xl'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm ${isActive ? 'bg-white/20' : 'bg-indigo-100 text-indigo-600'}`}>
                          {op.name[0]}
                        </div>
                        <div>
                          <p className={`text-xs font-black uppercase tracking-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>{op.name}</p>
                          <p className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>{op.rollNumber}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black ${isActive ? 'text-white' : 'text-indigo-600'}`}>{hrs}h</p>
                        <div className={`w-3 h-3 rounded-full ml-auto mt-2 border-2 border-white ${op.status === AttendanceStatus.ONLINE ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
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
