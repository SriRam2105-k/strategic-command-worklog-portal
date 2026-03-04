import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportToCSV() {
    const models = [
        'user',
        'team',
        'project',
        'milestone',
        'worklog',
        'attendance',
        'message',
        'notification',
        'auditLog',
        'peerReview',
        'archiveItem'
    ];

    const exportDir = path.join(process.cwd(), 'exported_data');

    if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir);
    }

    for (const model of models) {
        try {
            // @ts-ignore - dynamic model access
            const data = await prisma[model].findMany();
            if (data.length === 0) {
                console.log(`Skipping ${model} - no data`);
                continue;
            }

            const headers = Object.keys(data[0]);
            const csvRows = [headers.join(',')];

            for (const row of data) {
                const values = headers.map(header => {
                    let val = row[header];
                    if (val === null || val === undefined) {
                        return ''; // Return empty string for NULL
                    }
                    const escaped = ('' + val).replace(/"/g, '""');
                    return `"${escaped}"`;
                });
                csvRows.push(values.join(','));
            }

            const fileName = `${model}.csv`;
            const filePath = path.join(exportDir, fileName);
            fs.writeFileSync(filePath, csvRows.join('\n'), 'utf8');
            console.log(`Successfully exported ${model} to ${filePath}`);
        } catch (error) {
            console.error(`Error exporting ${model}:`, error);
        }
    }

    await prisma.$disconnect();
}

exportToCSV();
