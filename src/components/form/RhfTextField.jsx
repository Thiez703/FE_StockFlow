import { Controller } from 'react-hook-form';
import { Form, Input } from 'antd';

/**
 * Field text dùng chung cho các form RHF + Zod + AntD: gói sẵn Controller + Form.Item
 * (hiển thị lỗi từ `errors`) quanh một input AntD, mặc định là Input.
 * Đổi input khác (vd. Input.Password) qua prop `as`.
 */
export default function RhfTextField({
  control,
  name,
  label,
  errors,
  as: Component = Input,
  itemProps,
  ...inputProps
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Form.Item
          label={label}
          validateStatus={errors?.[name] ? 'error' : ''}
          help={errors?.[name]?.message}
          {...itemProps}
        >
          <Component {...field} {...inputProps} />
        </Form.Item>
      )}
    />
  );
}
