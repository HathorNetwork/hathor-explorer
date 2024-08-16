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
    uptime = Math.floor(uptime);
    const days = Math.floor(uptime / 3600 / 24);
    uptime %= 3600 * 24;
    const hours = Math.floor(uptime / 3600);
    uptime %= 3600;
    const minutes = Math.floor(uptime / 60);
    uptime %= 60;
    const seconds = uptime;
    const pad = n => (Math.abs(n) >= 10 ? n : `0${n}`);
    const uptime_str = `${days} days, ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    return uptime_str;
  },

  dateToTimestamp(date) {
    return Math.floor(date.getTime() / 1000);
  },
};

export default dateFormatter;
