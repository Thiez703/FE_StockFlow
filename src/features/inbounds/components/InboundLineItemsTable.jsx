import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { Card, Button, Select, InputNumber, Empty, Popconfirm, Drawer, Modal, Tag, Input, DatePicker } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useFormContext, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/date';
import { useIsMobile } from '@/hooks/useIsMobile';
import MobileQuantityInput from '@/components/ui/MobileQuantityInput';

const DEFAULT_ITEM = {
  productId: undefined,
  isNewLot: false,
  lotCode: '',
  lotId: undefined,
  locationId: undefined,
  mfgDate: undefined,
  expDate: undefined,
  quantity: 1,
  unitPrice: 0,
};

function LocationSelectionGrid({ locationOptions, currentLocationId, currentProductId, currentLotId, isNewMode, inventoryCells = [], onSelect, onClose }) {
  // Map: locationId → Set<productId>
  const locationProductMap = useMemo(() => {
    const map = new Map();
    inventoryCells.forEach(c => {
      if (!map.has(c.locationId)) map.set(c.locationId, new Set());
      map.get(c.locationId).add(c.productId);
    });
    return map;
  }, [inventoryCells]);

  // Map: locationId → Set<lotId>
  const locationLotMap = useMemo(() => {
    const map = new Map();
    inventoryCells.forEach(c => {
      if (!map.has(c.locationId)) map.set(c.locationId, new Set());
      map.get(c.locationId).add(c.lotId);
    });
    return map;
  }, [inventoryCells]);

  // Map: locationId → first matching cell (for existing mode: to get lot info)
  const locationCellMap = useMemo(() => {
    const map = new Map();
    inventoryCells.forEach(c => {
      if (!map.has(c.locationId)) map.set(c.locationId, []);
      map.get(c.locationId).push(c);
    });
    return map;
  }, [inventoryCells]);

  const grouped = {};
  locationOptions.forEach(loc => {
    const zone = loc.zoneCode || 'Khác';
    if (!grouped[zone]) grouped[zone] = [];
    grouped[zone].push(loc);
  });

  const sortedKeys = Object.keys(grouped).sort();

  const legendGreen = isNewMode ? 'Trống (nên chọn)' : 'Cùng SP (chọn được)';

  return (
    <div className="flex flex-col gap-5 p-1 max-h-[60vh] overflow-y-auto pr-2">
      {/* Chú thích */}
      {currentProductId && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded border-2 border-emerald-400 bg-emerald-50" /> {legendGreen}</span>
          {!isNewMode && <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded border-2 border-amber-300 bg-amber-50" /> Trống (không chọn được)</span>}
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded border-2 border-slate-200 bg-slate-100" /> {isNewMode ? 'Có hàng (không chọn được)' : 'Khác SP (không chọn được)'}</span>
        </div>
      )}

      {sortedKeys.map(zone => (
        <div key={zone} className="flex flex-col gap-2.5">
          <div className="text-sm font-bold text-slate-500 border-b-2 border-slate-100 pb-1.5 uppercase tracking-wider">Dãy {zone}</div>
          <div className="grid grid-cols-6 gap-2">
            {grouped[zone].map(loc => {
              const isSelected = loc.value === currentLocationId;
              const productsHere = locationProductMap.get(loc.value);
              const lotsHere = locationLotMap.get(loc.value);
              const cellsHere = locationCellMap.get(loc.value) ?? [];
              const isEmpty = !productsHere || productsHere.size === 0;
              const hasSameProduct = currentProductId && productsHere?.has(currentProductId);

              // Nhập mới: chỉ được chọn ô trống
              // Nhập cũ: chỉ được chọn ô có cùng SP, ô trống không được chọn
              const disabled = isNewMode
                ? (!isEmpty && !!currentProductId)
                : (isEmpty || (currentProductId && !productsHere?.has(currentProductId)));

              let isGreen = isNewMode
                ? (isEmpty && !!currentProductId)
                : !!hasSameProduct;

              // Existing mode: find lot info for cells at this location matching selected product
              const matchingCells = !isNewMode && currentProductId
                ? cellsHere.filter(c => c.productId === currentProductId)
                : [];
              let lotLabel = matchingCells.length > 0
                ? [...new Set(matchingCells.map(c => c.lotCode))].join(', ')
                : '';

              let btnClass = '';
              let statusLabel = '';

              if (isNewMode) {
                if (isEmpty) {
                  isGreen = true;
                  lotLabel = 'Trống';
                } else {
                  lotLabel = 'Có hàng (không chọn được)';
                }
              } else {
                if (matchingCells.length > 0) {
                  isGreen = true;
                  lotLabel = matchingCells[0].lotCode;
                } else if (!isEmpty) {
                  lotLabel = 'Khác sản phẩm';
                } else {
                  lotLabel = 'Trống';
                }
              }

              if (isSelected) {
                btnClass = 'border-royal bg-blue-50 text-royal scale-105 shadow-sm ring-2 ring-royal/20';
                statusLabel = 'Đã chọn';
              } else if (disabled) {
                btnClass = 'border-slate-200 bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed';
                statusLabel = lotLabel || '';
              } else if (isGreen) {
                btnClass = 'border-emerald-400 bg-emerald-50 text-emerald-700 hover:border-emerald-500 hover:bg-emerald-100';
                statusLabel = lotLabel || '';
              } else {
                btnClass = 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50';
                statusLabel = '';
              }

              // Existing mode: on select, pass the first matching cell's lot data
              const handleSelect = () => {
                if (disabled) return;
                if (!isNewMode && matchingCells.length > 0) {
                  const cell = matchingCells[0];
                  onSelect(loc.value, { lotId: cell.lotId, lotCode: cell.lotCode, mfgDate: cell.mfgDate, expDate: cell.expDate });
                } else {
                  onSelect(loc.value, null);
                }
                onClose();
              };

              return (
                <button
                  key={loc.value}
                  type="button"
                  disabled={disabled}
                  onClick={handleSelect}
                  className={`flex flex-col ${!isNewMode && lotLabel ? 'h-16' : 'h-14'} items-center justify-center rounded-xl border-2 transition-all ${btnClass}`}
                >
                  <span className="font-bold text-[13px]">{loc.label}</span>
                  {statusLabel && <span className={`text-[9px] mt-0.5 font-bold uppercase leading-tight text-center ${isSelected ? 'text-royal' : disabled ? (isEmpty && !isNewMode ? 'text-amber-400' : 'text-slate-400') : 'text-emerald-600'}`}>{statusLabel}</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductSelectionList({ productOptions, currentProductId, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = productOptions.filter(p => p.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-3 h-full">
      <Input.Search
        placeholder="Tìm kiếm sản phẩm..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        allowClear
      />
      <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
        {filtered.length === 0 && <div className="text-center py-4 text-slate-400">Không tìm thấy sản phẩm.</div>}
        {filtered.map(p => {
          const isSelected = p.value === currentProductId;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => { onSelect(p.value); onClose(); }}
              className={`flex flex-col rounded-xl border-2 p-3 text-left transition-colors ${
                isSelected ? 'border-royal bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-slate-800">{p.label}</span>
                {isSelected && <span className="text-royal font-bold">✓</span>}
              </div>
              {p.unit && <span className="text-xs text-slate-500 mt-1">ĐVT: {p.unit}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InboundLotSelectionCards({ lots, currentLotId, onSelect, onClose }) {
  if (!lots || lots.length === 0) {
    return <div className="p-4 text-center text-slate-500">Không có lô hàng nào.</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      {lots.map((l) => {
        const selected = l.id === currentLotId;
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => { onSelect(l); onClose(); }}
            className={`flex w-full flex-col gap-1 rounded-xl border-2 p-3 text-left transition-colors active:bg-slate-50 ${
              selected ? 'border-royal bg-blue-50/50' : 'border-hair bg-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="mono text-sm font-bold text-ink">{l.lotCode}</span>
              {selected && <span className="ml-auto text-royal font-bold">✓</span>}
            </div>
            <div className="flex items-center gap-4 text-xs text-ink-sub">
              {l.expDate && (
                <span>HSD: <strong className="text-ink">{formatDate(l.expDate)}</strong></span>
              )}
              {l.mfgDate && (
                <span>NSX: <strong>{formatDate(l.mfgDate)}</strong></span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ItemRow({ name, index, control, errors, setValue, onRemove, removable, productOptions, lotsByProduct, locationOptions, isNewMode, onOpenLotModal, onOpenProductModal, onOpenLocationModal }) {
  const [productId, lotId, lotCode, quantity, unitPrice] = useWatch({
    control,
    name: [
      `${name}.${index}.productId`,
      `${name}.${index}.lotId`,
      `${name}.${index}.lotCode`,
      `${name}.${index}.quantity`,
      `${name}.${index}.unitPrice`,
    ],
  });
  const lineTotal = (Number(quantity) || 0) * (Number(unitPrice) || 0);
  const rowErr = errors?.[name]?.[index];

  const lotOptions = useMemo(() => {
    if (!productId) return [];
    const lots = lotsByProduct.get(productId) ?? [];
    return lots.map((l) => ({
      value: l.lotCode,
      lotId: l.id,
      label: `${l.lotCode}${l.expDate ? ` — HSD: ${formatDate(l.expDate)}` : ''}`,
    }));
  }, [productId, lotsByProduct]);

  const baseUnit = useMemo(() => {
    if (!productId) return '';
    return productOptions.find((p) => p.value === productId)?.unit ?? '';
  }, [productId, productOptions]);

  return (
    <div className="group flex items-start border-b border-slate-100 last:border-b-0 hover:bg-blue-50/30 transition-colors">
      {/* # */}
      <div className="w-11 shrink-0 py-3.5 text-center text-sm font-semibold text-slate-300 group-hover:text-slate-400">
        {index + 1}
      </div>

      {/* Columns */}
      <div className={`grid flex-1 items-start gap-3 py-3 pr-4 ${isNewMode ? 'grid-cols-15' : 'grid-cols-12'}`}>
        {/* Sản phẩm */}
        <div className={`col-span-12 md:${isNewMode ? 'col-span-3' : 'col-span-4'}`}>
          <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Sản phẩm</span>
          <Controller
            name={`${name}.${index}.productId`}
            control={control}
            render={({ field }) => {
              const product = productOptions.find(p => p.value === field.value);
              return (
                <Button
                  type="dashed"
                  onClick={() => onOpenProductModal(index)}
                  className={`w-full text-left flex justify-between min-h-[36px] items-center px-3 ${!field.value ? 'text-slate-400' : 'text-slate-700'} ${rowErr?.productId ? 'border-rose-500' : ''}`}
                >
                  <span className="truncate">{product?.label || 'Chọn sản phẩm...'}</span>
                </Button>
              );
            }}
          />
        </div>

        {/* Vị trí kho */}
        <div className="col-span-12 md:col-span-2">
          <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Vị trí{!isNewMode ? ' & Lô' : ''}</span>
          <Controller
            name={`${name}.${index}.locationId`}
            control={control}
            render={({ field }) => {
              const loc = locationOptions.find(l => l.value === field.value);
              const locDisplay = loc?.label || 'Chọn vị trí...';
              return (
                <Button
                  type="dashed"
                  onClick={() => onOpenLocationModal(index, productId, lotId)}
                  className={`w-full text-left flex justify-between min-h-[36px] items-center px-3 ${!field.value ? 'text-slate-400' : 'text-slate-700'} ${rowErr?.locationId ? 'border-rose-500' : ''}`}
                >
                  <span className="truncate">
                    <span className="font-semibold">{locDisplay}</span>
                    {!isNewMode && lotCode && <span className="text-xs text-slate-400 ml-1">({lotCode})</span>}
                  </span>
                </Button>
              );
            }}
          />
        </div>

        {/* NSX & HSD (chỉ khi tạo lô mới) */}
        {isNewMode && (
          <>
            <div className="col-span-12 md:col-span-2">
              <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">NSX</span>
              <Controller
                name={`${name}.${index}.mfgDate`}
                control={control}
                render={({ field }) => (
                  <DatePicker
                    format="DD/MM/YYYY"
                    placeholder="Ngày SX"
                    className="w-full h-[36px]"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : null)}
                    status={rowErr?.mfgDate ? 'error' : ''}
                  />
                )}
              />
            </div>
            <div className="col-span-12 md:col-span-2">
              <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">HSD</span>
              <Controller
                name={`${name}.${index}.expDate`}
                control={control}
                render={({ field }) => (
                  <DatePicker
                    format="DD/MM/YYYY"
                    placeholder="Ngày HSD"
                    className="w-full h-[36px]"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : null)}
                    status={rowErr?.expDate ? 'error' : ''}
                  />
                )}
              />
            </div>
          </>
        )}

        {/* ĐVT */}
        <div className="col-span-4 md:col-span-1">
          <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">ĐVT</span>
          <span className="flex h-[36px] items-center text-sm text-slate-500">{baseUnit || '—'}</span>
        </div>

        {/* SL */}
        <div className="col-span-4 md:col-span-1">
          <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">SL</span>
          <Controller
            name={`${name}.${index}.quantity`}
            control={control}
            render={({ field }) => (
              <InputNumber {...field} min={1} className="w-full" status={rowErr?.quantity ? 'error' : ''} />
            )}
          />
        </div>

        {/* Đơn giá */}
        <div className="col-span-4 md:col-span-2">
          <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Đơn giá</span>
          <Controller
            name={`${name}.${index}.unitPrice`}
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                min={0}
                step={1000}
                className="w-full"
                status={rowErr?.unitPrice ? 'error' : ''}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                parser={(v) => v?.replace(/\./g, '')}
              />
            )}
          />
        </div>

        {/* Thành tiền */}
        <div className="col-span-8 self-center md:col-span-1 md:text-right">
          <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Thành tiền</span>
          <span className="text-sm font-semibold text-ink">{formatCurrency(lineTotal)}</span>
        </div>

        {/* Xoá */}
        <div className="col-span-4 flex justify-end self-center md:col-span-1">
          {productId ? (
            <Popconfirm
              title="Xóa dòng này?"
              description="Dòng đã có dữ liệu, bạn có chắc chắn muốn xóa?"
              onConfirm={onRemove}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              disabled={!removable}
            >
              <Button
                type="text"
                danger
                aria-label="Xóa dòng"
                icon={<DeleteOutlined />}
                disabled={!removable}
              />
            </Popconfirm>
          ) : (
            <Button
              type="text"
              danger
              aria-label="Xóa dòng"
              icon={<DeleteOutlined />}
              disabled={!removable}
              onClick={onRemove}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function MobileItemRow({ name, index, control, errors, setValue, onRemove, removable, productOptions, lotsByProduct, locationOptions, isNewMode, onOpenLotModal, onOpenProductModal, onOpenLocationModal }) {
  const [productId, lotId, lotCode, quantity, unitPrice] = useWatch({
    control,
    name: [`${name}.${index}.productId`, `${name}.${index}.lotId`, `${name}.${index}.lotCode`, `${name}.${index}.quantity`, `${name}.${index}.unitPrice`],
  });
  const lineTotal = (Number(quantity) || 0) * (Number(unitPrice) || 0);
  const rowErr = errors?.[name]?.[index];

  const lotOptions = useMemo(() => {
    if (!productId) return [];
    const lots = lotsByProduct.get(productId) ?? [];
    return lots.map((l) => ({
      value: l.lotCode,
      lotId: l.id,
      label: `${l.lotCode}${l.expDate ? ` — HSD: ${formatDate(l.expDate)}` : ''}`,
    }));
  }, [productId, lotsByProduct]);

  const baseUnit = useMemo(() => {
    if (!productId) return '';
    return productOptions.find((p) => p.value === productId)?.unit ?? '';
  }, [productId, productOptions]);

  return (
    <div className={`rounded-xl border bg-white p-3 ${productId ? 'border-blue-100 shadow-sm' : 'border-slate-200'}`}>
      {/* Header: # + Xóa */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-bold ${productId ? 'text-blue-400' : 'text-slate-400'}`}>#{index + 1}</span>
        {removable && (
          productId ? (
            <Popconfirm
              title="Xóa dòng này?"
              description="Dòng đã có dữ liệu, bạn có chắc chắn muốn xóa?"
              onConfirm={onRemove}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" danger size="small" icon={<DeleteOutlined />} className="min-h-[36px]">
                Xóa
              </Button>
            </Popconfirm>
          ) : (
            <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={onRemove} className="min-h-[36px]">
              Xóa
            </Button>
          )
        )}
      </div>

      {/* Sản phẩm */}
      <div className="mb-3">
        <span className="mb-1.5 block text-xs font-semibold text-slate-400">Sản phẩm</span>
        <Controller
          name={`${name}.${index}.productId`}
          control={control}
          render={({ field }) => {
            const product = productOptions.find(p => p.value === field.value);
            return (
              <Button
                type="dashed"
                onClick={() => onOpenProductModal(index)}
                className={`w-full text-left flex justify-between min-h-[44px] items-center px-3 ${!field.value ? 'text-slate-400' : 'text-slate-700'} ${rowErr?.productId ? 'border-rose-500' : ''}`}
              >
                <span className="truncate">{product?.label || 'Chọn sản phẩm...'}</span>
              </Button>
            );
          }}
        />
      </div>

      {/* Vị trí & HSD/Lô */}
      {isNewMode ? (
        <>
          <div className="mb-3">
            <span className="mb-1.5 block text-xs font-semibold text-slate-400">Vị trí</span>
            <Controller
              name={`${name}.${index}.locationId`}
              control={control}
              render={({ field }) => {
                const loc = locationOptions.find(l => l.value === field.value);
                return (
                  <Button
                    type="dashed"
                    onClick={() => onOpenLocationModal(index, productId, lotId)}
                    className={`w-full text-left flex justify-between min-h-[44px] items-center px-3 ${!field.value ? 'text-slate-400' : 'text-slate-700'} ${rowErr?.locationId ? 'border-rose-500' : ''}`}
                  >
                    <span className="truncate font-semibold">{loc?.label || 'Chọn vị trí...'}</span>
                  </Button>
                );
              }}
            />
          </div>
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <span className="mb-1.5 block text-xs font-semibold text-slate-400">Ngày SX</span>
              <Controller
                name={`${name}.${index}.mfgDate`}
                control={control}
                render={({ field }) => (
                  <DatePicker
                    format="DD/MM/YYYY"
                    placeholder="Ngày SX"
                    className="w-full h-[44px]"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : null)}
                    status={rowErr?.mfgDate ? 'error' : ''}
                  />
                )}
              />
            </div>
            <div className="flex-1">
              <span className="mb-1.5 block text-xs font-semibold text-slate-400">Hạn sử dụng</span>
              <Controller
                name={`${name}.${index}.expDate`}
                control={control}
                render={({ field }) => (
                  <DatePicker
                    format="DD/MM/YYYY"
                    placeholder="Ngày HSD"
                    className="w-full h-[44px]"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : null)}
                    status={rowErr?.expDate ? 'error' : ''}
                  />
                )}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="mb-3">
          <span className="mb-1.5 block text-xs font-semibold text-slate-400">Vị trí & Lô</span>
          <Controller
            name={`${name}.${index}.locationId`}
            control={control}
            render={({ field }) => {
              const loc = locationOptions.find(l => l.value === field.value);
              const locDisplay = loc?.label || 'Chọn vị trí...';
              return (
                <Button
                  type="dashed"
                  onClick={() => onOpenLocationModal(index, productId, lotId)}
                  className={`w-full text-left flex justify-between min-h-[44px] items-center px-3 ${!field.value ? 'text-slate-400' : 'text-slate-700'} ${rowErr?.locationId ? 'border-rose-500' : ''}`}
                >
                  <span className="truncate">
                    <span className="font-semibold">{locDisplay}</span>
                    {lotCode && <span className="text-xs text-slate-400 ml-1">({lotCode})</span>}
                  </span>
                </Button>
              );
            }}
          />
        </div>
      )}

      {/* Số lượng */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-slate-400">Số lượng {baseUnit && `(${baseUnit})`}</span>
        </div>
        <Controller
          name={`${name}.${index}.quantity`}
          control={control}
          render={({ field }) => (
            <MobileQuantityInput value={field.value} onChange={field.onChange} min={1} />
          )}
        />
      </div>

      {/* Đơn giá + Thành tiền */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <span className="mb-1 block text-xs font-semibold text-slate-400">Đơn giá</span>
          <Controller
            name={`${name}.${index}.unitPrice`}
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                min={0}
                step={1000}
                className="w-full"
                inputMode="decimal"
                status={rowErr?.unitPrice ? 'error' : ''}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                parser={(v) => v?.replace(/\./g, '')}
              />
            )}
          />
        </div>
        <div className="flex-1 text-right">
          <span className="mb-1 block text-xs font-semibold text-slate-400">Thành tiền</span>
          <span className="text-base font-bold text-ink">{formatCurrency(lineTotal)}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Bảng dòng hàng cho phiếu nhập kho — có cột Lô hàng (Select mode="tags")
 * và cột Vị trí kho. Lô hàng lọc theo product_id đã chọn, cho phép nhập mã lô mới.
 * Props: productOptions, lotsByProduct (Map<productId, lot[]>), locationOptions
 */
export default function InboundLineItemsTable({
  name = 'items',
  emptyItem = DEFAULT_ITEM,
  productOptions = [],
  lotsByProduct = new Map(),
  locationOptions = [],
  inventoryCells = [],
  isNewMode = false,
}) {
  const isMobile = useIsMobile();
  const [lotModal, setLotModal] = useState({ open: false, index: null, productId: null });
  const [productModal, setProductModal] = useState({ open: false, index: null });
  const [locationModal, setLocationModal] = useState({ open: false, index: null, productId: null });

  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  const arrErr = errors?.[name]?.message || errors?.[name]?.root?.message;
  const [addCount, setAddCount] = useState(1);

  const items = useWatch({ control, name });
  const totalAmount = (items ?? []).reduce(
    (sum, it) => sum + (Number(it?.quantity) || 0) * (Number(it?.unitPrice) || 0),
    0,
  );

  const handleAdd = () => {
    const count = Number(addCount) || 1;
    append(Array.from({ length: count }, () => ({ ...emptyItem })));
  };

  const RowComponent = isMobile ? MobileItemRow : ItemRow;

  return (
    <>
      <Card
        title={
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <PlusOutlined className="text-sm" />
            </div>
            <span className="text-base font-bold text-slate-800">Sản phẩm nhập</span>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{fields.length} dòng</span>
          </div>
        }
        className="rounded-2xl shadow-sm ring-1 ring-slate-200/60 bg-white overflow-hidden"
        styles={{ header: { borderBottom: '1px solid #e2e8f0', padding: '16px 20px' }, body: { padding: isMobile ? 12 : 0 } }}
        extra={
          <div className="flex items-center gap-2">
            {!isMobile && <InputNumber min={1} value={addCount} onChange={(v) => setAddCount(v ?? 1)} className="w-16" />}
            <Button type="primary" size={isMobile ? 'large' : 'middle'} ghost icon={<PlusOutlined />} onClick={handleAdd} className={isMobile ? 'min-h-[44px]' : ''}>
              Thêm dòng
            </Button>
          </div>
        }
      >
        {/* Desktop header */}
        {!isMobile && (
          <div className="hidden items-center border-b border-slate-100 bg-slate-50/80 md:flex">
            <div className="w-11 shrink-0 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
              #
            </div>
            <div className={`grid flex-1 gap-3 py-3 pr-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 ${isNewMode ? 'grid-cols-15' : 'grid-cols-12'}`}>
              <span className={isNewMode ? 'col-span-3' : 'col-span-4'}>Sản phẩm</span>
              <span className="col-span-2">{isNewMode ? 'Vị trí' : 'Vị trí & Lô'}</span>
              {isNewMode && <span className="col-span-2">Ngày SX</span>}
              {isNewMode && <span className="col-span-2">Hạn sử dụng</span>}
              <span className="col-span-1">ĐVT</span>
              <span className="col-span-1">SL</span>
              <span className="col-span-2">Đơn giá</span>
              <span className="col-span-1 text-right">Thành tiền</span>
              <span className="col-span-1" />
            </div>
          </div>
        )}

        {fields.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3">
            <Empty description={false} />
            <p className="m-0 text-sm text-slate-400">Chưa có sản phẩm nào</p>
            <Button type="primary" ghost icon={<PlusOutlined />} onClick={handleAdd}>
              Thêm sản phẩm đầu tiên
            </Button>
          </div>
        ) : (
          <div className={isMobile ? 'flex flex-col gap-3' : ''}>
            {fields.map((field, index) => (
              <RowComponent
                key={field.id}
                name={name}
                index={index}
                control={control}
                errors={errors}
                setValue={setValue}
                onRemove={() => remove(index)}
                removable={fields.length > 1}
                productOptions={productOptions}
                lotsByProduct={lotsByProduct}
                locationOptions={locationOptions}
                isNewMode={isNewMode}
                onOpenLotModal={(index, productId) => setLotModal({ open: true, index, productId })}
                onOpenProductModal={(index) => setProductModal({ open: true, index })}
                onOpenLocationModal={(index, productId, lotId) => setLocationModal({ open: true, index, productId, lotId })}
              />
            ))}
          </div>
        )}

        {arrErr && <p className="m-0 px-4 py-3 text-sm text-rose-600">{arrErr}</p>}

        {/* Footer total */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
          <span className="text-xs text-slate-400">{fields.length} dòng sản phẩm</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-500">Tổng cộng:</span>
            <span className="text-lg font-black text-blue-600">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        {/* Modal/Drawer chọn lô */}
        {lotModal.open && (
          isMobile ? (
            <Drawer
              open={lotModal.open}
              onClose={() => setLotModal({ open: false, index: null, productId: null })}
              placement="bottom"
              height="70vh"
              title={<span className="text-base font-bold text-ink">Chọn lô hàng</span>}
              styles={{ body: { padding: '8px 16px 16px' } }}
              className="rounded-t-2xl"
            >
              <InboundLotSelectionCards
                lots={lotModal.productId ? lotsByProduct.get(lotModal.productId) : []}
                currentLotId={fields[lotModal.index]?.lotId}
                onSelect={(lot) => {
                  setValue(`${name}.${lotModal.index}.lotCode`, lot.lotCode);
                  setValue(`${name}.${lotModal.index}.lotId`, lot.id);
                }}
                onClose={() => setLotModal({ open: false, index: null, productId: null })}
              />
            </Drawer>
          ) : (
            <Modal
              open={lotModal.open}
              onCancel={() => setLotModal({ open: false, index: null, productId: null })}
              title={<span className="text-lg font-bold text-slate-800">Chọn lô hàng</span>}
              footer={null}
              width={500}
              centered
            >
              <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
                <InboundLotSelectionCards
                  lots={lotModal.productId ? lotsByProduct.get(lotModal.productId) : []}
                  currentLotId={fields[lotModal.index]?.lotId}
                  onSelect={(lot) => {
                    setValue(`${name}.${lotModal.index}.lotCode`, lot.lotCode);
                    setValue(`${name}.${lotModal.index}.lotId`, lot.id);
                  }}
                  onClose={() => setLotModal({ open: false, index: null, productId: null })}
                />
              </div>
            </Modal>
          )
        )}

        {/* Modal/Drawer chọn sản phẩm */}
        {productModal.open && (
          isMobile ? (
            <Drawer
              open={productModal.open}
              onClose={() => setProductModal({ open: false, index: null })}
              placement="bottom"
              height="80vh"
              title={<span className="text-base font-bold text-ink">Chọn sản phẩm</span>}
              styles={{ body: { padding: '16px' } }}
              className="rounded-t-2xl"
            >
              <ProductSelectionList
                productOptions={productOptions}
                currentProductId={fields[productModal.index]?.productId}
                onSelect={(pid) => {
                  setValue(`${name}.${productModal.index}.productId`, pid);
                  setValue(`${name}.${productModal.index}.lotCode`, '');
                  setValue(`${name}.${productModal.index}.lotId`, undefined);
                  if (!isNewMode) {
                    setValue(`${name}.${productModal.index}.locationId`, undefined);
                  }
                }}
                onClose={() => setProductModal({ open: false, index: null })}
              />
            </Drawer>
          ) : (
            <Modal
              open={productModal.open}
              onCancel={() => setProductModal({ open: false, index: null })}
              title={<span className="text-lg font-bold text-slate-800">Chọn sản phẩm</span>}
              footer={null}
              width={500}
              centered
            >
              <div className="mt-4">
                <ProductSelectionList
                  productOptions={productOptions}
                  currentProductId={fields[productModal.index]?.productId}
                  onSelect={(pid) => {
                    setValue(`${name}.${productModal.index}.productId`, pid);
                    setValue(`${name}.${productModal.index}.lotCode`, '');
                    setValue(`${name}.${productModal.index}.lotId`, undefined);
                    if (!isNewMode) {
                      setValue(`${name}.${productModal.index}.locationId`, undefined);
                    }
                  }}
                  onClose={() => setProductModal({ open: false, index: null })}
                />
              </div>
            </Modal>
          )
        )}

        {/* Modal/Drawer chọn vị trí */}
        {locationModal.open && (
          isMobile ? (
            <Drawer
              open={locationModal.open}
              onClose={() => setLocationModal({ open: false, index: null, productId: null, lotId: null })}
              placement="bottom"
              height="80vh"
              title={<span className="text-base font-bold text-ink">Chọn vị trí kho</span>}
              styles={{ body: { padding: '8px 16px 16px' } }}
              className="rounded-t-2xl"
            >
              <LocationSelectionGrid
                locationOptions={locationOptions}
                currentLocationId={fields[locationModal.index]?.locationId}
                currentProductId={locationModal.productId}
                currentLotId={locationModal.lotId}
                isNewMode={isNewMode}
                inventoryCells={inventoryCells}
                onSelect={(locId, cellData) => {
                  setValue(`${name}.${locationModal.index}.locationId`, locId);
                  if (cellData) {
                    setValue(`${name}.${locationModal.index}.lotId`, cellData.lotId);
                    setValue(`${name}.${locationModal.index}.lotCode`, cellData.lotCode);
                    if (cellData.mfgDate) setValue(`${name}.${locationModal.index}.mfgDate`, cellData.mfgDate);
                    if (cellData.expDate) setValue(`${name}.${locationModal.index}.expDate`, cellData.expDate);
                  }
                }}
                onClose={() => setLocationModal({ open: false, index: null, productId: null, lotId: null })}
              />
            </Drawer>
          ) : (
            <Modal
              open={locationModal.open}
              onCancel={() => setLocationModal({ open: false, index: null, productId: null, lotId: null })}
              title={<span className="text-lg font-bold text-slate-800">Chọn vị trí kho</span>}
              footer={null}
              width={700}
              centered
            >
              <div className="mt-4">
                <LocationSelectionGrid
                  locationOptions={locationOptions}
                  currentLocationId={fields[locationModal.index]?.locationId}
                  currentProductId={locationModal.productId}
                  currentLotId={locationModal.lotId}
                  isNewMode={isNewMode}
                  inventoryCells={inventoryCells}
                  onSelect={(locId, cellData) => {
                    setValue(`${name}.${locationModal.index}.locationId`, locId);
                    if (cellData) {
                      setValue(`${name}.${locationModal.index}.lotId`, cellData.lotId);
                      setValue(`${name}.${locationModal.index}.lotCode`, cellData.lotCode);
                      if (cellData.mfgDate) setValue(`${name}.${locationModal.index}.mfgDate`, cellData.mfgDate);
                      if (cellData.expDate) setValue(`${name}.${locationModal.index}.expDate`, cellData.expDate);
                    }
                  }}
                  onClose={() => setLocationModal({ open: false, index: null, productId: null, lotId: null })}
                />
              </div>
            </Modal>
          )
        )}
      </Card>
    </>
  );
}
