
import React, { useEffect, useState, useRef } from 'react';
import { Award, Star, Zap, Shield, Trophy, ChevronUp } from 'lucide-react';

interface RewardFanfareProps {
    rankTitle: string;
    rankLevel: number;
    isOpen: boolean;
    onClose: () => void;
}

const RewardFanfare: React.FC<RewardFanfareProps> = ({ rankTitle, rankLevel, isOpen, onClose }) => {
    const [showContent, setShowContent] = useState(false);
    const audioCtx = useRef<AudioContext | null>(null);

    useEffect(() => {
        if (isOpen) {
            setShowContent(true);
            playRankUpSound();
            const timer = setTimeout(() => {
                // Auto-close after 5 seconds or keep it open for manual close?
                // Let's keep it until manual close for impact.
            }, 5000);
            return () => clearTimeout(timer);
        } else {
            setShowContent(false);
        }
    }, [isOpen]);

    const playRankUpSound = () => {
        try {
            if (!audioCtx.current) {
                audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioCtx.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;
            osc.frequency.setValueAtTime(440, now); // A4
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5
            osc.frequency.exponentialRampToValueAtTime(1320, now + 0.3); // E6

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

            osc.start(now);
            osc.stop(now + 0.5);
        } catch (e) {
            console.warn("Audio Context blocked or failed", e);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
            {/* Background Particles Simulation (Reduced for performance) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-indigo-500 rounded-full animate-ping opacity-20"
                        style={{
                            width: Math.random() * 100 + 50 + 'px',
                            height: Math.random() * 100 + 50 + 'px',
                            top: Math.random() * 100 + '%',
                            left: Math.random() * 100 + '%',
                            animationDuration: Math.random() * 3 + 2 + 's',
                            willChange: 'transform, opacity'
                        } as React.CSSProperties}
                    ></div>
                ))}
            </div>

            <div className={`relative max-w-lg w-full bg-white rounded-[3rem] p-12 text-center shadow-[0_0_100px_rgba(79,70,229,0.3)] border-4 border-indigo-100 transition-all duration-700 ${showContent ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10'}`}>
                <div className="absolute -top-16 left-1/2 -translate-x-1/2">
                    <div className="w-32 h-32 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-full flex items-center justify-center shadow-glow-indigo border-8 border-white animate-bounce">
                        <Trophy className="text-white" size={64} />
                    </div>
                </div>

                <div className="mt-12 space-y-6">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em]">Advancement Secured</p>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter">Rank Promoted</h2>
                    </div>

                    <div className="py-8 px-10 bg-indigo-50 rounded-[2.5rem] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Shield size={80} className="text-indigo-600" />
                        </div>
                        <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">New Designation</p>
                        <h3 className="text-3xl font-black text-indigo-700 uppercase tracking-tight">{rankTitle}</h3>
                        <div className="flex justify-center gap-1 mt-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} size={20} className={i < rankLevel ? 'text-indigo-600 fill-indigo-600' : 'text-indigo-200'} />
                            ))}
                        </div>
                    </div>

                    <div className="pt-6 space-y-6">
                        <p className="text-sm text-slate-500 font-medium">Your dedication to the Strategic Command has been recognized. New field assets and clearance levels have been granted.</p>

                        <button
                            onClick={onClose}
                            className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3"
                        >
                            ACKNOWLEDGE COMMAND <Zap size={18} />
                        </button>
                    </div>
                </div>

                {/* Floating Rank Up Icon */}
                <div className="absolute top-4 right-4 animate-bounce text-indigo-600 opacity-20">
                    <ChevronUp size={48} />
                </div>
            </div>
        </div>
    );
};

export default RewardFanfare;
