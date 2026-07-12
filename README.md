# StockFlow - Frontend

Hệ thống quản lý kho dành cho doanh nghiệp phân phối nước giải khát.

## Tech Stack

| Mục đích | Thư viện |
|---|---|
| Framework | React 19 |
| Build tool | Vite |
| Styling | Tailwind CSS |
| UI Library | Ant Design |
| Quản lý state | Redux Toolkit |
| Server state | TanStack React Query |
| HTTP client | Axios |
| Form | React Hook Form + Zod |
| Routing | React Router DOM |

## Cài đặt

```bash
# Clone repo
git clone <repo-url>
cd fe-stockflow

# Cài dependencies
npm install

# Tạo file .env từ mẫu
cp .env.example .env

# Chạy dev server
npm run dev
```

## Các lệnh

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy dev server tại http://localhost:3000 |
| `npm run build` | Build production vào thư mục `dist/` |
| `npm run preview` | Xem trước bản build |
| `npm run lint` | Kiểm tra code bằng ESLint |

## Cấu trúc thư mục

```
src/
├── api/                          # Gọi API, mỗi resource 1 file
├── assets/                       # Tài nguyên tĩnh
│   ├── icons/
│   └── images/
├── components/                   # Component dùng chung (KHÔNG chứa nghiệp vụ)
│   ├── feedback/                 # Spinner, EmptyState, ErrorBoundary, Toast
│   ├── form/                     # FormField, FormDatePicker, FormNumberInput
│   ├── layout/                   # MainLayout, AuthLayout, Sidebar, Header
│   ├── table/                    # DataTable, Pagination, SortableHeader
│   └── ui/                       # Button, Input, Select, Modal, Badge, Tabs
├── constants/                    # Hằng số, mỗi nhóm 1 file
├── features/                     # Module theo nghiệp vụ
│   ├── _shared/                  # Component/hook dùng chung giữa các feature
│   │   ├── components/
│   │   └── hooks/
│   └── auth/                     # Feature mẫu
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── schemas/
│       ├── store/
│       └── utils/
├── hooks/                        # Custom hooks dùng chung
├── routes/                       # Cấu hình routing
├── store/                        # Redux store
├── utils/                        # Hàm tiện ích
├── App.jsx                       # Root component
├── index.css                     # Tailwind directives
└── main.jsx                      # Entry point
```

## Khuôn của một feature

Mỗi feature trong `features/` theo đúng khuôn:

```
features/<tên-feature>/
├── components/         # Component riêng của feature
├── hooks/              # Hook riêng của feature
├── pages/              # Trang (1 page = 1 màn hình)
├── routes.jsx          # Route của feature
├── schemas/            # (tùy chọn) Zod schema
├── store/              # (tùy chọn) Redux slice
└── utils/              # (tùy chọn) Hàm riêng
```

## Quy tắc chống xung đột

1. **KHÔNG dùng barrel file** (index.js) ở `components/ui/`, `api/`, `constants/`. Import trực tiếp file.
2. **`routes/index.jsx`** chỉ import và spread `routes.jsx` của từng feature. Thêm màn hình mới thì sửa file trong feature, không đụng router chung.
3. **Mỗi hằng số 1 file** trong `constants/`, không gộp chung.
4. **Mỗi resource 1 file** trong `api/`, không gộp chung.
5. **Component chỉ dùng ở 1 feature** thì để trong feature đó. Khi feature thứ 2 cần mới chuyển sang `_shared/` hoặc `components/`. Phải báo cả nhóm.
6. **Không tự tạo folder cấp 1** trong `src/`.

## Quy ước đặt tên

| Loại | Quy ước | Ví dụ |
|---|---|---|
| Component | PascalCase.jsx | `LoginForm.jsx` |
| Hook | useXxx.js | `useAuth.js` |
| Util / constant | camelCase.js | `formatCurrency.js` |
| Folder feature | kebab-case | `goods-receipt/` |
| Redux slice | xxxSlice.js | `authSlice.js` |
| Zod schema | xxxSchema.js | `loginSchema.js` |
| API file | xxxApi.js | `productApi.js` |
| Route file | routes.jsx | Luôn là `routes.jsx` |

## Import alias

Dùng `@/` trỏ tới `src/`:

```js
import Button from '@/components/ui/Button';
import { ROLES } from '@/constants/roles';
```

Đã cấu hình sẵn trong `vite.config.js` và `jsconfig.json`.
