/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import nanoApi from '../../api/nanoApi';
import Spinner from '../../components/Spinner';

hljs.registerLanguage('json', json);

/**
 * Screen to display nano contract execution logs
 *
 * @memberof Screens
 */
function NanoContractLogs() {
  const { tx_id } = useParams();
  const [logsResponse, setLogsResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const logsRef = useRef();

  useEffect(() => {
    loadLogs();
  }, [tx_id]);

  useEffect(() => {
    if (logsRef.current && logsResponse) {
      hljs.highlightBlock(logsRef.current);
    }
  }, [logsResponse]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await nanoApi.getLogs(tx_id);

      if (!response.success) {
        setErrorMessage(response.error || 'Failed to load nano contract logs');
        setLoading(false);
        return;
      }

      setLogsResponse(response);
      setLoading(false);
    } catch (error) {
      setErrorMessage(error.message || 'Error loading nano contract logs');
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  if (errorMessage) {
    return <p className="text-danger mb-4">{errorMessage}</p>;
  }

  return (
    <div className="blueprint-content-wrapper">
      <h3>Nano Contract Execution Logs</h3>
      <p className="blueprint-id-name-info">
        <strong>TRANSACTION ID: </strong>
        <span>{tx_id}</span>
      </p>
      <p className="blueprint-id-name-info">
        <strong>EXECUTION STATUS: </strong>
        <span>{logsResponse.nc_execution || 'error'}</span>
      </p>
      <div className="blueprint-attributes">
        <h4>Logs</h4>
        <div className="blueprint-source-code">
          <pre>
            <code ref={logsRef} className="language-json">
              {JSON.stringify(logsResponse.logs, null, 2)}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}

export default NanoContractLogs;
