import { useState } from 'react';
import { Button, Modal, Input, Popconfirm } from 'antd';
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
  const [reason, setReason] = useState('');

  if (record.status !== 'PENDING') return <span className="text-ink-sub">—</span>;

  return (
    <div className="flex items-center justify-center gap-2">
      <Popconfirm
        title="Duyệt phiếu?"
        description="Xác nhận duyệt phiếu này?"
        onConfirm={() => onApprove(record.id)}
        okText="Duyệt"
        cancelText="Hủy"
      >
        <Button
          type="primary"
          className="bg-emerald-600 hover:bg-emerald-500 border-none"
          size="small"
          icon={<CheckOutlined />}
        >
          Duyệt
        </Button>
      </Popconfirm>
      
      <Button 
        type="primary" 
        danger 
        size="small"
        icon={<CloseOutlined />} 
        onClick={() => setRejectOpen(true)} 
      >
        Từ chối
      </Button>

      <Modal
        open={rejectOpen}
        title="Từ chối phiếu"
        okText="Xác nhận từ chối"
        okButtonProps={{ danger: true }}
        cancelText="Đóng"
        onCancel={() => setRejectOpen(false)}
        onOk={() => {
          onReject(record.id, reason);
          setRejectOpen(false);
          setReason('');
        }}
        destroyOnHidden
      >
        <p className="mt-1 mb-3 text-sm text-ink-sub">Nhập lý do từ chối phiếu này.</p>
        <Input.TextArea
          rows={3}
          placeholder="VD: Số liệu chưa khớp, đề nghị kiểm lại..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}
