import { useState, useCallback } from 'react';
import { CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons';

/**
 * Sort thủ công cho 1 cột tại 1 thời điểm (không dùng `sorter` của AntD, vì cột
 * có `sorter` tự thêm icon riêng, chồng lên chỉ báo tự vẽ). Bấm tiêu đề đổi
 * chiều: asc -> desc -> tắt. Dùng chung cho mọi bảng có cột sort được.
 */
export function useColumnSort(defaultField = 'date', defaultOrder = 'desc') {
  const [sortState, setSortState] = useState({ field: defaultField, order: defaultOrder });

  const toggleSort = useCallback((field) => {
    setSortState((prev) => {
      if (prev.field !== field) return { field, order: 'asc' };
      if (prev.order === 'asc') return { field, order: 'desc' };
      return { field: null, order: null };
    });
  }, []);

  const sortableTitle = useCallback((label, field) => {
    const active = sortState.field === field;
    return (
      <span className="inline-flex cursor-pointer select-none items-center gap-2" onClick={() => toggleSort(field)}>
        {label}
        <span className="flex flex-col leading-[10px]">
          <CaretUpOutlined
            className="text-sm"
            style={{
              color: active && sortState.order === 'asc' ? '#1E5AF0' : '#CBD5E1',
              transition: 'color 0.15s ease',
            }}
          />
          <CaretDownOutlined
            className="text-sm"
            style={{
              color: active && sortState.order === 'desc' ? '#1E5AF0' : '#CBD5E1',
              transition: 'color 0.15s ease',
            }}
          />
        </span>
      </span>
    );
  }, [sortState.field, sortState.order, toggleSort]);

  // So sánh tổng quát (hoạt động cho cả số và chuỗi, kể cả ngày dạng 'YYYY-MM-DD').
  const sortRows = useCallback((rows) => {
    if (!sortState.field) return rows;
    const dir = sortState.order === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[sortState.field];
      const bv = b[sortState.field];
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [sortState.field, sortState.order]);

  return { sortState, toggleSort, sortableTitle, sortRows };
}
