import PaperSheet, { PaperStamp } from '@/components/ui/PaperSheet';
import { PaperHeader, PaperTitle, DocField, AmountInWords, SignatureRow } from '@/components/ui/PaperBlocks';
import VoucherItemsTable from '@/components/ui/VoucherItemsTable';
import { VOUCHER_KINDS } from '@/constants/voucher';
import { formatCurrency, formatNumber } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/date';
import { stocktakeTotals } from '@/utils/voucher';

/** Câu kết luận của biên bản kiểm kê, suy ra từ chênh lệch thừa/thiếu. */
function countConclusion(items) {
  const { surplus, shortage } = stocktakeTotals(items);
  if (!surplus && !shortage) return 'Số liệu kiểm kê khớp với sổ kế toán.';
  const parts = [];
  if (surplus) parts.push(`thừa ${formatNumber(surplus)} đơn vị`);
  if (shortage) parts.push(`thiếu ${formatNumber(shortage)} đơn vị`);
  return `Có chênh lệch so với sổ kế toán: ${parts.join(', ')}.`;
}

/**
 * Tờ chứng từ đã lập, dựng đúng bố cục mẫu in: đầu phiếu, tiêu đề + số hiệu,
 * các dòng thông tin, bảng vật tư kẻ ô, phần kết và hàng ô chữ ký.
 * Dùng cho màn hình xem lại phiếu và cho bản in.
 *
 * @param {object} voucher  Bản ghi đã chuẩn hoá qua toVoucher().
 * @param {boolean} print   Đánh dấu đây là tờ sẽ được đưa vào bản in.
 */
export default function VoucherPaper({ voucher, print = false, className = '' }) {
  if (!voucher) return null;

  const cfg = VOUCHER_KINDS[voucher.kind];
  const items = voucher.items ?? [];
  const isMoney = cfg.layout === 'money';

  return (
    <PaperSheet size="a4" print={print} className={className}>
      {/* Dấu đóng đè lên vùng chữ ký thủ kho / kế toán, đúng chỗ đóng dấu thật. */}
      <PaperStamp
        status={voucher.status}
        caption={formatDate(voucher.date)}
        className="bottom-12 right-20 z-10"
      />

      <PaperHeader formNo={cfg.formNo} formNote={cfg.formNote} />

      <PaperTitle
        title={cfg.title}
        date={voucher.date}
        code={isMoney ? voucher.code : undefined}
        debit={cfg.debit}
        credit={cfg.credit}
      />

      <div className="mt-9 flex flex-col gap-2 text-[13px]">
        {(voucher.rejectReason || voucher.voidReason) && (
          <div className="mb-2 rounded border border-red-200 bg-red-50 p-2 text-[13px] font-semibold text-red-700">
            Lý do {voucher.rejectReason ? 'từ chối' : 'huỷ'}: <span className="font-normal">{voucher.rejectReason || voucher.voidReason}</span>
          </div>
        )}
        {!isMoney && <DocField label="Biên bản số" value={voucher.code} />}
        <DocField label={cfg.partnerLabel} value={voucher.partnerName || cfg.partnerFallback} />
        {/* Hàng bất thường: dòng này ghi loại bất thường, còn diễn giải nằm ở
            cột "Nguyên nhân" trong bảng nên không lặp lại. */}
        <DocField
          label={cfg.reasonLabel}
          value={cfg.layout === 'incident' ? voucher.subType : voucher.note || voucher.subType || ''}
        />
        <div className="flex gap-6">
          <DocField label={cfg.warehouseLabel} value={voucher.warehouse} className="flex-1" />
          <DocField label="Địa điểm" value="Khu A" dash={false} className="w-[220px]" />
        </div>
      </div>

      <VoucherItemsTable kind={voucher.kind} items={items} />

      <div className="mt-3 flex flex-col gap-2 text-[13px]">
        {isMoney ? (
          <>
            <div className="flex items-end gap-2">
              <span className="shrink-0">- Cộng thành tiền:</span>
              <span className="doc-dotted min-w-0 flex-1 pb-[2px] text-right font-bold">
                {formatCurrency(voucher.total)}
              </span>
            </div>
            <AmountInWords amount={voucher.total} />
            <DocField label="Số chứng từ gốc kèm theo" value="01 (một) bộ" />
          </>
        ) : (
          <>
            {cfg.layout === 'count' && (
              <DocField label="Kết luận" value={countConclusion(items)} />
            )}
            <DocField label="Ý kiến / kiến nghị xử lý" value="" />
            <p className="m-0 mt-1 text-[12.5px] italic">
              Biên bản được lập thành 02 bản, mỗi bên giữ 01 bản có giá trị như nhau.
            </p>
          </>
        )}
      </div>

      <SignatureRow signers={cfg.signers} date={voucher.date} signedBy={voucher.createdBy} />
    </PaperSheet>
  );
}
