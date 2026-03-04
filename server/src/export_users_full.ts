import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function exportUsers() {
    const users = await prisma.user.findMany();

    if (users.length === 0) {
        console.log('No users found.');
        return;
    }

    const headers = Object.keys(users[0]);
    const csvRows = [headers.join(',')];

    for (const user of users) {
        const values = headers.map(header => {
            const val = (user as any)[header];
            // Handle null or undefined values by converting them to an empty string
            const stringVal = val === null || val === undefined ? '' : String(val);
            const escaped = stringVal.replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    fs.writeFileSync('users_full.csv', csvRows.join('\n'));
    console.log(`Successfully exported ${users.length} users to users_full.csv`);

    await prisma.$disconnect();
}

exportUsers();
