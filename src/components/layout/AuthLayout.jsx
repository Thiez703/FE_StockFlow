import { Outlet } from 'react-router-dom';
import { CheckCircleFilled } from '@ant-design/icons';
import Logo from '@/components/ui/Logo';

const HIGHLIGHTS = [
  'Theo dõi tồn kho theo thời gian thực',
  'Quản lý phiếu nhập / xuất chặt chẽ',
  'Báo cáo trực quan cho nhà phân phối',
];

/**
 * Layout cho các trang xác thực (đăng nhập, quên mật khẩu...).
 * Chia đôi màn hình: bảng thương hiệu (nền xanh) bên trái, nội dung form bên phải.
 * Trên mobile chỉ hiện phần form.
 */
export default function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Bảng thương hiệu — ẩn trên mobile */}
      <div className="relative hidden w-1/2 overflow-hidden bg-[linear-gradient(150deg,#1e3a8a_0%,#2563eb_55%,#3b82f6_100%)] lg:flex">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-1 flex-col justify-between p-12 text-white">
          <div className="rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
            <Logo variant="dark" to={null} />
          </div>

          <div className="max-w-md">
            <h2 className="text-3xl font-bold leading-snug">
              Hệ thống quản lý kho cho doanh nghiệp phân phối nước giải khát.
            </h2>
            <ul className="mt-8 space-y-4">
              {HIGHLIGHTS.map((text) => (
                <li key={text} className="flex items-center gap-3 text-blue-50">
                  <CheckCircleFilled className="text-blue-200" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-blue-200">
            © {new Date().getFullYear()} StockFlow. Bảo lưu mọi quyền.
          </p>
        </div>
      </div>

      {/* Vùng form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[400px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
