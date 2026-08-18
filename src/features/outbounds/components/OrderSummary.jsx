import { Card } from 'antd';
import { CalculatorOutlined } from '@ant-design/icons';
import { formatCurrency, formatNumber } from '@/utils/formatCurrency';

/** Thẻ tóm tắt bên phải màn hình lập phiếu. Chỉ đếm dòng đã chọn được vị trí. */
export default function OrderSummary({ rows = [], theme }) {
  const filled = rows.filter((r) => r.cellKey);
  const totalQty = filled.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
  const totalAmount = filled.reduce(
    (s, r) => s + (Number(r.quantity) || 0) * (Number(r.unitPrice) || 0),
    0,
  );

  const bgClass = theme?.bg || 'bg-amber-50';
  const textIconClass = theme?.textIcon || 'text-amber-600';

  return (
    <div className={`rounded-2xl shadow-sm bg-gradient-to-b from-white to-slate-50/50 p-6 h-full border-t-4 ${theme?.border || 'border-t-amber-500'} flex flex-col`}>
      <div className="flex items-center gap-2.5 mb-5">
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${bgClass} ${textIconClass}`}>
          <CalculatorOutlined className="text-base" />
        </div>
        <h3 className="m-0 text-base font-bold text-slate-800 tracking-wide">Tổng kết phiếu</h3>
      </div>
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between text-[14px]">
          <span className="text-slate-500 font-medium">Số dòng hàng</span>
          <span className="font-semibold text-slate-700">{filled.length} dòng</span>
        </div>
        <div className="flex items-center justify-between text-[14px]">
          <span className="text-slate-500 font-medium">Tổng số lượng</span>
          <span className="font-semibold text-slate-700">{formatNumber(totalQty)} thùng</span>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-dashed border-slate-200 pt-5">
        <span className="text-[14px] font-bold text-slate-500 uppercase tracking-wider">Tổng giá trị</span>
        <span className={`text-[22px] font-black ${textIconClass}`}>{formatCurrency(totalAmount)}</span>
      </div>
    </div>
  );
}
