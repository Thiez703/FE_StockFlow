import Logo from '@/components/ui/Logo';
import ForgotPasswordForm from '@/features/auth/components/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <div>
      {/* Logo cho màn hình nhỏ (bảng thương hiệu bên trái bị ẩn) */}
      <div className="mb-8 lg:hidden">
        <Logo to={null} />
      </div>

      <div className="mb-8">
        <h1 className="m-0 text-2xl font-bold tracking-tight text-slate-900">
          Quên mật khẩu?
        </h1>
        <p className="mt-2 mb-0 text-slate-500">
          Nhập email đã đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu cho bạn.
        </p>
      </div>

      <ForgotPasswordForm />
    </div>
  );
}
