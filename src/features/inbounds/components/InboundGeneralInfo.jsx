import { Form, Input, Select } from 'antd';
import { useFormContext, Controller } from 'react-hook-form';
import { formatDate, today } from '@/utils/date';

const { TextArea } = Input;

/**
 * Khối "Thông tin phiếu" của phiếu nhập — render bare (không Card wrapper).
 * Container do trang cha cung cấp.
 */
export default function InboundGeneralInfo({ supplierOptions = [], loadingSuppliers = false }) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <Form layout="vertical" component={false}>
      <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
        <Form.Item label={<span className="text-slate-600 font-medium text-sm">Ngày nhập</span>}>
          <Input value={formatDate(today())} readOnly variant="filled" className="mono bg-slate-50/80 text-slate-500" />
        </Form.Item>

        <Controller
          name="supplierId"
          control={control}
          render={({ field }) => (
            <Form.Item
              label={<span className="text-slate-600 font-medium text-sm">Nhà cung cấp</span>}
              required
              validateStatus={errors.supplierId ? 'error' : ''}
              help={errors.supplierId?.message}
            >
              <Select
                {...field}
                showSearch
                optionFilterProp="label"
                placeholder="Chọn nhà cung cấp"
                options={supplierOptions}
                loading={loadingSuppliers}
              />
            </Form.Item>
          )}
        />
      </div>

      <Controller
        name="note"
        control={control}
        render={({ field }) => (
          <Form.Item label={<span className="text-slate-600 font-medium text-sm">Ghi chú</span>} className="!mb-0">
            <TextArea {...field} rows={2} placeholder="Ghi chú thêm cho phiếu nhập (không bắt buộc)" className="resize-none" />
          </Form.Item>
        )}
      />
    </Form>
  );
}
