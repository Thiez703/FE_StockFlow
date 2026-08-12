import { Select, Space } from 'antd';
import { useState, useMemo, useEffect } from 'react';
import dayjs from 'dayjs';

function DateSelect({ value, onChange, allowClear = true }) {
  const [day, setDay] = useState(value ? value.date() : null);
  const [month, setMonth] = useState(value ? value.month() + 1 : null);
  const [year, setYear] = useState(value ? value.year() : null);

  useEffect(() => {
    if (value) {
      setDay(value.date());
      setMonth(value.month() + 1);
      setYear(value.year());
    } else {
      setDay(null);
      setMonth(null);
      setYear(null);
    }
  }, [value]);

  useEffect(() => {
    if (day && month && year) {
      let d = dayjs(`${year}-${month}-${day}`);
      if (d.isValid()) {
        const todayStr = dayjs().format('YYYY-MM-DD');
        if (d.isAfter(todayStr, 'day')) {
          d = dayjs();
          setYear(d.year());
          setMonth(d.month() + 1);
          setDay(d.date());
        }
        onChange(d);
      }
    } else if (!day && !month && !year) {
      onChange(null);
    }
  }, [day, month, year]);

  const today = dayjs();
  const currentYear = today.year();
  const currentMonth = today.month() + 1;
  const currentDay = today.date();

  const maxDays = useMemo(() => {
    let dInMonth = 31;
    if (month && year) dInMonth = dayjs(`${year}-${month}`).daysInMonth();
    if (year === currentYear && month === currentMonth) return Math.min(dInMonth, currentDay);
    return dInMonth;
  }, [month, year, currentYear, currentMonth, currentDay]);

  const days = Array.from({ length: maxDays }, (_, i) => i + 1);
  const maxMonth = year === currentYear ? currentMonth : 12;
  const months = Array.from({ length: maxMonth }, (_, i) => i + 1);
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 10 + i);

  return (
    <Space.Compact>
      <Select placeholder="DD" value={day} onChange={setDay} allowClear={allowClear} style={{ width: 64 }} options={days.map(d => ({ label: String(d).padStart(2, '0'), value: d }))} />
      <Select placeholder="MM" value={month} onChange={setMonth} allowClear={allowClear} style={{ width: 64 }} options={months.map(m => ({ label: String(m).padStart(2, '0'), value: m }))} />
      <Select placeholder="YYYY" value={year} onChange={setYear} allowClear={allowClear} style={{ width: 76 }} options={years.map(y => ({ label: y, value: y }))} />
    </Space.Compact>
  );
}

export default function DateRangeSelectGroup({ value, onChange, style, className }) {
  const start = value?.[0] || null;
  const end = value?.[1] || null;

  const handleStartChange = (d) => {
    if (d && end) onChange([d, end]);
    else if (d) onChange([d, null]);
    else if (!d && !end) onChange(null);
    else onChange([null, end]);
  };
  const handleEndChange = (d) => {
    if (start && d) onChange([start, d]);
    else if (d) onChange([null, d]);
    else if (!start && !d) onChange(null);
    else onChange([start, null]);
  };

  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-2 items-center rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-1.5 shadow-sm transition-colors hover:border-blue-300 ${className || ''}`} style={style}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-blue-800">Từ</span>
        <DateSelect value={start} onChange={handleStartChange} />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-blue-800">Đến</span>
        <DateSelect value={end} onChange={handleEndChange} />
      </div>
    </div>
  );
}
