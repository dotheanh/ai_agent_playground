# Portal Project Requirements

## Overview

AI Agent Portal là một landing page tương tác giới thiệu về AI Agent và các công nghệ liên quan (Claude Code, Machine Learning, Neural Networks...). Dự án bao gồm client (React) và server (NestJS) với các tính năng tương tác như chat bot, quiz, guestbook và thống kê real-time.

## Problem Statement

- Cần một landing page giới thiệu AI Agent với trải nghiệm người dùng ấn tượng
- Tích hợp các tính năng tương tác để thu hút khách truy cập
- Lưu trữ dữ liệu (guestbook, visitor stats) một cách persistent

## Goals

1. Xây dựng landing page AI Agent với thiết kế dark theme + crimson accents
2. Tích hợp các tính năng tương tác: AI Chat, Quiz, Guestbook
3. Theo dõi và hiển thị visitor stats real-time
4. Lưu trữ dữ liệu persistent với SQLite

## Technical Stack

### Client
- **Framework**: React 19 + Vite 7
- **Language**: TypeScript
- **Styling**: TailwindCSS 3.4 + custom theme (void-black, crimson)
- **UI Components**: Radix UI + custom shadcn/ui patterns
- **3D**: React Three Fiber + Drei
- **Animation**: GSAP + Lenis smooth scroll

### Server
- **Framework**: NestJS 7
- **Database**: SQLite via sql.js + TypeORM
- **Language**: TypeScript

### Development
- **Package Manager**: npm
- **Scripts**: start.bat (PowerShell launcher)
- **Dev Tools**: react-grab (UI inspector cho dev mode)

## Project Structure

```
portal/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/ui/    # Radix UI components
│   │   ├── sections/         # Page sections
│   │   │   ├── Hero.tsx
│   │   │   ├── AlbumCube.tsx
│   │   │   ├── ParallaxGallery.tsx
│   │   │   ├── VisitorStats.tsx
│   │   │   ├── AIQuiz.tsx
│   │   │   ├── Guestbook.tsx
│   │   │   ├── TourSchedule.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── AIChat.tsx    # Floating chat widget
│   │   ├── lib/
│   │   │   ├── api.ts        # API client
│   │   │   └── utils.ts
│   │   ├── hooks/            # Custom hooks
│   │   ├── config.ts         # Site configuration
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── vite.config.ts
│
├── server/                    # NestJS backend
│   ├── src/
│   │   ├── entities/         # TypeORM entities
│   │   │   ├── guestbook-entry.entity.ts
│   │   │   ├── visitor-stats.entity.ts
│   │   │   ├── contact-submission.entity.ts
│   │   │   └── newsletter-subscriber.entity.ts
│   │   ├── dto/              # Data transfer objects
│   │   ├── portal.controller.ts
│   │   ├── contact.controller.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── portal.db              # SQLite database file
│
├── start.bat                  # Launcher script
└── package.json
```

## Feature Specs

### 1. Landing Page Sections

| Section | Mô tả |
|---------|--------|
| **Hero** | Full-screen với decode text animation, navigation pill, CTA buttons |
| **AlbumCube** | 3D cube展示 với React Three Fiber |
| **ParallaxGallery** | Gallery với parallax scrolling effect |
| **VisitorStats** | Real-time stats: page views, unique visitors, online users, uptime |
| **AIQuiz** | Quiz về AI (5 câu hỏi ngẫu nhiên), tính điểm |
| **Guestbook** | Để lại tin nhắn, xem tin nhắn của người khác |
| **TourSchedule** | Pricing plans (starter, professional, enterprise) |
| **Footer** | Contact info, quick links, social links |
| **AIChat** | Floating chat widget góc màn hình |

### 2. API Endpoints

| Endpoint | Method | Mô tả |
|----------|--------|--------|
| `/api/stats/visitors` | GET | Lấy visitor stats |
| `/api/stats/live` | GET | Live stats + uptime |
| `/api/stats/heartbeat` | POST | Track online users |
| `/api/quiz/questions` | GET | Lấy 5 câu hỏi quiz |
| `/api/quiz/submit` | POST | Nộp bài quiz |
| `/api/guestbook` | GET/POST | Xem/thêm tin nhắn |
| `/api/chat` | POST | Chat với AI bot |
| `/api/contact` | POST | Gửi liên hệ |
| `/api/newsletter` | POST | Đăng ký newsletter |

### 3. Database Entities

| Entity | Mô tả |
|--------|--------|
| `GuestbookEntry` | Tin nhắn guestbook (name, message, createdAt) |
| `VisitorStats` | Thống kê visitor (pageViews, uniqueVisitors) |
| `ContactSubmission` | Tin nhắn liên hệ |
| `NewsletterSubscriber` | Email đăng ký newsletter |

### 4. UI/UX

- **Theme**: Dark mode (void-black #050505) + Crimson accents (#ff0033)
- **Typography**: Inter (display), JetBrains Mono (mono)
- **Animations**: GSAP scroll-triggered, decode text effect, floating particles
- **Scroll**: Lenis smooth scrolling

## Dev Tools

### React Grab

React Grab là công cụ UI inspector cho React development, giúp chỉnh sửa styling trực tiếp trên trình duyệt.

**Cài đặt:**
```bash
npx -y grab@latest init -c client
```

**Cách sử dụng:**
1. Chạy dev server: `cd client && npm run dev`
2. Mở trình duyệt tại http://localhost:3000
3. Nhấn `G` trên bàn phím để bật/tắt react-grab
4. Click vào elements để inspect và chỉnh sửa style trực tiếp
5. Thay đổi sẽ được highlight trong code

**Lưu ý:** React Grab chỉ hoạt động trong dev mode (production build sẽ không load)

## Running the Project

```bash
# Chạy start.bat và chọn option 1
./start.bat

# Hoặc chạy riêng:
# Terminal 1 - Server
cd server && npm run start:dev

# Terminal 2 - Client
cd client && npm run dev
```

- **Client**: http://localhost:3000
- **Server**: http://localhost:3001
