import { z } from 'zod';

// Schema kiểm tra dữ liệu form đăng nhập (dùng với react-hook-form + zodResolver).
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập email')
    .email('Email không hợp lệ'),
  password: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu')
    .min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  remember: z.boolean().optional(),
});
