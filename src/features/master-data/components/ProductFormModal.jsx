import { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select } from 'antd';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Ngừng kinh doanh' },
];

const UNIT_SUGGESTIONS = ['Lon', 'Chai', 'Thùng', 'Két', 'Hộp', 'Gói', 'Bịch', 'Can'];

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

  useEffect(() => {
    if (open) {
      form.setFieldsValue(editing ?? { status: 'ACTIVE', minStock: 0 });
    }
  }, [open, editing, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit(values);
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
            <Input placeholder="VD: Bia Saigon Lager lon 330ml" />
          </Form.Item>
          <Form.Item
            name="code"
            label="Mã sản phẩm"
            rules={[
              { required: true, message: 'Nhập mã sản phẩm' },
              { max: 30, message: 'Tối đa 30 ký tự' },
            ]}
          >
            <Input placeholder="BIA-SG-LAGER-330" />
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
            <Select
              showSearch
              allowClear
              placeholder="Chọn hoặc nhập đơn vị"
              options={UNIT_SUGGESTIONS.map((u) => ({ value: u, label: u }))}
              mode={undefined}
              dropdownRender={(menu) => menu}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              notFoundContent={null}
              open={undefined}
            />
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
