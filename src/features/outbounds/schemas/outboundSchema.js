import { z } from 'zod';

const requiredSelect = (message) =>
  z.preprocess((v) => (v == null ? '' : v), z.string().min(1, message));

export const emptyItem = { productId: undefined, lotId: undefined, overrideReason: '', quantity: 1, unitPrice: 0 };

const outboundItemSchema = z.object({
  productId: requiredSelect('Chọn sản phẩm'),
  lotId: requiredSelect('Vui lòng chọn lô hàng'),
  overrideReason: z.string().optional().default(''),
  quantity: z.number().nullable().refine((v) => v != null && v > 0, 'Số lượng phải lớn hơn 0'),
  unitPrice: z.number().nullable().refine((v) => v != null && v >= 0, 'Đơn giá không hợp lệ'),
});

export const outboundSchema = z
  .object({
    code: z.string().min(1, 'Thiếu mã phiếu'),
    type: requiredSelect('Chọn loại xuất'),
    partnerId: z.any().optional(),
    warehouseId: requiredSelect('Vui lòng chọn kho xuất'),
    issueDate: z.any().refine((v) => !!v, 'Vui lòng chọn ngày xuất'),
    note: z.string().optional(),
    items: z.array(outboundItemSchema).min(1, 'Cần thêm ít nhất 1 sản phẩm'),
  })
  .superRefine((val, ctx) => {
    // Xuất Sỉ / Trả NCC bắt buộc chọn đối tác.
    if ((val.type === 'Sỉ' || val.type === 'Trả NCC') && !val.partnerId) {
      ctx.addIssue({ code: 'custom', path: ['partnerId'], message: 'Vui lòng chọn đối tác' });
    }
  });
