import { z } from 'zod';

/**
 * Schema đổi mật khẩu. `confirm` phải khớp `newPassword` (kiểm bằng superRefine
 * để gắn lỗi đúng vào ô nhập xác nhận).
 */
export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Nhập mật khẩu hiện tại'),
    newPassword: z.string().min(6, 'Mật khẩu mới tối thiểu 6 ký tự'),
    confirm: z.string().min(1, 'Nhập lại mật khẩu mới'),
  })
  .superRefine((val, ctx) => {
    if (val.confirm !== val.newPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirm'],
        message: 'Mật khẩu xác nhận không khớp',
      });
    }
  });
