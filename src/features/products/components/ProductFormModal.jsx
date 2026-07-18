import { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select } from 'antd';
import { CATEGORY_OPTIONS } from '@/mock/categories';

const BASE_UNIT_OPTIONS = [
  { value: 'Lon', label: 'Lon' },
  { value: 'Chai', label: 'Chai' },
];

/**
 * Modal thêm/sửa sản phẩm (AntD Form). Demo tĩnh: submit trả dữ liệu về trang cha
 * để cập nhật state, không gọi API.
 */
export default function ProductFormModal({ open, editing, onClose, onSubmit }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        editing ?? { baseUnit: 'Lon', status: 'active', minStock: 0, maxStock: 0, price: 0 },
      );
    }
  }, [open, editing, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      open={open}
      title={editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
      okText={editing ? 'Lưu thay đổi' : 'Thêm mới'}
      cancelText="Huỷ"
      onCancel={onClose}
      onOk={handleOk}
      width={620}
      destroyOnHidden
      maskClosable={false}
    >
      <Form form={form} layout="vertical" requiredMark={false} className="mt-2">
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true, message: 'Nhập tên sản phẩm' }]} className="sm:col-span-2">
            <Input placeholder="VD: Bia Saigon Lager lon 330ml" />
          </Form.Item>
          <Form.Item name="sku" label="Mã SKU" rules={[{ required: true, message: 'Nhập mã SKU' }]}>
            <Input placeholder="BIA-SG-LAGER-330" />
          </Form.Item>
          <Form.Item name="barcode" label="Barcode" rules={[{ required: true, message: 'Nhập barcode' }]}>
            <Input placeholder="8935049500101" />
          </Form.Item>
          <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true, message: 'Chọn danh mục' }]}>
            <Select options={CATEGORY_OPTIONS} placeholder="Chọn danh mục" />
          </Form.Item>
          <Form.Item name="baseUnit" label="Đơn vị cơ sở" rules={[{ required: true }]}>
            <Select options={BASE_UNIT_OPTIONS} />
          </Form.Item>
          <Form.Item name="minStock" label="Tồn tối thiểu">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item name="maxStock" label="Tồn tối đa">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item name="price" label="Giá bán lẻ (₫)">
            <InputNumber min={0} step={500} className="w-full" />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái">
            <Select
              options={[
                { value: 'active', label: 'Hoạt động' },
                { value: 'inactive', label: 'Ngừng kinh doanh' },
              ]}
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
