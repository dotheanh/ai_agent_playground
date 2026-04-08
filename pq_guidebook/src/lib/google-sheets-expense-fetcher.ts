import type { ExpenseData } from '@/types';

const SHEET_ID = '1tMQ7wqwdHHxScqjKj9ssKJ2gq-cdJBPhPLZltH_YJs0';
const GID = '1945875745';
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${GID}`;

export async function fetchExpenseData(): Promise<ExpenseData> {
  const response = await fetch(URL);
  const text = await response.text();

  // Parse Google Sheets JSON response (wrapped in callback)
  const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\((.*)\)/);
  if (!jsonMatch) {
    throw new Error('Failed to parse Google Sheets response');
  }

  const json = JSON.parse(jsonMatch[1]);
  const cols = json.table.cols;
  const rows = json.table.rows;

  // Find column indices
  const descIdx = cols.findIndex((c: any) => c.label === 'Nội dung chi');
  const amountIdx = cols.findIndex((c: any) => c.label === 'Số tiền');
  const personIdx = cols.findIndex((c: any) => c.label === 'Người chi');
  const countIdx = cols.findIndex((c: any) => c.label === 'Số người');
  const perPersonIdx = cols.findIndex((c: any) => c.label === 'Tiền/người');

  // Parse rows into expense items
  const items: any[] = [];
  let total = 0;

  rows.forEach((row: any) => {
    const description = row.c[descIdx]?.v || '';
    const amount = row.c[amountIdx]?.v || 0;
    const person = row.c[personIdx]?.v || '';
    const count = row.c[countIdx]?.v || 0;
    const perPerson = row.c[perPersonIdx]?.v || 0;

    // Skip header row and empty rows
    if (description && amount) {
      items.push({
        stt: items.length + 1,
        description,
        amount,
        person,
        count,
        perPerson
      });
      total += amount;
    }
  });

  return { items, total };
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
