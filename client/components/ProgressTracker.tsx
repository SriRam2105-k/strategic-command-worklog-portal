import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { dataService } from '../services/dataService';
import { Target, TrendingUp, Award, Clock } from 'lucide-react';

interface ProgressTrackerProps {
    user: User;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ user }) => {
    const [stats, setStats] = useState({
        worklogsThisWeek: 0,
        hoursThisWeek: 0,
        reviewsCompleted: 0,
        rankProgress: 0,
        rankLevel: 0,
        rankTitle: '',
    });

    useEffect(() => {
        loadStats();
    }, [user]);

    const loadStats = () => {
        const worklogs = dataService.getWorklogs().filter(w => w.studentId === user.id);
        const reviews = dataService.getReviews().filter(r => r.reviewerId === user.id);
        const rank = dataService.calculateUserRank(user);

        // Calculate this week's worklogs
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const thisWeekWorklogs = worklogs.filter(w => new Date(w.date) > oneWeekAgo);
        const hoursThisWeek = thisWeekWorklogs.reduce((sum, w) => sum + w.hours, 0);

        // Calculate progress to next rank based on XP
        const nextLevelXP = rank.level === 5 ? 1000 : [50, 150, 300, 500, 1000][rank.level];
        const prevLevelXP = rank.level === 1 ? 0 : [0, 50, 150, 300, 500][rank.level - 1];
        const rankProgress = ((rank.xp - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100;

        setStats({
            worklogsThisWeek: thisWeekWorklogs.length,
            hoursThisWeek,
            reviewsCompleted: reviews.length,
            rankProgress: Math.min(rankProgress, 100),
            rankLevel: rank.level,
            rankTitle: rank.title,
        });
    };

    const CircularProgress = ({ progress, color, label, value, max }: { progress: number; color: string; label: string; value: string | number; max?: number }) => {
        const radius = 40;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (progress / 100) * circumference;

        return (
            <div className="flex flex-col items-center gap-2">
                <div className="relative w-24 h-24">
                    <svg className="transform -rotate-90 w-24 h-24">
                        <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            className="text-slate-200"
                        />
                        <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className={`${color} transition-all duration-1000 ease-out`}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-slate-800">{value}</span>
                        {max && <span className="text-[10px] text-slate-500">/ {max}</span>}
                    </div>
                </div>
                <p className="text-xs font-bold text-slate-600 text-center">{label}</p>
            </div>
        );
    };

    const LinearProgress = ({ progress, label, color }: { progress: number; label: string; color: string }) => {
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-700">{label}</p>
                    <p className="text-xs font-black text-slate-800">{progress}%</p>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${color} transition-all duration-1000 ease-out rounded-full`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        );
    };

    if (user.role === UserRole.ADMIN) {
        // Admin view - show overall statistics
        const allWorklogs = dataService.getWorklogs();
        const allUsers = dataService.getUsers().filter(u => u.role === UserRole.STUDENT);
        const activeUsers = allUsers.filter(u => u.status === 'ONLINE' || u.status === 'PRESENT');

        return (
            <div className="glass-panel rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">System Overview</h2>
                    <TrendingUp size={20} className="text-indigo-600" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <CircularProgress
                        progress={(activeUsers.length / Math.max(allUsers.length, 1)) * 100}
                        color="text-green-500"
                        label="Active Users"
                        value={activeUsers.length}
                        max={allUsers.length}
                    />
                    <CircularProgress
                        progress={Math.min((allWorklogs.length / 50) * 100, 100)}
                        color="text-blue-500"
                        label="Total Worklogs"
                        value={allWorklogs.length}
                    />
                    <CircularProgress
                        progress={75}
                        color="text-indigo-500"
                        label="System Health"
                        value="75%"
                    />
                </div>
            </div>
        );
    }

    // Student view
    const weeklyGoal = 5; // 5 worklogs per week
    const hoursGoal = 20; // 20 hours per week
    const worklogProgress = Math.min((stats.worklogsThisWeek / weeklyGoal) * 100, 100);
    const hoursProgress = Math.min((stats.hoursThisWeek / hoursGoal) * 100, 100);

    return (
        <div className="glass-panel rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">My Progress</h2>
                <Target size={20} className="text-indigo-600" />
            </div>

            {/* Circular Stats */}
            <div className="grid grid-cols-3 gap-4">
                <CircularProgress
                    progress={worklogProgress}
                    color="text-blue-500"
                    label="Worklogs This Week"
                    value={stats.worklogsThisWeek}
                    max={weeklyGoal}
                />
                <CircularProgress
                    progress={hoursProgress}
                    color="text-green-500"
                    label="Hours Logged"
                    value={stats.hoursThisWeek}
                    max={hoursGoal}
                />
                <CircularProgress
                    progress={(stats.reviewsCompleted / 10) * 100}
                    color="text-indigo-500"
                    label="Reviews Done"
                    value={stats.reviewsCompleted}
                />
            </div>

            {/* Rank Progress */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2">
                    <Award size={16} className="text-yellow-600" />
                    <p className="text-sm font-bold text-slate-700">Rank Progress</p>
                </div>
                <LinearProgress
                    progress={stats.rankProgress}
                    label={`${stats.rankTitle} (Level ${stats.rankLevel})`}
                    color="bg-gradient-to-r from-yellow-500 to-orange-500"
                />
            </div>
        </div>
    );
};

export default ProgressTracker;
