import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Form, Input, App } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { changePasswordSchema } from '@/features/auth/schemas/changePasswordSchema';

const DEFAULTS = { oldPassword: '', newPassword: '', confirm: '' };

/**
 * Modal đổi mật khẩu — mở từ dropdown avatar trên TopNav.
 * Demo tĩnh: submit chỉ hiện thông báo thành công rồi đóng (không gọi API).
 */
export default function ChangePasswordModal({ open, onClose }) {
  const { message } = App.useApp();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: DEFAULTS,
  });

  const close = () => {
    reset(DEFAULTS);
    onClose();
  };

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 600));
    message.success('Đổi mật khẩu thành công!');
    close();
  };

  const field = (name, label, placeholder) => (
    <Controller
      name={name}
      control={control}
      render={({ field: f }) => (
        <Form.Item
          label={label}
          validateStatus={errors[name] ? 'error' : ''}
          help={errors[name]?.message}
        >
          <Input.Password
            {...f}
            size="large"
            prefix={<LockOutlined className="text-slate-400" />}
            placeholder={placeholder}
            autoComplete="new-password"
          />
        </Form.Item>
      )}
    />
  );

  return (
    <Modal
      open={open}
      title="Đổi mật khẩu"
      okText="Cập nhật"
      cancelText="Huỷ"
      onCancel={close}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isSubmitting}
      destroyOnHidden
      maskClosable={false}
    >
      <p className="mt-1 mb-4 text-sm text-ink-sub">
        Vì bảo mật, hãy dùng mật khẩu mới đủ mạnh và không trùng mật khẩu cũ.
      </p>
      <Form layout="vertical" requiredMark={false} onFinish={handleSubmit(onSubmit)}>
        {field('oldPassword', 'Mật khẩu hiện tại', 'Nhập mật khẩu đang dùng')}
        {field('newPassword', 'Mật khẩu mới', 'Tối thiểu 6 ký tự')}
        {field('confirm', 'Xác nhận mật khẩu mới', 'Nhập lại mật khẩu mới')}
      </Form>
    </Modal>
  );
}
