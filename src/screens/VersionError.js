/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { useDispatch } from 'react-redux';
import { MIN_API_VERSION } from '../constants';
import versionApi from '../api/version';
import helpers from '../utils/helpers';
import { isVersionAllowedUpdate } from '../actions/index';
import logo from '../assets/images/hathor-white-logo.png';
import Version from '../components/Version';

function VersionError() {
  const dispatch = useDispatch();

  const versionUpdated = async () => {
    try {
      const data = await versionApi.getVersion();
      dispatch(isVersionAllowedUpdate({ allowed: helpers.isVersionAllowed(data.version) }));
    } catch (e) {
      // Error in request
      console.error(e);
    }
  };

  return (
    <div>
      <div className="main-nav">
        <nav className="navbar navbar-expand-lg navbar-dark">
          <div className="d-flex flex-column align-items-center navbar-brand">
            <img src={logo} alt="" />
          </div>
          <div
            className="collapse navbar-collapse d-flex flex-column align-items-end"
            id="navbarSupportedContent"
          >
            <div>
              <Version />
            </div>
          </div>
        </nav>
      </div>
      <div className="content-wrapper">
        <p>
          Your API backend version is not compatible with this admin. We expect at least the version
          version {MIN_API_VERSION}
        </p>
        <p>Please update you API version and try again</p>
        <button className="btn btn-hathor" onClick={versionUpdated}>
          Try again
        </button>
      </div>
    </div>
  );
}

export default VersionError;
