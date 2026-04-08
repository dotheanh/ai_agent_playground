export interface ExternalLink {
  type: 'website' | 'facebook' | 'airbnb' | 'tiktok' | 'map' | 'other';
  url: string;
  label: string;
}

export interface Event {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  fullDescription: string;
  notes: string;
  mapLink: string;
  images: string[];
  externalLinks?: ExternalLink[];
}

export interface TimelineProps {
  events: Event[];
  selectedEvent: Event | null;
  currentEvent: Event | null;
  onSelectEvent: (event: Event) => void;
}

export interface DetailPanelProps {
  event: Event | null;
  isCurrent: boolean;
  events: Event[];
  onSelectEvent: (event: Event) => void;
}

export interface HeaderProps {
  // No props needed - uses internal state for clock
}

export interface ImageCarouselProps {
  images: string[];
  title: string;
}

// MLACE Expense Modal Types
export interface ExpenseItem {
  stt: number;
  description: string;
  amount: number;
  person: string;
  count: number;
  perPerson: number;
  // Member participation (columns F-L) - can be boolean or number
  binh?: boolean | number;
  nhi?: boolean | number;
  tan?: boolean | number;
  thuan?: boolean | number;
  trieu?: boolean | number;
  theAnh?: boolean | number;
  vy?: boolean | number;
}

export interface MemberSummary {
  name: string;
  toPay: number; // Số tiền cuối phải trả
  fundContribution: number; // Số tiền đóng quỹ
  advancePayment: number; // Số tiền đã chi/ứng trước
  totalExpense: number; // Tổng chi phí
}

export interface ExpenseData {
  items: ExpenseItem[];
  total: number;
  members: MemberSummary[];
}
