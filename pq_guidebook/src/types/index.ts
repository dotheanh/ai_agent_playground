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
}

export interface HeaderProps {
  // No props needed - uses internal state for clock
}

export interface ImageCarouselProps {
  images: string[];
  title: string;
}
