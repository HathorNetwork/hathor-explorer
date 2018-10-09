const initialState = {
    transactions: 0,
    blocks: 0,
};

const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'dashboard_update':
      console.log(action);
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

export default rootReducer;