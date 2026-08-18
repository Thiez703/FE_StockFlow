import { createSlice } from '@reduxjs/toolkit';

const savedExpirySoonDays = localStorage.getItem('expirySoonDays');
const savedDefaultUnit = localStorage.getItem('systemDefaultUnit');

const initialState = {
  expirySoonDays: savedExpirySoonDays ? parseInt(savedExpirySoonDays, 10) : 14,
  defaultUnit: savedDefaultUnit || 'Thùng',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setExpirySoonDays: (state, action) => {
      state.expirySoonDays = action.payload;
      localStorage.setItem('expirySoonDays', action.payload);
    },
    setDefaultUnit: (state, action) => {
      state.defaultUnit = action.payload;
      localStorage.setItem('systemDefaultUnit', action.payload);
    },
  },
});

export const { setExpirySoonDays, setDefaultUnit } = settingsSlice.actions;
export default settingsSlice.reducer;
