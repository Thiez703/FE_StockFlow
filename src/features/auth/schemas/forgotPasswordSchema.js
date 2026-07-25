import { z } from 'zod';

// Schema kiểm tra dữ liệu form quên mật khẩu.
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập email')
    .email('Email không hợp lệ'),
});
