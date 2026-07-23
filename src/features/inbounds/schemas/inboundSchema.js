import { z } from 'zod';

/**
 * Schema kiểm tra phiếu nhập kho (RHF + Zod).
 * preprocess đưa undefined/null (Select/Date chưa chọn) về '' để có thông báo thân thiện.
 */
const requiredSelect = (message) =>
  z.preprocess((v) => (v == null ? '' : v), z.string().min(1, message));

// Dòng hàng rỗng để append khi thêm dòng mới.
export const emptyItem = { productId: undefined, lotId: undefined, quantity: 1, unitPrice: 0 };

export const inboundItemSchema = z.object({
  productId: requiredSelect('Chọn sản phẩm'),
  lotId: requiredSelect('Vui lòng chọn hoặc nhập mã lô'),
  quantity: z
    .number()
    .nullable()
    .refine((v) => v != null && v > 0, 'Số lượng phải lớn hơn 0'),
  unitPrice: z
    .number()
    .nullable()
    .refine((v) => v != null && v >= 0, 'Đơn giá không hợp lệ'),
});

export const inboundSchema = z.object({
  code: z.string().min(1, 'Thiếu mã phiếu'),
  supplierId: requiredSelect('Vui lòng chọn nhà cung cấp'),
  receiptDate: z.any().refine((v) => !!v, 'Vui lòng chọn ngày nhập'),
  note: z.string().optional(),
  items: z.array(inboundItemSchema).min(1, 'Cần thêm ít nhất 1 sản phẩm'),
});
