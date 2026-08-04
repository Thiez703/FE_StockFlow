import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Form, Input, Modal, Select, Tooltip, App, Segmented } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  FolderOpenOutlined,
  TagOutlined,
  SearchOutlined,
  ShrinkOutlined,
  ArrowsAltOutlined,
  StopOutlined,
  CheckCircleOutlined,
  AppstoreOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import { usePermissions } from '@/hooks/usePermissions';
import DataTable from '@/components/ui/DataTable';
import TableEmptyState from '@/components/ui/TableEmptyState';
import FadeSection from '@/components/ui/FadeSection';
import StatusPill from '@/components/ui/StatusPill';
import { categoryApi } from '@/api/categories';
import { getErrorMessage } from '@/utils/getErrorMessage';

const CATEGORIES_KEY = ['categories'];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Ngừng' },
];

const stripEmptyChildren = (nodes = []) =>
  nodes.map((n) => ({
    ...n,
    children: n.children?.length ? stripEmptyChildren(n.children) : undefined,
  }));

const getParentKeys = (nodes) =>
  nodes.reduce((acc, n) => {
    if (n.children?.length) acc.push(n.id, ...getParentKeys(n.children));
    return acc;
  }, []);

const countNodes = (nodes) =>
  nodes.reduce((acc, n) => acc + 1 + (n.children ? countNodes(n.children) : 0), 0);

const filterTree = (nodes, kw, status) =>
  nodes.reduce((acc, n) => {
    const selfMatchKw = !kw || (n.name ?? '').toLowerCase().includes(kw);
    const selfMatchStatus = !status || n.status === status;
    if (selfMatchKw && selfMatchStatus) {
      acc.push(n);
      return acc;
    }
    const childMatches = n.children ? filterTree(n.children, kw, status) : [];
    if (childMatches.length > 0) acc.push({ ...n, children: childMatches });
    return acc;
  }, []);

const CategoryCardNode = ({ node, level = 0, onEdit, onAddChild, onToggleStatus, canManageMasterData }) => {
  const isRoot = level === 0;
  const active = node.status === 'ACTIVE';

  return (
    <div className="flex flex-col gap-4">
      {/* The Card for this node */}
      <div
        className={`group relative rounded-2xl border bg-white transition-all duration-300 hover:shadow-md ${
          active ? 'border-slate-200 hover:border-blue-400' : 'border-slate-200 bg-slate-50 opacity-80'
        } ${isRoot ? 'p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4' : 'p-4 flex flex-col'}`}
      >
        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 p-1 rounded-xl backdrop-blur-md shadow-sm border border-slate-100">
          <Tooltip title="Sửa" placement="top">
            <Button type="text" size="small" icon={<EditOutlined className="text-blue-600" />} disabled={!canManageMasterData} onClick={() => onEdit(node)} />
          </Tooltip>
          <Tooltip title="Thêm danh mục con" placement="top">
            <Button type="text" size="small" icon={<PlusOutlined className="text-blue-600" />} disabled={!canManageMasterData} onClick={() => onAddChild(node.id)} />
          </Tooltip>
          <Tooltip title={active ? 'Ngừng sử dụng' : 'Kích hoạt lại'} placement="top">
            <Button type="text" size="small" danger={active} icon={active ? <StopOutlined /> : <CheckCircleOutlined className="text-green-500" />} disabled={!canManageMasterData} onClick={() => onToggleStatus(node)} />
          </Tooltip>
        </div>

        <div className="flex items-center gap-4">
          <div className={`rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
            isRoot ? 'w-14 h-14 bg-gradient-to-br from-indigo-100 to-blue-200 text-indigo-700' : 'w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600'
          }`}>
            {isRoot ? <FolderOpenOutlined className="text-2xl" /> : <TagOutlined className="text-xl" />}
          </div>
          <div className="flex-1 min-w-0 pr-24">
            <div className="flex items-center gap-2">
              <div className={`font-bold text-slate-800 truncate ${isRoot ? 'text-lg' : 'text-base'}`}>{node.name}</div>
              {node.children?.length > 0 && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  {node.children.length}
                </span>
              )}
            </div>
            {isRoot ? (
              <div className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">Danh mục gốc</div>
            ) : (
              <div className="mt-3 flex justify-between items-center">
                <StatusPill status={node.status} />
              </div>
            )}
          </div>
        </div>

        {isRoot && (
           <div className="flex items-center gap-3">
              <StatusPill status={node.status} />
           </div>
        )}
      </div>

      {/* Children */}
      {node.children?.length > 0 && (
        <div className={`grid grid-cols-1 ${level === 0 ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pl-6 sm:pl-10 border-l-2 border-slate-200 ml-6' : 'gap-4 pl-4 border-l-2 border-slate-200 ml-6'}`}>
          {node.children.map(child => (
            <CategoryCardNode
              key={child.id}
              node={child}
              level={level + 1}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onToggleStatus={onToggleStatus}
              canManageMasterData={canManageMasterData}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function CategoriesTab() {
  const { message } = App.useApp();
  const { canManageMasterData } = usePermissions();
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [quickParentId, setQuickParentId] = useState(null);
  const [expandedKeys, setExpandedKeys] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [form] = Form.useForm();

  const { data: tree = [], isLoading } = useQuery({
    queryKey: [...CATEGORIES_KEY, 'tree'],
    queryFn: categoryApi.getTree,
    select: stripEmptyChildren,
  });

  const { mutate: saveCategory, isPending: isSaving } = useMutation({
    mutationFn: ({ id, values }) =>
      id ? categoryApi.update(id, values) : categoryApi.create(values),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      message.success(id ? 'Đã cập nhật danh mục' : 'Đã thêm danh mục');
      setOpen(false);
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const { mutate: toggleStatus } = useMutation({
    mutationFn: ({ id, active }) =>
      active ? categoryApi.deactivate(id) : categoryApi.activate(id),
    onSuccess: (_data, { active }) => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      message.success(active ? 'Đã ngừng sử dụng danh mục' : 'Đã kích hoạt lại danh mục');
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const data = useMemo(
    () => filterTree(tree, keyword.trim().toLowerCase(), status),
    [tree, keyword, status],
  );

  const hasActiveFilters = Boolean(keyword || status);
  const allParentKeys = useMemo(() => getParentKeys(tree), [tree]);
  const visibleExpandedKeys = hasActiveFilters
    ? getParentKeys(data)
    : (expandedKeys ?? allParentKeys);
  const allExpanded = visibleExpandedKeys.length > 0;
  const toggleExpandAll = () => setExpandedKeys(allExpanded ? [] : allParentKeys);

  useEffect(() => {
    if (open) form.setFieldsValue(editing ?? { parentId: quickParentId, status: 'ACTIVE' });
  }, [open, editing, quickParentId, form]);

  const parentOptions = [
    { value: null, label: 'Danh mục gốc' },
    ...tree.map((n) => ({ value: n.id, label: n.name })),
  ];

  const handleOk = async () => {
    const values = await form.validateFields();
    saveCategory({
      id: editing?.id,
      values: {
        name: values.name,
        parentId: values.parentId ?? null,
        status: values.status,
      },
    });
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
                <FolderOpenOutlined className="text-blue-500" />
              ) : (
                <TagOutlined className="text-slate-400" />
              )}
              {name}
            </span>
            {r.children?.length > 0 && (
              <span className="rounded-full bg-slate-100 px-1.5 text-xs font-medium text-slate-500">
                {r.children.length}
              </span>
            )}
            {isParent && canManageMasterData && (
              <Tooltip title="Thêm danh mục con">
                <Button
                  type="text"
                  size="small"
                  className="!h-5 !w-5 !min-w-0"
                  icon={<PlusOutlined className="text-xs text-blue-500" />}
                  onClick={() => openAdd(r.id)}
                />
              </Tooltip>
            )}
          </div>
        );
      },
    },
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
      width: 96,
      render: (_, r) => {
        const active = r.status === 'ACTIVE';
        return (
          <div className="flex items-center justify-center">
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
            <Tooltip title={active ? 'Ngừng sử dụng' : 'Kích hoạt lại'}>
              <Button
                type="text"
                danger={active}
                icon={active ? <StopOutlined /> : <CheckCircleOutlined />}
                disabled={!canManageMasterData}
                onClick={() => toggleStatus({ id: r.id, active })}
              />
            </Tooltip>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Top Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-wrap items-center gap-4">
            <Input
              allowClear
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="Tìm tên danh mục..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full sm:w-80"
            />
            <Select
              allowClear
              placeholder="Trạng thái"
              className="w-full sm:w-48"
              options={STATUS_OPTIONS}
              value={status}
              onChange={setStatus}
            />
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-4">
              <Segmented
                options={[
                  { value: 'card', icon: <AppstoreOutlined /> },
                  { value: 'table', icon: <UnorderedListOutlined /> },
                ]}
                value={viewMode}
                onChange={setViewMode}
              />
              <span className="text-sm text-slate-500 font-medium">{countNodes(data)} danh mục</span>
              {viewMode === 'table' && (
                <Button
                  type="text"
                  size="small"
                  icon={allExpanded ? <ShrinkOutlined /> : <ArrowsAltOutlined />}
                  disabled={hasActiveFilters}
                  onClick={toggleExpandAll}
                >
                  {allExpanded ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
                </Button>
              )}
            </div>
            {canManageMasterData && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={() => openAdd(null)}
              >
                Thêm danh mục
              </Button>
            )}
          </div>

          <FadeSection dataKey={`${viewMode}-${data.map((n) => n.id).join(',')}`}>
            {viewMode === 'table' ? (
              <DataTable
                className="category-tree-table"
                rowClassName={(record) => (record.parentId ? 'category-row-child' : 'category-row-parent')}
                columns={columns}
                dataSource={data}
                loading={isLoading}
                pagination={false}
                expandable={{
                  expandedRowKeys: visibleExpandedKeys,
                  onExpandedRowsChange: setExpandedKeys,
                }}
                locale={{ emptyText: <TableEmptyState message="Không tìm thấy danh mục phù hợp" /> }}
              />
            ) : data.length === 0 ? (
              <TableEmptyState message="Không tìm thấy danh mục phù hợp" />
            ) : (
              <div className="flex flex-col gap-6">
                {data.map((rootNode) => (
                  <CategoryCardNode
                    key={rootNode.id}
                    node={rootNode}
                    level={0}
                    onEdit={(c) => {
                      setEditing(c);
                      setOpen(true);
                    }}
                    onAddChild={openAdd}
                    onToggleStatus={(c) => toggleStatus({ id: c.id, active: c.status === 'ACTIVE' })}
                    canManageMasterData={canManageMasterData}
                  />
                ))}
              </div>
            )}
          </FadeSection>
        </div>
      </div>

      <Modal centered
        open={open}
        title={editing ? 'Sửa danh mục' : 'Thêm danh mục'}
        okText={editing ? 'Lưu thay đổi' : 'Thêm mới'}
        cancelText="Huỷ"
        confirmLoading={isSaving}
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
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
