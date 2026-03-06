// =============================================================================
// Site Configuration - ZPS Site (Zingplay Women's Day 8/3)
// Special site for International Women's Day - Celebrating Zingplay Team
// =============================================================================

const BASE = import.meta.env.BASE_URL;

// -- Site-wide settings -------------------------------------------------------
export interface SiteConfig {
  title: string;
  description: string;
  language: string;
}

export const siteConfig: SiteConfig = {
  title: "Chúc Mừng Ngày Quốc Tế Phụ Nữ 8/3 - Zingplay Team",
  description: "Tri ân những người phụ nữ tuyệt vời của đội ngũ Zingplay. Chúc các chị em luôn xinh đẹp, hạnh phúc và thành công!",
  language: "vi",
};

// -- Hero Section -------------------------------------------------------------
export interface HeroNavItem {
  label: string;
  sectionId: string;
  icon: "disc" | "play" | "calendar" | "music";
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
  backgroundImage: `${BASE}zps-hero-bg.jpg`,
  brandName: "ZPS",
  decodeText: "ZINGPLAY",
  decodeChars: "!@#$%^&*()_+-=[]{}|;:,.<>?",
  subtitle: "8/3",
  ctaPrimary: "Gửi lời chúc",
  ctaPrimaryTarget: "guestbook",
  ctaSecondary: "Xem Album",
  ctaSecondaryTarget: "gallery",
  cornerLabel: "NGÀY QUỐC TẾ",
  cornerDetail: "PHỤ NỮ 8/3",
  navItems: [
    { label: "Album", sectionId: "gallery", icon: "play" },
    { label: "Thống kê", sectionId: "stats", icon: "disc" },
    { label: "Quiz", sectionId: "quiz", icon: "disc" },
    { label: "Lời chúc", sectionId: "guestbook", icon: "music" },
    { label: "Lịch", sectionId: "tour", icon: "calendar" },
  ],
};

// -- Album Cube Section -------------------------------------------------------
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
        title: "ZING",
        subtitle: "PLAY",
        image: `${BASE}zps-cube-1.jpg`,
      },
      {
        id: 2,
        title: "GAME",
        subtitle: "MOBILE",
        image: `${BASE}zps-cube-2.jpg`,
      },
      {
        id: 3,
        title: "CREATIVE",
        subtitle: "TEAM",
        image: `${BASE}zps-cube-3.jpg`,
      },
      {
        id: 4,
        title: "WOMEN",
        subtitle: "POWER",
        image: `${BASE}zps-cube-4.jpg`,
      },
    ],
    cubeTextures: [
      `${BASE}zps-cube-1.jpg`,
      `${BASE}zps-cube-2.jpg`,
      `${BASE}zps-cube-3.jpg`,
      `${BASE}zps-cube-4.jpg`,
      `${BASE}zps-cube-5.jpg`,
      `${BASE}zps-cube-6.jpg`,
    ],
    scrollHint: "Khám phá đội ngũ Zingplay",
};

// -- Parallax Gallery Section -------------------------------------------------
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

export const parallaxGalleryConfig: ParallaxGalleryConfig = {
  sectionLabel: "ZINGPLAY TEAM",
  sectionTitle: "NHỮNG NGƯỜI PHỤ NỮ TUYỆT VỜI",
  galleryLabel: "GALLERY",
  galleryTitle: "ĐỘI NGŨ ZINGPLAY",

  marqueeTexts: [
    "ZINGPLAY",
    "WOMEN POWER",
    "SÁNG TẠO",
    "NĂNG ĐỘNG",
    "TÀI NĂNG",
    "QUYẾT TÂM",
    "HẠNH PHÚC",
    "THÀNH CÔNG",
  ],

  endCtaText: "Khám phá thêm về Zingplay",

  parallaxImagesTop: [
    { id: 1, src: `${BASE}zps-gallery-1.jpg`, alt: "Zingplay Team" },
    { id: 2, src: `${BASE}zps-gallery-2.jpg`, alt: "Creative Women" },
    { id: 3, src: `${BASE}zps-gallery-3.jpg`, alt: "Gaming Innovation" },
    { id: 4, src: `${BASE}zps-gallery-4.jpg`, alt: "Mobile Games" },
    { id: 5, src: `${BASE}zps-gallery-5.jpg`, alt: "Team Spirit" },
    { id: 6, src: `${BASE}zps-gallery-6.jpg`, alt: "Success" },
  ],

  parallaxImagesBottom: [
    { id: 7, src: `${BASE}zps-gallery-6.jpg`, alt: "Success" },
    { id: 8, src: `${BASE}zps-gallery-5.jpg`, alt: "Team Spirit" },
    { id: 9, src: `${BASE}zps-gallery-4.jpg`, alt: "Mobile Games" },
    { id: 10, src: `${BASE}zps-gallery-3.jpg`, alt: "Gaming Innovation" },
    { id: 11, src: `${BASE}zps-gallery-2.jpg`, alt: "Creative Women" },
    { id: 12, src: `${BASE}zps-gallery-1.jpg`, alt: "Zingplay Team" },
  ],

  galleryImages: [
    { id: 1, src: `${BASE}zps-gallery-1.jpg`, title: "Đoàn Kết", date: "Team Unity" },
    { id: 2, src: `${BASE}zps-gallery-2.jpg`, title: "Sáng Tạo", date: "Creativity" },
    { id: 3, src: `${BASE}zps-gallery-3.jpg`, title: "Nhiệt Huyết", date: "Passion" },
    { id: 4, src: `${BASE}zps-gallery-4.jpg`, title: "Chuyên Nghiệp", date: "Professional" },
    { id: 5, src: `${BASE}zps-gallery-5.jpg`, title: "Hợp Tác", date: "Collaboration" },
    { id: 6, src: `${BASE}zps-gallery-6.jpg`, title: "Thành Công", date: "Success" },
  ],
};

// -- Tour Schedule Section (Adapted for Event Schedule) ----------------------------------------------------
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
  sectionLabel: "SỰ KIỆN",
  sectionTitle: "LỊCH TRÌNH 8/3",
  vinylImage: `${BASE}zps-spinner.png`,
  buyButtonText: "Tham gia",
  detailsButtonText: "Chi tiết",
  bottomNote: "Chúc tất cả chị em Zingplay luôn vui vẻ, hạnh phúc và thành công!",
  bottomCtaText: "Liên hệ với chúng tôi",
  statusLabels: {
    onSale: "Đã đăng ký",
    soldOut: "Hết slot",
    comingSoon: "Sắp diễn ra",
    default: "Đăng ký",
  },
  tourDates: [
    {
      id: 1,
      date: "08/3",
      time: "09:00",
      city: "Chúc mừng",
      venue: "Gửi lời chúc đến tất cả chị em",
      status: "on-sale",
      image: `${BASE}zps-gallery-1.jpg`,
    },
    {
      id: 2,
      date: "08/3",
      time: "14:00",
      city: "Tri ân",
      venue: "Cảm ơn sự đóng góp của chị em",
      status: "on-sale",
      image: `${BASE}zps-gallery-2.jpg`,
    },
    {
      id: 3,
      date: "Hàng ngày",
      time: "24/7",
      city: "Hỗ trợ",
      venue: "Luôn đồng hành cùng chị em",
      status: "coming-soon",
      image: `${BASE}zps-gallery-3.jpg`,
    },
    {
      id: 4,
      date: "2026",
      time: "Tết",
      city: "Tưởng nhớ",
      venue: "Những khoảnh khắc đáng nhớ",
      status: "coming-soon",
      image: `${BASE}zps-gallery-4.jpg`,
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
  portraitImage: `${BASE}zps-footer-portrait.jpg`,
  portraitAlt: "Zingplay Team",
  heroTitle: "KẾT NỐI",
  heroSubtitle: "CÙNG ZPS",
  artistLabel: "TRI ÂN",
  artistName: "ZINGPLAY",
  artistSubtitle: "Đội ngũ tuyệt vời",
  brandName: "ZPS",
  brandDescription: "Tri ân những người phụ nữ tuyệt vời của đội ngũ Zingplay. Chúc các chị em luôn xinh đẹp, hạnh phúc và thành công trong công việc và cuộc sống!",
  quickLinksTitle: "Liên kết",
  quickLinks: ["Zingplay", "Game Mobile", "Tuyển dụng", "Liên hệ", "Fanpage"],
  contactTitle: "Liên hệ",
  emailLabel: "Email",
  email: "contact@zingplay.vn",
  phoneLabel: "Điện thoại",
  phone: "+84 123 456 789",
  addressLabel: "Địa chỉ",
  address: "Hà Nội, Việt Nam",
  newsletterTitle: "Nhận tin",
  newsletterDescription: "Đăng ký để nhận tin tức mới nhất từ Zingplay.",
  newsletterButtonText: "Đăng ký",
  subscribeAlertMessage: "Cảm ơn bạn đã đăng ký nhận tin từ Zingplay!",
  copyrightText: "© 2026 Zingplay. Made with love by ZPS Team.",
  bottomLinks: ["Chính sách", "Điều khoản", "Bảo mật"],
  socialLinks: [
    { icon: "twitter", label: "Twitter", href: "https://twitter.com/zingplay" },
    { icon: "instagram", label: "Instagram", href: "https://instagram.com/zingplay" },
    { icon: "youtube", label: "YouTube", href: "https://youtube.com/zingplay" },
    { icon: "music", label: "Facebook", href: "https://facebook.com/zingplay" },
  ],
  galleryImages: [
    { id: 1, src: `${BASE}zps-gallery-1.jpg` },
    { id: 2, src: `${BASE}zps-gallery-2.jpg` },
    { id: 3, src: `${BASE}zps-gallery-3.jpg` },
    { id: 4, src: `${BASE}zps-gallery-4.jpg` },
  ],
};
