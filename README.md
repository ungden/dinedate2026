# DineDate - Ứng dụng Hẹn Hò & Booking (Web)

Ứng dụng dating hiện đại kết hợp tính năng booking dịch vụ hẹn hò, giúp người dùng kết nối và trải nghiệm các hoạt động cùng nhau. Phiên bản web được xây dựng với Next.js 15.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand (với persist)
- **Icons**: Lucide React
- **Animation**: Framer Motion

## Tính năng chính

### 1. Partner (Home)
- Browse tất cả thành viên (Partner) ngay tại trang chủ
- Tìm kiếm theo tên, địa điểm
- Lọc theo loại hoạt động, trạng thái online, nhà cung cấp dịch vụ
- Xem grid hoặc list view

### 2. Khám phá (Discover)
- Xem danh sách lời mời hẹn hò công khai
- Tìm kiếm theo tiêu đề, mô tả, địa điểm
- Lọc theo loại hoạt động (Ăn uống, Cafe/Bar, Xem phim, Du lịch)

### 3. Service Booking
- Xem dịch vụ của từng user
- Book trực tiếp với ngày, giờ, địa điểm
- Quản lý booking gửi/nhận
- Accept/Reject booking

### 4. Messaging
- Chat realtime giữa users
- Tự động tạo conversation khi accept application/booking

### 5. VIP System
- 4 cấp độ: Bronze, Silver, Gold, Platinum
- Quyền lợi tương ứng cho mỗi cấp
- Thanh toán qua ví

### 6. Wallet
- Quản lý số dư
- Nạp tiền qua nhiều phương thức
- Lịch sử giao dịch

### 7. Profile
- Quản lý thông tin cá nhân
- Xem thống kê (lời mời, ứng tuyển, đánh giá)
- Quản lý dịch vụ

## Cấu trúc thư mục

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home - Danh sách Partner
│   ├── discover/          # Khám phá - Lời mời hẹn hò
│   ├── layout.tsx         # Root layout
│   ├── messages/          # Tin nhắn
│   ├── notifications/     # Thông báo
│   ├── profile/           # Hồ sơ
│   ├── chat/[id]/         # Chi tiết chat
│   ├── request/[id]/      # Chi tiết lời mời
│   ├── user/[id]/         # Hồ sơ user khác
│   ├── create-request/    # Tạo lời mời
│   ├── wallet/            # Ví
│   ├── vip-subscription/  # VIP
│   ├── manage-bookings/   # Quản lý booking
│   └── manage-services/   # Quản lý dịch vụ
├── components/            # React components
│   ├── Header.tsx
│   ├── DateRequestCard.tsx
│   ├── PartnerCard.tsx
│   └── ActivityFilter.tsx
├── hooks/                 # Custom hooks
│   └── useDateStore.ts    # Zustand store
├── lib/                   # Utilities
│   └── utils.ts
├── types/                 # TypeScript types
│   └── index.ts
└── mocks/                 # Mock data
    ├── users.ts
    ├── dateRequests.ts
    └── reviews.ts
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Navigation

### Main Tabs
1. **Partner** - Browse members (Trang chủ)
2. **Khám phá** - Browse date requests
3. **Tin nhắn** - Conversations
4. **Thông báo** - Notifications
5. **Hồ sơ** - User profile

### Feature Pages
- `/user/[id]` - User profile với services và booking
- `/request/[id]` - Chi tiết lời mời
- `/chat/[id]` - Conversation
- `/manage-services` - Quản lý dịch vụ
- `/manage-bookings` - Quản lý bookings
- `/vip-subscription` - Nâng cấp VIP
- `/wallet` - Ví và giao dịch
- `/create-request` - Tạo lời mời mới

## Responsive Design

Ứng dụng được thiết kế responsive cho:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (< 768px)

## Data Persistence

Sử dụng Zustand với middleware persist để lưu trữ dữ liệu trong localStorage.

---

Migrated from React Native (Expo) to Next.js