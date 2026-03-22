import { google } from 'googleapis';
import * as path from 'path';

const SPREADSHEET_ID = '16X9KPKE1WLhpENcx0DHzCZNx6UWR3COlzsbJYsKVow4';
const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');

const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export const sheets = google.sheets({ version: 'v4', auth });

export async function getAllRows(sheetName: string) {
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1:Z`,
    });
    
    const rows = res.data.values;
    if (!rows || rows.length === 0) return [];
    
    // First row is headers
    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    return dataRows.map(row => {
        const item: any = {};
        headers.forEach((header: string, index: number) => {
            item[header] = row[index] !== undefined ? row[index] : '';
            
            // Basic type coercion: try to parse booleans or JSON strings if needed
            // For now, treat all as strings or try JSON parsing for complex arrays
            if (item[header] === 'true') item[header] = true;
            if (item[header] === 'false') item[header] = false;
            // Treat explicit null string or empty as empty string (not null)
            if (item[header] === null) item[header] = '';
        });
        return item;
    });
}

function formatCellValue(val: any): string {
    if (typeof val === 'object' && val !== null) return JSON.stringify(val);
    if (val === undefined || val === null) return '';
    
    const strVal = String(val);
    // Convert ISO string to human-readable format for Google Sheets
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(strVal)) {
        const d = new Date(strVal);
        if (!isNaN(d.getTime())) {
            const pad = (n: number) => n.toString().padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        }
    }
    return strVal;
}

export async function appendRow(sheetName: string, item: any) {
    // Get headers first
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1:Z1`,
    });
    const headers = res.data.values?.[0] || [];
    
    const rowData = headers.map((header: string) => {
        return formatCellValue(item[header]);
    });

    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A:A`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [rowData]
        }
    });
}

export async function updateRow(sheetName: string, idField: string, idValue: string, updatedItem: any) {
    // Fetch all to find the row index
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1:Z`,
    });
    const rows = res.data.values || [];
    if (rows.length < 2) return; // No data rows
    
    const headers = rows[0];
    const idIndex = headers.indexOf(idField);
    if (idIndex === -1) return;
    
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
        if (rows[i][idIndex] === idValue) {
            rowIndex = i;
            break;
        }
    }
    
    if (rowIndex === -1) return; // Not found
    
    // Construct new row data, merging old data with updated fields
    const oldRow = rows[rowIndex];
    const rowData = headers.map((header: string, idx: number) => {
        if (updatedItem[header] !== undefined) {
             return formatCellValue(updatedItem[header]);
        }
        return oldRow[idx] || ''; // Keep old value if not updated
    });
    
    // Update the specific row. Rows in Sheets are 1-indexed. rowIndex is 0-indexed array, so physical row is rowIndex + 1
    const physicalRow = rowIndex + 1;
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A${physicalRow}:Z${physicalRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [rowData]
        }
    });
}

export async function rewriteAllRows(sheetName: string, items: any[]) {
    // Useful for mass updates or deletes
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1:Z1`,
    });
    const headers = res.data.values?.[0] || [];
    
    const allData = items.map(item => {
        return headers.map((header: string) => {
            return formatCellValue(item[header]);
       });
    });
    
    // Clear the existing data below headers
    await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A2:Z`,
    });
    
    if (allData.length > 0) {
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheetName}!A2:Z`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: allData
            }
        });
    }
}

export async function deleteRow(sheetName: string, idField: string, idValue: string) {
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1:Z`,
    });
    const rows = res.data.values || [];
    if (rows.length < 2) return;
    
    const headers = rows[0];
    const idIndex = headers.indexOf(idField);
    if (idIndex === -1) return;
    
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
        if (rows[i][idIndex] === idValue) {
            rowIndex = i;
            break;
        }
    }
    
    if (rowIndex === -1) return;
    
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === sheetName);
    const sheetId = sheet?.properties?.sheetId;
    
    if (sheetId !== undefined) {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId: sheetId,
                                dimension: "ROWS",
                                startIndex: rowIndex,
                                endIndex: rowIndex + 1
                            }
                        }
                    }
                ]
            }
        });
    }
}
