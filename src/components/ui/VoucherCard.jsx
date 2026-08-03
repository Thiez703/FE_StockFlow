import PaperSheet, { PaperStamp } from '@/components/ui/PaperSheet';
import InkSignature from '@/components/ui/InkSignature';
import { COMPANY, VOUCHER_KINDS } from '@/constants/voucher';
import { formatCurrency, formatNumber } from '@/utils/formatCurrency';
import { readMoneyVi } from '@/utils/numberToWords';
import { dateParts } from '@/utils/date';
import { totalQuantity, stocktakeTotals } from '@/utils/voucher';

// Số dòng hàng in trên thẻ thu nhỏ; phần còn lại gộp thành "và N mặt hàng khác".
const PREVIEW_ROWS = 9;

// Số lượng hiển thị ở cột SL của bảng rút gọn: kiểm kê lấy số đếm thực tế.
const rowQuantity = (layout, item) => (layout === 'count' ? item.countedQty : item.quantity);

/**
 * Dòng tổng kết ở chân thẻ, khác nhau theo loại phiếu: nhập/xuất cộng tiền,
 * kiểm kê nêu chênh lệch, hàng bất thường nêu số lượng và tình trạng.
 */
function cardSummary(voucher, cfg) {
  if (cfg.layout === 'count') {
    const { system, counted, surplus, shortage } = stocktakeTotals(voucher.items ?? []);
    const parts = [];
    if (surplus) parts.push(`thừa ${formatNumber(surplus)}`);
    if (shortage) parts.push(`thiếu ${formatNumber(shortage)}`);
    return {
      label: 'Chênh lệch:',
      value: parts.length ? parts.join(' · ') : 'Khớp sổ',
      sub: `Theo sổ ${formatNumber(system)} — kiểm kê ${formatNumber(counted)}`,
    };
  }

  if (cfg.layout === 'incident') {
    const first = voucher.items?.[0];
    return {
      label: 'Số lượng bất thường:',
      value: `${formatNumber(totalQuantity(voucher.items))} ${first?.unit ?? ''}`.trim(),
      sub: first?.reason,
    };
  }

  return {
    label: 'Cộng thành tiền:',
    value: formatCurrency(voucher.total),
    sub: `(${readMoneyVi(voucher.total)})`,
  };
}

/**
 * Thẻ phiếu trong lưới danh sách: một tờ phiếu thu nhỏ theo đúng tỉ lệ giấy A4
 * (khổ đứng), giữ nguyên bố cục của bản in — đầu phiếu, tiêu đề, số phiếu, bảng
 * vật tư rút gọn, dòng cộng tiền và ô ký. Bấm vào thẻ để mở tờ phiếu đầy đủ.
 */
export default function VoucherCard({ voucher, onOpen }) {
  const cfg = VOUCHER_KINDS[voucher.kind];
  const items = voucher.items ?? [];
  const shown = items.slice(0, PREVIEW_ROWS);
  const rest = items.length - shown.length;
  const { day, month, year } = dateParts(voucher.date);
  const voided = voucher.status === 'VOIDED' || voucher.status === 'REJECTED';
  const summary = cardSummary(voucher, cfg);

  return (
    <button
      type="button"
      onClick={() => onOpen?.(voucher)}
      aria-label={`Mở phiếu ${voucher.code}`}
      className="group block aspect-[1/1.414] w-full cursor-pointer text-left focus:outline-none"
    >
      <PaperSheet
        size="fill"
        stacked
        className={`flex flex-col overflow-hidden px-4 pt-3.5 pb-3 text-[10px] leading-[1.35] transition duration-200 group-hover:-translate-y-1 group-focus-visible:ring-2 group-focus-visible:ring-royal ${
          voided ? 'opacity-75' : ''
        }`}
      >
        <PaperStamp status={voucher.status} size="sm" className="right-2.5 top-[88px] z-10" />

        {/* Đầu phiếu */}
        <div className="flex items-start justify-between gap-2 text-[7px] uppercase leading-tight">
          <span className="min-w-0 flex-1 truncate font-bold">{COMPANY.name}</span>
          <span className="shrink-0 italic">{cfg.formNo}</span>
        </div>
        <div className="mt-1.5 border-t border-slate-200" />

        {/* Tiêu đề + số phiếu */}
        <div className="mt-2.5 text-center">
          <div className="text-[13.5px] font-bold uppercase leading-tight tracking-[0.05em]">
            {cfg.cardTitle ?? cfg.title}
          </div>
          <div className="mt-0.5 text-[8.5px] italic text-slate-600">
            Ngày {day} tháng {month} năm {year}
          </div>
          <div className="mt-1 text-[10.5px]">
            Số: <span className="font-bold">{voucher.code}</span>
          </div>
        </div>

        {/* Thông tin đối tác */}
        <div className="doc-rule-top mt-2.5 pt-2">
          <div className="text-[8.5px] italic text-slate-600">{cfg.partnerLabel}:</div>
          <div className="line-clamp-2 font-bold">{voucher.partnerName || cfg.partnerFallback}</div>
          <div className="mt-0.5 truncate text-[9px] italic text-slate-600">
            {voucher.subType ? `${cfg.subTypeLabel}: ${voucher.subType} — ` : ''}
            {cfg.warehouseLabel}: {voucher.warehouse}
          </div>
        </div>

        {/* Bảng vật tư rút gọn */}
        <table className="doc-table mt-2 text-[9px] [&_td]:px-1 [&_td]:py-[2.5px] [&_th]:px-1 [&_th]:py-[2.5px]">
          <colgroup>
            <col className="w-[16px]" />
            <col />
            <col className="w-[42px]" />
          </colgroup>
          <thead>
            <tr className="text-[8px]">
              <th>TT</th>
              <th>Tên hàng</th>
              <th>SL</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((it, i) => (
              <tr key={`${it.productName}-${i}`}>
                <td className="text-center">{i + 1}</td>
                <td className="truncate">{it.productName}</td>
                <td className="text-right">{formatNumber(rowQuantity(cfg.layout, it))}</td>
              </tr>
            ))}
            {/* Dòng kẻ sẵn còn trống, đúng kiểu biểu mẫu in sẵn. */}
            {Array.from({ length: Math.max(0, PREVIEW_ROWS - shown.length) }, (_, i) => (
              <tr key={`filler-${i}`}>
                <td className="text-center text-slate-300">{shown.length + i + 1}</td>
                <td>&nbsp;</td>
                <td />
              </tr>
            ))}
          </tbody>
        </table>
        {rest > 0 && (
          <div className="mt-1 text-center text-[8.5px] italic text-slate-500">
            … và {rest} mặt hàng khác
          </div>
        )}

        <div className="flex-1" />

        {/* Dòng tổng kết: cộng tiền / chênh lệch kiểm kê / số lượng bất thường */}
        <div className="mt-2 border-t border-slate-800 pt-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="shrink-0 text-[9.5px]">{summary.label}</span>
            <span className="truncate text-[13px] font-bold">{summary.value}</span>
          </div>
          {summary.sub && (
            <div className="line-clamp-2 text-[8px] italic text-slate-500">{summary.sub}</div>
          )}
        </div>

        {/* Ô ký của người lập phiếu */}
        <div className="doc-rule-top mt-1.5 flex items-end justify-between gap-2 pt-1">
          <div className="min-w-0">
            <div className="text-[8px] italic text-slate-600">Người lập phiếu</div>
            <div className="truncate text-[9.5px] font-medium">{voucher.createdBy}</div>
          </div>
          <InkSignature name={voucher.createdBy} width={70} height={24} className="shrink-0" />
        </div>
      </PaperSheet>
    </button>
  );
}
