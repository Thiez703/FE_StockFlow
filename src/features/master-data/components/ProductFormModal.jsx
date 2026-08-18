import { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Tooltip } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/api/inventory';
import { useSelector } from 'react-redux';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Ngừng kinh doanh' },
];

/**
 * Modal thêm/sửa sản phẩm. Đơn vị là 1 ô nhập/chọn đơn giản (text).
 */
export default function ProductFormModal({
  open,
  editing,
  categoryOptions = [],
  confirmLoading,
  onClose,
  onSubmit,
}) {
  const [form] = Form.useForm();
  const defaultUnit = useSelector((state) => state.settings.defaultUnit);

  useEffect(() => {
    if (open) {
      form.setFieldsValue(editing ?? { status: 'ACTIVE', minStock: 0, unit: defaultUnit });
    }
  }, [open, editing, form, defaultUnit]);

  const { data: txData } = useQuery({
    queryKey: ['transactions', editing?.id],
    queryFn: () => inventoryApi.getTransactionsByProduct(editing.id, { size: 1 }),
    enabled: !!editing?.id,
  });

  const hasTransactions = txData?.totalElements > 0;

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit({
      ...values,
      unit: 'Thùng', // Force 'Thùng'
    });
  };

  return (
    <Modal centered
      open={open}
      title={editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
      okText={editing ? 'Lưu thay đổi' : 'Thêm mới'}
      cancelText="Huỷ"
      confirmLoading={confirmLoading}
      onCancel={onClose}
      onOk={handleOk}
      width={620}
      destroyOnHidden
      maskClosable={false}
    >
      <Form form={form} layout="vertical" requiredMark={false} className="mt-2">
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Form.Item
            name="name"
            label="Tên sản phẩm"
            rules={[
              { required: true, message: 'Nhập tên sản phẩm' },
              { max: 255, message: 'Tối đa 255 ký tự' },
            ]}
            className="sm:col-span-2"
          >
            <Input placeholder="VD: Bia Saigon Lager Thùng" />
          </Form.Item>
          <Form.Item
            name="code"
            label="Mã sản phẩm"
            rules={[
              { required: true, message: 'Nhập mã sản phẩm' },
              { max: 30, message: 'Tối đa 30 ký tự' },
            ]}
          >
            {hasTransactions ? (
              <Tooltip title="Không thể sửa mã vì sản phẩm đã phát sinh giao dịch/tồn kho">
                <Input placeholder="BIA-SG-LAGER-330" disabled />
              </Tooltip>
            ) : (
              <Input placeholder="BIA-SG-LAGER-330" disabled={false} />
            )}
          </Form.Item>
          <Form.Item name="categoryId" label="Danh mục">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              options={categoryOptions}
              placeholder="Chọn danh mục"
            />
          </Form.Item>
          <Form.Item
            name="unit"
            label="Đơn vị"
            rules={[{ required: true, message: 'Nhập đơn vị tính' }]}
          >
            <Input disabled placeholder="Đơn vị tính mặc định" />
          </Form.Item>
          <Form.Item name="minStock" label="Tồn tối thiểu">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái">
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
