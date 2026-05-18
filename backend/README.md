# FPTAIEZ Backend

Backend API cho dự án FPTAIEZ - Node.js + Express + MongoDB

## Công nghệ

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + bcrypt
- **Security**: Helmet, Rate Limiting, CORS

## Cài đặt

### Yêu cầu

- Node.js 18+
- MongoDB (local hoặc MongoDB Atlas)
- MongoDB Compass (để quản lý database)

### Các bước cài đặt

```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Cài đặt dependencies
npm install

# 3. Copy file cấu hình
cp .env.example .env

# 4. Chỉnh sửa file .env
# Thay đổi MONGODB_URI nếu cần
# Mặc định: mongodb://localhost:27017/fptaiez

# 5. Chạy server
npm run dev
```

### Kết nối MongoDB Compass

```
Host: localhost
Port: 27017
Database: fptaiez
```

## Scripts

```bash
npm run dev     # Chạy development server (nodemon)
npm run start   # Chạy production server
npm run seed    # Tạo dữ liệu mẫu
```

## API Endpoints

### Authentication

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | /api/auth/register | Đăng ký tài khoản |
| POST | /api/auth/login | Đăng nhập |
| POST | /api/auth/logout | Đăng xuất |
| POST | /api/auth/refresh | Làm mới token |
| POST | /api/auth/forgot-password | Quên mật khẩu |
| POST | /api/auth/reset-password | Đặt lại mật khẩu |

### User

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | /api/users/profile | Lấy thông tin profile |
| PUT | /api/users/profile | Cập nhật profile |
| PUT | /api/users/change-password | Đổi mật khẩu |
| GET | /api/users/settings | Lấy cài đặt |
| PUT | /api/users/settings | Cập nhật cài đặt |

### Transactions

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | /api/transactions | Danh sách giao dịch |
| GET | /api/transactions/:id | Chi tiết giao dịch |
| POST | /api/transactions | Tạo giao dịch |
| PUT | /api/transactions/:id | Cập nhật giao dịch |
| DELETE | /api/transactions/:id | Xóa giao dịch |
| GET | /api/transactions/stats | Thống kê |

### Notifications

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | /api/notifications | Danh sách thông báo |
| PUT | /api/notifications/:id/read | Đánh dấu đã đọc |
| PUT | /api/notifications/read-all | Đánh dấu tất cả đã đọc |
| DELETE | /api/notifications/:id | Xóa thông báo |

### Dashboard

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | /api/dashboard/stats | Thống kê dashboard |

### Admin (requires admin role)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | /api/admin/users | Danh sách users |
| GET | /api/admin/users/:id | Chi tiết user |
| PUT | /api/admin/users/:id | Cập nhật user |
| DELETE | /api/admin/users/:id | Xóa user |
| GET | /api/admin/transactions | Tất cả giao dịch |

## Tài khoản test

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@fptaiez.com | admin123 |
| User | minh@fptaiez.com | user123 |
| User | lan@fptaiez.com | user123 |

## Cấu trúc thư mục

```
src/
├── config/          # Database, app config
├── controllers/     # Xử lý logic
├── middleware/      # Auth, validation, error handling
├── models/          # Mongoose schemas
├── routes/          # API routes
├── services/       # Business logic
├── utils/          # Helpers
└── index.js        # Entry point
```

## Environment Variables

Xem file `.env.example` để biết các biến môi trường cần thiết.
