import { VOUCHER_KINDS } from '@/constants/voucher';
import { formatNumber } from '@/utils/formatCurrency';
import { totalQuantity, stocktakeTotals } from '@/utils/voucher';

// Bảng vật tư luôn kẻ sẵn tối thiểu 5 dòng như biểu mẫu in.
const MIN_ROWS = 5;

/** Các dòng kẻ trống còn lại của bảng — phiếu giấy luôn chừa sẵn vài dòng. */
function FillerRows({ count, from, cols }) {
  return Array.from({ length: count }, (_, i) => (
    <tr key={`filler-${i}`}>
      <td className="text-center text-slate-300">{from + i}</td>
      <td>&nbsp;</td>
      {Array.from({ length: cols - 2 }, (_, c) => (
        <td key={c} />
      ))}
    </tr>
  ));
}

/** Hàng ký hiệu cột A, B, C… in sẵn trên biểu mẫu của Bộ Tài chính. */
function LetterRow({ count }) {
  const letters = ['A', 'B', 'C', 'D'];
  return (
    <tr className="text-[11px] italic">
      {Array.from({ length: count }, (_, i) => (
        <th key={i} className="font-normal">
          {letters[i] ?? i - 3}
        </th>
      ))}
    </tr>
  );
}

/** Nhập / xuất kho: số lượng — đơn giá — thành tiền. */
function MoneyTable({ cfg, items, minRows }) {
  const fillers = Math.max(0, minRows - items.length);

  return (
    <table className="doc-table mt-5 text-[12.5px]">
      <colgroup>
        <col className="w-[38px]" />
        <col />
        <col className="w-[92px]" />
        <col className="w-[86px]" />
        <col className="w-[62px]" />
        <col className="w-[92px]" />
        <col className="w-[108px]" />
      </colgroup>
      <thead>
        <tr>
          <th>STT</th>
          <th>Tên, nhãn hiệu, quy cách phẩm chất vật tư, hàng hoá</th>
          <th>Mã lô</th>
          <th>
            Đơn vị
            <br />
            tính
          </th>
          <th>{cfg.quantityLabel}</th>
          <th>Đơn giá</th>
          <th>Thành tiền</th>
        </tr>
        <LetterRow count={7} />
      </thead>
      <tbody>
        {items.map((it, i) => (
          <tr key={`${it.productName}-${i}`}>
            <td className="text-center">{i + 1}</td>
            <td className="break-words">{it.productName}</td>
            <td className="text-center">{it.lot || '—'}</td>
            <td className="text-center">{'Thùng'}</td>
            <td className="text-right">{formatNumber(it.quantity)}</td>
            <td className="text-right">{formatNumber(it.unitPrice)}</td>
            <td className="text-right">{formatNumber(it.quantity * it.unitPrice)}</td>
          </tr>
        ))}
        <FillerRows count={fillers} from={items.length + 1} cols={7} />
        <tr className="font-bold">
          <td colSpan={4} className="text-right">
            Cộng
          </td>
          <td className="text-right">{formatNumber(totalQuantity(items))}</td>
          <td className="text-center">x</td>
          <td className="text-right">
            {formatNumber(items.reduce((s, it) => s + it.quantity * it.unitPrice, 0))}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/** Kiểm kê: theo sổ sách — thực tế — chênh lệch thừa / thiếu (mẫu 05-VT). */
function CountTable({ items, minRows }) {
  const fillers = Math.max(0, minRows - items.length);
  const sum = stocktakeTotals(items);

  return (
    <table className="doc-table mt-5 text-[12.5px]">
      <colgroup>
        <col className="w-[38px]" />
        <col />
        <col className="w-[92px]" />
        <col className="w-[60px]" />
        <col className="w-[78px]" />
        <col className="w-[78px]" />
        <col className="w-[64px]" />
        <col className="w-[64px]" />
        <col className="w-[100px]" />
      </colgroup>
      <thead>
        <tr>
          <th rowSpan={2}>STT</th>
          <th rowSpan={2}>Tên, nhãn hiệu, quy cách phẩm chất vật tư, hàng hoá</th>
          <th rowSpan={2}>Mã lô</th>
          <th rowSpan={2}>
            Đơn vị
            <br />
            tính
          </th>
          <th rowSpan={2}>
            Tồn
            <br />
            hệ thống
          </th>
          <th rowSpan={2}>
            Số lượng
            <br />
            thực tế
          </th>
          <th colSpan={2}>Chênh lệch</th>
          <th rowSpan={2}>Ghi chú</th>
        </tr>
        <tr>
          <th>Thừa</th>
          <th>Thiếu</th>
        </tr>
        <LetterRow count={9} />
      </thead>
      <tbody>
        {items.map((it, i) => {
          const diff = (Number(it.countedQty) || 0) - (Number(it.systemQty) || 0);
          return (
            <tr key={`${it.productName}-${i}`}>
              <td className="text-center">{i + 1}</td>
              <td className="break-words">{it.productName}</td>
              <td className="text-center">{it.lot || '—'}</td>
              <td className="text-center">{'Thùng'}</td>
              <td className="text-right">{formatNumber(it.systemQty)}</td>
              <td className="text-right">{formatNumber(it.countedQty)}</td>
              <td className="text-right">{diff > 0 ? formatNumber(diff) : ''}</td>
              <td className="text-right">{diff < 0 ? formatNumber(-diff) : ''}</td>
              <td className="break-words">{it.note || ''}</td>
            </tr>
          );
        })}
        <FillerRows count={fillers} from={items.length + 1} cols={9} />
        <tr className="font-bold">
          <td colSpan={4} className="text-right">
            Cộng
          </td>
          <td className="text-right">{formatNumber(sum.system)}</td>
          <td className="text-right">{formatNumber(sum.counted)}</td>
          <td className="text-right">{sum.surplus ? formatNumber(sum.surplus) : ''}</td>
          <td className="text-right">{sum.shortage ? formatNumber(sum.shortage) : ''}</td>
          <td />
        </tr>
      </tbody>
    </table>
  );
}

/** Hàng bất thường: số lượng — tình trạng — nguyên nhân. */
function IncidentTable({ items, minRows }) {
  const fillers = Math.max(0, minRows - items.length);

  return (
    <table className="doc-table mt-5 text-[12.5px]">
      <colgroup>
        <col className="w-[38px]" />
        <col />
        <col className="w-[92px]" />
        <col className="w-[60px]" />
        <col className="w-[70px]" />
        <col className="w-[86px]" />
        <col />
      </colgroup>
      <thead>
        <tr>
          <th>STT</th>
          <th>Tên, nhãn hiệu, quy cách phẩm chất vật tư, hàng hoá</th>
          <th>Mã lô</th>
          <th>
            Đơn vị
            <br />
            tính
          </th>
          <th>Số lượng</th>
          <th>Tình trạng</th>
          <th>Nguyên nhân</th>
        </tr>
        <LetterRow count={7} />
      </thead>
      <tbody>
        {items.map((it, i) => (
          <tr key={`${it.productName}-${i}`}>
            <td className="text-center">{i + 1}</td>
            <td className="break-words">{it.productName}</td>
            <td className="text-center">{it.lot || '—'}</td>
            <td className="text-center">{'Thùng'}</td>
            <td className="text-right">{formatNumber(it.quantity)}</td>
            <td className="text-center">{it.condition}</td>
            <td className="break-words">{it.reason}</td>
          </tr>
        ))}
        <FillerRows count={fillers} from={items.length + 1} cols={7} />
        <tr className="font-bold">
          <td colSpan={4} className="text-right">
            Cộng
          </td>
          <td className="text-right">{formatNumber(totalQuantity(items))}</td>
          <td className="text-center">x</td>
          <td />
        </tr>
      </tbody>
    </table>
  );
}

/**
 * Bảng vật tư giữa mặt phiếu. Mỗi loại chứng từ có bộ cột riêng nhưng chung
 * cách kẻ ô, hàng ký hiệu cột và dòng "Cộng" của biểu mẫu in.
 */
export default function VoucherItemsTable({ kind, items = [], minRows = MIN_ROWS }) {
  const cfg = VOUCHER_KINDS[kind];
  if (cfg.layout === 'count') return <CountTable items={items} minRows={minRows} />;
  if (cfg.layout === 'incident') return <IncidentTable items={items} minRows={minRows} />;
  return <MoneyTable cfg={cfg} items={items} minRows={minRows} />;
}
