import { InputNumber } from 'antd';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';

/**
 * Ô nhập số lượng tối ưu cho mobile: nút +/- lớn dễ bấm, bàn phím số.
 * Touch target tối thiểu 44×44px.
 */
export default function MobileQuantityInput({
  value,
  onChange,
  min = 0,
  max,
  disabled,
  step = 1,
}) {
  const handleDecrement = () => {
    const next = Math.max(min, (value ?? 0) - step);
    onChange(next);
  };
  const handleIncrement = () => {
    const next = (value ?? 0) + step;
    onChange(max != null ? Math.min(max, next) : next);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || (value ?? 0) <= min}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-hair bg-slate-50 text-ink transition-colors active:bg-slate-200 disabled:opacity-40"
      >
        <MinusOutlined className="text-base" />
      </button>
      <InputNumber
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        disabled={disabled}
        inputMode="decimal"
        controls={false}
        className="w-full flex-1 text-center [&_input]:!text-center [&_input]:!text-lg [&_input]:!font-bold"
      />
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || (max != null && (value ?? 0) >= max)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-hair bg-slate-50 text-ink transition-colors active:bg-slate-200 disabled:opacity-40"
      >
        <PlusOutlined className="text-base" />
      </button>
    </div>
  );
}
