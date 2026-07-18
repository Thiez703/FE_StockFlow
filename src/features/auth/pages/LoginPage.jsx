import Logo from '@/components/ui/Logo';
import LoginForm from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <div>
      {/* Logo cho màn hình nhỏ (bảng thương hiệu bên trái bị ẩn) */}
      <div className="mb-8 lg:hidden">
        <Logo to={null} />
      </div>

      <div className="mb-8">
        <h1 className="m-0 text-2xl font-bold tracking-tight text-slate-900">
          Chào mừng trở lại 👋
        </h1>
        <p className="mt-2 mb-0 text-slate-500">
          Đăng nhập để tiếp tục quản lý kho hàng của bạn.
        </p>
      </div>

      <LoginForm />

      <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs text-slate-500">
        Tài khoản demo:{' '}
        <span className="font-semibold text-slate-700">admin@stockflow.vn</span> /{' '}
        <span className="font-semibold text-slate-700">123456</span>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Chưa có tài khoản?{' '}
        <a className="font-semibold text-royal hover:text-royal-500">
          Liên hệ quản trị viên
        </a>
      </p>
    </div>
  );
}
