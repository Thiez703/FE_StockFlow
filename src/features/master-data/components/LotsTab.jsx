 
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Button, Input, Select, Checkbox, Tooltip, Form, Modal, DatePicker, App } from 'antd';
import { EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { usePermissions } from '@/hooks/usePermissions';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useColumnSort } from '@/hooks/useColumnSort';
import DataTable from '@/components/ui/DataTable';
import TableEmptyState from '@/components/ui/TableEmptyState';
import FadeSection from '@/components/ui/FadeSection';
import DocCode from '@/components/ui/DocCode';
import StatusPill from '@/components/ui/StatusPill';
import { lotApi } from '@/api/lots';
import { productApi } from '@/api/products';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { formatDate, daysUntil } from '@/utils/date';

const LOTS_KEY = ['lots'];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Còn hạn' },
  { value: 'EXPIRED', label: 'Quá hạn' },
  { value: 'INACTIVE', label: 'Ngừng' },
];

function expiryInfo(expDate, expirySoonDays) {
  const d = daysUntil(expDate);
  if (d < 0) return { tone: 'text-red-600', dot: 'bg-red-500', label: `Quá hạn ${Math.abs(d)} ngày` };
  if (d <= expirySoonDays) return { tone: 'text-amber-600', dot: 'bg-amber-500', label: `Còn ${d} ngày` };
  return { tone: 'text-slate-600', dot: 'bg-green-500', label: `Còn ${d} ngày` };
}

export default function LotsTab() {
  const { message } = App.useApp();
  const { canManageMasterData } = usePermissions();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState(null);
  const [nearOnly, setNearOnly] = useState(false);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form] = Form.useForm();
  const { sortableTitle, sortRows } = useColumnSort(null, null);
  const expirySoonDays = useSelector((state) => state.settings.expirySoonDays);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: LOTS_KEY,
    queryFn: lotApi.getAll,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productApi.getAll,
  });

  const productOptions = products.map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` }));

  const closeModal = () => {
    setEditing(null);
    setAdding(false);
  };

  const { mutate: saveLot, isPending: isSaving } = useMutation({
    mutationFn: ({ id, values }) => (id ? lotApi.update(id, values) : lotApi.create(values)),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: LOTS_KEY });
      message.success(id ? 'Đã cập nhật lô hàng' : 'Đã thêm lô hàng');
      closeModal();
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const flatData = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const filtered = rows.filter((l) => {
      const okKw = !kw || [l.lotCode, l.productName].some((v) => String(v ?? '').toLowerCase().includes(kw));
      const okStatus = !status || l.status === status;
      const okNear = !nearOnly || daysUntil(l.expDate) <= expirySoonDays;
      return okKw && okStatus && okNear;
    });
    
    // Sort logic inside groups can just use sortRows, but we'll apply it per group below
    return filtered;
  }, [rows, keyword, status, nearOnly, expirySoonDays]);

  const groupedData = useMemo(() => {
    const map = new Map();
    const productCodeMap = new Map(products.map((p) => [p.id, p.code]));

    for (const lot of flatData) {
      if (!map.has(lot.productId)) {
        map.set(lot.productId, {
          id: lot.productId,
          productCode: productCodeMap.get(lot.productId) || '',
          productName: lot.productName,
          lots: [],
          totalLots: 0,
          activeLots: 0,
          expiredLots: 0,
          nearExpiredLots: 0,
        });
      }
      const group = map.get(lot.productId);
      group.lots.push(lot);
      group.totalLots++;
      const d = daysUntil(lot.expDate);
      if (d < 0) group.expiredLots++;
      else if (d <= expirySoonDays) group.nearExpiredLots++;
      else group.activeLots++;
    }

    const groups = Array.from(map.values());
    
    // Sort lots inside each group (expired first, then sorted by default)
    for (const group of groups) {
      const sorted = sortRows(group.lots);
      const activeLots = [];
      const expiredLots = [];
      for (const lot of sorted) {
        if (daysUntil(lot.expDate) < 0) {
          expiredLots.push(lot);
        } else {
          activeLots.push(lot);
        }
      }
      group.lots = [...expiredLots, ...activeLots];
    }
    
    // Sort groups by productName
    return groups.sort((a, b) => a.productName.localeCompare(b.productName));
  }, [flatData, products, sortRows, expirySoonDays]);

  useEffect(() => {
    if (editing) {
      form.setFieldsValue({
        mfgDate: editing.mfgDate ? dayjs(editing.mfgDate) : null,
        expDate: editing.expDate ? dayjs(editing.expDate) : null,
      });
    } else if (adding) {
      form.resetFields();
    }
  }, [editing, adding, form]);

  const handleOk = async () => {
    const v = await form.validateFields();
    const dates = {
      mfgDate: v.mfgDate?.format('YYYY-MM-DD') ?? null,
      expDate: v.expDate.format('YYYY-MM-DD'),
    };
    saveLot({
      id: editing?.id,
      values: editing ? dates : { productId: v.productId, lotCode: v.lotCode, ...dates },
    });
  };

  const parentColumns = useMemo(() => [
    { 
      title: 'Sản phẩm', 
      dataIndex: 'productName', 
      render: (v, r) => (
        <span className="font-semibold text-ink">
          {r.productCode && <span className="text-slate-400 font-normal mr-2">[{r.productCode}]</span>}
          {v}
        </span>
      ) 
    },
    { 
      title: 'Tổng số lô', 
      dataIndex: 'totalLots', 
      align: 'center', 
      width: 120,
      render: (v) => <span className="font-medium text-slate-600">{v} lô</span>
    },
    ...(!isMobile ? [
      { 
        title: 'Cận hạn', 
        dataIndex: 'nearExpiredLots', 
        align: 'center', 
        width: 120, 
        render: (v) => v > 0 ? <span className="text-amber-600 font-medium">{v} lô</span> : <span className="text-slate-300">—</span> 
      },
      { 
        title: 'Quá hạn', 
        dataIndex: 'expiredLots', 
        align: 'center', 
        width: 120, 
        render: (v) => v > 0 ? <span className="text-red-600 font-medium">{v} lô</span> : <span className="text-slate-300">—</span> 
      },
    ] : []),
  ], [isMobile]);

  const childColumns = useMemo(() => [
    { title: 'Mã lô', dataIndex: 'lotCode', width: 120, fixed: isMobile ? 'left' : undefined, render: (c) => <DocCode>{c}</DocCode> },
    ...(!isMobile ? [{
      title: 'NSX',
      dataIndex: 'mfgDate',
      align: 'center',
      width: 120,
      render: (d) => <span className="mono text-ink-sub">{formatDate(d)}</span>,
    }] : []),
    {
      title: sortableTitle('HSD', 'expDate'),
      dataIndex: 'expDate',
      align: 'center',
      width: isMobile ? 130 : 170,
      render: (d) => {
        const info = expiryInfo(d, expirySoonDays);
        return (
          <div className="flex flex-col items-center justify-center">
            <span className={`inline-flex items-center gap-1.5 mono font-medium ${info.tone}`}>
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${info.dot}`} />
              {formatDate(d)}
            </span>
            <span className={`text-[11px] mt-0.5 leading-none opacity-80 ${info.tone}`}>
              {info.label}
            </span>
          </div>
        );
      },
    },
    {
      title: 'TT',
      dataIndex: 'status',
      align: 'center',
      width: isMobile ? 90 : 130,
      render: (s) => <StatusPill status={s} />,
    },
    ...(!isMobile ? [{
      title: '',
      key: 'action',
      align: 'center',
      width: 56,
      render: (_, r) => (
        <Tooltip title="Sửa ngày sản xuất / hạn dùng">
          <Button
            type="text"
            icon={<EditOutlined />}
            disabled={!canManageMasterData}
            onClick={() => setEditing(r)}
          />
        </Tooltip>
      ),
    }] : []),
  ], [isMobile, canManageMasterData, sortableTitle, expirySoonDays]);

  const expandedRowRender = useMemo(() => (record) => (
    <div className="py-2 pr-2 sm:pr-6 md:pr-10">
      <DataTable
        sticky={false}
        columns={childColumns}
        dataSource={record.lots}
        pagination={false}
        rowKey="id"
        size="small"
        scroll={isMobile ? { x: 520 } : undefined}
        onRow={isMobile && canManageMasterData ? (r) => ({ onClick: () => setEditing(r) }) : undefined}
        rowClassName={(r) => (daysUntil(r.expDate) < 0 ? '!bg-[#fef2f2]' : '')}
        showHeader={true}
        className="m-0 border border-slate-200 rounded-lg overflow-hidden"
      />
    </div>
  ), [childColumns, isMobile, canManageMasterData]);

  const expandableConfig = useMemo(() => ({
    expandedRowRender,
    rowExpandable: (record) => record.lots.length > 0,
  }), [expandedRowRender]);

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Top Filter Bar */}
        <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
            <Input
              allowClear
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="Tìm mã lô, sản phẩm..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full sm:w-64"
            />
            <div className="flex items-center gap-3">
              <Select
                allowClear
                placeholder="Trạng thái"
                className="flex-1 sm:w-48 sm:flex-none"
                options={STATUS_OPTIONS}
                value={status}
                onChange={setStatus}
              />
              <Checkbox checked={nearOnly} onChange={(e) => setNearOnly(e.target.checked)}>
                <span className="text-sm whitespace-nowrap">{isMobile ? 'Cận hạn' : 'Chỉ cận hạn (≤ 30 ngày)'}</span>
              </Checkbox>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 font-medium">
                {groupedData.length} sản phẩm · {flatData.length} lô
              </span>
            </div>
            {canManageMasterData && !isMobile && (
              <Tooltip title={products.length ? '' : 'Cần có ít nhất một sản phẩm trước'}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  disabled={!products.length}
                  onClick={() => setAdding(true)}
                >
                  Thêm lô
                </Button>
              </Tooltip>
            )}
          </div>

          {canManageMasterData && isMobile && (
            <Tooltip title={products.length ? '' : 'Cần có ít nhất một sản phẩm trước'}>
              <Button
                type="primary"
                shape="circle"
                icon={<PlusOutlined />}
                disabled={!products.length}
                size="large"
                className="fixed bottom-20 right-4 z-50 shadow-lg w-12 h-12 flex items-center justify-center bg-blue-600"
                onClick={() => setAdding(true)}
              />
            </Tooltip>
          )}

          <FadeSection dataKey={`table-${groupedData.map((g) => g.id).join(',')}`}>
            <DataTable
              columns={parentColumns}
              dataSource={groupedData}
              loading={isLoading}
              rowKey="id"
              expandable={expandableConfig}
              locale={{ emptyText: <TableEmptyState message="Không tìm thấy dữ liệu phù hợp" /> }}
            />
          </FadeSection>
        </div>
      </div>

      <Modal centered
        open={!!editing || adding}
        title={editing ? `Sửa lô ${editing.lotCode}` : 'Thêm lô hàng'}
        okText={editing ? 'Lưu thay đổi' : 'Thêm mới'}
        cancelText="Huỷ"
        confirmLoading={isSaving}
        onCancel={closeModal}
        onOk={handleOk}
        destroyOnHidden
        maskClosable={false}
      >
        <Form form={form} layout="vertical" requiredMark={false} className="mt-2">
          {editing ? (
            <p className="mb-4 text-sm text-slate-500">
              Sản phẩm: <span className="font-bold text-slate-800">{editing.productName}</span>
            </p>
          ) : (
            <>
              <Form.Item name="productId" label="Sản phẩm" rules={[{ required: true, message: 'Chọn sản phẩm' }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={productOptions}
                  placeholder="Chọn sản phẩm"
                />
              </Form.Item>
            </>
          )}
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item 
              name="mfgDate" 
              label="Ngày sản xuất"
              dependencies={['expDate']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value) return Promise.resolve();
                    if (value.isAfter(dayjs().endOf('day'))) {
                      return Promise.reject(new Error('Không lớn hơn hiện tại'));
                    }
                    const expDate = getFieldValue('expDate');
                    if (expDate && value.isAfter(expDate, 'day')) {
                      return Promise.reject(new Error('Phải trước HSD'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <DatePicker 
                className="w-full" 
                format="DD/MM/YYYY" 
                disabledDate={(current) => {
                  const expDate = form.getFieldValue('expDate');
                  const isAfterExp = expDate ? current && current.isAfter(expDate, 'day') : false;
                  return isAfterExp || (current && current.isAfter(dayjs().endOf('day')));
                }}
              />
            </Form.Item>
            <Form.Item 
              name="expDate" 
              label="Hạn sử dụng" 
              dependencies={['mfgDate']}
              rules={[
                { required: true, message: 'Chọn HSD' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value) return Promise.resolve();
                    if (value.isBefore(dayjs().startOf('day'))) {
                      return Promise.reject(new Error('Không nhỏ hơn hiện tại'));
                    }
                    const mfgDate = getFieldValue('mfgDate');
                    if (mfgDate && value.isBefore(mfgDate, 'day')) {
                      return Promise.reject(new Error('Phải sau NSX'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <DatePicker 
                className="w-full" 
                format="DD/MM/YYYY" 
                disabledDate={(current) => {
                  const mfgDate = form.getFieldValue('mfgDate');
                  const isBeforeMfg = mfgDate ? current && current.isBefore(mfgDate, 'day') : false;
                  return isBeforeMfg || (current && current.isBefore(dayjs().startOf('day')));
                }}
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </>
  );
}
