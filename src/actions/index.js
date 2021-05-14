/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const dashboardUpdate = data => ({ type: "dashboard_update", payload: data });

export const isVersionAllowedUpdate = data => ({ type: "is_version_allowed_update", payload: data });

export const apiLoadErrorUpdate = data => ({ type: 'api_load_error_update', payload: data })