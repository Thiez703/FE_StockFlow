import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Form, InputNumber, Modal, Popconfirm, Select, Tooltip, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import TableEmptyState from '@/components/ui/TableEmptyState';
import { productUnitApi } from '@/api/products';
import { unitApi } from '@/api/units';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { formatNumber } from '@/utils/formatCurrency';

/**
 * Khai báo đơn vị quy đổi của một sản phẩm, VD 1 Thùng = 24 Lon.
 * Tỷ lệ luôn quy về đơn vị cơ sở của chính sản phẩm đó.
 *
 * Backend chặn sẵn 3 trường hợp, ở đây lọc luôn khỏi danh sách chọn để người
 * dùng không phải thử rồi mới thấy lỗi: đơn vị chưa ACTIVE, đơn vị trùng đơn vị
 * cơ sở, và đơn vị đã khai báo cho sản phẩm này.
 */
export default function ProductUnitsModal({ open, product, canEdit = true, onClose }) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const productId = product?.id;
  const PRODUCT_UNITS_KEY = ['product-units', productId];

  const { data: rows = [], isLoading } = useQuery({
    queryKey: PRODUCT_UNITS_KEY,
    queryFn: () => productUnitApi.getByProduct(productId),
    enabled: open && !!productId,
  });

  // React Query dùng chung cache với các tab khác nên không phát sinh request thừa.
  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: unitApi.getAll,
    enabled: open,
  });

  const baseUnit = units.find((u) => u.id === product?.baseUnitId);
  const baseUnitName = baseUnit?.name ?? '—';

  const unitOptions = useMemo(() => {
    const used = new Set(rows.filter((r) => r.id !== editing?.id).map((r) => r.unitId));
    return units
      .filter((u) => u.status === 'ACTIVE' && u.id !== product?.baseUnitId && !used.has(u.id))
      .map((u) => ({ value: u.id, label: `${u.name} (${u.code})` }));
  }, [units, rows, editing, product?.baseUnitId]);

  const resetForm = () => {
    setEditing(null);
    form.resetFields();
  };

  // Đóng modal thì bỏ luôn dòng đang sửa dở, để lần mở sau bắt đầu sạch.
  // Các ô nhập không cần xoá tay: `destroyOnHidden` đã huỷ cả Form.
  const handleClose = () => {
    setEditing(null);
    onClose();
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: PRODUCT_UNITS_KEY });
  const onError = (error) => message.error(getErrorMessage(error));

  const { mutate: saveUnit, isPending: isSaving } = useMutation({
    mutationFn: ({ id, values }) =>
      id
        ? productUnitApi.update(productId, id, values)
        : productUnitApi.create(productId, values),
    onSuccess: (_data, { id }) => {
      invalidate();
      message.success(id ? 'Đã cập nhật đơn vị quy đổi' : 'Đã thêm đơn vị quy đổi');
      resetForm();
    },
    onError,
  });

  const { mutate: removeUnit } = useMutation({
    mutationFn: (id) => productUnitApi.remove(productId, id),
    onSuccess: (_data, id) => {
      invalidate();
      message.success('Đã xoá đơn vị quy đổi');
      if (editing?.id === id) resetForm();
    },
    onError,
  });

  const handleSubmit = async () => {
    const v = await form.validateFields();
    saveUnit({
      id: editing?.id,
      values: { unitId: v.unitId, conversionRate: v.conversionRate },
    });
  };

  const startEdit = (row) => {
    setEditing(row);
    form.setFieldsValue({ unitId: row.unitId, conversionRate: row.conversionRate });
  };

  const columns = [
    {
      title: 'Đơn vị',
      dataIndex: 'unitName',
      render: (name, r) => (
        <div>
          <div className="font-medium text-ink">{name}</div>
          <DocCode muted>{r.unitCode}</DocCode>
        </div>
      ),
    },
    {
      title: 'Quy đổi',
      dataIndex: 'conversionRate',
      render: (rate, r) => (
        <span className="text-ink">
          1 {r.unitName} ={' '}
          <span className="mono font-semibold">{formatNumber(rate)}</span> {baseUnitName}
        </span>
      ),
    },
    {
      title: '',
      key: 'action',
      align: 'center',
      width: 96,
      render: (_, r) => (
        <div className="flex items-center justify-center">
          <Tooltip title="Sửa tỷ lệ">
            <Button
              type="text"
              icon={<EditOutlined />}
              disabled={!canEdit}
              onClick={() => startEdit(r)}
            />
          </Tooltip>
          <Popconfirm
            title="Xoá đơn vị quy đổi này?"
            okText="Xoá"
            okButtonProps={{ danger: true }}
            cancelText="Huỷ"
            onConfirm={() => removeUnit(r.id)}
            disabled={!canEdit}
          >
            <Tooltip title="Xoá">
              <Button type="text" danger icon={<DeleteOutlined />} disabled={!canEdit} />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const noUnitLeft = unitOptions.length === 0;

  return (
    <Modal centered
      open={open}
      title={`Đơn vị quy đổi — ${product?.name ?? ''}`}
      onCancel={handleClose}
      width={720}
      destroyOnHidden
      footer={<Button onClick={handleClose}>Đóng</Button>}
    >
      <p className="mt-2 mb-4 text-sm text-ink-sub">
        Đơn vị cơ sở của sản phẩm là <span className="font-semibold text-ink">{baseUnitName}</span>.
        Mọi tỷ lệ bên dưới đều quy về đơn vị này.
      </p>

      {canEdit && (
        <Form form={form} layout="vertical" requiredMark={false} className="mb-4">
          <div className="flex items-end gap-2">
            <Form.Item
              name="unitId"
              label="Đơn vị"
              rules={[{ required: true, message: 'Chọn đơn vị' }]}
              className="!mb-0 flex-1"
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={unitOptions}
                placeholder={noUnitLeft ? 'Không còn đơn vị nào để thêm' : 'Chọn đơn vị'}
                disabled={noUnitLeft}
              />
            </Form.Item>
            <Form.Item
              name="conversionRate"
              label={`Bằng bao nhiêu ${baseUnitName}?`}
              rules={[{ required: true, message: 'Nhập tỷ lệ' }]}
              className="!mb-0 w-48"
            >
              <InputNumber
                min={1}
                precision={0}
                className="w-full"
                placeholder="24"
                disabled={noUnitLeft}
              />
            </Form.Item>
            <Button
              type="primary"
              icon={editing ? <CheckOutlined /> : <PlusOutlined />}
              loading={isSaving}
              disabled={noUnitLeft}
              onClick={handleSubmit}
            >
              {editing ? 'Lưu' : 'Thêm'}
            </Button>
            {editing && <Button onClick={resetForm}>Huỷ</Button>}
          </div>
        </Form>
      )}

      <DataTable
        columns={columns}
        dataSource={rows}
        loading={isLoading}
        pagination={false}
        locale={{
          emptyText: <TableEmptyState message="Sản phẩm chưa có đơn vị quy đổi nào" />,
        }}
      />
    </Modal>
  );
}
