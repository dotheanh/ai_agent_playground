import type { ExpenseData, MemberSummary } from '@/types';

const SHEET_ID = '1tMQ7wqwdHHxScqjKj9ssKJ2gq-cdJBPhPLZltH_YJs0';
const GID = '1945875745';
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${GID}`;

// Column indices (fixed based on sheet structure)
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
  SUMMARY_LABEL: 12, // M: Label tổng hợp
  SUMMARY_VALUE: 14, // O: Giá trị tổng hợp
};

const MEMBER_NAMES = ['Bình', 'Nhi', 'Tân', 'Thuận', 'Triển', 'Thế Anh', 'Vy'];
const MEMBER_COL_INDEXES = [COL.BINH, COL.NHI, COL.TAN, COL.THUAN, COL.TRIEU, COL.THE_ANH, COL.VY];

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

  // Parse expense items (rows with description and amount)
  const items: any[] = [];
  let total = 0;

  // Parse member summary data
  const memberData: Record<string, { toPay?: number; fund?: number; advance?: number; total?: number }> = {};
  MEMBER_NAMES.forEach(name => { memberData[name] = {}; });

  rows.forEach((row: any) => {
    const description = row.c[COL.DESC]?.v || '';
    const amount = row.c[COL.AMOUNT]?.v || 0;

    // Check if this is an expense item row
    if (description && amount) {
      const item: any = {
        stt: items.length + 1,
        description,
        amount,
        person: row.c[COL.PERSON]?.v || '',
        count: row.c[COL.COUNT]?.v || 0,
        perPerson: row.c[COL.PER_PERSON]?.v || 0,
      };

      // Parse member participation
      item.binh = row.c[COL.BINH]?.v === true;
      item.nhi = row.c[COL.NHI]?.v === true;
      item.tan = row.c[COL.TAN]?.v === true;
      item.thuan = row.c[COL.THUAN]?.v === true;
      item.trieu = row.c[COL.TRIEU]?.v === true;
      item.theAnh = row.c[COL.THE_ANH]?.v === true;
      item.vy = row.c[COL.VY]?.v === true;

      items.push(item);
      total += amount;
    }

    // Check if this is a summary row (has label in column M)
    const summaryLabel = row.c[COL.SUMMARY_LABEL]?.v || '';
    const summaryValue = row.c[COL.SUMMARY_VALUE]?.v;

    if (summaryLabel && summaryValue !== undefined) {
      // This is a summary row, need to find which member column this value belongs to
      // The summary section has labels in column M and values spread across member columns
      MEMBER_NAMES.forEach((name, idx) => {
        const memberColIdx = MEMBER_COL_INDEXES[idx];
        const memberValue = row.c[memberColIdx]?.v;
        if (memberValue !== undefined && memberValue !== null) {
          if (summaryLabel.includes('phải trả')) {
            memberData[name].toPay = memberValue;
          } else if (summaryLabel.includes('đóng quỹ')) {
            memberData[name].fund = memberValue;
          } else if (summaryLabel.includes('đã chi/ứng trước')) {
            memberData[name].advance = memberValue;
          } else if (summaryLabel.includes('Tổng chi phí')) {
            memberData[name].total = memberValue;
          }
        }
      });
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
