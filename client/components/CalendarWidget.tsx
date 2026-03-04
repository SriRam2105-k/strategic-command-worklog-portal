import React, { useState } from 'react';
import { User, UserRole, AttendanceStatus } from '../types';
import { dataService } from '../services/dataService';
import { Calendar, ChevronLeft, ChevronRight, Circle } from 'lucide-react';

interface CalendarWidgetProps {
    user: User;
    onNavigate: (tab: string) => void;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ user, onNavigate }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();

    const attendanceRecords = dataService.getAttendance().filter(a => a.studentId === user.id);

    const getAttendanceForDate = (day: number) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateStr = date.toISOString().split('T')[0];
        return attendanceRecords.find(a => a.date === dateStr);
    };

    const getStatusColor = (status?: AttendanceStatus) => {
        if (!status) return '';
        switch (status) {
            case AttendanceStatus.PRESENT:
            case AttendanceStatus.ONLINE:
                return 'bg-green-500';
            case AttendanceStatus.ABSENT:
                return 'bg-red-500';
            case AttendanceStatus.OD:
                return 'bg-yellow-500';
            default:
                return '';
        }
    };

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const days = [];
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const attendance = getAttendanceForDate(day);
        const isToday =
            day === new Date().getDate() &&
            currentDate.getMonth() === new Date().getMonth() &&
            currentDate.getFullYear() === new Date().getFullYear();

        days.push(
            <div
                key={day}
                className={`aspect-square flex items-center justify-center rounded-lg text-xs font-semibold relative group cursor-pointer transition-all ${isToday
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-700 hover:bg-indigo-50'
                    }`}
                onClick={() => attendance && onNavigate('attendance')}
            >
                {day}
                {attendance && (
                    <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${getStatusColor(attendance.status)}`} />
                )}
            </div>
        );
    }

    if (user.role === UserRole.ADMIN) {
        return (
            <div className="glass-panel rounded-3xl p-6 text-center">
                <Calendar size={32} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Calendar view for students only</p>
            </div>
        );
    }

    return (
        <div className="glass-panel rounded-3xl p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar size={20} className="text-indigo-600" />
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Calendar</h2>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={previousMonth}
                        className="p-1.5 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft size={16} className="text-slate-600" />
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-1.5 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                        <ChevronRight size={16} className="text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Month/Year */}
            <div className="text-center">
                <p className="text-sm font-black text-slate-800">{monthName} {year}</p>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-center text-[10px] font-black text-slate-500 py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {days}
            </div>

            {/* Legend */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-center gap-4">
                <div className="flex items-center gap-1.5">
                    <Circle size={8} className="text-green-500 fill-green-500" />
                    <span className="text-[10px] text-slate-600 font-semibold">Present</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Circle size={8} className="text-red-500 fill-red-500" />
                    <span className="text-[10px] text-slate-600 font-semibold">Absent</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Circle size={8} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-[10px] text-slate-600 font-semibold">OD</span>
                </div>
            </div>
        </div>
    );
};

export default CalendarWidget;
