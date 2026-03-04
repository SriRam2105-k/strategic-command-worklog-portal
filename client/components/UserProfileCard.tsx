import React from 'react';
import { User, UserRole } from '../types';
import { dataService } from '../services/dataService';
import { User as UserIcon, Award, Clock, Star, TrendingUp, Activity } from 'lucide-react';

interface UserProfileCardProps {
    user: User;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ user }) => {
    const rank = dataService.calculateUserRank(user);
    const worklogs = dataService.getWorklogs().filter(w => w.studentId === user.id);
    const reviews = dataService.getReviews().filter(r => r.reviewerId === user.id);
    const attendance = dataService.getAttendance().filter(a => a.studentId === user.id);

    const totalHours = worklogs.reduce((sum, w) => sum + w.hours, 0);
    const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.studentRating, 0) / reviews.length
        : 0;
    const attendanceRate = attendance.length > 0
        ? (attendance.filter(a => a.status === 'PRESENT' || a.status === 'ONLINE').length / attendance.length) * 100
        : 0;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ONLINE': return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
            case 'PRESENT': return 'bg-green-500';
            case 'OFFLINE': return 'bg-slate-400';
            default: return 'bg-slate-300';
        }
    };

    return (
        <div className="glass-glossy rounded-3xl p-6 space-y-4 hover:shadow-2xl transition-all">
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                        <UserIcon size={32} className="text-white" />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white ${getStatusColor(user.status)}`} />
                </div>

                {/* User Info */}
                <div className="flex-1">
                    <h3 className="text-xl font-black text-slate-800">{user.name}</h3>
                    <p className="text-sm text-slate-600 font-semibold">{user.rollNumber}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <Award size={14} className="text-yellow-600" />
                        <span className="text-xs font-bold text-slate-700">{rank.title}</span>
                        <span className="text-xs text-slate-500">Level {rank.level}</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            {user.role === UserRole.STUDENT && (
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/60">
                    <div className="text-center space-y-1">
                        <div className="flex items-center justify-center gap-1">
                            <Clock size={12} className="text-blue-600" />
                            <p className="text-xs font-bold text-slate-600">Hours</p>
                        </div>
                        <p className="text-2xl font-black text-slate-800">{totalHours}</p>
                    </div>
                    <div className="text-center space-y-1">
                        <div className="flex items-center justify-center gap-1">
                            <Star size={12} className="text-yellow-600" />
                            <p className="text-xs font-bold text-slate-600">Rating</p>
                        </div>
                        <p className="text-2xl font-black text-slate-800">{avgRating.toFixed(1)}</p>
                    </div>
                    <div className="text-center space-y-1">
                        <div className="flex items-center justify-center gap-1">
                            <TrendingUp size={12} className="text-green-600" />
                            <p className="text-xs font-bold text-slate-600">Attend</p>
                        </div>
                        <p className="text-2xl font-black text-slate-800">{attendanceRate.toFixed(0)}%</p>
                    </div>
                </div>
            )}

            {user.role === UserRole.ADMIN && (
                <div className="pt-4 border-t border-white/60">
                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-xl">
                        <Activity size={14} className="text-indigo-600" />
                        <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Administrator</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfileCard;
