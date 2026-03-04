import { Router } from 'express';
import { prisma } from './index';
import bcrypt from 'bcryptjs';

const router = Router();

// --- Auth ---
router.post('/login', async (req, res) => {
    const { rollNumber, password } = req.body;
    const user = await prisma.user.findUnique({ where: { rollNumber } });
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    // For now, return user without token, frontend manages session state
    // ideally return JWT
    res.json(user);
});

// --- Data Fetching (Sync) ---
router.get('/sync', async (req, res) => {
    try {
        const [users, teams, projects, worklogs, attendance, messages, notifications, auditLogs, reviews, archiveItems] = await Promise.all([
            prisma.user.findMany(),
            prisma.team.findMany({ include: { members: true } }),
            prisma.project.findMany({ include: { milestones: true } }),
            prisma.worklog.findMany(),
            prisma.attendance.findMany(),
            prisma.message.findMany(),
            prisma.notification.findMany({ orderBy: { timestamp: 'desc' } }),
            prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' } }),
            prisma.peerReview.findMany(),
            prisma.archiveItem.findMany({ orderBy: { timestamp: 'desc' } })
        ]);

        res.json({
            users,
            teams: teams.map((t: any) => ({
                id: t.id,
                name: t.name,
                projectId: t.projectId,
                studentIds: t.members.map((m: any) => m.id)
            })),
            projects,
            worklogs,
            attendance,
            messages,
            notifications,
            auditlogs: auditLogs,
            reviews,
            archive: archiveItems
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Sync failed' });
    }
});

// --- Individual Resources ---

// Users
router.post('/users', async (req, res) => {
    try {
        const { password, ...rest } = req.body;
        const hashedPassword = await bcrypt.hash(password || '1234', 10);
        const user = await prisma.user.create({
            data: { ...rest, password: hashedPassword }
        });
        res.json(user);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

router.put('/users/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { status }
        });
        res.json(user);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// Teams
router.post('/teams', async (req, res) => {
    const { studentIds, ...rest } = req.body;
    const team = await prisma.team.create({ data: rest });
    res.json({ ...team, studentIds: [] });
});

router.put('/teams/:id/members', async (req, res) => {
    const { studentIds } = req.body;
    try {
        await prisma.user.updateMany({
            where: { teamId: req.params.id },
            data: { teamId: null }
        });

        await prisma.user.updateMany({
            where: { id: { in: studentIds } },
            data: { teamId: req.params.id }
        });

        const updatedTeam = await prisma.team.findUnique({
            where: { id: req.params.id },
            include: { members: true }
        });

        if (!updatedTeam) return res.status(404).json({ error: 'Team not found' });

        res.json({
            id: updatedTeam.id,
            name: updatedTeam.name,
            projectId: updatedTeam.projectId,
            studentIds: updatedTeam.members.map((m: any) => m.id)
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Projects
router.post('/projects', async (req, res) => {
    const { milestones, ...rest } = req.body;
    const project = await prisma.project.create({
        data: {
            ...rest,
            milestones: {
                create: milestones
            }
        },
        include: { milestones: true }
    });
    res.json(project);
});

router.put('/projects/:id/milestones', async (req, res) => {
    const { milestones } = req.body; // Expecting array of milestone objects
    // Replace milestones logic
    try {
        await prisma.milestone.deleteMany({ where: { projectId: req.params.id } });
        const project = await prisma.project.update({
            where: { id: req.params.id },
            data: {
                milestones: {
                    create: milestones.map((m: any) => ({
                        label: m.label,
                        isCompleted: m.isCompleted,
                        priority: m.priority
                    }))
                }
            },
            include: { milestones: true }
        });
        res.json(project);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Worklogs
router.post('/worklogs', async (req, res) => {
    const worklog = await prisma.worklog.create({ data: req.body });
    res.json(worklog);
});

router.put('/worklogs/:id/status', async (req, res) => {
    const worklog = await prisma.worklog.update({
        where: { id: req.params.id },
        data: { status: req.body.status }
    });
    res.json(worklog);
});

// Attendance
router.post('/attendance', async (req, res) => {
    const record = await prisma.attendance.create({ data: req.body });
    res.json(record);
});

router.put('/attendance/:id', async (req, res) => {
    try {
        const record = await prisma.attendance.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(record);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// Messages
router.post('/messages', async (req, res) => {
    const msg = await prisma.message.create({ data: req.body });
    res.json(msg);
});

router.put('/messages/:id/read', async (req, res) => {
    const msg = await prisma.message.update({
        where: { id: req.params.id },
        data: { status: 'READ' }
    });
    res.json(msg);
});

// Notifications
router.post('/notifications', async (req, res) => {
    const notif = await prisma.notification.create({ data: req.body });
    res.json(notif);
});

router.put('/notifications/:id/read', async (req, res) => {
    const notif = await prisma.notification.update({
        where: { id: req.params.id },
        data: { isRead: true }
    });
    res.json(notif);
});

router.post('/notifications/clear', async (req, res) => {
    await prisma.notification.deleteMany({});
    res.json({ success: true });
});

router.put('/notifications/read-all', async (req, res) => {
    await prisma.notification.updateMany({ data: { isRead: true } });
    res.json({ success: true });
});

// Reviews
router.post('/reviews', async (req, res) => {
    try {
        const reviews = req.body; // Expecting array of review objects
        if (!Array.isArray(reviews) || reviews.length === 0) {
            return res.status(400).json({ error: 'Invalid payload: Expected array of reviews' });
        }

        const reviewerId = reviews[0].reviewerId;
        const today = new Date().toISOString().split('T')[0];

        // Validation: Check if reviewer has already reviewed ANY team today
        const existingReview = await prisma.peerReview.findFirst({
            where: {
                reviewerId: reviewerId,
                date: today
            }
        });

        if (existingReview) {
            return res.status(400).json({ error: 'You have already submitted a review today. Limit: One team review per day.' });
        }

        // Create reviews in bulk
        const createdReviews = await prisma.peerReview.createMany({
            data: reviews
        });

        res.json({ count: createdReviews.count, message: 'Reviews submitted successfully' });
    } catch (e: any) {
        console.error("Review Submission Error:", e);
        res.status(500).json({ error: e.message });
    }
});

router.get('/reviews/assignment/:reviewerId', async (req, res) => {
    try {
        const { reviewerId } = req.params;
        const user = await prisma.user.findUnique({ where: { id: reviewerId } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get all teams except user's team
        const otherTeams = await prisma.team.findMany({
            where: {
                id: { not: user.teamId || '' }
            },
            include: { members: true }
        });

        if (otherTeams.length === 0) {
            return res.json({ assignedTeam: null, message: 'No other teams available to review' });
        }

        // Deterministic Random Selection
        // Seed = reviewerId + date (YYYY-MM-DD)
        const today = new Date().toISOString().split('T')[0];
        const seedString = reviewerId + today;

        // Simple hash function for the seed
        let hash = 0;
        for (let i = 0; i < seedString.length; i++) {
            const char = seedString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        const positiveHash = Math.abs(hash);

        const index = positiveHash % otherTeams.length;
        const assignedTeam = otherTeams[index];

        res.json({
            assignedTeam: {
                id: assignedTeam.id,
                name: assignedTeam.name,
                projectId: assignedTeam.projectId,
                studentIds: assignedTeam.members.map((m: any) => m.id)
            }
        });

    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Audit Logs
router.post('/audit-logs', async (req, res) => {
    const log = await prisma.auditLog.create({ data: req.body });
    res.json(log);
});

// Archive Items
router.get('/archive', async (req, res) => {
    const items = await prisma.archiveItem.findMany({ orderBy: { timestamp: 'desc' } });
    res.json(items);
});

router.post('/archive', async (req, res) => {
    try {
        const item = await prisma.archiveItem.create({ data: req.body });
        res.json(item);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

router.delete('/archive/:id', async (req, res) => {
    try {
        await prisma.archiveItem.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

export default router;
