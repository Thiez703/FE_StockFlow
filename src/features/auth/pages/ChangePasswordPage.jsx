import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, Input, Button, Alert, App } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Logo from '@/components/ui/Logo';
import RhfTextField from '@/components/form/RhfTextField';
import { changePasswordSchema } from '@/features/auth/schemas/changePasswordSchema';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { passwordChanged } from '@/store/authSlice';

const DEFAULTS = { oldPassword: '', newPassword: '', confirm: '' };

/**
 * Trang đổi mật khẩu. Tài khoản mới cấp (hoặc vừa được admin reset) bị
 * ProtectedRoute đẩy thẳng vào đây và không đi đâu khác được cho tới khi đổi
 * xong — cờ `mustChangePassword` lấy từ /auth/me.
 *
 * TODO(BE): backend chưa có endpoint đổi mật khẩu cho chính mình (mới chỉ có
 * POST /api/users/{id}/reset-password dành cho ADMIN). Tạm mô phỏng thành công
 * như ChangePasswordModal, khi có API thì thay phần submit bên dưới.
 */
export default function ChangePasswordPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const handleLogout = useLogout();
  const user = useSelector((state) => state.auth.user);
  const forced = Boolean(user?.mustChangePassword);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(changePasswordSchema), defaultValues: DEFAULTS });

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 600));
    dispatch(passwordChanged());
    message.success('Đổi mật khẩu thành công!');
    // Quay lại trang bị chặn trước khi đăng nhập, mặc định /dashboard.
    navigate(location.state?.from?.pathname ?? '/dashboard', { replace: true });
  };

  const field = (name, label, placeholder) => (
    <RhfTextField
      control={control}
      errors={errors}
      name={name}
      label={label}
      as={Input.Password}
      size="large"
      prefix={<LockOutlined className="text-slate-400" />}
      placeholder={placeholder}
      autoComplete="new-password"
    />
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <div className="mb-8 lg:hidden">
        <Logo to={null} />
      </div>

      <div className="mb-6">
        <h1 className="m-0 text-2xl font-bold tracking-tight text-slate-900">
          {forced ? 'Đặt mật khẩu mới 🔐' : 'Đổi mật khẩu'}
        </h1>
        <p className="mt-2 mb-0 text-slate-500">
          {forced
            ? `Xin chào ${user?.fullName ?? ''}, đây là lần đăng nhập đầu tiên với mật khẩu được cấp.`
            : 'Dùng mật khẩu mới đủ mạnh và không trùng mật khẩu cũ.'}
        </p>
      </div>

      {forced && (
        <Alert
          type="warning"
          showIcon
          className="!mb-5"
          message="Cần đổi mật khẩu trước khi tiếp tục"
          description="Vì bảo mật, mật khẩu do hệ thống cấp chỉ dùng được một lần. Đổi xong bạn sẽ vào thẳng hệ thống."
        />
      )}

      <Form layout="vertical" requiredMark={false} onFinish={handleSubmit(onSubmit)}>
        {field('oldPassword', 'Mật khẩu hiện tại', 'Mật khẩu được cấp qua email')}
        {field('newPassword', 'Mật khẩu mới', 'Tối thiểu 6 ký tự')}
        {field('confirm', 'Xác nhận mật khẩu mới', 'Nhập lại mật khẩu mới')}

        <Button type="primary" htmlType="submit" size="large" block loading={isSubmitting}>
          Cập nhật mật khẩu
        </Button>
      </Form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Không phải tài khoản của bạn?{' '}
        <button
          type="button"
          onClick={handleLogout}
          className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-royal hover:text-royal-500"
        >
          Đăng xuất
        </button>
      </p>
    </motion.div>
  );
}
