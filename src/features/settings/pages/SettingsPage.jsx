import { Form, InputNumber, Button, message, Card, Typography, Divider } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { setExpirySoonDays } from '@/store/settingsSlice';
import { usePermissions } from '@/hooks/usePermissions';
import { SettingOutlined, SaveOutlined, WarningOutlined } from '@ant-design/icons';
import { useEffect } from 'react';

const { Title, Text } = Typography;

export default function SettingsPage() {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { isAdmin } = usePermissions();
  const expirySoonDays = useSelector((state) => state.settings.expirySoonDays);

  useEffect(() => {
    form.setFieldsValue({ expirySoonDays });
  }, [expirySoonDays, form]);

  const onFinish = (values) => {
    dispatch(setExpirySoonDays(values.expirySoonDays));
    message.success('Đã lưu cấu hình thành công!');
  };

  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-6 bg-[#f8fafc] min-h-[calc(100vh-64px)]">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-sm rounded-xl border-slate-200">
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
              <WarningOutlined className="text-4xl text-amber-500 mb-4" />
              <Title level={4}>Không có quyền truy cập</Title>
              <Text>Bạn cần có quyền quản trị (ADMIN) để xem và thay đổi cấu hình hệ thống.</Text>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-[#f8fafc] min-h-[calc(100vh-64px)]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <SettingOutlined className="text-royal-500" />
            Cấu hình hệ thống
          </h1>
          <p className="text-slate-500 mt-1">Quản lý các tham số cấu hình chung cho toàn hệ thống.</p>
        </div>

        <Card className="shadow-sm rounded-xl border-slate-200" title={<span className="font-semibold text-slate-700">Cảnh báo hàng hóa</span>}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ expirySoonDays }}
            className="max-w-md"
          >
            <Form.Item
              name="expirySoonDays"
              label={<span className="font-medium text-slate-700">Số ngày cảnh báo "Sắp hết hạn"</span>}
              rules={[
                { required: true, message: 'Vui lòng nhập số ngày' },
                { type: 'number', min: 1, max: 365, message: 'Số ngày phải từ 1 đến 365' }
              ]}
              extra="Các lô hàng có số ngày còn lại đến hạn sử dụng nhỏ hơn hoặc bằng giá trị này sẽ được đưa vào danh sách cảnh báo Sắp hết hạn (màu cam)."
            >
              <InputNumber
                className="w-full"
                placeholder="Ví dụ: 14, 30"
                addonAfter="ngày"
              />
            </Form.Item>

            <Divider />

            <Form.Item className="mb-0">
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} className="bg-royal-600 hover:bg-royal-500">
                Lưu cấu hình
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}
