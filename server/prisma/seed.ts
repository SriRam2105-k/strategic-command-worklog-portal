import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Clear existing data to avoid unique constraint violations
    await prisma.peerReview.deleteMany();
    await prisma.worklog.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.message.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.milestone.deleteMany();
    await prisma.user.deleteMany({ where: { role: 'STUDENT' } });
    await prisma.team.deleteMany();
    await prisma.project.deleteMany();
    await prisma.archiveItem.deleteMany();

    const hashedPassword = await bcrypt.hash('admin', 10);
    const studentPassword = await bcrypt.hash('1234', 10);

    // Create Primary Admin User
    await prisma.user.upsert({
        where: { rollNumber: 'ADM-001' },
        update: {
            password: hashedPassword,
            role: 'ADMIN',
            name: 'Command HQ'
        },
        create: {
            name: 'Command HQ',
            rollNumber: 'ADM-001',
            password: hashedPassword,
            role: 'ADMIN',
            status: 'ONLINE'
        },
    });

    // Create Secondary Admin User
    await prisma.user.upsert({
        where: { rollNumber: 'ADM-002' },
        update: {
            password: hashedPassword,
            role: 'ADMIN',
            name: 'Lead Operative'
        },
        create: {
            name: 'Lead Operative',
            rollNumber: 'ADM-002',
            password: hashedPassword,
            role: 'ADMIN',
            status: 'OFFLINE'
        },
    });

    // Create Project
    const project = await prisma.project.create({
        data: {
            name: 'OPERATION NEXUS',
            description: 'Primary strategic mission.',
            status: 'ACTIVE',
            milestones: {
                create: [
                    { label: 'Primary Objective', isCompleted: true, priority: 'CRITICAL' }
                ]
            }
        }
    });

    // Create 10 Teams
    const teamNames = [
        'FRONTEND', 'BACKEND', 'AI AUTOMATION', 'CLOUD & DEVOPS', 'AI & ML',
        'UI & UX', 'APP DEVELOPMENT', 'VIDEO PRODUCTION', 'CREATIVE MEDIA PRODUCTION', 'DATA VISUALIZATION'
    ];

    const teams = [];
    for (const name of teamNames) {
        const team = await prisma.team.create({
            data: {
                name,
                projectId: project.id
            }
        });
        teams.push(team);
    }

    const studentsData = [
        { roll: "583224243029", name: "MARIS YUKESHWARAN S" },
        { roll: "583224243002", name: "ABDUL HALIK N" },
        { roll: "583224243046", name: "SADHANA SHREE I" },
        { roll: "583224243011", name: "DERANSIYA DORIN J" },
        { roll: "583224243058", name: "SWETHA T" },
        { roll: "583224243027", name: "LOGA SOUNDARYA C" },
        { roll: "583224243041", name: "RITHISH J" },
        { roll: "583224243031", name: "NANDHINI D" },
        { roll: "583224243062", name: "YOKESH KUMAR R" },
        { roll: "583224243020", name: "GEETHA A" },
        { roll: "583224243055", name: "SIVA SHEELAN P" },
        { roll: "583224148021", name: "JEEVAN RAJ V" },
        { roll: "583224148046", name: "SHANMUGA PRIYA P" },
        { roll: "583224148301", name: "SRIRAM A" },
        { roll: "583224148042", name: "SAI KRISHNAN M" },
        { roll: "583224148057", name: "VISHNU M" },
        { roll: "583224148045", name: "SELVA KUMAR R" },
        { roll: "583224148013", name: "DHARINI K" },
        { roll: "583224148035", name: "NIKILA S" },
        { roll: "583224148036", name: "PRAKASH RAJ C" },
        { roll: "583224148015", name: "GANGA S" },
        { roll: "583224148054", name: "VEL PRAKASH S" },
        { roll: "583224103001", name: "AMIRTHAA K" },
        { roll: "583224103008", name: "JEEVITHAN B" },
        { roll: "583224104045", name: "JISHNU VEL T" },
        { roll: "583224104023", name: "DHAVAPRIYA S" },
        { roll: "583224104095", name: "SANTHOSH B" },
        { roll: "583224104007", name: "ALAN BIRLA R" },
        { roll: "583224104047", name: "KARTHIKEYAN S" },
        { roll: "583224104021", name: "DHARUN P" },
        { roll: "583224104010", name: "ASLIM J" },
        { roll: "583224104042", name: "JANANI S" },
        { roll: "583224104020", name: "DHARANI G.S" },
        { roll: "583224104085", name: "RAMYA R" },
        { roll: "583224104044", name: "JEGAN T" },
        { roll: "583224104119", name: "VIJAY SEENIVASH B" },
        { roll: "583224104037", name: "HARSHVARTHAN KS" },
        { roll: "583224104098", name: "SAPNA S" },
        { roll: "583224104110", name: "SUBHETHA B" },
        { roll: "583224104065", name: "MONICA S" },
        { roll: "583224104058", name: "MANO BALA D" },
        { roll: "583224104109", name: "SOWMITHA MURUGAN" },
        { roll: "583224104122", name: "YOGAMARAN S" },
        { roll: "583224104034", name: "HARINI PRIYA M" },
        { roll: "583224104102", name: "SHARMI M" },
        { roll: "583224104123", name: "YOGESHWARAN P" },
        { roll: "583224104106", name: "SIMILA C" },
        { roll: "583224104083", name: "RAKESH SHARMA M S" },
        { roll: "583224104112", name: "THANUSHRI S" },
        { roll: "583224104096", name: "SANTHOSH M" },
        { roll: "583224104056", name: "MADHUMATHI R" },
        { roll: "583224104033", name: "HARIDHARSHAN B" },
        { roll: "583224104082", name: "RAHUL K" },
        { roll: "583224104113", name: "THASNIM BANU A" },
        { roll: "583224104114", name: "THECIKA A" },
        { roll: "583224104088", name: "ROSHVANTHRAJ J" },
        { roll: "583224104077", name: "PRINCE S" },
        { roll: "583224104061", name: "MITHUN R" },
        { roll: "583224106055", name: "KETHZI ANGELIN R" },
        { roll: "583224106045", name: "JESSY MERLIN R" },
        { roll: "583224106022", name: "DHARANI M" },
        { roll: "583224106023", name: "DHARANIKUMAR K" },
        { roll: "583224106039", name: "HEMALATHA R" },
        { roll: "583224106011", name: "ARUNKUMAR G" },
        { roll: "583224106042", name: "JAI VISHWA G" },
        { roll: "583224106008", name: "ANNAKAMESHWARI M" },
        { roll: "583224106060", name: "MATHUMITHA M" },
        { roll: "583224106076", name: "PALANI KUMAR K" },
        { roll: "583224106100", name: "SHIVASANJAY S.V" },
        { roll: "583224106095", name: "SHAHAANA R" },
        { roll: "583224106086", name: "RAGAVI G" },
        { roll: "583224106110", name: "VIJAYASRI S" },
        { roll: "583224106098", name: "SHAMYUKTHA" },
        { roll: "583224106040", name: "IMRANKHAN S" },
        { roll: "583224106051", name: "KATHIRAVAN J" },
        { roll: "583224106041", name: "INFANT ROWAN C" },
        { roll: "583224106094", name: "SATHISH R" },
        { roll: "583224106063", name: "MOHAMED IEJAS FAZIL" },
        { roll: "583224105004", name: "AVINASH T" },
        { roll: "583224105007", name: "BHAVANA M" },
        { roll: "583224105023", name: "THAMOTHARA PANDIYAN M" },
        { roll: "583224205047", name: "SABARINATHAN K" },
        { roll: "583224205059", name: "VIGNESH M" },
        { roll: "583224205027", name: "KEERTHANA S" },
        { roll: "583224205054", name: "SRI RAM K" },
        { roll: "583224205028", name: "KEERTHANA S" },
        { roll: "583224205025", name: "KAVINBHARATHI M" },
        { roll: "583224205045", name: "RITHISHWARAN K" },
        { roll: "583224205006", name: "BALADHARANI B" },
        { roll: "583224205024", name: "KASI PRASATH K" },
        { roll: "583224205003", name: "ARAVINDAN S" },
        { roll: "583224205043", name: "PRAVEENRAJ M" },
        { roll: "583224205051", name: "SHOFYA J" },
        { roll: "583224205031", name: "LATHIKA SRI V" },
        { roll: "583224205050", name: "SASTHA K" },
        { roll: "583224205038", name: "NAVEEN NARAYANAN N" },
        { roll: "583224205037", name: "MOHAMED UMER NIHAL" },
        { roll: "583224205012", name: "GURU PRIYAN M" },
        { roll: "583224114017", name: "THIYANESWAR M" },
        { roll: "583224114007", name: "JEEVA PRIYAN M" }
    ];

    for (let i = 0; i < studentsData.length; i++) {
        const studentData = studentsData[i];
        const teamIndex = i % teams.length;
        await prisma.user.create({
            data: {
                name: studentData.name,
                rollNumber: studentData.roll,
                password: studentPassword,
                role: 'STUDENT',
                teamId: teams[teamIndex].id,
                status: 'OFFLINE'
            }
        });
    }

    console.log(`Seeding complete: 2 Admins, 10 Teams, ${studentsData.length} Students added.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

