import { motion } from 'framer-motion';
import Logo from '@/components/ui/Logo';
import LoginForm from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
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
      <p className="mt-6 text-center text-sm text-slate-500">
        Chưa có tài khoản?{' '}
        <a className="font-semibold text-royal hover:text-royal-500">
          Liên hệ quản trị viên
        </a>
      </p>
    </motion.div>
  );
}
