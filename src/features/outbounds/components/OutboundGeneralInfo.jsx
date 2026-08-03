import { Card, Form, Input, Select } from 'antd';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { CUSTOMER_OPTIONS, SUPPLIER_OPTIONS } from '@/mock/partners';
import { OUTBOUND_TYPES } from '@/mock/outbounds';
import { formatDate, TODAY } from '@/utils/date';

const { TextArea } = Input;
const TYPE_OPTIONS = OUTBOUND_TYPES.map((t) => ({ value: t, label: t }));

// Đối tác theo loại xuất: Sỉ -> khách hàng, Trả NCC -> nhà cung cấp, còn lại -> không cần.
function partnerConfig(type) {
  if (type === 'Sỉ') return { options: CUSTOMER_OPTIONS, label: 'Khách hàng', disabled: false };
  if (type === 'Trả NCC') return { options: SUPPLIER_OPTIONS, label: 'Nhà cung cấp', disabled: false };
  return { options: [], label: 'Đối tác', disabled: true };
}

/**
 * Khối thông tin chung của phiếu xuất; đối tác đổi theo loại xuất đang chọn.
 */
export default function OutboundGeneralInfo() {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const type = useWatch({ control, name: 'type' });
  const partner = partnerConfig(type);

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
              <Form.Item label="Mã phiếu xuất">
                <Input {...field} readOnly variant="filled" className="mono" />
              </Form.Item>
            )}
          />

          {/* Ngày ghi sổ không cho chọn: phiếu luôn mang ngày lập. Khi nối API
              thật thì lấy ngày từ response của server thay vì tự tính ở FE. */}
          <Form.Item label="Ngày xuất">
            <Input value={formatDate(TODAY)} readOnly variant="filled" className="mono" />
          </Form.Item>

          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Form.Item
                label="Loại xuất"
                required
                validateStatus={errors.type ? 'error' : ''}
                help={errors.type?.message}
              >
                <Select {...field} placeholder="Chọn loại xuất" options={TYPE_OPTIONS} />
              </Form.Item>
            )}
          />

          <Controller
            name="partnerId"
            control={control}
            render={({ field }) => (
              <Form.Item
                label={partner.label}
                validateStatus={errors.partnerId ? 'error' : ''}
                help={errors.partnerId?.message}
              >
                <Select
                  {...field}
                  showSearch
                  optionFilterProp="label"
                  placeholder={partner.disabled ? 'Không áp dụng' : `Chọn ${partner.label.toLowerCase()}`}
                  options={partner.options}
                  disabled={partner.disabled}
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
              <TextArea {...field} rows={2} placeholder="Ghi chú thêm cho phiếu xuất (không bắt buộc)" />
            </Form.Item>
          )}
        />
      </Form>
    </Card>
  );
}
