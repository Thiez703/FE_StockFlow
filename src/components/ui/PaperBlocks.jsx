import InkSignature from '@/components/ui/InkSignature';
import { COMPANY } from '@/constants/voucher';
import { readMoneyVi } from '@/utils/numberToWords';
import { dateParts } from '@/utils/date';

/**
 * Các mảnh cấu thành mặt phiếu giấy, dùng chung cho phiếu đã lập (chỉ xem) và
 * màn hình đang lập phiếu (có ô nhập). Nhờ vậy tờ phiếu lúc điền và lúc in ra
 * là cùng một bố cục.
 */

/** Góc trên: đơn vị chủ quản bên trái — số hiệu mẫu biểu bên phải. */
export function PaperHeader({ formNo, formNote }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 text-[12px] leading-snug">
      <div className="min-w-0">
        <div className="font-bold uppercase">{COMPANY.name}</div>
        <div>{COMPANY.dept}</div>
        <div className="italic text-slate-600">{COMPANY.address}</div>
      </div>
      <div className="max-w-[240px] text-right">
        <div className="font-bold">{formNo}</div>
        <div className="text-[10.5px] italic leading-tight text-slate-600">({formNote})</div>
      </div>
    </div>
  );
}

/**
 * Khối tiêu đề: tên phiếu + dòng "Ngày ... tháng ... năm ...", bên phải là
 * Số phiếu / tài khoản Nợ / Có.
 *
 * `dateSlot` cho phép màn hình lập phiếu chèn ô chọn ngày vào đúng vị trí.
 */
export function PaperTitle({ title, date, dateSlot, code, codeSlot, debit, credit }) {
  const { day, month, year } = dateParts(date);

  return (
    <div className="relative mt-7">
      <div className="text-center">
        <h2 className="m-0 text-[26px] font-bold uppercase tracking-[0.06em]">{title}</h2>
        <div className="mt-1.5 text-[13px] italic">
          {dateSlot ?? (
            <span>
              Ngày {day} tháng {month} năm {year}
            </span>
          )}
        </div>
      </div>

      {/* Biên bản (05-VT, biểu mẫu nội bộ) không có ô Số / Nợ / Có ở đầu tờ —
          bỏ hẳn khối này để tiêu đề dài không bị đè lên. */}
      {(code || codeSlot) && (
        <div className="absolute right-0 top-1 text-[12.5px]">
          <div className="flex items-baseline gap-1.5">
            <span>Số:</span>
            {codeSlot ?? <span className="font-bold">{code}</span>}
          </div>
          {debit && (
            <div className="mt-0.5">
              <span>Nợ:</span> <span className="font-medium">{debit}</span>
            </div>
          )}
          {credit && (
            <div className="mt-0.5">
              <span>Có:</span> <span className="font-medium">{credit}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Một dòng thông tin trên phiếu: nhãn + phần điền nằm trên dòng kẻ chấm.
 * Truyền `children` (ô nhập) khi đang lập phiếu, `value` khi chỉ xem.
 */
export function DocField({ label, value, children, error, className = '', dash = true }) {
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      {dash && <span className="shrink-0">-</span>}
      <span className="shrink-0">{label}:</span>
      <span
        className={`min-w-0 flex-1 pb-[2px] ${error ? 'doc-dotted-error' : 'doc-dotted'} ${children ? '' : 'truncate'}`}
      >
        {children ?? (value || ' ')}
      </span>
    </div>
  );
}

/** Dòng "Tổng số tiền (viết bằng chữ)" — bắt buộc có trên phiếu in. */
export function AmountInWords({ amount, className = '' }) {
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      <span className="shrink-0">- Tổng số tiền (viết bằng chữ):</span>
      <span className="doc-dotted min-w-0 flex-1 pb-[2px] italic">{readMoneyVi(amount)}</span>
    </div>
  );
}

/**
 * Chân phiếu: dòng ngày ký bên phải + hàng ô chữ ký. Người lập phiếu đã ký sẵn
 * (nét ký sinh từ tên), các ô còn lại để trống chờ ký như phiếu giấy.
 */
export function SignatureRow({ signers, date, signedBy }) {
  const { day, month, year } = dateParts(date);

  return (
    <div className="mt-6">
      <div className="text-right text-[12.5px] italic">
        Ngày {day} tháng {month} năm {year}
      </div>

      <div className="mt-2 grid grid-cols-4 gap-x-4 gap-y-6 text-center text-[12.5px]">
        {signers.map((role, i) => (
          <div key={role}>
            <div className="font-bold uppercase">{role}</div>
            <div className="text-[11px] italic text-slate-600">(Ký, họ tên)</div>
            <div className="flex h-[46px] items-center justify-center">
              {i === 0 && signedBy && <InkSignature name={signedBy} width={104} height={36} />}
            </div>
            <div className="font-medium">{i === 0 ? signedBy : ' '}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
