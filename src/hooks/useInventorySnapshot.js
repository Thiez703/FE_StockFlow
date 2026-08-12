import { useQuery } from '@tanstack/react-query';
import { stocktakeApi } from '@/api/stocktakes';
import { DEFAULT_WAREHOUSE_ID } from '@/constants/warehouse';

/**
 * Ảnh chụp tồn kho theo từng ô vị trí, đã lọc bỏ ô trống.
 *
 * Dùng chung cho hai màn hình lập biên bản (kiểm kê và hàng bất thường): cả hai
 * đều phải chọn đúng cặp (lô, vị trí) đang thực sự có hàng, vì backend nhận
 * `lotId` + `locationId` chứ không nhận `productId`.
 *
 * Endpoint nằm dưới /stocktakes nhưng bản chất là dữ liệu tồn kho, không phải
 * dữ liệu của riêng phiếu kiểm kê.
 *
 * Backend giới hạn endpoint này cho MANAGER / ACCOUNTANT / STAFF — ADMIN gọi sẽ
 * nhận 403. Truyền `enabled: false` để khỏi bắn request chắc chắn hỏng.
 */
export function useInventorySnapshot(warehouseId = DEFAULT_WAREHOUSE_ID, { enabled = true } = {}) {
  const query = useQuery({
    queryKey: ['inventory-snapshot', warehouseId],
    queryFn: () => stocktakeApi.getInventorySnapshot(warehouseId),
    enabled,
    // Số tồn đổi liên tục — luôn lấy bản mới khi mở màn hình lập phiếu.
    staleTime: 0,
  });

  let raw = [];
  if (Array.isArray(query.data)) raw = query.data;
  else if (query.data?.content && Array.isArray(query.data.content)) raw = query.data.content;
  else if (query.data?.data && Array.isArray(query.data.data)) raw = query.data.data;

  // `key` = cặp lô + vị trí, đủ để định danh một dòng nhập liệu.
  const cells = raw
    .filter((c) => c.lotId != null && c.locationId != null)
    .map((c) => ({ ...c, key: `${c.lotId}-${c.locationId}` }));

  return { ...query, cells };
}
