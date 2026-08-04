import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Modal, Button } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import VoucherPaper from '@/components/ui/VoucherPaper';
import StatusPill from '@/components/ui/StatusPill';
import DocCode from '@/components/ui/DocCode';

/**
 * Xem lại một phiếu đã lập dưới dạng tờ giấy đầy đủ, kèm nút in. `actions` là
 * các nút nghiệp vụ riêng của từng loại phiếu (huỷ phiếu, duyệt / từ chối...).
 *
 * Bản in được render bằng portal ra thẳng <body> (không nằm trong Modal) vì tờ
 * phiếu trong Modal bị kẹp bởi vùng cuộn và transform của AntD — in ra sẽ mất
 * phần dưới. Tờ portal chỉ hiện khi in (class `print-only`).
 */
export default function VoucherPreviewModal({ open, voucher, onClose, actions }) {
  // AntD tự focus khung dialog khi mở, khiến trình duyệt cuộn trang lên đầu —
  // khôi phục vị trí cuộn ngay sau đó để danh sách không bị giật.
  const scrollYRef = useRef(0);
  useEffect(() => {
    if (!open) return;
    scrollYRef.current = window.scrollY;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.scrollTo(0, scrollYRef.current));
    });
  }, [open]);

  return (
    <>
      <Modal centered
        open={open}
        onCancel={onClose}
        width={920}
        destroyOnHidden
        styles={{ body: { padding: 0 } }}
        title={
          voucher && (
            <span className="flex flex-wrap items-center gap-3">
              <DocCode>{voucher.code}</DocCode>
              <StatusPill status={voucher.status} />
            </span>
          )
        }
        footer={
          voucher && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {actions}
              <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
                In phiếu
              </Button>
              <Button type="primary" onClick={onClose}>
                Đóng
              </Button>
            </div>
          )
        }
      >
        <div className="app-scroll max-h-[72vh] overflow-auto bg-[#e9edf3] px-3 py-6 sm:px-6">
          <VoucherPaper voucher={voucher} />
        </div>
      </Modal>

      {open &&
        voucher &&
        createPortal(
          <div className="print-only print-sheet">
            <VoucherPaper voucher={voucher} />
          </div>,
          document.body,
        )}
    </>
  );
}
