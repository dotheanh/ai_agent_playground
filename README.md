# Alex AI Agent's Playground

[![Deploy](https://img.shields.io/badge/Deploy-nhoxtheanh.duckdns.org-red)](https://nhoxtheanh.duckdns.org/)

## Giới thiệu

Đây là playground của **Alex AI Agent** - một AI assistant được thiết kế để hỗ trợ phát triển, triển khai và tự động hóa các dự án web.

## Tính năng nổi bật

- **Tự động push code**: Mọi thay đổi, cập nhật đều được Alex AI Agent tự động commit và push lên repository này.
- **Version control**: Hỗ trợ quản lý phiên bản rõ ràng (Latest, v1, v2...).
- **Continuous Deployment**: Code được triển khai tự động tại [nhoxtheanh.duckdns.org](https://nhoxtheanh.duckdns.org/).

## Các dự án hiện tại

### Gunny-like Demo (100% Vibe Coding)
- Game bắn súng theo góc/lực/gió với địa hình đồi ngẫu nhiên
- Sát thương mô phỏng theo động lực học rơi
- Buff Phượng Hoàng: bắn chim để nhận buff (x2.5 dmg, đạn to x3, bắn 2 phát, thêm lượt)
- Responsive UI cho cả desktop và mobile
- Hỗ trợ nhiều phiên bản (Latest, v1, v2, v3, v4, v5)

**Video Demo**:

https://nhoxtheanh.duckdns.org/gunny/demo.mp4

![Gameplay Preview](gunny/screenshots/gameplay.jpg)
![Mobile Interface](gunny/screenshots/mobile.jpg)

**Truy cập**: [https://nhoxtheanh.duckdns.org/gunny/](https://nhoxtheanh.duckdns.org/gunny/)

**📋 Design Document**: [gunny/docs/gunny_design.txt](gunny/docs/gunny_design.txt) - Tài liệu thiết kế chi tiết hệ thống game, buff, SFX...

### Sound FX Demo
- Trang demo 6+ loại âm thanh procedural được tạo bằng WebAudio API
- Nghe thử và so sánh các hiệu ứng âm thanh khác nhau
- Không cần file mp3 - tạo realtime bằng code

**Truy cập**: [https://nhoxtheanh.duckdns.org/sound-demo/](https://nhoxtheanh.duckdns.org/sound-demo/)

### Bot Chat Room - WebSocket Chat for AI
- Phòng chat real-time sử dụng WebSocket cho giao tiếp Human ↔ AI Bot
- Dark theme UI hiện đại với hiệu ứng gradient
- Hỗ trợ 2 loại client: Human (browser) và Bot (WebSocket/API)
- Real-time messaging, join/leave notifications, online user count
- Message history (100 messages)

**Tech Stack**: Node.js + WebSocket (ws library) + Vanilla JS

**Cách dùng**:
- **Human**: Vào `/boman/`, nhập tên, chọn "Human", connect rồi chat
- **Bot**: Connect WebSocket `ws://localhost:3010?id=YOUR_ID&type=bot`

**Truy cập**: [https://nhoxtheanh.duckdns.org/boman/](https://nhoxtheanh.duckdns.org/boman/)

### AI Agent Landing Page
- Landing page giới thiệu về AI Agent với hiệu ứng parallax, 3D cube, quiz, guestbook và thống kê visitor real-time
- Frontend: React 19 + Vite 7 + TypeScript + TailwindCSS + Radix UI + React Three Fiber + GSAP + Lenis
- Backend: NestJS 7 + TypeScript + SQLite + TypeORM
- Các tính năng: Hero section, AlbumCube (3D), ParallaxGallery, VisitorStats, AIQuiz, Guestbook, AI Chat widget
- Lưu trữ dữ liệu persistent với SQLite, hiển thị visitor stats real-time

**Truy cập**: [https://nhoxtheanh.duckdns.org/portal/](https://nhoxtheanh.duckdns.org/portal/)

## Quy trình làm việc

```
User request → Alex AI Agent update → Auto commit → Push to GitHub → Auto deploy
```

## Links

- **Live Demo**: [https://nhoxtheanh.duckdns.org/](https://nhoxtheanh.duckdns.org/)
- **Repository**: [https://github.com/dotheanh/ai_agent_playground](https://github.com/dotheanh/ai_agent_playground)

## About Alex AI Agent (AAA)

Alex là một AI assistant chạy trên VPS, được thiết kế để:
- Tự động hóa các tác vụ phát triển web
- Quản lý và triển khai code
- Hỗ trợ người dùng 24/7 với các yêu cầu kỹ thuật

---

*Mọi update trong repository này đều được thực hiện tự động bởi Alex AI Agent.*
