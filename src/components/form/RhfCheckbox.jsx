import { Controller } from 'react-hook-form';
import { Checkbox } from 'antd';

/**
 * Checkbox dùng chung cho các form RHF: gói sẵn Controller, map value <-> checked/onChange.
 */
export default function RhfCheckbox({ control, name, children, ...checkboxProps }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Checkbox
          checked={field.value}
          onChange={(e) => field.onChange(e.target.checked)}
          {...checkboxProps}
        >
          {children}
        </Checkbox>
      )}
    />
  );
}
