import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, Input, Button, Checkbox, App } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { loginSchema } from '@/features/auth/schemas/loginSchema';

/**
 * Form đăng nhập — dùng react-hook-form + Zod (đúng stack dự án), input của Ant Design.
 * Đây là mẫu tích hợp RHF <-> AntD để các form sau làm theo.
 */
export default function LoginForm() {
  const { message } = App.useApp();
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: true },
  });

  const onSubmit = async () => {
    // Giả lập gọi API đăng nhập.
    await new Promise((resolve) => setTimeout(resolve, 900));
    message.success('Đăng nhập thành công!');
    navigate('/dashboard');
  };

  return (
    <Form layout="vertical" requiredMark={false} onFinish={handleSubmit(onSubmit)}>
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <Form.Item
            label="Email"
            validateStatus={errors.email ? 'error' : ''}
            help={errors.email?.message}
          >
            <Input
              {...field}
              size="large"
              autoComplete="email"
              prefix={<MailOutlined className="text-slate-400" />}
              placeholder="you@company.com"
            />
          </Form.Item>
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <Form.Item
            label="Mật khẩu"
            validateStatus={errors.password ? 'error' : ''}
            help={errors.password?.message}
            className="!mb-2"
          >
            <Input.Password
              {...field}
              size="large"
              autoComplete="current-password"
              prefix={<LockOutlined className="text-slate-400" />}
              placeholder="••••••••"
            />
          </Form.Item>
        )}
      />

      <div className="mb-5 flex items-center justify-between">
        <Controller
          name="remember"
          control={control}
          render={({ field }) => (
            <Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)}>
              Ghi nhớ đăng nhập
            </Checkbox>
          )}
        />
        <a className="text-sm font-medium text-blue-600 hover:text-blue-700">
          Quên mật khẩu?
        </a>
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
