<<<<<<< HEAD
# FPTAIEZ - Fullstack Web Application

Dự án fullstack hiện đại kiểu FPTAIEZ với React + Node.js + MongoDB.

![FPTAIEZ](https://img.shields.io/badge/FPTAIEZ-v1.0.0-purple)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-6+-brightgreen)

## Tính năng

- **Authentication**: Đăng ký, đăng nhập, JWT tokens, quên mật khẩu
- **Dashboard**: Thống kê, biểu đồ, giao dịch gần đây
- **Quản lý giao dịch**: CRUD, phân loại, tìm kiếm, phân trang
- **User Profile**: Cập nhật thông tin, đổi mật khẩu
- **Notifications**: Hệ thống thông báo real-time
- **Settings**: Cài đặt giao diện, thông báo, bảo mật
- **Admin Panel**: Quản lý users, giao dịch

## Công nghệ sử dụng

### Backend
- Node.js 18+
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs
- Helmet (Security)
- Rate Limiting

### Frontend
- React 18
- Vite
- Tailwind CSS
- Redux Toolkit
- Axios
- React Router
- Lucide Icons
- React Hot Toast

## Cấu trúc thư mục

```
d:\Summer2026\EXE202\
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── config/         # Database, JWT config
│   │   ├── controllers/    # Logic xử lý request
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/         # Helpers
│   │   └── index.js       # Entry point
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── frontend/               # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API calls
│   │   ├── store/         # Redux Toolkit
│   │   └── App.jsx
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
└── README.md              # Project overview
```

## Hướng dẫn cài đặt

### Yêu cầu hệ thống

- Node.js 18+
- MongoDB 6+
- MongoDB Compass (tùy chọn)

### 1. Cài đặt MongoDB

#### Cách 1: MongoDB Local
1. Tải và cài đặt MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Chạy MongoDB service
3. Connection string: `mongodb://localhost:27017/fptaiez`

#### Cách 2: MongoDB Atlas (Cloud)
1. Đăng ký tài khoản tại https://www.mongodb.com/atlas
2. Tạo cluster mới
3. Lấy connection string

### 2. Cài đặt Backend

```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt dependencies
npm install

# Copy file cấu hình
cp .env.example .env

# Chỉnh sửa .env
# Thay đổi MONGODB_URI nếu cần

# Chạy development server
npm run dev
```

### 3. Cài đặt Frontend

```bash
# Di chuyển vào thư mục frontend (mở terminal mới)
cd frontend

# Cài đặt dependencies
npm install

# Copy file cấu hình
cp .env.example .env

# Chạy development server
npm run dev
```

### 4. Tạo dữ liệu mẫu

```bash
cd backend
npm run seed
```

### 5. Truy cập ứng dụng

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Tài khoản test

| Role  | Email              | Password |
|-------|--------------------|----------|
| Admin | admin@fptaiez.com  | admin123 |
| User  | minh@fptaiez.com   | user123  |
| User  | lan@fptaiez.com    | user123  |

## API Endpoints

### Authentication
| Method | Endpoint               | Mô tả              |
|--------|------------------------|--------------------|
| POST   | /api/auth/register     | Đăng ký            |
| POST   | /api/auth/login       | Đăng nhập          |
| POST   | /api/auth/logout      | Đăng xuất          |
| POST   | /api/auth/refresh     | Refresh token       |
| POST   | /api/auth/forgot-password | Quên mật khẩu   |

### User
| Method | Endpoint               | Mô tả              |
|--------|------------------------|--------------------|
| GET    | /api/users/profile     | Lấy profile        |
| PUT    | /api/users/profile     | Cập nhật profile   |
| PUT    | /api/users/change-password | Đổi mật khẩu   |
| GET    | /api/users/settings   | Lấy cài đặt        |

### Transactions
| Method | Endpoint                  | Mô tả              |
|--------|---------------------------|--------------------|
| GET    | /api/transactions         | Danh sách giao dịch|
| POST   | /api/transactions         | Tạo giao dịch      |
| PUT    | /api/transactions/:id     | Cập nhật giao dịch |
| DELETE | /api/transactions/:id    | Xóa giao dịch      |

### Notifications
| Method | Endpoint                       | Mô tả              |
|--------|--------------------------------|--------------------|
| GET    | /api/notifications             | Danh sách thông báo|
| PUT    | /api/notifications/:id/read    | Đánh dấu đã đọc   |
| DELETE | /api/notifications/:id         | Xóa thông báo      |

### Dashboard
| Method | Endpoint               | Mô tả              |
|--------|------------------------|--------------------|
| GET    | /api/dashboard/stats   | Thống kê dashboard |

## Scripts

### Backend
```bash
npm run dev    # Development (nodemon)
npm run start  # Production
npm run seed   # Seed database
```

### Frontend
```bash
npm run dev    # Development server
npm run build  # Production build
npm run preview # Preview production build
```

## Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/fptaiez
JWT_ACCESS_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=FPTAIEZ
```

## UI/UX Features

- Dark/Light mode toggle
- Gradient backgrounds (purple/blue theme)
- Smooth animations
- Responsive layout
- Toast notifications
- Loading skeletons
- Mobile-first design

## Security Features

- Helmet.js headers
- Rate limiting
- Input validation
- Password hashing (bcrypt)
- JWT access + refresh tokens
- CORS configuration

## License

MIT License - FPTAIEZ Team 2026
=======
# exe202
>>>>>>> e5c145e8ef0e633d8f3d595fedc28421c5c06c80
