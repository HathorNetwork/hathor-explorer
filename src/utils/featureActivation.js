const featureActivation = {
  getPrettyState(state) {
    const prettyStates = {
      DEFINED: 'Defined',
      STARTED: 'Started',
      MUST_SIGNAL: 'Must Signal',
      LOCKED_IN: 'Locked-in',
      ACTIVE: 'Active',
      FAILED: 'Failed',
    };

    return prettyStates[state] || state;
  },
};

export default featureActivation;
