import { Button, Result } from 'antd';
import { PrinterOutlined, EditOutlined, UnorderedListOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import VoucherPaper from '@/components/ui/VoucherPaper';
import VoucherMobileView from '@/components/ui/VoucherMobileView';
import DocCode from '@/components/ui/DocCode';
import { useIsMobile } from '@/hooks/useIsMobile';

/**
 * Bước sau khi lập phiếu: nhập liệu xong bằng form thường, xác nhận rồi mới dựng
 * ra tờ phiếu hoàn chỉnh ở đây. Tách hai bước như vậy để thao tác trên điện thoại
 * là điền form bình thường, còn tờ giấy chỉ đóng vai trò bản chốt để xem và in.
 *
 * @param {object}   voucher   Bản ghi đã chuẩn hoá (toVoucher/draft).
 * @param {string}   title     Tiêu đề dòng thông báo.
 * @param {Function} onEdit    Quay lại form, giữ nguyên dữ liệu vừa nhập.
 * @param {Function} onNew     Lập tờ mới (reset form).
 * @param {string}   listPath  Đường dẫn danh sách để quay về.
 */
export default function VoucherResult({ voucher, title, onEdit, onNew, listPath }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const actions = isMobile
    ? [
        <Button key="new" type="primary" icon={<PlusOutlined />} onClick={onNew} className="min-h-[44px]">
          Lập phiếu mới
        </Button>,
        <Button key="list" icon={<UnorderedListOutlined />} onClick={() => navigate(listPath)} className="min-h-[44px]">
          Về danh sách
        </Button>,
        <Button key="print" icon={<PrinterOutlined />} onClick={() => window.print()} className="min-h-[44px]">
          In phiếu
        </Button>,
      ]
    : [
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
          In phiếu
        </Button>,
        <Button key="new" icon={<PlusOutlined />} onClick={onNew}>
          Lập phiếu mới
        </Button>,
        <Button key="list" icon={<UnorderedListOutlined />} onClick={() => navigate(listPath)}>
          Về danh sách
        </Button>,
      ];

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="no-print w-full rounded-2xl border border-hair bg-white">
        <Result
          status="success"
          title={title}
          subTitle={
            <span className="flex flex-wrap items-center justify-center gap-2 text-sm">
              Số phiếu <DocCode>{voucher.code}</DocCode>
              {!isMobile && <span className="text-ink-sub">— kiểm tra lại nội dung bên dưới rồi in nếu cần.</span>}
            </span>
          }
          extra={actions}
        />
      </div>

      {/* Mobile: graphic/table view. Desktop: paper view (printable). */}
      {isMobile ? (
        <VoucherMobileView voucher={voucher} />
      ) : (
        <VoucherPaper voucher={voucher} print />
      )}
    </div>
  );
}
