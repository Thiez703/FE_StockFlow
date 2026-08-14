import { DatePicker } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function DateRangeSelectGroup({ value, onChange, style, className }) {
  const handleChange = (dates) => {
    // dates is [dayjs, dayjs] or null
    onChange(dates);
  };

  return (
    <div className={`flex items-center ${className || ''}`} style={style}>
      <RangePicker
        value={value}
        onChange={handleChange}
        format="DD/MM/YYYY"
        disabledDate={(current) => current && current > dayjs().endOf('day')}
        className="w-full sm:w-[280px] rounded-lg border border-blue-200 bg-blue-50/50 hover:border-blue-300 shadow-sm px-3 py-1.5 transition-colors text-blue-900 font-medium"
      />
    </div>
  );
}
