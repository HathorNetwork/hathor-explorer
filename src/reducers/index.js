import { DASHBOARD_CHART_TIME } from '../constants';

const initialState = {
  data: []
};

const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'dashboard_update':
      let data = [];
      state.data.map((metric, index) => {
        return data.push(metric);
      });
      let newData = action.payload;
      newData['date'] = new Date(newData.time*1000);
      data.push(action.payload);
      if (data.length > DASHBOARD_CHART_TIME) data.shift();
      return Object.assign({}, state, {data: data});
    default:
      return state;
  }
};

export default rootReducer;