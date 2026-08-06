import { Card, Form, Input, Select } from 'antd';
import { useFormContext, Controller } from 'react-hook-form';
import { CUSTOMER_OPTIONS, SUPPLIER_OPTIONS } from '@/mock/partners';
import { REASON_TYPES } from '@/mock/outbounds';
import { formatDate, TODAY } from '@/utils/date';

const { TextArea } = Input;

/**
 * Khối thông tin chung — hiển thị field khác nhau tuỳ issue_type.
 * @param {'RETAIL'|'RETURN_SUPPLIER'|'DISPOSAL'} issueType
 */
export default function OutboundGeneralInfo({ issueType }) {
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
              <Form.Item label="Mã phiếu xuất">
                <Input {...field} readOnly variant="filled" className="mono" />
              </Form.Item>
            )}
          />

          <Form.Item label="Ngày xuất">
            <Input value={formatDate(TODAY)} readOnly variant="filled" className="mono" />
          </Form.Item>

          {issueType === 'RETAIL' && (
            <Controller
              name="customerId"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label="Khách hàng"
                  required
                  validateStatus={errors.customerId ? 'error' : ''}
                  help={errors.customerId?.message}
                >
                  <Select
                    {...field}
                    showSearch
                    optionFilterProp="label"
                    placeholder="Chọn khách hàng"
                    options={CUSTOMER_OPTIONS}
                  />
                </Form.Item>
              )}
            />
          )}

          {issueType === 'RETURN_SUPPLIER' && (
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
                    options={SUPPLIER_OPTIONS}
                  />
                </Form.Item>
              )}
            />
          )}

          {issueType === 'DISPOSAL' && (
            <Controller
              name="reason_type"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label="Lý do hủy"
                  required
                  validateStatus={errors.reason_type ? 'error' : ''}
                  help={errors.reason_type?.message}
                >
                  <Select
                    {...field}
                    placeholder="Chọn lý do hủy"
                    options={REASON_TYPES}
                  />
                </Form.Item>
              )}
            />
          )}
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
