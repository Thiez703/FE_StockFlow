import { z } from 'zod';

/**
 * Schema kiểm tra phiếu nhập kho (RHF + Zod).
 * Cập nhật theo Swagger InboundCreateRequest:
 *   details: [{ productId*, lotCode*, locationId*, quantity*, unitPrice*,
 *               lotId?, mfgDate?, expDate? }]
 */
const requiredId = (message) =>
  z.preprocess((v) => (v == null ? '' : v), z.union([z.string().min(1, message), z.number().min(1, message)]));

export const emptyItem = {
  productId: undefined,
  lotCode: '',
  lotId: undefined,
  locationId: undefined,
  mfgDate: undefined,
  expDate: undefined,
  quantity: 1,
  unitPrice: 0,
};

export const inboundItemSchema = z.object({
  productId: requiredId('Chọn sản phẩm'),
  lotCode: z.preprocess((v) => (v == null ? '' : v), z.string().min(1, 'Vui lòng chọn hoặc nhập mã lô')),
  lotId: z.number().nullable().optional(),
  locationId: requiredId('Chọn vị trí kho'),
  mfgDate: z.string().nullable().optional(),
  expDate: z.string().nullable().optional(),
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
  supplierId: requiredId('Vui lòng chọn nhà cung cấp'),
  note: z.string().optional(),
  items: z.array(inboundItemSchema).min(1, 'Cần thêm ít nhất 1 sản phẩm'),
});
