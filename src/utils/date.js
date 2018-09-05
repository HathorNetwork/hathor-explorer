const dateFormatter = {
  parseTimestamp(timestamp) {
    const d = new Date(timestamp*1000); // new Date in js expect milliseconds
    return `${d.toLocaleDateString('en-US')} ${d.toLocaleTimeString('en-US')}`;
  }
};

export default dateFormatter;