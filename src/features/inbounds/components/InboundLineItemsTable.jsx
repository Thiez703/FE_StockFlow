import { useState, useMemo } from 'react';
import { Card, Button, Select, InputNumber, Empty, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useFormContext, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/date';
import { useIsMobile } from '@/hooks/useIsMobile';
import MobileQuantityInput from '@/components/ui/MobileQuantityInput';

const DEFAULT_ITEM = {
  productId: undefined,
  lotCode: '',
  lotId: undefined,
  locationId: undefined,
  mfgDate: undefined,
  expDate: undefined,
  quantity: 1,
  unitPrice: 0,
};

function ItemRow({ name, index, control, errors, setValue, onRemove, removable, productOptions, lotsByProduct, locationOptions }) {
  const [productId, quantity, unitPrice] = useWatch({
    control,
    name: [
      `${name}.${index}.productId`,
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
    <div className="grid grid-cols-12 items-start gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50/60">
      {/* Sản phẩm */}
      <div className="col-span-12 md:col-span-2">
        <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Sản phẩm</span>
        <Controller
          name={`${name}.${index}.productId`}
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              showSearch
              optionFilterProp="label"
              placeholder="Chọn sản phẩm"
              options={productOptions}
              status={rowErr?.productId ? 'error' : ''}
              className="w-full"
              onChange={(value) => {
                field.onChange(value);
                setValue(`${name}.${index}.lotCode`, '');
                setValue(`${name}.${index}.lotId`, undefined);
              }}
            />
          )}
        />
      </div>

      {/* Lô hàng */}
      <div className="col-span-12 md:col-span-2">
        <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Lô hàng</span>
        <Controller
          name={`${name}.${index}.lotCode`}
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              mode="tags"
              maxCount={1}
              placeholder="Chọn hoặc nhập mã lô..."
              options={lotOptions}
              status={rowErr?.lotCode ? 'error' : ''}
              className="w-full"
              disabled={!productId}
              onChange={(values) => {
                const val = values?.length ? values[values.length - 1] : '';
                field.onChange(val);
                const existingLot = lotOptions.find((o) => o.value === val);
                setValue(`${name}.${index}.lotId`, existingLot?.lotId ?? null);
              }}
              value={field.value ? [field.value] : []}
            />
          )}
        />
        {rowErr?.lotCode && (
          <p className="m-0 mt-1 text-xs text-rose-500">{rowErr.lotCode.message}</p>
        )}
      </div>

      {/* Vị trí kho */}
      <div className="col-span-12 md:col-span-2">
        <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Vị trí</span>
        <Controller
          name={`${name}.${index}.locationId`}
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              showSearch
              optionFilterProp="label"
              placeholder="Chọn vị trí"
              options={locationOptions}
              status={rowErr?.locationId ? 'error' : ''}
              className="w-full"
            />
          )}
        />
      </div>

      {/* Đơn vị */}
      <div className="col-span-4 md:col-span-1">
        <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Đơn vị</span>
        <span className="flex h-8 items-center text-sm text-ink-sub">{baseUnit || '—'}</span>
      </div>

      {/* Số lượng */}
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
        <span className="font-semibold text-ink">{formatCurrency(lineTotal)}</span>
      </div>

      {/* Xoá */}
      <div className="col-span-4 flex justify-end self-center md:col-span-1">
        <Popconfirm
          title="Xóa dòng này?"
          description="Bạn có chắc chắn muốn xóa dòng sản phẩm này?"
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
      </div>
    </div>
  );
}

function MobileItemRow({ name, index, control, errors, setValue, onRemove, removable, productOptions, lotsByProduct, locationOptions }) {
  const [productId, quantity, unitPrice] = useWatch({
    control,
    name: [`${name}.${index}.productId`, `${name}.${index}.quantity`, `${name}.${index}.unitPrice`],
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
    <div className="rounded-xl border border-hair bg-white p-3">
      {/* Sản phẩm */}
      <div className="mb-3">
        <span className="mb-1.5 block text-xs font-semibold text-slate-400">Sản phẩm</span>
        <Controller
          name={`${name}.${index}.productId`}
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              showSearch
              optionFilterProp="label"
              placeholder="Tìm và chọn sản phẩm..."
              options={productOptions}
              status={rowErr?.productId ? 'error' : ''}
              className="w-full"
              onChange={(value) => {
                field.onChange(value);
                setValue(`${name}.${index}.lotCode`, '');
                setValue(`${name}.${index}.lotId`, undefined);
              }}
            />
          )}
        />
      </div>

      {/* Lô + Vị trí */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-400">Lô hàng</span>
          <Controller
            name={`${name}.${index}.lotCode`}
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                mode="tags"
                maxCount={1}
                placeholder="Chọn/nhập lô"
                options={lotOptions}
                status={rowErr?.lotCode ? 'error' : ''}
                className="w-full"
                disabled={!productId}
                onChange={(values) => {
                  const val = values?.length ? values[values.length - 1] : '';
                  field.onChange(val);
                  const existingLot = lotOptions.find((o) => o.value === val);
                  setValue(`${name}.${index}.lotId`, existingLot?.lotId ?? null);
                }}
                value={field.value ? [field.value] : []}
              />
            )}
          />
          {rowErr?.lotCode && <p className="m-0 mt-1 text-xs text-rose-500">{rowErr.lotCode.message}</p>}
        </div>
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-400">Vị trí</span>
          <Controller
            name={`${name}.${index}.locationId`}
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                showSearch
                optionFilterProp="label"
                placeholder="Chọn vị trí"
                options={locationOptions}
                status={rowErr?.locationId ? 'error' : ''}
                className="w-full"
              />
            )}
          />
        </div>
      </div>

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

      {/* Xóa */}
      {removable && (
        <div className="mt-3 flex justify-end">
          <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={onRemove} className="min-h-[44px]">
            Xóa dòng
          </Button>
        </div>
      )}
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
  title = 'Danh sách sản phẩm',
  productOptions = [],
  lotsByProduct = new Map(),
  locationOptions = [],
}) {
  const isMobile = useIsMobile();
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  const arrErr = errors?.[name]?.message || errors?.[name]?.root?.message;
  const [addCount, setAddCount] = useState(1);

  const handleAdd = () => {
    const count = Number(addCount) || 1;
    append(Array.from({ length: count }, () => ({ ...emptyItem })));
  };

  const RowComponent = isMobile ? MobileItemRow : ItemRow;

  return (
    <Card
      title={title}
      className="border-hair [&_.ant-card-head-title]:!whitespace-normal [&_.ant-card-head-wrapper]:flex-wrap [&_.ant-card-head-wrapper]:gap-y-2"
      styles={{ header: { borderBottom: '1px solid #f1f5f9' }, body: { padding: isMobile ? 12 : 0 } }}
      extra={
        <div className="flex items-center gap-2">
          {!isMobile && <InputNumber min={1} value={addCount} onChange={(v) => setAddCount(v ?? 1)} className="w-16" />}
          <Button type="primary" ghost icon={<PlusOutlined />} onClick={handleAdd} className={isMobile ? 'min-h-[44px]' : ''}>
            Thêm dòng
          </Button>
        </div>
      }
    >
      {/* Desktop header */}
      {!isMobile && (
        <div className="hidden grid-cols-12 gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid">
          <span className="col-span-2">Sản phẩm</span>
          <span className="col-span-2">Lô hàng</span>
          <span className="col-span-2">Vị trí</span>
          <span className="col-span-1">ĐVT</span>
          <span className="col-span-1">SL</span>
          <span className="col-span-2">Đơn giá</span>
          <span className="col-span-1 text-right">Thành tiền</span>
          <span className="col-span-1" />
        </div>
      )}

      {fields.length === 0 ? (
        <div className="py-10">
          <Empty description="Chưa có sản phẩm nào" />
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
            />
          ))}
        </div>
      )}

      {arrErr && <p className="m-0 px-4 py-3 text-sm text-rose-600">{arrErr}</p>}
    </Card>
  );
}
