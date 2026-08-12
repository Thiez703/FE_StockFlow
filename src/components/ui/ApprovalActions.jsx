import { useState } from 'react';
import { Button, Modal, Input, Popconfirm, Select } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

/**
 * Cụm nút Duyệt / Từ chối cho phiếu đang chờ duyệt (PENDING). Từ chối yêu cầu lý do
 * qua Modal. Chỉ hiển thị khi record.status === 'PENDING'.
 *
 * @param {object} record
 * @param {(id:string)=>void} onApprove
 * @param {(id:string, reason:string)=>void} onReject
 */
export default function ApprovalActions({ record, onApprove, onReject }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectPrefix, setRejectPrefix] = useState('Sai số liệu');
  const [rejectDetail, setRejectDetail] = useState('');

  if (record.status !== 'PENDING') return <span className="text-ink-sub">—</span>;

  return (
    <div className="flex items-center justify-center gap-1.5">
      <Popconfirm
        title="Duyệt phiếu?"
        description="Xác nhận duyệt phiếu này?"
        onConfirm={() => onApprove(record.id)}
        okText="Duyệt"
        cancelText="Hủy"
        placement="topRight"
      >
        <Button
          type="primary"
          className="bg-emerald-600 hover:bg-emerald-500 border-none"
          size="small"
          icon={<CheckOutlined />}
          title="Duyệt phiếu"
        />
      </Popconfirm>
      
      <Button 
        type="primary" 
        danger 
        size="small"
        icon={<CloseOutlined />} 
        onClick={() => setRejectOpen(true)} 
        title="Từ chối phiếu"
      />

      <Modal centered
        open={rejectOpen}
        title="Từ chối phiếu"
        okText="Xác nhận từ chối"
        okButtonProps={{ danger: true }}
        cancelText="Đóng"
        onCancel={() => setRejectOpen(false)}
        onOk={() => {
          const detail = rejectDetail.trim();
          if (!detail) return;
          const finalReason = `[${rejectPrefix}] ${detail}`;
          onReject(record.id, finalReason);
          setRejectOpen(false);
          setRejectDetail('');
          setRejectPrefix('Sai số liệu');
        }}
        destroyOnHidden
      >
        <p className="mt-1 mb-3 text-sm text-ink-sub">Nhập lý do từ chối phiếu này.</p>
        <div className="flex flex-col gap-2">
          <Select
            value={rejectPrefix}
            onChange={setRejectPrefix}
            options={[
              { value: 'Sai số liệu', label: 'Sai số liệu' },
              { value: 'Chưa đủ thẩm quyền', label: 'Chưa đủ thẩm quyền' },
              { value: 'Yêu cầu kiểm lại', label: 'Yêu cầu kiểm lại' },
              { value: 'Lý do khác', label: 'Lý do khác' },
            ]}
          />
          <Input.TextArea
            rows={3}
            placeholder="Giải thích chi tiết (VD: Số liệu chưa khớp...)"
            value={rejectDetail}
            onChange={(e) => setRejectDetail(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
