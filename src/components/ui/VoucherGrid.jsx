import { StaggerList, StaggerItem } from '@/components/ui/StaggerList';
import VoucherCard from '@/components/ui/VoucherCard';
import TableEmptyState from '@/components/ui/TableEmptyState';

/**
 * Lưới phiếu đã lập: các tờ phiếu khổ đứng xếp thành hàng lối đều nhau, xuất hiện
 * lần lượt khi đổi bộ lọc. Dùng chung cho phiếu nhập và phiếu xuất.
 */
export default function VoucherGrid({ vouchers, onOpen, emptyMessage = 'Không tìm thấy phiếu phù hợp' }) {
  if (!vouchers.length) {
    return (
      <div className="rounded-2xl border border-hair bg-white">
        <TableEmptyState message={emptyMessage} />
      </div>
    );
  }

  return (
    <StaggerList
      as="ul"
      className="m-0 grid list-none grid-cols-1 gap-x-5 gap-y-7 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {vouchers.map((v) => (
        <StaggerItem key={v.id} as="li" className="m-0">
          <VoucherCard voucher={v} onOpen={onOpen} />
        </StaggerItem>
      ))}
    </StaggerList>
  );
}
