/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { useNewUiEnabled } from '../../hooks';

function ErrorMessage() {
  const newUiEnabled = useNewUiEnabled();

  const refreshPage = () => {
    window.location.reload();
  };

  return newUiEnabled ? (
    <div className="error-message-container">
      <span role="img" aria-label="sad face">
        😞
      </span>
      <p style={{ marginBottom: '0px', marginTop: '1rem' }}>Error loading.</p>
      <p style={{ marginBottom: '1rem', marginTop: '0px' }}>Please try again.</p>
      <button
        className="error-massage-button"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarSupportedContent"
        aria-controls="navbarSupportedContent"
        aria-expanded="false"
        aria-label="Toggle navigation"
        onClick={refreshPage}
      >
        <span className="footer-title">Refresh page</span>
      </button>
    </div>
  ) : (
    <div className="content-wrapper">
      <h3 className="text-danger">
        Error loading the explorer. Please reload the page to try again.
      </h3>
    </div>
  );
}

export default ErrorMessage;
