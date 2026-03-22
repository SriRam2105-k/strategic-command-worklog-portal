import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getAllRows, appendRow, updateRow, rewriteAllRows, deleteRow } from './googleSheetsApi';

const router = Router();

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Notification Trigger Helper ---
const triggerNotification = async (params: {
    userId?: string,
    type: 'success' | 'warning' | 'error' | 'info' | 'admin',
    priority: 'high' | 'medium' | 'low',
    message: string,
    actionTab?: string,
    actionLabel?: string
}) => {
    try {
        const notif = {
            id: generateId(),
            userId: params.userId || '',
            type: params.type,
            priority: params.priority,
            message: params.message,
            actionTab: params.actionTab || '',
            actionLabel: params.actionLabel || '',
            isRead: 'false',
            timestamp: new Date().toISOString(),
            actionRequired: params.actionTab ? 'true' : 'false'
        };
        await appendRow('notifications', notif);
        return notif;
    } catch (e) {
        console.error("Failed to trigger notification:", e);
    }
};

// --- Auth ---
router.post('/login', async (req, res) => {
    try {
        const { rollNumber, password } = req.body;
        const users = await getAllRows('users');
        const user = users.find((u: any) => u.rollNumber === rollNumber);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json(user);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Data Fetching (Sync) ---
router.get('/sync', async (req, res) => {
    try {
        const [users, teams, projects, milestones, worklogs, attendance, messages, notifications, auditlogs, reviews, archiveItems] = await Promise.all([
            getAllRows('users'),
            getAllRows('teams'),
            getAllRows('projects'),
            getAllRows('milestones'),
            getAllRows('worklogs'),
            getAllRows('attendance'),
            getAllRows('messages'),
            getAllRows('notifications'),
            getAllRows('auditLogs'),
            getAllRows('peerReviews'),
            getAllRows('archiveItems')
        ]);
        
        // Assemble teams with members
        const assembledTeams = teams.map((t: any) => ({
             id: t.id,
             name: t.name,
             projectId: t.projectId,
             studentIds: users.filter((u: any) => u.teamId === t.id).map((u: any) => u.id)
        }));
        
        // Assemble projects with milestones
        const assembledProjects = projects.map((p: any) => ({
             ...p,
             milestones: milestones.filter((m: any) => m.projectId === p.id)
        }));

        res.json({
            users,
            teams: assembledTeams,
            projects: assembledProjects,
            worklogs,
            attendance,
            messages,
            notifications,
            auditlogs,
            reviews,
            archive: archiveItems
        });
    } catch (error: any) {
        console.error("Sync error:", error);
        res.status(500).json({ error: 'Sync failed' });
    }
});

// Users
router.post('/users', async (req, res) => {
    try {
        const { password, ...rest } = req.body;
        const hashedPassword = await bcrypt.hash(password || '1234', 10);
        const user = { ...rest, id: generateId(), password: hashedPassword };
        await appendRow('users', user);
        res.json(user);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

router.put('/users/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        await updateRow('users', 'id', req.params.id, { status });
        
        res.json({ id: req.params.id, status });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// Teams
router.post('/teams', async (req, res) => {
    try {
        const { studentIds, ...rest } = req.body;
        const team = { ...rest, id: rest.id || generateId() };
        await appendRow('teams', team);
        
        if (studentIds && studentIds.length > 0) {
            for (const sId of studentIds) {
                await updateRow('users', 'id', sId, { teamId: team.id });
            }
        }
        res.json({ ...team, studentIds: studentIds || [] });
    } catch (e: any) {
         res.status(500).json({ error: e.message });
    }
});

router.put('/teams/:id/members', async (req, res) => {
    const { studentIds } = req.body;
    try {
        const users = await getAllRows('users');
        const currentMembers = users.filter((u: any) => u.teamId === req.params.id);
        for (const m of currentMembers) {
            await updateRow('users', 'id', m.id, { teamId: '' });
        }
        for (const sId of studentIds) {
            await updateRow('users', 'id', sId, { teamId: req.params.id });
        }
        
        const teams = await getAllRows('teams');
        const team = teams.find((t: any) => t.id === req.params.id);

        if (!team) return res.status(404).json({ error: 'Team not found' });

        res.json({
            id: team.id,
            name: team.name,
            projectId: team.projectId,
            studentIds
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Projects
router.post('/projects', async (req, res) => {
    try {
        const { milestones, ...rest } = req.body;
        const project = { ...rest, id: generateId() };
        await appendRow('projects', project);
        
        if (milestones) {
            for (const m of milestones) {
                await appendRow('milestones', { ...m, id: generateId(), projectId: project.id });
            }
        }
        res.json({ ...project, milestones: milestones || [] });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/projects/:id/milestones', async (req, res) => {
    try {
        const { milestones } = req.body;
        const allMilestones = await getAllRows('milestones');
        
        const newProjectMilestones = [];
        
        for (const m of milestones) {
            const existing = allMilestones.find((am: any) => am.id === m.id);
            if (existing) {
                await updateRow('milestones', 'id', m.id, {
                    label: m.label,
                    isCompleted: m.isCompleted,
                    priority: m.priority
                });
                newProjectMilestones.push({ ...existing, ...m });
            } else {
                const newM = {
                    id: m.id || generateId(),
                    projectId: req.params.id,
                    label: m.label,
                    isCompleted: m.isCompleted,
                    priority: m.priority
                };
                await appendRow('milestones', newM);
                newProjectMilestones.push(newM);
            }
        }
        
        const projects = await getAllRows('projects');
        const proj = projects.find((p: any) => p.id === req.params.id);
        
        res.json({ ...proj, milestones: newProjectMilestones });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Worklogs
router.post('/worklogs', async (req, res) => {
    try {
        const worklog = { ...req.body, id: generateId() };
        await appendRow('worklogs', worklog);
        
        // Trigger notification for Admins
        const users = await getAllRows('users');
        const student = users.find((u: any) => u.id === worklog.studentId);
        const admins = users.filter((u: any) => u.role === 'ADMIN');
        
        for (const admin of admins) {
            await triggerNotification({
                userId: admin.id,
                type: 'info',
                priority: 'medium',
                message: `New Worklog submission from ${student?.name || 'Student'}`,
                actionTab: 'reports',
                actionLabel: 'Review Log'
            });
        }
        
        res.json(worklog);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/worklogs/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        await updateRow('worklogs', 'id', req.params.id, { status });
        
        // Notify Student
        const worklogs = await getAllRows('worklogs');
        const log = worklogs.find((l: any) => l.id === req.params.id);
        if (log) {
            await triggerNotification({
                userId: log.studentId,
                type: status === 'REVIEWED' ? 'success' : 'info',
                priority: 'medium',
                message: `Your worklog for ${log.date} has been ${status.toLowerCase()}`,
                actionTab: 'worklogs',
                actionLabel: 'View Worklog'
            });
        }
        
        res.json({ id: req.params.id, status });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Attendance
router.post('/attendance', async (req, res) => {
    try {
        const record = { ...req.body, id: generateId() };
        await appendRow('attendance', record);
        res.json(record);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/attendance/:id', async (req, res) => {
    try {
        const record = req.body;
        await updateRow('attendance', 'id', req.params.id, record);
        res.json({ ...record, id: req.params.id });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Messages
router.get('/messages', async (req, res) => {
    try {
        const messages = await getAllRows('messages');
        res.json(messages);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/messages', async (req, res) => {
    try {
        const msg = { ...req.body, id: generateId() };
        await appendRow('messages', msg);
        
        // Notify Recipient
        const users = await getAllRows('users');
        const sender = users.find((u: any) => u.id === msg.senderId);
        
        await triggerNotification({
            userId: msg.recipientId,
            type: 'admin',
            priority: 'high',
            message: `New message from ${sender?.name || 'User'}`,
            actionTab: 'messages',
            actionLabel: 'Read Message'
        });
        
        res.json(msg);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/messages/:id/read', async (req, res) => {
    try {
        await updateRow('messages', 'id', req.params.id, { status: 'READ' });
        res.json({ id: req.params.id, status: 'READ' });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Notifications
router.post('/notifications', async (req, res) => {
    try {
        const notif = { ...req.body, id: generateId() };
        await appendRow('notifications', notif);
        res.json(notif);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/notifications/:id/read', async (req, res) => {
    try {
        await updateRow('notifications', 'id', req.params.id, { isRead: 'true' });
        res.json({ id: req.params.id, isRead: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/notifications/clear', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId required' });
        
        const all = await getAllRows('notifications');
        const userNotifs = all.filter((n: any) => n.userId === userId || (!n.userId && userId === 'admin')); // Admin clears globals too?
        
        for (const n of userNotifs) {
            await deleteRow('notifications', 'id', n.id);
        }
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/notifications/read-all', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId required' });
        
        const all = await getAllRows('notifications');
        for (const n of all) {
            if ((n.userId === userId || (!n.userId && userId === 'admin')) && (n.isRead !== true && n.isRead !== 'true')) {
                await updateRow('notifications', 'id', n.id, { isRead: 'true' });
            }
        }
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Reviews
router.post('/reviews', async (req, res) => {
    try {
        const reviews = req.body;
        if (!Array.isArray(reviews) || reviews.length === 0) {
            return res.status(400).json({ error: 'Invalid payload' });
        }
        
        const reviewerId = reviews[0].reviewerId;
        const today = new Date().toISOString().split('T')[0];
        
        const existingAll = await getAllRows('peerReviews');
        const existingReview = existingAll.find((r: any) => r.reviewerId === reviewerId && r.date === today);
        
        if (existingReview) {
            return res.status(400).json({ error: 'You have already submitted a review today.' });
        }
        
        for (const review of reviews) {
            await appendRow('peerReviews', { ...review, id: generateId() });
        }
        
        // Notify Team being reviewed? 
        // Maybe just notify the team lead if we had that concept.
        // For now, let's notify all students in the target team.
        const targetTeamId = reviews[0].teamId;
        const users = await getAllRows('users');
        const targetTeamMembers = users.filter((u: any) => u.teamId === targetTeamId);
        
        for (const member of targetTeamMembers) {
            await triggerNotification({
                userId: member.id,
                type: 'info',
                priority: 'low',
                message: `New peer review submitted for your team.`,
                actionTab: 'analytics',
                actionLabel: 'View Feedback'
            });
        }
        
        res.json({ count: reviews.length, message: 'Success' });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/reviews/assignment/:reviewerId', async (req, res) => {
    try {
        const { reviewerId } = req.params;
        const users = await getAllRows('users');
        const user = users.find((u: any) => u.id === reviewerId);
        
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const allTeams = await getAllRows('teams');
        const otherTeams = allTeams.filter((t: any) => t.id !== user.teamId);
        
        if (otherTeams.length === 0) {
            return res.json({ assignedTeam: null, message: 'No other teams' });
        }
        const assignedTeam = otherTeams[0];
        
        res.json({
            assignedTeam: {
                id: assignedTeam.id,
                name: assignedTeam.name,
                projectId: assignedTeam.projectId,
                studentIds: users.filter((u: any) => u.teamId === assignedTeam.id).map((u: any) => u.id)
            }
        });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Audit Logs
router.post('/audit-logs', async (req, res) => {
    try {
        const log = { ...req.body, id: generateId() };
        await appendRow('auditLogs', log);
        res.json(log);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Archive Items
router.get('/archive', async (req, res) => {
    try {
        const items = await getAllRows('archiveItems');
        res.json(items);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/archive', async (req, res) => {
    try {
        const item = { ...req.body, id: generateId() };
        await appendRow('archiveItems', item);
        res.json(item);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/archive/:id', async (req, res) => {
    try {
        await deleteRow('archiveItems', 'id', req.params.id);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
