import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, Input, Button, App } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSchema } from '@/features/auth/schemas/loginSchema';
import { CHANGE_PASSWORD_PATH } from '@/features/auth/routes';
import RhfTextField from '@/components/form/RhfTextField';
import RhfCheckbox from '@/components/form/RhfCheckbox';
import { authApi } from '@/api/auth';
import { loginSuccess, setUser } from '@/store/authSlice';
import { getErrorMessage } from '@/utils/getErrorMessage';

/**
 * Form đăng nhập — dùng react-hook-form + Zod (đúng stack dự án), input của Ant Design.
 * Đây là mẫu tích hợp RHF <-> AntD để các form sau làm theo.
 */
export default function LoginForm() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: true },
  });

  // `remember` chỉ dùng cho UI, không gửi lên server.
  const onSubmit = async ({ email, password }) => {
    try {
      const res = await authApi.login({ email, password });

      // ⚠️ BE trả tên field chữ thường ở /login, camelCase ở /refresh — đọc cả hai.
      const accessToken = res.accesstoken ?? res.accessToken;
      const refreshToken = res.refreshtoken ?? res.refreshToken;

      dispatch(loginSuccess({ accessToken, refreshToken }));

      // /login không kèm user nên phải gọi thêm /me.
      const me = await authApi.getMe();
      dispatch(setUser(me));

      message.success('Đăng nhập thành công!');

      // Mật khẩu do hệ thống cấp / vừa được reset: bắt đổi ngay, mang theo
      // trang định vào để đổi xong quay lại đúng chỗ.
      if (me?.mustChangePassword) {
        navigate(CHANGE_PASSWORD_PATH, { replace: true, state: location.state });
        return;
      }

      // Quay lại trang bị chặn trước đó, mặc định /dashboard.
      navigate(location.state?.from?.pathname ?? '/dashboard', { replace: true });
    } catch (error) {
      // BE trả 401 kèm message tiếng Việt, getErrorMessage lấy thẳng câu đó.
      message.error(getErrorMessage(error, 'Đăng nhập thất bại, vui lòng thử lại.'));
    }
  };

  return (
    <Form layout="vertical" requiredMark={false} onFinish={handleSubmit(onSubmit)}>
      <RhfTextField
        control={control}
        errors={errors}
        name="email"
        label="Email"
        size="large"
        autoComplete="email"
        prefix={<MailOutlined className="text-slate-400" />}
        placeholder="you@company.com"
      />

      <RhfTextField
        control={control}
        errors={errors}
        name="password"
        label="Mật khẩu"
        as={Input.Password}
        size="large"
        autoComplete="current-password"
        prefix={<LockOutlined className="text-slate-400" />}
        placeholder="••••••••"
        itemProps={{ className: '!mb-2' }}
      />

      <div className="mb-5 flex items-center justify-between">
        <RhfCheckbox control={control} name="remember">
          Ghi nhớ đăng nhập
        </RhfCheckbox>
        <Link
          to="/forgot-password"
          className="text-sm font-medium text-royal hover:text-royal-500"
        >
          Quên mật khẩu?
        </Link>
      </div>

      <Button
        type="primary"
        htmlType="submit"
        size="large"
        block
        loading={isSubmitting}
      >
        Đăng nhập
      </Button>
    </Form>
  );
}
