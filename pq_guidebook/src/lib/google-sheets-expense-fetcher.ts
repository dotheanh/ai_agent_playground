import type { ExpenseData, MemberSummary } from '@/types';

const SHEET_ID = '1tMQ7wqwdHHxScqjKj9ssKJ2gq-cdJBPhPLZltH_YJs0';
const GID = '1759569996';
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${GID}`;

// Column indices (fixed based on sheet structure - 20 columns A-T)
const COL = {
  DESC: 0, // A: Nội dung chi
  AMOUNT: 1, // B: Số tiền
  PERSON: 2, // C: Người chi
  COUNT: 3, // D: Số người
  PER_PERSON: 4, // E: Tiền/người
  BINH: 5, // F: Bình
  NHI: 6, // G: Nhi
  TAN: 7, // H: Tân
  THUAN: 8, // I: Thuận
  TRIEU: 9, // J: Triển
  THE_ANH: 10, // K: Thế Anh
  VY: 11, // L: Vy
};

const MEMBER_NAMES = ['Bình', 'Nhi', 'Tân', 'Thuận', 'Triển', 'Thế Anh', 'Vy'];

export async function fetchExpenseData(): Promise<ExpenseData> {
  const response = await fetch(URL);
  const text = await response.text();

  console.log('Google Sheets Raw Response:', text);

  // Parse Google Sheets JSON response (wrapped in callback)
  const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\((.*)\)/);
  if (!jsonMatch) {
    throw new Error('Failed to parse Google Sheets response');
  }

  const json = JSON.parse(jsonMatch[1]);
  console.log('Google Sheets Parsed JSON:', JSON.stringify(json, null, 2));
  const rows = json.table.rows;

  // Parse expense items (rows with description and amount in column B)
  const items: any[] = [];
  let total = 0;

  // Parse member summary data from rows 1-4 (summary section)
  // Row 1: "Số tiền cuối phải trả của mỗi người"
  // Row 2: "Số tiền đóng quỹ"
  // Row 3: "Số tiền đã chi/ứng trước"
  // Row 4: "Chi phí"
  const memberData: Record<string, { toPay?: number; fund?: number; advance?: number; total?: number }> = {};
  MEMBER_NAMES.forEach(name => { memberData[name] = {}; });

  rows.forEach((row: any, rowIndex: number) => {
    const description = row.c[COL.DESC]?.v || '';
    const amount = row.c[COL.AMOUNT]?.v || 0;

    // Check if this is an expense item row (has both description and amount)
    if (description && amount) {
      const item: any = {
        stt: items.length + 1,
        description,
        amount,
        person: row.c[COL.PERSON]?.v || '',
        count: row.c[COL.COUNT]?.v || 0,
        perPerson: row.c[COL.PER_PERSON]?.v || 0,
      };

      // Parse member participation (new format: "x" = true, null/empty = false, number = actual amount)
      const parseMemberValue = (val: unknown): boolean | number => {
        if (val === null || val === undefined || val === '') return false;
        if (val === 'x' || val === 'X') return true;
        if (typeof val === 'number') return val;
        return false;
      };

      item.binh = parseMemberValue(row.c[COL.BINH]?.v);
      item.nhi = parseMemberValue(row.c[COL.NHI]?.v);
      item.tan = parseMemberValue(row.c[COL.TAN]?.v);
      item.thuan = parseMemberValue(row.c[COL.THUAN]?.v);
      item.trieu = parseMemberValue(row.c[COL.TRIEU]?.v);
      item.theAnh = parseMemberValue(row.c[COL.THE_ANH]?.v);
      item.vy = parseMemberValue(row.c[COL.VY]?.v);

      items.push(item);
      total += amount;
    } else if (rowIndex >= 1 && rowIndex <= 4) {
      // Summary rows (rows 1-4): parse data from columns F-L for all members
      const summaryType = rowIndex - 1; // 0=toPay, 1=fund, 2=advance, 3=total

      // Parse all columns F-L (indices 5-11) for summary data
      // Handle both boolean and number values generically
      for (let colIdx = COL.BINH; colIdx <= COL.VY; colIdx++) {
        const memberName = MEMBER_NAMES[colIdx - COL.BINH];
        const cellValue = row.c[colIdx]?.v;

        // Only store number values for summary (skip booleans)
        if (cellValue !== undefined && cellValue !== null && typeof cellValue === 'number') {
          switch (summaryType) {
            case 0: memberData[memberName].toPay = cellValue; break;
            case 1: memberData[memberName].fund = cellValue; break;
            case 2: memberData[memberName].advance = cellValue; break;
            case 3: memberData[memberName].total = cellValue; break;
          }
        }
      }
    }
  });

  // Build member summary array
  const members: MemberSummary[] = MEMBER_NAMES.map(name => ({
    name,
    toPay: memberData[name].toPay ?? 0,
    fundContribution: memberData[name].fund ?? 0,
    advancePayment: memberData[name].advance ?? 0,
    totalExpense: memberData[name].total ?? 0,
  }));

  return { items, total, members };
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatShort(amount: number): string {
  // Format to thousands with "k" suffix and dot separator (e.g., 6741000 -> "6.741k")
  if (amount >= 1000) {
    const thousands = Math.round(amount / 1000);
    const formatted = thousands.toLocaleString('vi-VN').replace(/\./g, '.');
    return `${formatted}k`;
  }
  return amount.toString();
}
