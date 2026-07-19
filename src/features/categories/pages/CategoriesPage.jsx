import { useEffect, useState } from 'react';
import { Button, Form, Input, Modal, Select, Tooltip, App } from 'antd';
import { PlusOutlined, EditOutlined, FolderOpenOutlined, TagOutlined } from '@ant-design/icons';
import PageHeader from '@/components/ui/PageHeader';
import { usePermissions } from '@/hooks/usePermissions';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import StatusPill from '@/components/ui/StatusPill';
import { CATEGORY_TREE } from '@/mock/categories';

// Cập nhật bất biến 1 node theo id trong cây.
const updateNode = (nodes, id, patch) =>
  nodes.map((n) =>
    n.id === id
      ? { ...n, ...patch }
      : n.children
        ? { ...n, children: updateNode(n.children, id, patch) }
        : n,
  );

// Thêm node con vào parentId (null => thêm ở gốc).
const addNode = (nodes, parentId, node) => {
  if (!parentId) return [...nodes, node];
  return nodes.map((n) =>
    n.id === parentId
      ? { ...n, children: [...(n.children ?? []), node] }
      : n.children
        ? { ...n, children: addNode(n.children, parentId, node) }
        : n,
  );
};

export default function CategoriesPage() {
  const { message } = App.useApp();
  const { canManageMasterData } = usePermissions();
  const [tree, setTree] = useState(CATEGORY_TREE);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(editing ?? { parentId: null, status: 'active' });
    }
  }, [open, editing, form]);

  const parentOptions = [
    { value: null, label: 'Danh mục gốc' },
    ...tree.map((n) => ({ value: n.id, label: n.name })),
  ];

  const handleOk = async () => {
    const values = await form.validateFields();
    if (editing) {
      setTree((prev) => updateNode(prev, editing.id, { name: values.name, status: values.status }));
      message.success('Đã cập nhật danh mục');
    } else {
      const node = {
        id: `DM-${Date.now().toString().slice(-5)}`,
        code: values.name.toUpperCase().replace(/\s+/g, '-').slice(0, 12),
        name: values.name,
        parentId: values.parentId ?? null,
        status: values.status,
      };
      setTree((prev) => addNode(prev, values.parentId, node));
      message.success('Đã thêm danh mục');
    }
    setOpen(false);
  };

  const columns = [
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      render: (name, r) => (
        <span className="flex items-center gap-2 font-medium text-ink">
          {r.parentId ? (
            <TagOutlined className="text-ink-sub" />
          ) : (
            <FolderOpenOutlined className="text-royal" />
          )}
          {name}
        </span>
      ),
    },
    { title: 'Mã', dataIndex: 'code', width: 200, render: (c) => <DocCode muted>{c}</DocCode> },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      align: 'center',
      width: 140,
      render: (s) => <StatusPill status={s} />,
    },
    {
      title: '',
      key: 'action',
      align: 'center',
      width: 56,
      render: (_, r) => (
        <Tooltip title="Sửa">
          <Button
            type="text"
            icon={<EditOutlined />}
            disabled={!canManageMasterData}
            onClick={() => {
              setEditing(r);
              setOpen(true);
            }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Danh mục"
        subtitle="Cây nhóm hàng cha – con của kho phân phối"
        breadcrumb={[{ title: 'Dữ liệu nền' }, { title: 'Danh mục' }]}
        extra={
          canManageMasterData && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              Thêm danh mục
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        dataSource={tree}
        pagination={false}
        expandable={{ defaultExpandAllRows: true }}
      />

      <Modal
        open={open}
        title={editing ? 'Sửa danh mục' : 'Thêm danh mục'}
        okText={editing ? 'Lưu thay đổi' : 'Thêm mới'}
        cancelText="Huỷ"
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        destroyOnHidden
        maskClosable={false}
      >
        <Form form={form} layout="vertical" requiredMark={false} className="mt-2">
          <Form.Item name="parentId" label="Danh mục cha">
            <Select options={parentOptions} disabled={!!editing} />
          </Form.Item>
          <Form.Item name="name" label="Tên danh mục" rules={[{ required: true, message: 'Nhập tên danh mục' }]}>
            <Input placeholder="VD: Bia lon" />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái">
            <Select
              options={[
                { value: 'active', label: 'Hoạt động' },
                { value: 'inactive', label: 'Ngừng' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
