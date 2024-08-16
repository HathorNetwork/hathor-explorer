/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState } from 'react';
import Loading from '../../components/Loading';
import nanoApi from '../../api/nanoApi';

/**
 * Details of a Nano Contract
 *
 * @memberof Screens
 */
function BlueprintDetail(props) {
  const blueprintId = props.match.params.blueprint_id;

  // blueprintInformation {Object | null} Blueprint information
  const [blueprintInformation, setBlueprintInformation] = useState(null);
  // loading {boolean} Bool to show/hide loading when getting blueprint information
  const [loading, setLoading] = useState(true);
  // errorMessage {string | null} Error message in case a request to get nano contract data fails
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadBlueprintInformation() {
      setLoading(true);
      setBlueprintInformation(null);
      try {
        const blueprintInformation = await nanoApi.getBlueprintInformation(blueprintId);
        if (ignore) {
          // This is to prevent setting a state after the component has been already cleaned
          return;
        }
        setBlueprintInformation(blueprintInformation);
        setLoading(false);
      } catch (e) {
        if (ignore) {
          // This is to prevent setting a state after the component has been already cleaned
          return;
        }
        setErrorMessage('Error getting blueprint information.');
        setLoading(false);
      }
    }

    loadBlueprintInformation();
    return () => {
      ignore = true;
    };
  }, [blueprintId]);

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

  return (
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
        <hr />
      </div>
    </div>
  );
}

export default BlueprintDetail;
