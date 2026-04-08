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

  // Parse member summary data from summary rows (rows without description but with values in F or K)
  // Summary section structure:
  // Row 0: "Số tiền cuối phải trả của mỗi người" -> F=Bình, K=Thế Anh
  // Row 1: "Số tiền đóng quỹ" -> K only
  // Row 2: "Số tiền đã chi/ứng trước" -> F=Bình, K=Thế Anh
  // Row 3: "Tổng chi phí" -> F=Bình, K=Thế Anh
  const memberData: Record<string, { toPay?: number; fund?: number; advance?: number; total?: number }> = {};
  MEMBER_NAMES.forEach(name => { memberData[name] = {}; });

  // Track which summary row we're on (0=toPay, 1=fund, 2=advance, 3=total)
  let summaryRowIndex = 0;

  rows.forEach((row: any) => {
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
    } else {
      // This is a summary row (no description, check for values in F or K)
      const binhVal = row.c[COL.BINH]?.v;
      const theAnhVal = row.c[COL.THE_ANH]?.v;

      // Check if this row has any summary data
      if (binhVal !== undefined && binhVal !== null) {
        switch (summaryRowIndex) {
          case 0: memberData['Bình'].toPay = binhVal; break;
          case 1: memberData['Bình'].fund = binhVal; break;
          case 2: memberData['Bình'].advance = binhVal; break;
          case 3: memberData['Bình'].total = binhVal; break;
        }
      }

      if (theAnhVal !== undefined && theAnhVal !== null) {
        switch (summaryRowIndex) {
          case 0: memberData['Thế Anh'].toPay = theAnhVal; break;
          case 1: memberData['Thế Anh'].fund = theAnhVal; break;
          case 2: memberData['Thế Anh'].advance = theAnhVal; break;
          case 3: memberData['Thế Anh'].total = theAnhVal; break;
        }
      }

      // Increment summary row index if we found any data
      if (binhVal !== undefined || theAnhVal !== undefined) {
        summaryRowIndex++;
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
