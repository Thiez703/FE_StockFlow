import { Card, Form, Input, Select } from 'antd';
import { DISPOSAL_REASON_OPTIONS } from '@/features/outbounds/constants/issueTypes';
import { formatDate, TODAY } from '@/utils/date';

const { TextArea } = Input;

/**
 * Khối thông tin chung của phiếu xuất — field thay đổi theo loại xuất.
 *
 * Chỉ `customerId` là field thật của backend. Nhà cung cấp (phiếu trả NCC) và
 * lý do huỷ (phiếu xuất huỷ) không có cột riêng trong OutboundCreateRequest,
 * trang lập phiếu ghép hai giá trị này vào `note` trước khi gửi đi.
 */
export default function OutboundGeneralInfo({
  issueType,
  value,
  onChange,
  customerOptions,
  supplierOptions,
  loadingPartners,
  createdBy,
}) {
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <Card
      title="Thông tin chung"
      className="border-hair"
      styles={{ header: { borderBottom: '1px solid #f1f5f9' } }}
    >
      <Form layout="vertical" component={false}>
        <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
          <Form.Item label="Ngày xuất">
            <Input value={formatDate(TODAY)} readOnly variant="filled" className="mono" />
          </Form.Item>

          {issueType === 'RETAIL' && (
            <Form.Item label="Khách hàng" required>
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Chọn khách hàng"
                options={customerOptions}
                loading={loadingPartners}
                value={value.customerId}
                onChange={(v) => set({ customerId: v })}
              />
            </Form.Item>
          )}

          {issueType === 'RETURN_SUPPLIER' && (
            <Form.Item name="supplierId" label="Trả về nhà cung cấp" rules={[{ required: true, message: 'Vui lòng chọn NCC' }]}>
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Chọn nhà cung cấp"
                options={supplierOptions}
                loading={loadingPartners}
                value={value.supplierId}
                onChange={(v) => set({ supplierId: v })}
              />
            </Form.Item>
          )}

          {issueType === 'DISPOSAL' && (
            <Form.Item name="disposalReason" label="Lý do xuất huỷ" rules={[{ required: true, message: 'Vui lòng chọn lý do' }]}>
              <Select
                placeholder="Chọn lý do hủy"
                options={DISPOSAL_REASON_OPTIONS}
                value={value.disposalReason}
                onChange={(v) => set({ disposalReason: v })}
              />
            </Form.Item>
          )}

          {/* Người lập lấy từ token ở backend, không sửa được tại đây. */}
          <Form.Item label="Người lập phiếu">
            <Input value={createdBy ?? '—'} readOnly variant="filled" />
          </Form.Item>
        </div>

        <Form.Item
          label="Ghi chú"
          className="!mb-0"
          extra={
            issueType !== 'RETAIL' && value.note.length > 200
              ? 'Ghi chú sẽ được ghép với thông tin NCC/lý do hủy và cắt ở 255 ký tự.'
              : undefined
          }
        >
          <TextArea
            rows={2}
            maxLength={255}
            showCount
            placeholder="Ghi chú thêm cho phiếu xuất (không bắt buộc)"
            value={value.note}
            onChange={(e) => set({ note: e.target.value })}
          />
        </Form.Item>
      </Form>
    </Card>
  );
}
