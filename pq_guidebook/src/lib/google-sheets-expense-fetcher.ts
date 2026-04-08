import type { ExpenseData, MemberSummary } from '@/types';

const SHEET_ID = '1tMQ7wqwdHHxScqjKj9ssKJ2gq-cdJBPhPLZltH_YJs0';
const GID = '1945875745';
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${GID}`;

// Column indices (fixed based on sheet structure - 20 columns A-T)
const COL = {
  DESC: 0, // A: Nội dung chi
  AMOUNT: 1, // B: Số tiền
  PERSON: 2, // C: Người chi
  COUNT: 3, // D: Số người
  PER_PERSON: 4, // E: Tiền/người
  BINH: 5, // F: Bình (number)
  NHI: 6, // G: Nhi (boolean)
  TAN: 7, // H: Tân (boolean)
  THUAN: 8, // I: Thuận (boolean)
  TRIEU: 9, // J: Triển (boolean)
  THE_ANH: 10, // K: Thế Anh (number)
  VY: 11, // L: Vy (boolean)
  SUMMARY_LABEL: 12, // M: Label tổng hợp
  UNUSED_N: 13, // N
  SUMMARY_VALUE: 14, // O: Giá trị tổng hợp
};

const MEMBER_NAMES = ['Bình', 'Nhi', 'Tân', 'Thuận', 'Triển', 'Thế Anh', 'Vy'];

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

      // Parse member participation (can be boolean or number)
      const binhVal = row.c[COL.BINH]?.v;
      const nhiVal = row.c[COL.NHI]?.v;
      const tanVal = row.c[COL.TAN]?.v;
      const thuanVal = row.c[COL.THUAN]?.v;
      const trieuVal = row.c[COL.TRIEU]?.v;
      const theAnhVal = row.c[COL.THE_ANH]?.v;
      const vyVal = row.c[COL.VY]?.v;

      item.binh = binhVal !== undefined && binhVal !== null ? binhVal : false;
      item.nhi = nhiVal !== undefined && nhiVal !== null ? nhiVal : false;
      item.tan = tanVal !== undefined && tanVal !== null ? tanVal : false;
      item.thuan = thuanVal !== undefined && thuanVal !== null ? thuanVal : false;
      item.trieu = trieuVal !== undefined && trieuVal !== null ? trieuVal : false;
      item.theAnh = theAnhVal !== undefined && theAnhVal !== null ? theAnhVal : false;
      item.vy = vyVal !== undefined && vyVal !== null ? vyVal : false;

      items.push(item);
      total += amount;
    } else if (rowIndex >= 1 && rowIndex <= 4) {
      // Summary rows (rows 1-4): parse data from columns F-L for all members
      const summaryType = rowIndex - 1; // 0=toPay, 1=fund, 2=advance, 3=total

      // Parse all columns F-L (indices 5-11) for summary data
      for (let colIdx = 5; colIdx <= 11; colIdx++) {
        const memberName = MEMBER_NAMES[colIdx - 5];
        const cellValue = row.c[colIdx]?.v;

        // Store any value that exists (number, boolean, or string)
        if (cellValue !== undefined && cellValue !== null) {
          switch (summaryType) {
            case 0: memberData[memberName].toPay = cellValue as number; break;
            case 1: memberData[memberName].fund = cellValue as number; break;
            case 2: memberData[memberName].advance = cellValue as number; break;
            case 3: memberData[memberName].total = cellValue as number; break;
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
  // Format to thousands with "k" suffix (e.g., 50000 -> "50k")
  if (amount >= 1000) {
    const thousands = Math.round(amount / 1000);
    return `${thousands}k`;
  }
  return amount.toString();
}
