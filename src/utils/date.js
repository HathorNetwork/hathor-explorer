/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const dateFormatter = {
  parseTimestamp(timestamp) {
    const d = new Date(timestamp * 1000); // new Date in js expect milliseconds
    return `${d.toLocaleDateString('en-US')} ${d.toLocaleTimeString('en-US')}`;
  },
  /**
   * Return the localized string of a SQL Timestamp value
   * @param {String} timestamp String with YYYY-MM-DD'T'HH:MM:SS'Z' format, like 2022-05-09T18:55:47Z
   * @returns The localized, user-friendly date string
   */
  parseTimestampFromSQLTimestamp(timestamp) {
    const d = new Date(timestamp);
    return `${d.toLocaleDateString('en-US')} ${d.toLocaleTimeString('en-US')}`;
  },

  timestampToString(timestamp) {
    return new Date(timestamp * 1000).toString();
  },

  uptimeFormat(uptime) {
    let tmpUptime = uptime;
    tmpUptime = Math.floor(tmpUptime);
    const days = Math.floor(tmpUptime / 3600 / 24);
    tmpUptime %= 3600 * 24;
    const hours = Math.floor(tmpUptime / 3600);
    tmpUptime %= 3600;
    const minutes = Math.floor(tmpUptime / 60);
    tmpUptime %= 60;
    const seconds = tmpUptime;
    const pad = n => (Math.abs(n) >= 10 ? n : `0${n}`);
    const uptime_str = `${days} days, ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    return uptime_str;
  },

  dateToTimestamp(date) {
    return Math.floor(date.getTime() / 1000);
  },

  parseTimestampNewUi(timestamp) {
    const date = new Date(timestamp * 1000);
    const userLocale = navigator.language || navigator.userLanguage || 'en-US';
    return new Intl.DateTimeFormat(userLocale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  },
};

export default dateFormatter;
