import { createSlice } from '@reduxjs/toolkit';

const savedExpirySoonDays = localStorage.getItem('expirySoonDays');
const initialState = {
  expirySoonDays: savedExpirySoonDays ? parseInt(savedExpirySoonDays, 10) : 14,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setExpirySoonDays: (state, action) => {
      state.expirySoonDays = action.payload;
      localStorage.setItem('expirySoonDays', action.payload);
    },
  },
});

export const { setExpirySoonDays } = settingsSlice.actions;
export default settingsSlice.reducer;
