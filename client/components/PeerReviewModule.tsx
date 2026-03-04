
import React, { useState, useMemo, useEffect } from 'react';
import { Users, ShieldCheck, Star, ArrowRight, History, Search, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';
import { User, PeerReview, UserRole, Team } from '../types';
import { dataService } from '../services/dataService';

interface Props { user: User; }

const PeerReviewModule: React.FC<Props> = ({ user }) => {
  const [assignedTeam, setAssignedTeam] = useState<Team | null>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState('');

  // Team Review State
  const [teamRating, setTeamRating] = useState(5);
  const [teamFeedback, setTeamFeedback] = useState('');
  const [reviewMethod, setReviewMethod] = useState('FACE_TO_FACE');

  // Member Reviews State: { [studentId]: { rating, feedback } }
  const [memberReviews, setMemberReviews] = useState<{ [key: string]: { rating: number; feedback: string } }>({});

  // Helpers
  const [expandedWorklogs, setExpandedWorklogs] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const isAdmin = user.role === 'ADMIN';
  const allReviews = dataService.getReviews();
  const allUsers = dataService.getUsers();
  const allTeams = dataService.getTeams();
  const allWorklogs = dataService.getWorklogs();

  // Effects
  useEffect(() => {
    if (!isAdmin && !showHistory) {
      fetchAssignment();
    }
  }, [isAdmin, showHistory, user.id]);

  const fetchAssignment = async () => {
    setLoadingAssignment(true);
    try {
      const res = await dataService.getDailyReviewAssignment(user.id);
      if (res.assignedTeam) {
        // Hydrate team members if needed, or just match with local data
        const team = allTeams.find(t => t.id === res.assignedTeam.id);
        setAssignedTeam(team || null);
      } else {
        setAssignedTeam(null);
        setAssignmentMessage(res.message || 'No assignment available.');
      }
    } catch (e) {
      console.error(e);
      setAssignmentMessage('Failed to load assignment.');
    } finally {
      setLoadingAssignment(false);
    }
  };

  const teamMembers = useMemo(() => {
    if (!assignedTeam) return [];
    return allUsers.filter(u => assignedTeam.studentIds.includes(u.id));
  }, [assignedTeam, allUsers]);

  const filteredReviews = useMemo(() => {
    let list = [...allReviews];
    if (!isAdmin) {
      // Show reviews given by this user or received by this user
      list = list.filter(r => r.reviewerId === user.id || r.studentId === user.id);
    }
    return list.filter(r => {
      const student = allUsers.find(u => u.id === r.studentId);
      const team = allTeams.find(t => t.id === r.teamId);
      const matchesSearch = !searchTerm ||
        student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.studentFeedback.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.teamFeedback.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allReviews, isAdmin, user.id, allUsers, allTeams, searchTerm]);

  // Check if today's review is already done
  const isReviewDoneToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return allReviews.some(r => r.reviewerId === user.id && r.date === today);
  }, [allReviews, user.id]);

  // Handlers
  const toggleWorklog = (studentId: string) => {
    setExpandedWorklogs(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const handleMemberRatingChange = (studentId: string, rating: number) => {
    setMemberReviews(prev => ({ ...prev, [studentId]: { ...prev[studentId], rating } }));
  };

  const handleMemberFeedbackChange = (studentId: string, feedback: string) => {
    setMemberReviews(prev => ({ ...prev, [studentId]: { ...prev[studentId], feedback } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!assignedTeam) return;

    // Validation
    if (!teamFeedback.trim()) {
      setError("Please provide feedback for the team.");
      return;
    }

    const memberIds = teamMembers.map(m => m.id);
    const missingReviews = memberIds.filter(id => !memberReviews[id]?.feedback?.trim());

    if (missingReviews.length > 0) {
      setError(`Please provide feedback for all team members.`);
      return;
    }

    setSubmitting(true);

    const reviewsToSubmit: Omit<PeerReview, 'id'>[] = teamMembers.map(member => ({
      reviewerId: user.id,
      studentId: member.id,
      teamId: assignedTeam.id,
      date: new Date().toISOString().split('T')[0],
      studentRating: memberReviews[member.id]?.rating || 5,
      teamRating: teamRating,
      studentFeedback: memberReviews[member.id]?.feedback || '',
      teamFeedback: teamFeedback,
      reviewMethod: reviewMethod
    }));

    try {
      await dataService.submitReviews(reviewsToSubmit);
      dataService.logAction(user.id, user.name, `Submitted Review for Team ${assignedTeam.name}`, "Reviews");

      // Reset
      setAssignedTeam(null);
      setTeamRating(5);
      setTeamFeedback('');
      setMemberReviews({});
      setExpandedWorklogs([]);
      setReviewMethod('FACE_TO_FACE');
      alert("Reviews submitted successfully!");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to submit reviews. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Admin View
  if (isAdmin) {
    return (
      <div className="space-y-10 py-6 animate-stagger">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/40 p-10 rounded-[3.5rem] border border-white shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white"><ShieldCheck size={24} /></div><h2 className="text-4xl font-black text-slate-900 uppercase">Review <span className="text-indigo-600">Records</span></h2></div>
            <p className="text-slate-500 font-bold text-xs uppercase pl-1">Feedback and Evaluation</p>
          </div>
          <div className="relative"><Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="SEARCH REVIEWS..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 pr-6 py-4 rounded-[1.5rem] border border-slate-200 bg-white/50 focus:bg-white outline-none font-bold text-xs uppercase w-64 transition-all" /></div>
        </div>
        <div className="space-y-6">
          {filteredReviews.map((rev) => {
            const student = allUsers.find(u => u.id === rev.studentId);
            const reviewer = allUsers.find(u => u.id === rev.reviewerId);
            const team = allTeams.find(t => t.id === rev.teamId);
            return (
              <div key={rev.id} className="glass-panel p-8 rounded-[3rem] border border-white hover:border-indigo-100 transition-all">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  <div className="flex items-center gap-5 min-w-[320px]">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 flex items-center justify-center text-white font-black text-lg">{student?.name[0]}</div>
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-slate-900 uppercase truncate">{student?.name}</h3>
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Team: {team?.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Reviewed by {reviewer?.name}</p>
                      <div className="mt-2 text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full w-fit uppercase tracking-widest">{rev.reviewMethod?.replace(/_/g, ' ') || 'FACE_TO_FACE'}</div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap gap-6">
                      <div className="space-y-1"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Student Rating</p><div className="flex items-center gap-1.5">{[1, 2, 3, 4, 5].map(n => <Star key={n} size={14} className={n <= rev.studentRating ? 'text-indigo-500 fill-indigo-500' : 'text-slate-200'} />)}</div></div>
                      <div className="space-y-1"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Team Rating</p><div className="flex items-center gap-1.5">{[1, 2, 3, 4, 5].map(n => <Star key={n} size={14} className={n <= rev.teamRating ? 'text-purple-500 fill-purple-500' : 'text-slate-200'} />)}</div></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Student Feedback</p><p className="text-sm font-medium text-slate-600 italic leading-relaxed">"{rev.studentFeedback}"</p></div>
                      <div className="bg-slate-50 p-4 rounded-2xl"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Team Feedback</p><p className="text-sm font-medium italic leading-relaxed">"{rev.teamFeedback}"</p></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Student/Reviewer View
  return (
    <div className="max-w-6xl mx-auto space-y-8 md:space-y-12 py-4 md:py-6 animate-stagger">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 uppercase">Review <span className="text-indigo-600">System</span></h2>
        <div className="flex p-1.5 bg-slate-100 rounded-[2rem] border border-slate-200"><button onClick={() => setShowHistory(false)} className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${!showHistory ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400'}`}>Current Mission</button><button onClick={() => setShowHistory(true)} className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${showHistory ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400'}`}>Historical Log</button></div>
      </div>

      {!showHistory ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar: Mission Status */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] border border-white">
              <h3 className="text-[10px] md:text-xs font-black uppercase text-slate-900 mb-8 border-b pb-4">Mission Status</h3>

              {loadingAssignment ? (
                <div className="py-8 text-center text-slate-400 animate-pulse text-xs font-bold uppercase tracking-widest">Identifying Target...</div>
              ) : isReviewDoneToday ? (
                <div className="py-8 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4"><CheckCircle size={32} /></div>
                  <h3 className="text-lg font-black text-slate-900 uppercase">Mission Complete</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">Daily Review Submitted</p>
                </div>
              ) : assignedTeam ? (
                <div className="w-full flex items-center gap-4 p-4 rounded-[1.5rem] bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-xl">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm"><Users size={18} /></div>
                  <div className="text-left min-w-0">
                    <p className="text-[9px] uppercase tracking-widest text-indigo-100 mb-1">Target Team</p>
                    <p className="text-lg font-black uppercase truncate">{assignedTeam.name}</p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center flex flex-col items-center">
                  <AlertCircle size={32} className="text-slate-300 mb-4" />
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{assignmentMessage}</p>
                </div>
              )}

            </div>
          </div>

          {/* Main Content: Review Form */}
          <div className="lg:col-span-8 space-y-8">
            {!isReviewDoneToday && assignedTeam ? (
              <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                  <div className="p-4 rounded-[1.5rem] bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-3"><AlertCircle size={20} />{error}</div>
                )}

                {/* Review Method */}
                <div className="glass-panel p-8 md:p-10 rounded-[3rem] border border-white shadow-lg">
                  <h3 className="text-[10px] md:text-xs font-black uppercase text-slate-900 mb-4">Review Method</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['FACE_TO_FACE', 'PHONE_CALL', 'ONLINE_MEETING'].map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setReviewMethod(method)}
                        className={`px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all border ${reviewMethod === method ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200'}`}
                      >
                        {method.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Team Review Section */}
                <div className="glass-panel p-8 md:p-10 rounded-[3rem] border border-white shadow-lg">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Reviewing Team</p>
                      <h3 className="text-2xl font-black text-slate-900 uppercase">{assignedTeam.name}</h3>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Team Rating</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} type="button" onClick={() => setTeamRating(n)} className="focus:outline-none hover:scale-110 transition-transform">
                            <Star size={20} className={n <= teamRating ? "text-indigo-500 fill-indigo-500" : "text-slate-200"} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Team Feedback</label>
                    <textarea rows={3} value={teamFeedback} onChange={e => setTeamFeedback(e.target.value)} placeholder="Provide feedback for the whole team..." className="w-full px-6 py-4 rounded-[1.5rem] border bg-slate-50/50 outline-none focus:bg-white transition-all text-sm resize-none" />
                  </div>
                </div>

                {/* Members Review Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-slate-900 uppercase pl-2">Member Reviews</h3>
                  {teamMembers.map(member => (
                    <div key={member.id} className="glass-panel p-8 rounded-[2.5rem] border border-white">
                      <div className="flex items-start justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-[1rem] bg-slate-900 text-white flex items-center justify-center font-black text-lg">{member.name[0]}</div>
                          <div><h4 className="text-lg font-bold text-slate-900 uppercase">{member.name}</h4><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Student Peer</p></div>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Rating</p>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(n => (
                              <button key={n} type="button" onClick={() => handleMemberRatingChange(member.id, n)} className="focus:outline-none hover:scale-110 transition-transform">
                                <Star size={16} className={n <= (memberReviews[member.id]?.rating || 5) ? "text-indigo-500 fill-indigo-500" : "text-slate-200"} />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Worklog Context */}
                      <div className="mb-6">
                        <button type="button" onClick={() => toggleWorklog(member.id)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">
                          {expandedWorklogs.includes(member.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {expandedWorklogs.includes(member.id) ? 'Hide Worklogs' : 'View Recent Worklogs'}
                        </button>
                        {expandedWorklogs.includes(member.id) && (
                          <div className="mt-4 space-y-3 pl-4 border-l-2 border-indigo-100">
                            {allWorklogs.filter(w => w.studentId === member.id).slice(0, 3).map(log => (
                              <div key={log.id} className="text-xs">
                                <div className="flex justify-between text-slate-400 font-bold uppercase text-[9px] mb-1">
                                  <span>{new Date(log.date).toLocaleDateString()}</span>
                                  <span>{log.hours} Hours</span>
                                </div>
                                <p className="text-slate-600">{log.content}</p>
                              </div>
                            ))}
                            {allWorklogs.filter(w => w.studentId === member.id).length === 0 && <p className="text-xs text-slate-400 italic">No worklogs submitted.</p>}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Individual Feedback</label>
                        <textarea rows={2} value={memberReviews[member.id]?.feedback || ''} onChange={e => handleMemberFeedbackChange(member.id, e.target.value)} placeholder={`Feedback for ${member.name}...`} className="w-full px-6 py-4 rounded-[1.5rem] border bg-slate-50/50 outline-none focus:bg-white transition-all text-sm resize-none" />
                      </div>
                    </div>
                  ))}
                </div>

                <button type="submit" disabled={submitting} className="w-full py-6 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-[2.5rem] font-black text-xs uppercase shadow-xl hover:bg-slate-950 transition-all flex items-center justify-center gap-4 disabled:opacity-70 disabled:cursor-not-allowed">
                  {submitting ? 'Submitting...' : 'Submit All Reviews'} <ArrowRight size={20} />
                </button>
              </form>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 glass-panel rounded-[3rem] border border-dashed opacity-50">
                {isReviewDoneToday ? (
                  <>
                    <CheckCircle size={48} className="text-green-500 mb-6" />
                    <h3 className="text-xl font-black text-slate-900 uppercase">All Clear</h3>
                    <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">You have completed your review mission for today.</p>
                  </>
                ) : (
                  <>
                    <Users size={48} className="text-slate-300 mb-6" />
                    <h3 className="text-xl font-black text-slate-900 uppercase">Awaiting Assignment</h3>
                    <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">{assignmentMessage || "Please check back later for your review assignment."}</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Historical View */}
          {filteredReviews.length === 0 && <p className="text-center text-slate-500 py-10">No reviews found.</p>}
          {filteredReviews.map((rev) => {
            const student = allUsers.find(u => u.id === rev.studentId);
            const team = allTeams.find(t => t.id === rev.teamId);
            if (!student) return null;

            return (
              <div key={rev.id} className="glass-panel p-8 rounded-[3rem] border border-white hover:shadow-2xl transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{new Date(rev.date).toLocaleDateString()}</p>
                    <h4 className="text-lg font-bold text-slate-900 uppercase">{student.name} <span className="text-slate-400 text-xs">({team?.name})</span></h4>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2"><span className="text-[9px] font-bold text-slate-400 uppercase">Student</span> <span className="flex text-indigo-500">{[1, 2, 3, 4, 5].map(n => <Star key={n} size={10} fill={n <= rev.studentRating ? "currentColor" : "none"} />)}</span></div>
                    <div className="flex items-center gap-2"><span className="text-[9px] font-bold text-slate-400 uppercase">Team</span> <span className="flex text-purple-500">{[1, 2, 3, 4, 5].map(n => <Star key={n} size={10} fill={n <= rev.teamRating ? "currentColor" : "none"} />)}</span></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Feedback for Student</p><p className="text-slate-800 text-sm font-bold italic leading-relaxed">"{rev.studentFeedback}"</p></div>
                  <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Feedback for Team</p><p className="text-slate-500 text-sm font-medium italic leading-relaxed">"{rev.teamFeedback}"</p></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PeerReviewModule;
