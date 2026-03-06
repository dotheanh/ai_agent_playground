const BASE = import.meta.env.BASE_URL || '/portal/';

// =============================================================================
// Site Configuration - Zingplay Women's Day 8/3
// Edit ONLY this file to customize all content across the site.
// All animations, layouts, and styles are controlled by the components.
// =============================================================================

// -- Site-wide settings -------------------------------------------------------
export interface SiteConfig {
  title: string;
  description: string;
  language: string;
}

export const siteConfig: SiteConfig = {
  title: "Zingplay - Chúc Mừng Ngày 8/3",
  description: "Landing page chúc mừng ngày Quốc Tế Phụ Nữ 8/3 dành cho các chị em Zingplay",
  language: "vi",
};

// -- Hero Section -------------------------------------------------------------
export interface HeroNavItem {
  label: string;
  sectionId: string;
  icon: "disc" | "play" | "calendar" | "music" | "send";
}

export interface HeroConfig {
  backgroundImage: string;
  brandName: string;
  decodeText: string;
  decodeChars: string;
  subtitle: string;
  ctaPrimary: string;
  ctaPrimaryTarget: string;
  ctaSecondary: string;
  ctaSecondaryTarget: string;
  cornerLabel: string;
  cornerDetail: string;
  navItems: HeroNavItem[];
}

export const heroConfig: HeroConfig = {
  backgroundImage: `${BASE}zps/hero-bg.jpg`,
  brandName: "Zingplay",
  decodeText: "CHÚC MỪNG 8/3",
  decodeChars: "💖✨🌸💕🎀💗",
  subtitle: "Gửi đến những bông hoa rực rỡ của team Zingplay - Những người phụ nữ tuyệt vời",
  ctaPrimary: "Xem Thông Điệp",
  ctaPrimaryTarget: "message",
  ctaSecondary: "Khám Phá Ngay",
  ctaSecondaryTarget: "gallery",
  cornerLabel: "Ngày 8/3",
  cornerDetail: "International Women's Day",
  navItems: [
    { label: "Thông Điệp", sectionId: "message", icon: "music" },
    { label: "Thành Viên", sectionId: "gallery", icon: "disc" },
    { label: "Thống Kê", sectionId: "stats", icon: "play" },
    { label: "Lời Chúc", sectionId: "guestbook", icon: "send" },
    { label: "Zingplay", sectionId: "contact", icon: "calendar" },
  ],
};

// -- Album Cube Section - Message Section for Women's Day --------------------
export interface Album {
  id: number;
  title: string;
  subtitle: string;
  image: string;
}

export interface AlbumCubeConfig {
  albums: Album[];
  cubeTextures: string[];
  scrollHint: string;
}

export const albumCubeConfig: AlbumCubeConfig = {
  albums: [
    {
      id: 1,
      title: "CÁM ƠN CÁC CHỊ EM",
      subtitle: "VÌ TẤT CẢ",
      image: `${BASE}zps/team-member-1.jpg`,
    },
    {
      id: 2,
      title: "CÁC BẠN THẬT TUYỆT VỜI",
      subtitle: "AMAZING",
      image: `${BASE}zps/team-member-5.jpg`,
    },
    {
      id: 3,
      title: "LUÔN TỎA SÁNG",
      subtitle: "SHINING",
      image: `${BASE}zps/team-member-10.jpg`,
    },
    {
      id: 4,
      title: "NGÀY CỦA CÁC BẠN",
      subtitle: "YOUR DAY",
      image: `${BASE}zps/team-member-15.jpg`,
    },
  ],
  cubeTextures: [
    `${BASE}zps/teams-1.jpg`,
    `${BASE}zps/teams-2.jpg`,
    `${BASE}zps/teams-3.jpg`,
    `${BASE}zps/teams-4.jpg`,
    `${BASE}zps/teams-3.jpg`,
    `${BASE}zps/teams-4.jpg`,
  ],
  scrollHint: "Cuộn để khám phá thêm 💕",
};

// -- Parallax Gallery Section - Team Members --------------------------------
export interface ParallaxImage {
  id: number;
  src: string;
  alt: string;
}

export interface GalleryImage {
  id: number;
  src: string;
  title: string;
  date: string;
}

export interface ParallaxGalleryConfig {
  sectionLabel: string;
  sectionTitle: string;
  galleryLabel: string;
  galleryTitle: string;
  marqueeTexts: string[];
  endCtaText: string;
  parallaxImagesTop: ParallaxImage[];
  parallaxImagesBottom: ParallaxImage[];
  galleryImages: GalleryImage[];
}

// Generate team member images - EASY TO REPLACE
// Just replace the files in /public/ folder with your own photos
// Naming convention: team-member-1.jpg through team-member-20.jpg
export const parallaxGalleryConfig: ParallaxGalleryConfig = {
  sectionLabel: "Đội Ngũ Zingplay",
  sectionTitle: "Những Bông Hoa Rực Rỡ",
  galleryLabel: "Thành Viên",
  galleryTitle: "16 Cô Gái Tuyệt Vờii",
  marqueeTexts: [
    "💖 HAPPY WOMEN'S DAY 💖",
    "🌸 CÁC CHỊ EM ZINGPLAY 🌸",
    "✨ LUÔN TỎA SÁNG ✨",
    "💕 CÁM ƠN CÁC BẠN 💕",
    "🎀 NGÀY 8/3 VUI VẺ 🎀",
  ],
  endCtaText: "Xem Tất Cả Thành Viên",
  parallaxImagesTop: [
    { id: 1, src: `${BASE}zps/team-member-1.jpg`, alt: "Team Member 1" },
    { id: 2, src: `${BASE}zps/team-member-2.jpg`, alt: "Team Member 2" },
    { id: 3, src: `${BASE}zps/team-member-3.jpg`, alt: "Team Member 3" },
    { id: 4, src: `${BASE}zps/team-member-4.jpg`, alt: "Team Member 4" },
    { id: 5, src: `${BASE}zps/team-member-5.jpg`, alt: "Team Member 5" },
    { id: 6, src: `${BASE}zps/team-member-6.jpg`, alt: "Team Member 6" },
  ],
  parallaxImagesBottom: [
    { id: 7, src: `${BASE}zps/team-member-7.jpg`, alt: "Team Member 7" },
    { id: 8, src: `${BASE}zps/team-member-8.jpg`, alt: "Team Member 8" },
    { id: 9, src: `${BASE}zps/team-member-9.jpg`, alt: "Team Member 9" },
    { id: 10, src: `${BASE}zps/team-member-10.jpg`, alt: "Team Member 10" },
    { id: 11, src: `${BASE}zps/team-member-11.jpg`, alt: "Team Member 11" },
    { id: 12, src: `${BASE}zps/team-member-12.jpg`, alt: "Team Member 12" },
  ],
  galleryImages: [
    { id: 1, src: `${BASE}zps/team-member-1.jpg`, title: "An", date: "Zingplay Team" },
    { id: 2, src: `${BASE}zps/team-member-2.jpg`, title: "Cuzao", date: "Zingplay Team" },
    { id: 3, src: `${BASE}zps/team-member-3.jpg`, title: "Hamin", date: "Zingplay Team" },
    { id: 4, src: `${BASE}zps/team-member-4.jpg`, title: "Sốp Pi", date: "Zingplay Team" },
    { id: 5, src: `${BASE}zps/team-member-5.jpg`, title: "Kate", date: "Zingplay Team" },
    { id: 6, src: `${BASE}zps/team-member-6.jpg`, title: "Kim", date: "Zingplay Team" },
    { id: 7, src: `${BASE}zps/team-member-7.jpg`, title: "Minh Híu", date: "Zingplay Team" },
    { id: 8, src: `${BASE}zps/team-member-8.jpg`, title: "Xu", date: "Zingplay Team" },
    { id: 9, src: `${BASE}zps/team-member-9.jpg`, title: "Trân", date: "Zingplay Team" },
    { id: 10, src: `${BASE}zps/team-member-10.jpg`, title: "Rim", date: "Zingplay Team" },
    { id: 11, src: `${BASE}zps/team-member-11.jpg`, title: "Quỳnh", date: "Zingplay Team" },
    { id: 12, src: `${BASE}zps/team-member-12.jpg`, title: "Pé Đù", date: "Zingplay Team" },
    { id: 13, src: `${BASE}zps/team-member-13.jpg`, title: "Cô Giáo Loan", date: "Zingplay Team" },
    { id: 14, src: `${BASE}zps/team-member-14.jpg`, title: "Chị Linhh", date: "Zingplay Team" },
    { id: 15, src: `${BASE}zps/team-member-15.jpg`, title: "Quỳnh Như", date: "Zingplay Team" },
    { id: 16, src: `${BASE}zps/team-member-16.jpg`, title: "Nhã", date: "Zingplay Team" },
  ],
};

// -- Tour Schedule Section - Wishes Section ---------------------------------
export interface TourDate {
  id: number;
  date: string;
  time: string;
  city: string;
  venue: string;
  status: "on-sale" | "sold-out" | "coming-soon";
  image: string;
}

export interface TourStatusLabels {
  onSale: string;
  soldOut: string;
  comingSoon: string;
  default: string;
}

export interface TourScheduleConfig {
  sectionLabel: string;
  sectionTitle: string;
  vinylImage: string;
  buyButtonText: string;
  detailsButtonText: string;
  bottomNote: string;
  bottomCtaText: string;
  statusLabels: TourStatusLabels;
  tourDates: TourDate[];
}

export const tourScheduleConfig: TourScheduleConfig = {
  sectionLabel: "Lời Chúc Từ Team",
  sectionTitle: "Những Điều Muốn Nói",
  vinylImage: `${BASE}zps/team-member-1.jpg`,
  buyButtonText: "Gửi Lời Chúc",
  detailsButtonText: "Xem Chi Tiết",
  bottomNote: "Cả team Zingplay gửi lời chúc tốt đẹp nhất đến các chị em!",
  bottomCtaText: "Xem Thêm Lời Chúc",
  statusLabels: {
    onSale: "Đã Nhận",
    soldOut: "Yêu Thương",
    comingSoon: "Sắp Tới",
    default: "Xem",
  },
  tourDates: [
    {
      id: 1,
      date: "2025.03.08",
      time: "00:00",
      city: "Cảm ơn",
      venue: "Vì đã luôn nỗ lực và cống hiến hết mình cho công việc",
      status: "on-sale",
      image: `${BASE}zps/team-member-1.jpg`,
    },
    {
      id: 2,
      date: "2025.03.08",
      time: "00:00",
      city: "Chúc các chị em",
      venue: "Luôn xinh đẹp, tự tin và tỏa sáng mỗi ngày",
      status: "on-sale",
      image: `${BASE}zps/team-member-2.jpg`,
    },
    {
      id: 3,
      date: "2025.03.08",
      time: "00:00",
      city: "Mong rằng",
      venue: "Mọi điều tốt đẹp sẽ đến với các bạn trong năm nay",
      status: "on-sale",
      image: `${BASE}zps/team-member-3.jpg`,
    },
    {
      id: 4,
      date: "2025.03.08",
      time: "00:00",
      city: "Các bạn là",
      venue: "Nguồn cảm hứng và động lực cho cả team phát triển",
      status: "on-sale",
      image: `${BASE}zps/team-member-4.jpg`,
    },
    {
      id: 5,
      date: "2025.03.08",
      time: "00:00",
      city: "Happy Women's Day",
      venue: "Ngày 8/3 vui vẻ, tràn đầy yêu thương và hạnh phúc!",
      status: "sold-out",
      image: `${BASE}zps/team-member-5.jpg`,
    },
  ],
};

// -- Footer Section -----------------------------------------------------------
export interface FooterImage {
  id: number;
  src: string;
}

export interface SocialLink {
  icon: "instagram" | "twitter" | "youtube" | "music";
  label: string;
  href: string;
}

export interface FooterConfig {
  portraitImage: string;
  portraitAlt: string;
  heroTitle: string;
  heroSubtitle: string;
  artistLabel: string;
  artistName: string;
  artistSubtitle: string;
  brandName: string;
  brandDescription: string;
  quickLinksTitle: string;
  quickLinks: string[];
  contactTitle: string;
  emailLabel: string;
  email: string;
  phoneLabel: string;
  phone: string;
  addressLabel: string;
  address: string;
  newsletterTitle: string;
  newsletterDescription: string;
  newsletterButtonText: string;
  subscribeAlertMessage: string;
  copyrightText: string;
  bottomLinks: string[];
  socialLinks: SocialLink[];
  galleryImages: FooterImage[];
}

export const footerConfig: FooterConfig = {
  portraitImage: `${BASE}zps/hero-bg.jpg`,
  portraitAlt: "Zingplay Women's Day",
  heroTitle: "CẢM ƠN CÁC CHỊ EM",
  heroSubtitle: "Vì đã là một phần tuyệt vời của Zingplay",
  artistLabel: "Từ Team Zingplay",
  artistName: "Gửi Đến Các Bạn",
  artistSubtitle: "Những người phụ nữ tuyệt vời",
  brandName: "Zingplay",
  brandDescription: "Cảm ơn các chị em đã đồng hành và cống hiến cùng Zingplay. Các bạn là những bông hoa rực rỡ làm cho team trở nên tuyệt vời hơn mỗi ngày!",
  quickLinksTitle: "Liên Kết",
  quickLinks: ["Trang Chủ", "Về Chúng Tôi"],
  contactTitle: "Zingplay",
  emailLabel: "Email",
  email: "hello@zingplay.com",
  phoneLabel: "Điện Thoại",
  phone: "+84 xxx xxx xxx",
  addressLabel: "Địa Chỉ",
  address: "TP. Hồ Chí Minh, Việt Nam",
  newsletterTitle: "Đăng ký Nhận tin",
  newsletterDescription: "Nhận thông tin mới nhất từ Zingplay",
  newsletterButtonText: "Đăng ký",
  subscribeAlertMessage: "Cảm ơn bạn đã đăng ký! 💕",
  copyrightText: "© 2025 Zingplay. Tất cả các quyền được bảo lưu.",
  bottomLinks: ["Chính Sách Bảo Mật", "Điều Khoản Sử Dụng"],
  socialLinks: [
    { icon: "instagram", label: "Instagram", href: "#" },
    { icon: "twitter", label: "Twitter", href: "#" },
    { icon: "youtube", label: "YouTube", href: "#" },
    { icon: "music", label: "TikTok", href: "#" },
  ],
  galleryImages: [
    { id: 1, src: `${BASE}zps/team-member-1.jpg` },
    { id: 2, src: `${BASE}zps/team-member-2.jpg` },
    { id: 3, src: `${BASE}zps/team-member-3.jpg` },
    { id: 4, src: `${BASE}zps/team-member-4.jpg` },
    { id: 5, src: `${BASE}zps/team-member-5.jpg` },
    { id: 6, src: `${BASE}zps/team-member-6.jpg` },
    { id: 7, src: `${BASE}zps/team-member-7.jpg` },
    { id: 8, src: `${BASE}zps/team-member-8.jpg` },
    { id: 9, src: `${BASE}zps/team-member-9.jpg` },
    { id: 10, src: `${BASE}zps/team-member-10.jpg` },
    { id: 11, src: `${BASE}zps/team-member-11.jpg` },
    { id: 12, src: `${BASE}zps/team-member-12.jpg` },
    { id: 13, src: `${BASE}zps/team-member-13.jpg` },
    { id: 14, src: `${BASE}zps/team-member-14.jpg` },
    { id: 15, src: `${BASE}zps/team-member-15.jpg` },
    { id: 16, src: `${BASE}zps/team-member-16.jpg` },
    { id: 17, src: `${BASE}zps/team-member-17.jpg` },
    { id: 18, src: `${BASE}zps/team-member-18.jpg` },
    { id: 19, src: `${BASE}zps/team-member-19.jpg` },
    { id: 20, src: `${BASE}zps/team-member-20.jpg` },
  ],
};
