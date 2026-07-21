import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, Input, Button, App } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { loginSchema } from '@/features/auth/schemas/loginSchema';
import RhfTextField from '@/components/form/RhfTextField';
import RhfCheckbox from '@/components/form/RhfCheckbox';

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
        <a className="text-sm font-medium text-royal hover:text-royal-500">
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
