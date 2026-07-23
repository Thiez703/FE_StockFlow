import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Input, Select, Checkbox, Tooltip, Form, Modal, InputNumber, DatePicker, App } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { usePermissions } from '@/hooks/usePermissions';
import { useColumnSort } from '@/hooks/useColumnSort';
import DataTable from '@/components/ui/DataTable';
import FilterSidebar from '@/components/ui/FilterSidebar';
import TableEmptyState from '@/components/ui/TableEmptyState';
import DocCode from '@/components/ui/DocCode';
import StatusPill from '@/components/ui/StatusPill';
import { LOTS } from '@/mock/lots';
import { PRODUCT_OPTIONS } from '@/mock/products';
import { LOCATION_OPTIONS } from '@/mock/locations';
import { formatDate, daysUntil } from '@/utils/date';
import { formatNumber } from '@/utils/formatCurrency';

// Phân loại tình trạng hạn dùng theo số ngày còn lại.
function expiryInfo(expDate) {
  const d = daysUntil(expDate);
  if (d < 0) return { tone: 'text-[#b91c1c]', dot: 'bg-[#dc2626]', label: `Quá hạn ${Math.abs(d)} ngày` };
  if (d <= 14) return { tone: 'text-[#b45309]', dot: 'bg-amber', label: `Còn ${d} ngày` };
  if (d <= 30) return { tone: 'text-[#b45309]', dot: 'bg-amber', label: `Còn ${d} ngày` };
  return { tone: 'text-ink', dot: 'bg-[#16a34a]', label: `Còn ${d} ngày` };
}

export default function LotsTab() {
  const { message } = App.useApp();
  const { canManageMasterData } = usePermissions();
  const [rows, setRows] = useState(LOTS);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState(null);
  const [nearOnly, setNearOnly] = useState(false);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const { sortableTitle, sortRows } = useColumnSort();

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const filtered = rows.filter((l) => {
      const okKw = !kw || [l.code, l.productName].some((v) => v.toLowerCase().includes(kw));
      const okStatus = !status || l.status === status;
      const okNear = !nearOnly || daysUntil(l.expDate) <= 30;
      return okKw && okStatus && okNear;
    });
    return sortRows(filtered);
  }, [rows, keyword, status, nearOnly, sortRows]);

  const hasActiveFilters = Boolean(keyword || status || nearOnly);
  const clearFilters = () => {
    setKeyword('');
    setStatus(null);
    setNearOnly(false);
  };

  const handleOk = async () => {
    const v = await form.validateFields();
    const lot = {
      id: `L${Date.now().toString().slice(-4)}`,
      code: v.code,
      productId: v.productId,
      productName: PRODUCT_OPTIONS.find((p) => p.value === v.productId)?.label ?? '',
      mfgDate: v.mfgDate?.format?.('YYYY-MM-DD'),
      expDate: v.expDate?.format?.('YYYY-MM-DD'),
      quantity: v.quantity,
      location: v.location,
      status: 'active',
    };
    setRows((prev) => [lot, ...prev]);
    message.success('Đã thêm lô hàng');
    setOpen(false);
    form.resetFields();
  };

  const columns = [
    { title: 'Mã lô', dataIndex: 'code', width: 130, render: (c) => <DocCode>{c}</DocCode> },
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      render: (name) => <span className="font-medium text-ink">{name}</span>,
    },
    { title: 'NSX', dataIndex: 'mfgDate', align: 'center', width: 120, render: (d) => <span className="mono text-ink-sub">{formatDate(d)}</span> },
    {
      title: sortableTitle('HSD', 'expDate'),
      dataIndex: 'expDate',
      align: 'center',
      width: 170,
      render: (d) => {
        const info = expiryInfo(d);
        return (
          <Tooltip title={info.label}>
            <span className={`inline-flex items-center gap-1.5 mono font-medium ${info.tone}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${info.dot}`} />
              {formatDate(d)}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: sortableTitle('Tồn lô', 'quantity'),
      dataIndex: 'quantity',
      align: 'right',
      width: 130,
      render: (q) => <span className="mono text-ink">{formatNumber(q)}</span>,
    },
    { title: 'Vị trí', dataIndex: 'location', align: 'center', width: 110, render: (l) => <DocCode muted>{l}</DocCode> },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      align: 'center',
      width: 130,
      render: (s) => <StatusPill status={s} />,
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Sidebar bộ lọc */}
        <FilterSidebar hasActiveFilters={hasActiveFilters} onClear={clearFilters}>
          <Input
            allowClear
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder="Tìm theo mã lô, sản phẩm..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Select
            allowClear
            placeholder="Trạng thái"
            className="w-full"
            options={[
              { value: 'active', label: 'Còn hạn' },
              { value: 'expired', label: 'Quá hạn' },
            ]}
            value={status}
            onChange={setStatus}
          />
          <Checkbox checked={nearOnly} onChange={(e) => setNearOnly(e.target.checked)}>
            Chỉ cận hạn (≤ 30 ngày)
          </Checkbox>
        </FilterSidebar>

        {/* Danh sách lô hàng */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-sm text-ink-sub">{data.length} lô</span>
            {canManageMasterData && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
                Thêm lô
              </Button>
            )}
          </div>

          <motion.div
            key={data.map((l) => l.id).join(',')}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <DataTable
              columns={columns}
              dataSource={data}
              rowClassName={(r) => (daysUntil(r.expDate) < 0 ? '!bg-[#fef2f2]' : '')}
              locale={{ emptyText: <TableEmptyState message="Không tìm thấy lô hàng phù hợp" /> }}
            />
          </motion.div>
        </div>
      </div>

      <Modal
        open={open}
        title="Thêm lô hàng"
        okText="Thêm mới"
        cancelText="Huỷ"
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        destroyOnHidden
        maskClosable={false}
      >
        <Form form={form} layout="vertical" requiredMark={false} className="mt-2">
          <Form.Item name="code" label="Mã lô" rules={[{ required: true, message: 'Nhập mã lô' }]}>
            <Input placeholder="L2406-SG" />
          </Form.Item>
          <Form.Item name="productId" label="Sản phẩm" rules={[{ required: true, message: 'Chọn sản phẩm' }]}>
            <Select showSearch optionFilterProp="label" options={PRODUCT_OPTIONS} placeholder="Chọn sản phẩm" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="mfgDate" label="Ngày sản xuất" rules={[{ required: true, message: 'Chọn NSX' }]}>
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="expDate" label="Hạn sử dụng" rules={[{ required: true, message: 'Chọn HSD' }]}>
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="quantity" label="Số lượng" rules={[{ required: true, message: 'Nhập số lượng' }]}>
              <InputNumber min={0} className="w-full" />
            </Form.Item>
            <Form.Item name="location" label="Vị trí" rules={[{ required: true, message: 'Chọn vị trí' }]}>
              <Select options={LOCATION_OPTIONS} placeholder="Chọn vị trí" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </>
  );
}
