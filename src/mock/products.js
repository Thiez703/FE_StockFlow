/**
 * Danh mục sản phẩm (bia – nước giải khát). Đơn vị cơ sở là "Lon"/"Chai".
 * `minStock` tính theo đơn vị cơ sở. `categoryId` trỏ tới danh mục (đã chuyển sang API).
 */
const PRODUCTS = [
  { id: 'SP-001', barcode: '8935049500101', sku: 'BIA-SG-LAGER-330', name: 'Bia Saigon Lager lon 330ml', categoryId: 'DM-0101', baseUnit: 'Lon', minStock: 480, status: 'active' },
  { id: 'SP-002', barcode: '8935049500118', sku: 'BIA-SG-SPECIAL-330', name: 'Bia Saigon Special lon 330ml', categoryId: 'DM-0101', baseUnit: 'Lon', minStock: 480, status: 'active' },
  { id: 'SP-003', barcode: '8934563138017', sku: 'BIA-TIGER-BAC-330', name: 'Bia Tiger Bạc lon 330ml', categoryId: 'DM-0101', baseUnit: 'Lon', minStock: 720, status: 'active' },
  { id: 'SP-004', barcode: '8934563100015', sku: 'BIA-TIGER-NAU-330', name: 'Bia Tiger Nâu chai 330ml', categoryId: 'DM-0102', baseUnit: 'Chai', minStock: 240, status: 'active' },
  { id: 'SP-005', barcode: '8934673100029', sku: 'BIA-HEINEKEN-330', name: 'Bia Heineken lon 330ml', categoryId: 'DM-0101', baseUnit: 'Lon', minStock: 600, status: 'active' },
  { id: 'SP-006', barcode: '8934673200019', sku: 'BIA-HEINEKEN-SILVER-330', name: 'Bia Heineken Silver lon 330ml', categoryId: 'DM-0101', baseUnit: 'Lon', minStock: 360, status: 'active' },
  { id: 'SP-007', barcode: '8935049501115', sku: 'BIA-333-330', name: 'Bia 333 lon 330ml', categoryId: 'DM-0101', baseUnit: 'Lon', minStock: 480, status: 'active' },
  { id: 'SP-008', barcode: '8935001700017', sku: 'CC-COKE-330', name: 'Coca-Cola lon 330ml', categoryId: 'DM-0201', baseUnit: 'Lon', minStock: 600, status: 'active' },
  { id: 'SP-009', barcode: '8934588012341', sku: 'PEPSI-330', name: 'Pepsi lon 330ml', categoryId: 'DM-0201', baseUnit: 'Lon', minStock: 600, status: 'active' },
  { id: 'SP-010', barcode: '8935001700123', sku: '7UP-330', name: '7Up lon 330ml', categoryId: 'DM-0202', baseUnit: 'Lon', minStock: 360, status: 'active' },
  { id: 'SP-011', barcode: '8935001700130', sku: 'SPRITE-330', name: 'Sprite lon 330ml', categoryId: 'DM-0202', baseUnit: 'Lon', minStock: 360, status: 'active' },
  { id: 'SP-012', barcode: '8935001700147', sku: 'FANTA-CAM-330', name: 'Fanta Cam lon 330ml', categoryId: 'DM-0202', baseUnit: 'Lon', minStock: 300, status: 'active' },
  { id: 'SP-013', barcode: '8934588063017', sku: 'STING-DAU-330', name: 'Sting Dâu chai 330ml', categoryId: 'DM-03', baseUnit: 'Chai', minStock: 480, status: 'active' },
  { id: 'SP-014', barcode: '9002490100070', sku: 'REDBULL-250', name: 'Red Bull lon 250ml', categoryId: 'DM-03', baseUnit: 'Lon', minStock: 300, status: 'active' },
  { id: 'SP-015', barcode: '8935001265078', sku: 'AQUAFINA-500', name: 'Aquafina 500ml', categoryId: 'DM-04', baseUnit: 'Chai', minStock: 720, status: 'active' },
  { id: 'SP-016', barcode: '8936079120016', sku: 'LAVIE-500', name: 'Lavie 500ml', categoryId: 'DM-04', baseUnit: 'Chai', minStock: 720, status: 'active' },
  { id: 'SP-017', barcode: '8934588123017', sku: 'NUMBER1-330', name: 'Number 1 chai 330ml', categoryId: 'DM-03', baseUnit: 'Chai', minStock: 240, status: 'inactive' },
  { id: 'SP-018', barcode: '8935001712017', sku: 'TEA-PLUS-455', name: 'Trà Ô Long TEA+ chai 455ml', categoryId: 'DM-05', baseUnit: 'Chai', minStock: 240, status: 'active' },
];

export const PRODUCT_OPTIONS = PRODUCTS.filter((p) => p.status === 'active').map((p) => ({
  value: p.id,
  label: p.name,
  unit: p.baseUnit,
  sku: p.sku,
}));

