import { useState } from 'react';
import { Tag, Segmented } from 'antd';
import { AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { VOUCHER_KINDS, VOUCHER_STAMPS } from '@/constants/voucher';
import { formatCurrency, formatNumber } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/date';
import { totalQuantity } from '@/utils/voucher';

const STATUS_COLORS = {
  POSTED: 'blue',
  APPROVED: 'green',
  PENDING: 'gold',
  REJECTED: 'red',
  VOIDED: 'default',
};

/**
 * Dạng đồ họa (graphic view) — mặc định trên mobile.
 * Card tóm tắt lớn + mỗi dòng hàng là 1 card riêng.
 */
function GraphicView({ voucher, cfg }) {
  const items = voucher.items ?? [];
  const isCount = cfg.layout === 'count';

  return (
    <div className="flex flex-col gap-3">
      {(voucher.rejectReason || voucher.voidReason) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <span className="font-semibold">Lý do {voucher.rejectReason ? 'từ chối' : 'huỷ'}:</span>{' '}
          {voucher.rejectReason || voucher.voidReason}
        </div>
      )}

      {/* Summary card */}
      <div className="rounded-2xl bg-white border border-hair p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="mono text-lg font-bold text-ink">{voucher.code}</div>
            <div className="text-xs text-ink-sub mt-0.5">{formatDate(voucher.date)}</div>
          </div>
          <Tag color={STATUS_COLORS[voucher.status] || 'default'} className="!mr-0 !text-xs !font-semibold">
            {VOUCHER_STAMPS[voucher.status]?.label || voucher.status}
          </Tag>
        </div>
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-ink-sub">{cfg.partnerLabel}</span>
            <span className="font-medium text-ink">{voucher.partnerName || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-sub">Người lập</span>
            <span className="font-medium text-ink">{voucher.createdBy || '—'}</span>
          </div>
          {voucher.note && (
            <div className="flex items-center justify-between">
              <span className="text-ink-sub">Ghi chú</span>
              <span className="font-medium text-ink text-right max-w-[60%] truncate">{voucher.note}</span>
            </div>
          )}
        </div>
        {/* Totals */}
        <div className="rule-dashed-top mt-3 pt-3">
          {isCount ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-sub">Tổng dòng</span>
              <span className="font-bold text-ink">{items.length} vị trí</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-sub">Tổng số lượng</span>
                <span className="font-bold text-ink">{formatNumber(totalQuantity(items))}</span>
              </div>
              {voucher.total > 0 && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-ink-sub">Tổng giá trị</span>
                  <span className="text-lg font-bold text-royal">{formatCurrency(voucher.total)}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Line item cards */}
      {items.map((item, idx) => (
        <div key={idx} className="rounded-xl bg-white border border-hair p-3">
          <div className="font-semibold text-ink text-sm mb-1">
            {item.productName || item.name || `Dòng ${idx + 1}`}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-sub">
            {item.productCode && <span className="mono">{item.productCode}</span>}
            {(item.lot || item.lotCode) && <span>Lô: <strong className="text-ink">{item.lot || item.lotCode}</strong></span>}
            {(item.location || item.locationCode) && <span>Vị trí: <strong className="text-ink">{item.location || item.locationCode}</strong></span>}
          </div>
          <div className="flex items-end justify-between mt-2">
            {isCount ? (
              <>
                <div className="flex gap-4 text-xs">
                  <span>Hệ thống: <strong className="mono">{formatNumber(item.systemQty)}</strong></span>
                  <span>Thực tế: <strong className="mono">{formatNumber(item.countedQty)}</strong></span>
                </div>
                <DiffBadge value={(item.countedQty ?? 0) - (item.systemQty ?? 0)} />
              </>
            ) : (
              <>
                <span className="text-2xl font-bold text-ink">{formatNumber(item.quantity)}</span>
                {item.unitPrice > 0 && (
                  <span className="text-sm font-medium text-ink-sub">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function DiffBadge({ value }) {
  if (value === 0) return <span className="text-xs text-ink-sub font-medium">Khớp</span>;
  const cls = value > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${cls}`}>
      {value > 0 ? `+${value}` : value}
    </span>
  );
}

/**
 * Dạng bảng gọn (compact table view) — cho đối chiếu số liệu.
 * Sticky first column, expandable rows for details.
 */
function CompactTableView({ voucher, cfg }) {
  const items = voucher.items ?? [];
  const isCount = cfg.layout === 'count';
  const [expanded, setExpanded] = useState({});

  const toggleRow = (idx) => setExpanded((p) => ({ ...p, [idx]: !p[idx] }));

  return (
    <div className="overflow-x-auto rounded-xl border border-hair bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
            <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left min-w-[140px]">Sản phẩm</th>
            <th className="px-3 py-2 text-right whitespace-nowrap">SL</th>
            {isCount && <th className="px-3 py-2 text-right whitespace-nowrap">Thực tế</th>}
            {isCount && <th className="px-3 py-2 text-right whitespace-nowrap">Lệch</th>}
            <th className="px-3 py-2 text-left whitespace-nowrap">Lô</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const isExp = expanded[idx];
            return (
              <tr
                key={idx}
                onClick={() => toggleRow(idx)}
                className="border-t border-slate-100 active:bg-slate-50"
              >
                <td className="sticky left-0 z-10 bg-white px-3 py-2 font-medium text-ink">
                  <div className="truncate max-w-[160px]">{item.productName || item.name}</div>
                  {isExp && (
                    <div className="mt-1 text-xs text-ink-sub">
                      {item.productCode && <div>{item.productCode}</div>}
                      {(item.location || item.locationCode) && <div>Vị trí: {item.location || item.locationCode}</div>}
                      {!isCount && item.unitPrice > 0 && (
                        <div>Đơn giá: {formatCurrency(item.unitPrice)} · Thành tiền: {formatCurrency(item.quantity * item.unitPrice)}</div>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-right mono font-medium whitespace-nowrap">
                  {isCount ? formatNumber(item.systemQty) : formatNumber(item.quantity)}
                </td>
                {isCount && (
                  <td className="px-3 py-2 text-right mono font-medium whitespace-nowrap">
                    {formatNumber(item.countedQty)}
                  </td>
                )}
                {isCount && (
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <DiffBadge value={(item.countedQty ?? 0) - (item.systemQty ?? 0)} />
                  </td>
                )}
                <td className="px-3 py-2 text-left mono text-ink-sub whitespace-nowrap">
                  {item.lot || item.lotCode || '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Component chuyển đổi giữa dạng đồ họa ↔ dạng bảng trên mobile.
 * Dùng chung cho cả 3 loại phiếu (inbound, outbound, stocktake).
 *
 * @param {object} voucher  Bản ghi đã chuẩn hoá qua toVoucher().
 */
export default function VoucherMobileView({ voucher }) {
  const [view, setView] = useState('graphic');

  if (!voucher) return null;

  const cfg = VOUCHER_KINDS[voucher.kind];
  if (!cfg) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* Toggle graphic ↔ table */}
      <div className="flex justify-center">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'graphic', icon: <AppstoreOutlined />, label: 'Đồ họa' },
            { value: 'table', icon: <UnorderedListOutlined />, label: 'Bảng' },
          ]}
          className="min-h-[40px]"
        />
      </div>

      {view === 'graphic' ? (
        <GraphicView voucher={voucher} cfg={cfg} />
      ) : (
        <CompactTableView voucher={voucher} cfg={cfg} />
      )}
    </div>
  );
}
