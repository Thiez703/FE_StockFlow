import { z } from 'zod';

const requiredSelect = (message) =>
  z.preprocess((v) => (v == null ? '' : v), z.string().min(1, message));

export const emptyItem = { productId: undefined, lotId: undefined, overrideReason: '', quantity: 1, unitPrice: 0 };

const baseItemSchema = z.object({
  productId: requiredSelect('Chọn sản phẩm'),
  lotId: requiredSelect('Vui lòng chọn lô hàng'),
  overrideReason: z.string().optional().default(''),
  quantity: z.number().nullable().refine((v) => v != null && v > 0, 'Số lượng phải lớn hơn 0'),
  unitPrice: z.number().nullable().refine((v) => v != null && v >= 0, 'Đơn giá không hợp lệ'),
});

const baseFields = {
  code: z.string().min(1, 'Thiếu mã phiếu'),
  note: z.string().optional(),
  items: z.array(baseItemSchema).min(1, 'Cần thêm ít nhất 1 sản phẩm'),
};

/** Xuất bán — bắt buộc chọn khách hàng */
export const retailSchema = z.object({
  ...baseFields,
  issue_type: z.literal('RETAIL'),
  customerId: requiredSelect('Vui lòng chọn khách hàng'),
});

/** Xuất trả NCC — bắt buộc chọn nhà cung cấp */
export const returnSupplierSchema = z.object({
  ...baseFields,
  issue_type: z.literal('RETURN_SUPPLIER'),
  supplierId: requiredSelect('Vui lòng chọn nhà cung cấp'),
});

/** Xuất hủy — bắt buộc chọn lý do */
export const disposalSchema = z.object({
  ...baseFields,
  issue_type: z.literal('DISPOSAL'),
  reason_type: requiredSelect('Vui lòng chọn lý do hủy'),
});
