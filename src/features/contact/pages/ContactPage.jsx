import PageHeader from '@/components/ui/PageHeader';
import { Card, Form, Input, Button, App } from 'antd';
import {
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  SendOutlined,
} from '@ant-design/icons';
import FadeSection from '@/components/ui/FadeSection';

export default function ContactPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const handleFinish = (values) => {
    console.log('Contact form values:', values);
    message.success('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.');
    form.resetFields();
  };

  return (
    <>
      <PageHeader
        title="Liên hệ"
        subtitle="Thông tin hỗ trợ và giải đáp thắc mắc"
        breadcrumb={[{ title: 'Hệ thống' }, { title: 'Liên hệ' }]}
      />

      <FadeSection dataKey="contact-page">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="flex flex-col gap-6">
            <Card className="shadow-sm border border-slate-200" bodyStyle={{ padding: '24px' }}>
              <h2 className="text-xl font-semibold mb-4 text-slate-800">Thông tin liên hệ</h2>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <PhoneOutlined className="text-lg" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Hotline hỗ trợ</div>
                    <div>1900 1234 (Miễn phí)</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-600">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <MailOutlined className="text-lg" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Email</div>
                    <div>support@stockflow.vn</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-600">
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <EnvironmentOutlined className="text-lg" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Văn phòng chính</div>
                    <div>Tòa nhà StockFlow, Quận 1, TP.HCM</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="shadow-sm border border-slate-200 bg-gradient-to-br from-blue-900 to-slate-900 text-white border-0" bodyStyle={{ padding: '24px' }}>
              <h3 className="text-lg font-semibold mb-2">Giờ làm việc</h3>
              <ul className="list-none p-0 m-0 space-y-2 text-slate-300">
                <li className="flex justify-between">
                  <span>Thứ 2 - Thứ 6:</span>
                  <span className="font-medium text-white">08:00 - 18:00</span>
                </li>
                <li className="flex justify-between">
                  <span>Thứ 7:</span>
                  <span className="font-medium text-white">08:00 - 12:00</span>
                </li>
                <li className="flex justify-between">
                  <span>Chủ nhật, Lễ:</span>
                  <span className="font-medium text-red-400">Nghỉ</span>
                </li>
              </ul>
            </Card>
          </div>

          <Card className="shadow-sm border border-slate-200 h-full" bodyStyle={{ padding: '24px' }}>
            <h2 className="text-xl font-semibold mb-1 text-slate-800">Gửi lời nhắn</h2>
            <p className="text-sm text-slate-500 mb-6">Hãy để lại thông tin, đội ngũ CSKH sẽ liên hệ lại ngay.</p>
            
            <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark={false}>
              <Form.Item
                name="name"
                label={<span className="text-slate-600 font-medium">Họ và tên</span>}
                rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
              >
                <Input placeholder="Nguyễn Văn A" size="large" className="rounded-lg" />
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="email"
                  label={<span className="text-slate-600 font-medium">Email</span>}
                  rules={[
                    { required: true, message: 'Vui lòng nhập email' },
                    { type: 'email', message: 'Email không hợp lệ' }
                  ]}
                >
                  <Input placeholder="email@domain.com" size="large" className="rounded-lg" />
                </Form.Item>

                <Form.Item
                  name="phone"
                  label={<span className="text-slate-600 font-medium">Số điện thoại</span>}
                >
                  <Input placeholder="090 123 4567" size="large" className="rounded-lg" />
                </Form.Item>
              </div>

              <Form.Item
                name="message"
                label={<span className="text-slate-600 font-medium">Nội dung tin nhắn</span>}
                rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
              >
                <Input.TextArea rows={4} placeholder="Bạn cần hỗ trợ gì?" size="large" className="rounded-lg resize-none" />
              </Form.Item>

              <Form.Item className="mb-0 pt-2">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large" 
                  icon={<SendOutlined />}
                  className="w-full sm:w-auto px-8 rounded-lg bg-blue-600 hover:bg-blue-700"
                >
                  Gửi yêu cầu
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </FadeSection>
    </>
  );
}
