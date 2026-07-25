import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, Button, App } from 'antd';
import { MailOutlined, CheckCircleFilled } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { forgotPasswordSchema } from '@/features/auth/schemas/forgotPasswordSchema';
import RhfTextField from '@/components/form/RhfTextField';

/**
 * Form quên mật khẩu — bản demo UI TĨNH: không gọi API thật, chỉ giả lập
 * gửi email rồi chuyển sang trạng thái xác nhận đã gửi.
 */
export default function ForgotPasswordForm() {
  const { message } = App.useApp();
  const [sentTo, setSentTo] = useState(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }) => {
    // Giả lập gọi API gửi email đặt lại mật khẩu.
    await new Promise((resolve) => setTimeout(resolve, 900));
    message.success('Đã gửi link đặt lại mật khẩu!');
    setSentTo(email);
  };

  if (sentTo) {
    return (
      <div className="text-center">
        <CheckCircleFilled className="text-4xl text-emerald-500" />
        <h2 className="mt-4 mb-0 text-lg font-bold text-slate-900">Đã gửi email</h2>
        <p className="mt-2 mb-0 text-slate-500">
          Link đặt lại mật khẩu đã được gửi tới{' '}
          <span className="font-semibold text-slate-700">{sentTo}</span>. Vui lòng
          kiểm tra hộp thư.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-block font-semibold text-royal hover:text-royal-500"
        >
          Quay lại đăng nhập
        </Link>
      </div>
    );
  }

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

      <Button
        type="primary"
        htmlType="submit"
        size="large"
        block
        loading={isSubmitting}
        className="mt-2"
      >
        Gửi link đặt lại mật khẩu
      </Button>

      <Link
        to="/login"
        className="mt-6 block text-center text-sm font-medium text-royal hover:text-royal-500"
      >
        Quay lại đăng nhập
      </Link>
    </Form>
  );
}
