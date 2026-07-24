import { useState } from 'react';
import { Card, Button, Select, InputNumber, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useFormContext, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/date';
import { PRODUCT_OPTIONS } from '@/mock/products';
import { LOTS } from '@/mock/lots';

const DEFAULT_ITEM = { productId: undefined, lotId: undefined, quantity: 1, unitPrice: 0 };

/**
 * Lấy danh sách lô còn active cho sản phẩm đã chọn, format dạng option cho Select.
 */
function getLotOptions(productId) {
  if (!productId) return [];
  return LOTS
    .filter((l) => l.productId === productId && l.status === 'active')
    .map((l) => ({
      value: l.code,
      label: `${l.code} — HSD: ${formatDate(l.expDate)}`,
    }));
}

/**
 * Lấy đơn vị cơ sở của sản phẩm.
 */
function getBaseUnit(productId) {
  if (!productId) return '';
  return PRODUCT_OPTIONS.find((p) => p.value === productId)?.unit ?? '';
}

// Một dòng hàng — useWatch để tính thành tiền theo dòng ngay tại UI.
function ItemRow({ name, index, control, errors, setValue, onRemove, removable }) {
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
  const lotOptions = getLotOptions(productId);
  const baseUnit = getBaseUnit(productId);

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
              options={PRODUCT_OPTIONS}
              status={rowErr?.productId ? 'error' : ''}
              className="w-full"
              onChange={(value) => {
                field.onChange(value);
                // Reset lô khi đổi sản phẩm
                setValue(`${name}.${index}.lotId`, undefined);
              }}
            />
          )}
        />
      </div>

      {/* Lô hàng — FIX 1 */}
      <div className="col-span-12 md:col-span-2">
        <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Lô hàng</span>
        <Controller
          name={`${name}.${index}.lotId`}
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              mode="tags"
              maxCount={1}
              placeholder="Chọn hoặc nhập mã lô..."
              options={lotOptions}
              status={rowErr?.lotId ? 'error' : ''}
              className="w-full"
              disabled={!productId}
              onChange={(values) => {
                // mode="tags" trả về mảng, chỉ lấy phần tử cuối cùng
                const val = values?.length ? values[values.length - 1] : undefined;
                field.onChange(val);
              }}
              value={field.value ? [field.value] : []}
            />
          )}
        />
        {rowErr?.lotId && (
          <p className="m-0 mt-1 text-xs text-rose-500">{rowErr.lotId.message}</p>
        )}
      </div>

      {/* Đơn vị */}
      <div className="col-span-4 md:col-span-1">
        <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Đơn vị</span>
        <span className="flex h-8 items-center text-sm text-ink-sub">{baseUnit || '—'}</span>
      </div>

      {/* Số lượng */}
      <div className="col-span-4 md:col-span-2">
        <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Số lượng</span>
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
      <div className="col-span-8 self-center md:col-span-2 md:text-right">
        <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Thành tiền</span>
        <span className="font-semibold text-ink">{formatCurrency(lineTotal)}</span>
      </div>

      {/* Xoá */}
      <div className="col-span-4 flex justify-end self-center md:col-span-1">
        <Button
          type="text"
          danger
          aria-label="Xóa dòng"
          icon={<DeleteOutlined />}
          disabled={!removable}
          onClick={onRemove}
        />
      </div>
    </div>
  );
}

/**
 * Bảng dòng hàng cho phiếu nhập kho — có cột Lô hàng (Select mode="tags").
 * Lô hàng lọc theo product_id đã chọn, cho phép nhập mã lô mới.
 */
export default function InboundLineItemsTable({ name = 'items', emptyItem = DEFAULT_ITEM, title = 'Danh sách sản phẩm' }) {
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

  return (
    <Card
      title={title}
      className="border-hair"
      styles={{ header: { borderBottom: '1px solid #f1f5f9' }, body: { padding: 0 } }}
      extra={
        <div className="flex items-center gap-2">
          <InputNumber min={1} value={addCount} onChange={(v) => setAddCount(v ?? 1)} className="w-16" />
          <Button type="primary" ghost icon={<PlusOutlined />} onClick={handleAdd}>
            Thêm dòng
          </Button>
        </div>
      }
    >
      <div className="hidden grid-cols-12 gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid">
        <span className="col-span-2">Sản phẩm</span>
        <span className="col-span-2">Lô hàng</span>
        <span className="col-span-1">Đơn vị</span>
        <span className="col-span-2">Số lượng</span>
        <span className="col-span-2">Đơn giá</span>
        <span className="col-span-2 text-right">Thành tiền</span>
        <span className="col-span-1" />
      </div>

      {fields.length === 0 ? (
        <div className="py-10">
          <Empty description="Chưa có sản phẩm nào" />
        </div>
      ) : (
        fields.map((field, index) => (
          <ItemRow
            key={field.id}
            name={name}
            index={index}
            control={control}
            errors={errors}
            setValue={setValue}
            onRemove={() => remove(index)}
            removable={fields.length > 1}
          />
        ))
      )}

      {arrErr && <p className="m-0 px-4 py-3 text-sm text-rose-600">{arrErr}</p>}
    </Card>
  );
}
