import { useEffect, useState } from 'react';

/**
 * Hoãn việc cập nhật giá trị cho tới khi người dùng ngừng gõ `delay` ms.
 * Dùng cho các ô tìm kiếm gọi API — tránh bắn một request mỗi ký tự.
 */
export function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
