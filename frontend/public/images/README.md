# Public Images Folder

Thư mục chứa các file tĩnh được serve trực tiếp qua URL.

## Cấu trúc thư mục

```
public/
├── images/           # Hình ảnh public
│   ├── banners/      # Banner images
│   ├── logos/        # Logo files
│   └── placeholders/ # Placeholder images
├── docs/             # Tài liệu public
└── downloads/        # File download public
```

## Cách sử dụng

### Trong React component:
```jsx
// Sử dụng đường dẫn tuyệt đối (khuyến nghị cho production)
<img src="/images/logo.png" alt="Logo" />

// Hoặc với biến môi trường
<img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" />
```

### Trong CSS:
```css
.logo {
  background-image: url('/images/logo.png');
}
```

## Lưu ý

- File trong `public/` được serve trực tiếp từ root URL
- Không cần import, chỉ cần dùng đường dẫn `/images/...`
- Phù hợp cho ảnh có kích thước lớn, ảnh nền, favicon
- Nên nén ảnh trước khi thêm vào
