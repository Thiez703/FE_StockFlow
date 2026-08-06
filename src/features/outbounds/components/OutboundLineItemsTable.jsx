import { useState } from 'react';
import { Card, Button, Select, InputNumber, Input, Tag, Empty, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useFormContext, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/date';
import { PRODUCT_OPTIONS } from '@/mock/products';
import { LOTS } from '@/mock/lots';

const DEFAULT_ITEM = { productId: undefined, lotId: undefined, overrideReason: '', quantity: 1, unitPrice: 0 };

function getFefoLot(productId) {
  if (!productId) return null;
  return LOTS
    .filter((l) => l.productId === productId && l.status === 'active')
    .sort((a, b) => a.expDate.localeCompare(b.expDate))[0] ?? null;
}

function getLotOptions(productId, fefoLotCode) {
  if (!productId) return [];
  return LOTS
    .filter((l) => l.productId === productId && l.status === 'active')
    .sort((a, b) => a.expDate.localeCompare(b.expDate))
    .map((l) => ({
      value: l.code,
      label: (
        <span className="flex items-center gap-1.5">
          {l.code} — HSD: {formatDate(l.expDate)}
          {fefoLotCode && l.code === fefoLotCode && (
            <Tag color="green" className="!ml-1 !mr-0 !text-[10px] !leading-none !px-1.5 !py-0.5">FEFO</Tag>
          )}
        </span>
      ),
    }));
}

function getBaseUnit(productId) {
  if (!productId) return '';
  return PRODUCT_OPTIONS.find((p) => p.value === productId)?.unit ?? '';
}

/**
 * @param {boolean} useFEFO – true: gợi ý lô FEFO + override reason (RETAIL), false: chọn lô tự do
 */
function ItemRow({ name, index, control, errors, setValue, onRemove, removable, useFEFO }) {
  const [productId, lotId, overrideReason, quantity, unitPrice] = useWatch({
    control,
    name: [
      `${name}.${index}.productId`,
      `${name}.${index}.lotId`,
      `${name}.${index}.overrideReason`,
      `${name}.${index}.quantity`,
      `${name}.${index}.unitPrice`,
    ],
  });
  const lineTotal = (Number(quantity) || 0) * (Number(unitPrice) || 0);
  const rowErr = errors?.[name]?.[index];

  const fefoLot = useFEFO ? getFefoLot(productId) : null;
  const fefoLotCode = fefoLot?.code;
  const lotOptions = getLotOptions(productId, useFEFO ? fefoLotCode : null);
  const baseUnit = getBaseUnit(productId);

  const isOverride = useFEFO && lotId && fefoLotCode && lotId !== fefoLotCode;
  const overrideErr = isOverride && (!overrideReason || !overrideReason.trim());

  return (
    <div className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
      <div className="grid grid-cols-12 items-start gap-3 px-4 py-3">
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
                  if (useFEFO) {
                    const newFefo = getFefoLot(value);
                    setValue(`${name}.${index}.lotId`, newFefo?.code ?? undefined);
                  } else {
                    setValue(`${name}.${index}.lotId`, undefined);
                  }
                  setValue(`${name}.${index}.overrideReason`, '');
                }}
              />
            )}
          />
        </div>

        {/* Lô hàng */}
        <div className="col-span-12 md:col-span-2">
          <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Lô hàng</span>
          <Controller
            name={`${name}.${index}.lotId`}
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Chọn lô hàng"
                options={lotOptions}
                status={rowErr?.lotId ? 'error' : ''}
                className="w-full"
                disabled={!productId}
                onChange={(value) => {
                  field.onChange(value);
                  if (useFEFO && value === fefoLotCode) {
                    setValue(`${name}.${index}.overrideReason`, '');
                  }
                }}
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

      {/* Ô lý do override FEFO — chỉ hiện khi FEFO mode + chọn lô khác */}
      {isOverride && (
        <div className="mx-4 mb-3 rounded-lg border border-amber/30 bg-amber/5 p-3">
          <Controller
            name={`${name}.${index}.overrideReason`}
            control={control}
            render={({ field }) => (
              <>
                <label className="mb-1.5 block text-xs font-semibold text-amber-700">
                  Lý do chọn lô khác <span className="text-rose-500">*</span>
                </label>
                <Input.TextArea
                  {...field}
                  rows={2}
                  placeholder="VD: Lô FEFO đã tách riêng cho đơn khác..."
                  status={overrideErr ? 'error' : ''}
                />
                {overrideErr && (
                  <p className="m-0 mt-1 text-xs text-rose-500">
                    Bắt buộc nhập lý do khi chọn lô khác lô FEFO
                  </p>
                )}
              </>
            )}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Bảng dòng hàng cho phiếu xuất kho.
 * @param {boolean} useFEFO – true cho RETAIL (gợi ý FEFO), false cho RETURN_SUPPLIER / DISPOSAL
 */
export default function OutboundLineItemsTable({ name = 'items', emptyItem = DEFAULT_ITEM, title = 'Danh sách sản phẩm', useFEFO = true }) {
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
      className="border-hair [&_.ant-card-head-title]:!whitespace-normal [&_.ant-card-head-wrapper]:flex-wrap [&_.ant-card-head-wrapper]:gap-y-2"
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
            useFEFO={useFEFO}
          />
        ))
      )}

      {arrErr && <p className="m-0 px-4 py-3 text-sm text-rose-600">{arrErr}</p>}
    </Card>
  );
}
