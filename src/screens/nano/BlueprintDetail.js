/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useRef, useState } from 'react';
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import { useParams } from 'react-router-dom';
import Loading from '../../components/Loading';
import nanoApi from '../../api/nanoApi';
import { useNewUiEnabled } from '../../hooks';
import { DropDetails } from '../../components/DropDetails';

hljs.registerLanguage('python', python);

/**
 * Details of a Blueprint
 *
 * @memberof Screens
 */
function BlueprintDetail() {
  const { blueprint_id: blueprintId } = useParams();

  // blueprintInformation {Object | null} Blueprint information
  const [blueprintInformation, setBlueprintInformation] = useState(null);
  // blueprintSourceCode {string | null} Blueprint source code
  const [blueprintSourceCode, setBlueprintSourceCode] = useState(null);
  // loading {boolean} Bool to show/hide loading when getting blueprint information
  const [loading, setLoading] = useState(true);
  // errorMessage {string | null} Error message in case a request to get nano contract data fails
  const [errorMessage, setErrorMessage] = useState(null);
  // showCode {boolean} If should show the blueprint source code
  const [showCode, setShowCode] = useState(false);

  const codeRef = useRef();
  const newUiEnabled = useNewUiEnabled();

  useEffect(() => {
    let ignore = false;

    async function loadBlueprintInformation() {
      setLoading(true);
      setBlueprintInformation(null);
      try {
        const blueprintInformationData = await nanoApi.getBlueprintInformation(blueprintId);
        const blueprintSourceCodeData = await nanoApi.getBlueprintSourceCode(blueprintId);
        if (ignore) {
          // This is to prevent setting a state after the component has been already cleaned
          return;
        }
        setBlueprintInformation(blueprintInformationData);
        setBlueprintSourceCode(blueprintSourceCodeData.source_code);
      } catch (e) {
        if (ignore) {
          // This is to prevent setting a state after the component has been already cleaned
          return;
        }
        setErrorMessage('Error getting blueprint information.');
      } finally {
        setLoading(false);
      }
    }

    loadBlueprintInformation();
    return () => {
      ignore = true;
    };
  }, [blueprintId]);

  useEffect(() => {
    if (codeRef && codeRef.current) {
      hljs.highlightBlock(codeRef.current);
    }
  }, [blueprintSourceCode]);

  useEffect(() => {
    if (showCode && codeRef.current) {
      hljs.highlightBlock(codeRef.current);
    }
  }, [blueprintSourceCode, showCode]);

  if (errorMessage) {
    return <p className="text-danger mb-4">{errorMessage}</p>;
  }

  if (loading) {
    return <Loading />;
  }

  const renderBlueprintAttributes = () => {
    return (
      <div className="table-responsive">
        <table className="table table-striped table-bordered" id="attributes-table">
          <thead>
            <tr>
              <th className="d-lg-table-cell">Name</th>
              <th className="d-lg-table-cell">Type</th>
            </tr>
          </thead>
          <tbody>{renderAttributes()}</tbody>
        </table>
      </div>
    );
  };

  const renderNewUiBlueprintAttributes = () => {
    return (
      <div className="table-responsive blueprint-attrubutes-table">
        <table className="table-stylized" id="attributes-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>{renderAttributes()}</tbody>
        </table>
      </div>
    );
  };

  const renderAttributes = () => {
    return Object.entries(blueprintInformation.attributes).map(([name, type]) => {
      return (
        <tr key={name}>
          <td>{name}</td>
          <td>{type}</td>
        </tr>
      );
    });
  };

  const renderBlueprintMethods = (key, header) => {
    return (
      <div className="table-responsive mt-5">
        <table className="table table-striped table-bordered" id={`methods-table-${key}`}>
          <thead>
            <tr>
              <th className="d-lg-table-cell">{header}</th>
            </tr>
          </thead>
          <tbody>{renderMethods(key)}</tbody>
        </table>
      </div>
    );
  };

  const renderNewUiBlueprintMethods = (key, header) => {
    return (
      <div className="table-responsive blueprint-methods-table">
        <table className="table-stylized" id={`methods-table-${key}`}>
          <thead>
            <tr>
              <th className="blueprint-table-methods-header">{header}</th>
            </tr>
          </thead>
          <tbody>{renderMethods(key)}</tbody>
        </table>
      </div>
    );
  };

  const renderMethods = key => {
    return Object.entries(blueprintInformation[key]).map(([name, detail]) => {
      return (
        <tr key={name}>
          <td>{renderMethodDetails(name, detail.args, detail.return_type)}</td>
        </tr>
      );
    });
  };

  const renderMethodDetails = (name, args, returnType) => {
    const parameters = args.map(arg => `${arg.name}: ${arg.type}`);
    return `${name}(${parameters.join(', ')}): ${returnType === 'null' ? 'None' : returnType}`;
  };

  /**
   * Handle toggle click to hide or show the blueprint source code
   *
   * @param {Event} e Click event
   */
  const onToggleShowCode = e => {
    if (e) {
      e.preventDefault();
    }
    setShowCode(!showCode);
  };

  const renderUi = () => (
    <div className="content-wrapper">
      <h3 className="mt-4">Blueprint Information</h3>
      <div className="mt-5">
        <p>
          <strong>ID: </strong>
          {blueprintId}
        </p>
        <p>
          <strong>Name: </strong>
          {blueprintInformation.name}
        </p>
        <h4 className="mt-5 mb-4">Attributes</h4>
        {renderBlueprintAttributes()}
        {renderBlueprintMethods('public_methods', 'Public Methods')}
        {renderBlueprintMethods('private_methods', 'Private Methods')}
        <div className="d-flex flex-row align-items-center mb-4 mt-4">
          <h4 className="mb-0 me-3">Source Code</h4>
          <a href="true" onClick={e => onToggleShowCode(e)}>
            {showCode ? 'Hide' : 'Show'}
          </a>
        </div>
        <div className={`source-code ${showCode ? 'show' : ''}`}>
          <pre>
            <code ref={codeRef} className="language-python">
              {blueprintSourceCode}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );

  const renderNewUi = () => (
    <div className="blueprint-content-wrapper">
      <h3>Blueprint Information</h3>
      <p className="blueprint-id-name-info">
        <strong>ID: </strong>
        <span>{blueprintId}</span>
      </p>
      <p className="blueprint-id-name-info">
        <strong>NAME: </strong>
        <span>{blueprintInformation.name}</span>
      </p>
      <div className="blueprint-attributes">
        <h4>Attributes</h4>
        {renderNewUiBlueprintAttributes()}
      </div>
      <div className="blueprint-methods-container">
        <div className="blueprint-methods">
          {renderNewUiBlueprintMethods('public_methods', 'Public Methods')}
        </div>
        <div className="blueprint-methods">
          {renderNewUiBlueprintMethods('private_methods', 'Private Methods')}
        </div>
      </div>
      <div className="blueprint-source-code">
        <div style={{ display: 'flex' }}>
          <DropDetails title="Source Code" onToggle={e => onToggleShowCode(e)}>
            <div className={`source-code ${showCode ? 'show' : ''}`}>
              <pre>
                <code ref={codeRef} className="language-python">
                  {blueprintSourceCode}
                </code>
              </pre>
            </div>
          </DropDetails>
        </div>
      </div>
    </div>
  );

  return newUiEnabled ? renderNewUi() : renderUi();
}

export default BlueprintDetail;
