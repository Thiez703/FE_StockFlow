import { useEffect, useMemo, useState } from 'react';
import { Button, Form, Input, Modal, Select, Tooltip, App } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  FolderOpenOutlined,
  TagOutlined,
  SearchOutlined,
  ShrinkOutlined,
  ArrowsAltOutlined,
} from '@ant-design/icons';
import { usePermissions } from '@/hooks/usePermissions';
import DataTable from '@/components/ui/DataTable';
import FilterSidebar from '@/components/ui/FilterSidebar';
import TableEmptyState from '@/components/ui/TableEmptyState';
import FadeSection from '@/components/ui/FadeSection';
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

// Id của mọi node có con — dùng cho mở/thu gọn cây.
const getParentKeys = (nodes) =>
  nodes.reduce((acc, n) => {
    if (n.children?.length) acc.push(n.id, ...getParentKeys(n.children));
    return acc;
  }, []);

// Đếm toàn bộ node (cha + con) đang hiển thị.
const countNodes = (nodes) =>
  nodes.reduce((acc, n) => acc + 1 + (n.children ? countNodes(n.children) : 0), 0);

// Lọc cây theo từ khoá + trạng thái. Node cha khớp -> giữ nguyên cả nhánh con
// (để không mất ngữ cảnh); node cha không khớp nhưng có con khớp -> giữ cha,
// chỉ hiện các con khớp.
const filterTree = (nodes, kw, status) =>
  nodes.reduce((acc, n) => {
    const selfMatchKw = !kw || [n.name, n.code].some((v) => v.toLowerCase().includes(kw));
    const selfMatchStatus = !status || n.status === status;
    if (selfMatchKw && selfMatchStatus) {
      acc.push(n);
      return acc;
    }
    const childMatches = n.children ? filterTree(n.children, kw, status) : [];
    if (childMatches.length > 0) acc.push({ ...n, children: childMatches });
    return acc;
  }, []);

export default function CategoriesTab() {
  const { message } = App.useApp();
  const { canManageMasterData } = usePermissions();
  const [tree, setTree] = useState(CATEGORY_TREE);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [quickParentId, setQuickParentId] = useState(null);
  const [expandedKeys, setExpandedKeys] = useState(() => getParentKeys(CATEGORY_TREE));
  const [form] = Form.useForm();

  const data = useMemo(
    () => filterTree(tree, keyword.trim().toLowerCase(), status),
    [tree, keyword, status],
  );

  const hasActiveFilters = Boolean(keyword || status);
  const clearFilters = () => {
    setKeyword('');
    setStatus(null);
  };

  // Đang tìm kiếm -> luôn mở hết nhánh có kết quả để không phải bấm thủ công
  // (tính trực tiếp khi render, không setState trong effect, để tránh render kép).
  const allParentKeys = useMemo(() => getParentKeys(tree), [tree]);
  const visibleExpandedKeys = hasActiveFilters ? getParentKeys(data) : expandedKeys;
  const allExpanded = visibleExpandedKeys.length > 0;
  const toggleExpandAll = () => setExpandedKeys(allExpanded ? [] : allParentKeys);

  useEffect(() => {
    if (open) form.setFieldsValue(editing ?? { parentId: quickParentId, status: 'active' });
  }, [open, editing, quickParentId, form]);

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

  const openAdd = (parentId = null) => {
    setEditing(null);
    setQuickParentId(parentId);
    setOpen(true);
  };

  const columns = [
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      render: (name, r) => {
        const isParent = !r.parentId;
        return (
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-2 text-ink ${isParent ? 'font-semibold' : 'font-medium'}`}>
              {isParent ? (
                <FolderOpenOutlined className="text-royal" />
              ) : (
                <TagOutlined className="text-ink-sub" />
              )}
              {name}
            </span>
            {r.children?.length > 0 && (
              <span className="rounded-full bg-slate-100 px-1.5 text-xs font-medium text-ink-sub">
                {r.children.length}
              </span>
            )}
            {isParent && canManageMasterData && (
              <Tooltip title="Thêm danh mục con">
                <Button
                  type="text"
                  size="small"
                  className="!h-5 !w-5 !min-w-0"
                  icon={<PlusOutlined className="text-xs" />}
                  onClick={() => openAdd(r.id)}
                />
              </Tooltip>
            )}
          </div>
        );
      },
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
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Sidebar bộ lọc */}
        <FilterSidebar hasActiveFilters={hasActiveFilters} onClear={clearFilters}>
          <Input
            allowClear
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder="Tìm tên, mã danh mục..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Select
            allowClear
            placeholder="Trạng thái"
            className="w-full"
            options={[
              { value: 'active', label: 'Hoạt động' },
              { value: 'inactive', label: 'Ngừng' },
            ]}
            value={status}
            onChange={setStatus}
          />
          <p className="m-0 text-xs text-ink-sub">Cây nhóm hàng cha – con của kho phân phối.</p>
        </FilterSidebar>

        {/* Danh sách danh mục */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-ink-sub">{countNodes(data)} danh mục</span>
              <Button
                type="text"
                size="small"
                icon={allExpanded ? <ShrinkOutlined /> : <ArrowsAltOutlined />}
                disabled={hasActiveFilters}
                onClick={toggleExpandAll}
              >
                {allExpanded ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
              </Button>
            </div>
            {canManageMasterData && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openAdd(null)}>
                Thêm danh mục
              </Button>
            )}
          </div>

          <FadeSection dataKey={data.map((n) => n.id).join(',')}>
            <DataTable
              className="category-tree-table"
              rowClassName={(record) => (record.parentId ? 'category-row-child' : 'category-row-parent')}
              columns={columns}
              dataSource={data}
              pagination={false}
              expandable={{
                expandedRowKeys: visibleExpandedKeys,
                onExpandedRowsChange: setExpandedKeys,
              }}
              locale={{ emptyText: <TableEmptyState message="Không tìm thấy danh mục phù hợp" /> }}
            />
          </FadeSection>
        </div>
      </div>

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
