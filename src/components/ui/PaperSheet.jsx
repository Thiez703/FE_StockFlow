import { useLayoutEffect, useRef, useState } from 'react';
import { VOUCHER_STAMPS } from '@/constants/voucher';

// Bề ngang cố định của tờ A4 trên màn hình (≈210mm ở 96dpi trừ lề trình duyệt).
const SHEET_WIDTH = 840;

/**
 * Khung "tờ giấy" cho chứng từ. Mọi phiếu (nhập/xuất, xem lại hay đang lập) đều
 * nằm trên component này để có cùng chất giấy: nền ngà, viền mảnh, bóng đổ nhiều
 * lớp gợi tập giấy xếp chồng.
 *
 * Tờ A4 giữ nguyên bề ngang 840px và TỰ THU NHỎ theo tỉ lệ khi khung chứa hẹp
 * hơn (điện thoại, cửa sổ thu nhỏ, modal, người dùng phóng to trình duyệt). Cách
 * này giữ đúng bố cục bản in ở mọi kích thước — thay vì để bảng vật tư nhiều cột
 * đẩy tràn ngang cả trang. Khung ngoài được gán chiều cao đã nhân tỉ lệ để nội
 * dung phía sau không bị chồng lên.
 *
 * @param {'a4'|'fill'} size   'a4' = tờ phiếu đầy đủ, 'fill' = lấp đầy ô cha (thẻ thu nhỏ).
 * @param {boolean} print      Đánh dấu tờ này là tờ được in khi bấm Ctrl/Cmd+P.
 * @param {boolean} stacked    Bóng kiểu chồng nhiều tờ (dùng cho thẻ trong lưới).
 */
export default function PaperSheet({
  size = 'a4',
  print = false,
  stacked = false,
  className = '',
  children,
  ...rest
}) {
  const isA4 = size === 'a4';
  const frameRef = useRef(null);
  const sheetRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [frameHeight, setFrameHeight] = useState(null);

  useLayoutEffect(() => {
    if (!isA4) return undefined;
    const frame = frameRef.current;
    const sheet = sheetRef.current;
    if (!frame || !sheet) return undefined;

    // Transform không làm đổi kích thước layout của tờ giấy, nên vòng đo này
    // không tự kích hoạt lại chính nó.
    const measure = () => {
      const available = frame.clientWidth;
      // Khung đang ẩn (vd tờ dành riêng cho máy in) đo ra 0 — giữ nguyên tỉ lệ 1
      // thay vì thu tờ giấy về 0.
      if (!available) return;
      const next = Math.min(1, available / SHEET_WIDTH);
      setScale(next);
      setFrameHeight(sheet.offsetHeight * next);
    };

    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(sheet);
    measure();
    return () => observer.disconnect();
  }, [isA4]);

  const sheetClass = `paper-doc relative border border-slate-300/70 ${
    stacked ? 'paper-stack' : 'paper-flat'
  } ${
    isA4
      ? 'px-14 py-12 text-[13.5px] leading-[1.6]'
      : 'h-full w-full'
  } ${print ? 'print-sheet' : ''} ${className}`;

  if (!isA4) {
    return (
      <div className={sheetClass} {...rest}>
        {children}
      </div>
    );
  }

  const fitted = scale < 1;

  return (
    <div ref={frameRef} className="w-full" style={frameHeight ? { height: frameHeight } : undefined}>
      <div
        ref={sheetRef}
        className={sheetClass}
        style={{
          width: SHEET_WIDTH,
          transform: fitted ? `scale(${scale})` : undefined,
          transformOrigin: 'top left',
          marginInline: fitted ? 0 : 'auto',
        }}
        {...rest}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Con dấu mực đóng chéo trên mặt phiếu theo trạng thái (đã ghi sổ, chờ duyệt,
 * đã huỷ...). `mix-blend-multiply` để nét dấu ăn vào nền giấy như dấu thật.
 */
export function PaperStamp({ status, caption, size = 'md', className = '' }) {
  const cfg = VOUCHER_STAMPS[status];
  if (!cfg) return null;

  const box =
    size === 'sm'
      ? 'border-[1.5px] px-1.5 py-[3px] text-[7.5px] tracking-[0.12em]'
      : 'border-[3px] px-5 py-2 text-[17px] tracking-[0.22em]';

  return (
    <span
      className={`pointer-events-none absolute select-none ${className}`}
      aria-hidden="true"
    >
      <span
        className={`block -rotate-[13deg] rounded-[3px] border-double text-center font-bold uppercase opacity-[0.72] mix-blend-multiply ${box}`}
        style={{ color: cfg.color, borderColor: cfg.color }}
      >
        <span className="block whitespace-nowrap">{cfg.label}</span>
        {caption && (
          <span
            className={`mt-[2px] block border-t pt-[2px] font-normal tracking-normal ${size === 'sm' ? 'text-[6.5px]' : 'text-[10px]'}`}
            style={{ borderColor: cfg.color }}
          >
            {caption}
          </span>
        )}
      </span>
    </span>
  );
}
