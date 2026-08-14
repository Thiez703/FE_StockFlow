import { Card, Form, Input, Select } from 'antd';
import { DISPOSAL_REASON_OPTIONS } from '@/features/outbounds/constants/issueTypes';
import { formatDate, today } from '@/utils/date';

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
  errors = {},
  customerOptions,
  supplierOptions,
  loadingPartners,
  createdBy,
  theme,
}) {
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <div className={`rounded-2xl shadow-sm bg-white p-6 border-t-4 ${theme?.border || 'border-t-amber-500'} flex-1`}>
      <div className="flex items-center gap-2.5 mb-5">
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${theme?.bg || 'bg-amber-50'} ${theme?.textIcon || 'text-amber-500'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm4.75 6.75a.75.75 0 00-1.5 0v2.546l-.943-1.048a.75.75 0 10-1.114 1.004l2.25 2.5a.75.75 0 001.114 0l2.25-2.5a.75.75 0 10-1.114-1.004l-.943 1.048V8.75z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="m-0 text-base font-bold text-slate-800 tracking-wide">Thông tin phiếu</h3>
      </div>
      <Form layout="vertical" component={false}>
        <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
          <Form.Item label={<span className="text-slate-600 font-medium">Ngày xuất</span>}>
            <Input size="large" value={formatDate(today())} readOnly variant="filled" className="mono bg-slate-50 text-slate-500" />
          </Form.Item>

          {issueType === 'RETAIL' && (
            <Form.Item
              label={<span className="text-slate-600 font-medium">Khách hàng</span>}
              required
              validateStatus={errors.customerId ? 'error' : ''}
              help={errors.customerId}
            >
              <Select
                size="large"
                showSearch
                optionFilterProp="label"
                placeholder="Chọn khách hàng"
                options={customerOptions}
                loading={loadingPartners}
                value={value.customerId}
                status={errors.customerId ? 'error' : ''}
                onChange={(v) => set({ customerId: v })}
              />
            </Form.Item>
          )}

          {issueType === 'RETURN_SUPPLIER' && (
            <Form.Item
              label={<span className="text-slate-600 font-medium">Trả về nhà cung cấp</span>}
              required
              validateStatus={errors.supplierId ? 'error' : ''}
              help={errors.supplierId}
            >
              <Select
                size="large"
                showSearch
                optionFilterProp="label"
                placeholder="Chọn nhà cung cấp"
                options={supplierOptions}
                loading={loadingPartners}
                value={value.supplierId}
                status={errors.supplierId ? 'error' : ''}
                onChange={(v) => set({ supplierId: v })}
              />
            </Form.Item>
          )}

          {issueType === 'DISPOSAL' && (
            <Form.Item
              label={<span className="text-slate-600 font-medium">Lý do xuất huỷ</span>}
              required
              validateStatus={errors.disposalReason ? 'error' : ''}
              help={errors.disposalReason}
            >
              <Select
                size="large"
                placeholder="Chọn lý do hủy"
                options={DISPOSAL_REASON_OPTIONS}
                value={value.disposalReason}
                status={errors.disposalReason ? 'error' : ''}
                onChange={(v) => set({ disposalReason: v })}
              />
            </Form.Item>
          )}

          {/* Người lập lấy từ token ở backend, không sửa được tại đây. */}
          <Form.Item label={<span className="text-slate-600 font-medium">Người lập phiếu</span>}>
            <Input size="large" value={createdBy ?? '—'} readOnly variant="filled" className="bg-slate-50 text-slate-500" />
          </Form.Item>
        </div>

        <Form.Item
          label={<span className="text-slate-600 font-medium">Ghi chú</span>}
          className="!mb-0"
          extra={
            issueType !== 'RETAIL' && value.note.length > 200
              ? 'Ghi chú sẽ được ghép với thông tin NCC/lý do hủy và cắt ở 255 ký tự.'
              : undefined
          }
        >
          <TextArea
            size="large"
            rows={3}
            maxLength={255}
            showCount
            placeholder="Ghi chú thêm cho phiếu xuất (không bắt buộc)"
            value={value.note}
            onChange={(e) => set({ note: e.target.value })}
            className="resize-none"
          />
        </Form.Item>
      </Form>
    </div>
  );
}
