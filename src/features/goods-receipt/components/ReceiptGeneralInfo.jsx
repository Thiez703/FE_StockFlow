import { Card, Form, Input, Select, DatePicker } from 'antd';
import { useFormContext, Controller } from 'react-hook-form';

// Dữ liệu mẫu — thay bằng API sau.
const SUPPLIERS = [
  { value: 'sup-1', label: 'Suntory PepsiCo Việt Nam' },
  { value: 'sup-2', label: 'Coca-Cola Việt Nam' },
  { value: 'sup-3', label: 'Tân Hiệp Phát' },
  { value: 'sup-4', label: 'URC Việt Nam' },
];

const WAREHOUSES = [
  { value: 'wh-1', label: 'Kho trung tâm — Quận 7' },
  { value: 'wh-2', label: 'Kho miền Đông — Biên Hòa' },
  { value: 'wh-3', label: 'Kho miền Tây — Cần Thơ' },
];

const { TextArea } = Input;

/**
 * Khối "Thông tin chung" của phiếu nhập. Đọc control từ FormProvider ở trang cha.
 */
export default function ReceiptGeneralInfo() {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <Card
      title="Thông tin chung"
      className="border-slate-200/80 shadow-sm"
      styles={{ header: { borderBottom: '1px solid #f1f5f9' } }}
    >
      <Form layout="vertical" component={false}>
        <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <Form.Item label="Mã phiếu nhập">
                <Input {...field} readOnly variant="filled" />
              </Form.Item>
            )}
          />

          <Controller
            name="receiptDate"
            control={control}
            render={({ field }) => (
              <Form.Item
                label="Ngày nhập"
                required
                validateStatus={errors.receiptDate ? 'error' : ''}
                help={errors.receiptDate?.message}
              >
                <DatePicker
                  {...field}
                  format="DD/MM/YYYY"
                  className="w-full"
                  placeholder="Chọn ngày"
                />
              </Form.Item>
            )}
          />

          <Controller
            name="supplierId"
            control={control}
            render={({ field }) => (
              <Form.Item
                label="Nhà cung cấp"
                required
                validateStatus={errors.supplierId ? 'error' : ''}
                help={errors.supplierId?.message}
              >
                <Select
                  {...field}
                  showSearch
                  optionFilterProp="label"
                  placeholder="Chọn nhà cung cấp"
                  options={SUPPLIERS}
                />
              </Form.Item>
            )}
          />

          <Controller
            name="warehouseId"
            control={control}
            render={({ field }) => (
              <Form.Item
                label="Kho nhận"
                required
                validateStatus={errors.warehouseId ? 'error' : ''}
                help={errors.warehouseId?.message}
              >
                <Select
                  {...field}
                  placeholder="Chọn kho nhận"
                  options={WAREHOUSES}
                />
              </Form.Item>
            )}
          />
        </div>

        <Controller
          name="note"
          control={control}
          render={({ field }) => (
            <Form.Item label="Ghi chú" className="!mb-0">
              <TextArea
                {...field}
                rows={2}
                placeholder="Ghi chú thêm cho phiếu nhập (không bắt buộc)"
              />
            </Form.Item>
          )}
        />
      </Form>
    </Card>
  );
}
