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
  const rows = json.table.rows;

  // Column indices (fixed based on sheet structure: A=0, B=1, C=2, D=3, E=4)
  const DESC_IDX = 0; // Column A: Nội dung chi
  const AMOUNT_IDX = 1; // Column B: Số tiền
  const PERSON_IDX = 2; // Column C: Người chi
  const COUNT_IDX = 3; // Column D: Số người
  const PER_PERSON_IDX = 4; // Column E: Tiền/người

  // Parse rows into expense items
  const items: any[] = [];
  let total = 0;

  rows.forEach((row: any) => {
    const description = row.c[DESC_IDX]?.v || '';
    const amount = row.c[AMOUNT_IDX]?.v || 0;
    const person = row.c[PERSON_IDX]?.v || '';
    const count = row.c[COUNT_IDX]?.v || 0;
    const perPerson = row.c[PER_PERSON_IDX]?.v || 0;

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
