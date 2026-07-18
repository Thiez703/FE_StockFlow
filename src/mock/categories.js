/**
 * Danh mục hàng hoá — cây cha–con cho doanh nghiệp phân phối bia – nước giải khát.
 * `CATEGORY_TREE`: dạng lồng (children) cho Table tree.
 * `CATEGORIES_FLAT` / `CATEGORY_OPTIONS`: dạng phẳng cho Select, tra cứu tên.
 */
export const CATEGORY_TREE = [
  {
    id: 'DM-01',
    code: 'BIA',
    name: 'Bia',
    parentId: null,
    status: 'active',
    children: [
      { id: 'DM-0101', code: 'BIA-LON', name: 'Bia lon', parentId: 'DM-01', status: 'active' },
      { id: 'DM-0102', code: 'BIA-CHAI', name: 'Bia chai', parentId: 'DM-01', status: 'active' },
    ],
  },
  {
    id: 'DM-02',
    code: 'NGK-GAS',
    name: 'Nước ngọt có gas',
    parentId: null,
    status: 'active',
    children: [
      { id: 'DM-0201', code: 'COLA', name: 'Cola', parentId: 'DM-02', status: 'active' },
      { id: 'DM-0202', code: 'NGK-KHAC', name: 'Có gas khác', parentId: 'DM-02', status: 'active' },
    ],
  },
  {
    id: 'DM-03',
    code: 'TANG-LUC',
    name: 'Nước tăng lực',
    parentId: null,
    status: 'active',
  },
  {
    id: 'DM-04',
    code: 'NUOC-SUOI',
    name: 'Nước suối',
    parentId: null,
    status: 'active',
  },
  {
    id: 'DM-05',
    code: 'TRA',
    name: 'Trà đóng chai',
    parentId: null,
    status: 'inactive',
  },
];

// Làm phẳng cây (giữ cấp độ để hiển thị thụt đầu dòng nếu cần).
export const CATEGORIES_FLAT = CATEGORY_TREE.flatMap((parent) => [
  { id: parent.id, code: parent.code, name: parent.name, parentId: null, status: parent.status },
  ...(parent.children ?? []).map((c) => ({ ...c })),
]);

export const CATEGORY_OPTIONS = CATEGORIES_FLAT.map((c) => ({
  value: c.id,
  label: c.parentId ? `— ${c.name}` : c.name,
}));

export const getCategoryName = (id) =>
  CATEGORIES_FLAT.find((c) => c.id === id)?.name ?? '—';
