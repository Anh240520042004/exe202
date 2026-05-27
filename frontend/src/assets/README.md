# Assets Folder

Thư mục chứa các file tĩnh được import trực tiếp vào React components.

## Cấu trúc thư mục

```
src/assets/
├── images/           # Hình ảnh (jpg, png, gif, webp, svg)
├── icons/            # Icon files nếu cần
└── files/            # Các file khác (pdf, doc, etc.)
```

## Cách sử dụng

### Import trong React component:
```jsx
import logo from '@/assets/images/logo.png';
import heroImage from '@/assets/images/hero.jpg';

// Sử dụng
<img src={logo} alt="Logo" />
<img src={heroImage} alt="Hero" />
```

### Với SVG có thể import như component:
```jsx
import { ReactComponent as LogoIcon } from '@/assets/icons/logo.svg';

// Sử dụng như component
<LogoIcon className="w-10 h-10" />
```

## Lưu ý

- Vite sẽ tự động optimize ảnh khi build
- Nên nén ảnh trước khi thêm vào để tối ưu performance
- Kích thước khuyến nghị: < 500KB cho mỗi ảnh
