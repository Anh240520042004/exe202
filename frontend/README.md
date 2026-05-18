# FPTAIEZ Frontend

React + Vite + Tailwind CSS Frontend cho dự án FPTAIEZ.

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Copy file cấu hình
cp .env.example .env

# Chạy development server
npm run dev
```

## Scripts

```bash
npm run dev      # Development server (http://localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint check
```

## Cấu trúc thư mục

```
src/
├── components/
│   ├── ui/           # Reusable components (Button, Card, Input, Modal, etc.)
│   └── layout/       # Layout components (Sidebar, Header, Layout)
├── pages/
│   ├── auth/         # Login, Register, ForgotPassword
│   ├── dashboard/     # Dashboard page
│   ├── user/          # Profile, Settings, Notifications
│   └── transactions/  # Transactions list, Create
├── services/          # API service functions
├── store/            # Redux store & slices
└── App.jsx           # Main app component with routing
```

## Dependencies

- **React 18** - UI Library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Redux Toolkit** - State management
- **Axios** - HTTP client
- **React Router** - Routing
- **Lucide React** - Icons
- **React Hot Toast** - Toast notifications

## Environment Variables

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=FPTAIEZ
```
