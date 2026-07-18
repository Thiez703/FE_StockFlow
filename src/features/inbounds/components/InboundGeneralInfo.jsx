import { Card, Form, Input, Select, DatePicker } from 'antd';
import { useFormContext, Controller } from 'react-hook-form';
import { SUPPLIER_OPTIONS } from '@/mock/partners';
import { WAREHOUSES } from '@/constants/navigation';

const { TextArea } = Input;

/**
 * Khối "Thông tin chung" của phiếu nhập. Đọc control từ FormProvider ở trang cha.
 */
export default function InboundGeneralInfo() {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <Card
      title="Thông tin chung"
      className="border-hair"
      styles={{ header: { borderBottom: '1px solid #f1f5f9' } }}
    >
      <Form layout="vertical" component={false}>
        <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <Form.Item label="Mã phiếu nhập">
                <Input {...field} readOnly variant="filled" className="mono" />
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
                <DatePicker {...field} format="DD/MM/YYYY" className="w-full" placeholder="Chọn ngày" />
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
                <Select {...field} showSearch optionFilterProp="label" placeholder="Chọn nhà cung cấp" options={SUPPLIER_OPTIONS} />
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
                <Select {...field} placeholder="Chọn kho nhận" options={WAREHOUSES} />
              </Form.Item>
            )}
          />
        </div>

        <Controller
          name="note"
          control={control}
          render={({ field }) => (
            <Form.Item label="Ghi chú" className="!mb-0">
              <TextArea {...field} rows={2} placeholder="Ghi chú thêm cho phiếu nhập (không bắt buộc)" />
            </Form.Item>
          )}
        />
      </Form>
    </Card>
  );
}
