/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useEffect, useState } from 'react';
import { numberUtils } from '@hathor/wallet-lib';
import featureActivation from '../../utils/featureActivation';
import { ReactComponent as RowDown } from '../../assets/images/chevron-up.svg';
import { useIsMobile } from '../../hooks/useIsMobile';

const FeatureRow = ({ feature }) => {
  const [open, setOpen] = useState(false);

  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) {
      setOpen(false);
    }
  }, [isMobile]);

  const {
    acceptance,
    state,
    threshold,
    start_height,
    minimum_activation_height,
    timeout_height,
    lock_in_on_timeout,
    version,
    name,
  } = feature;

  const acceptance_percentage = acceptance === null ? '-' : `${(acceptance * 100).toFixed(0)}%`;
  const prettyState = featureActivation.getPrettyState(state);

  const renderNewUi = () => (
    <>
      <tr style={{ borderBottom: `${open ? 'none' : ''}` }}>
        <td className="d-lg-table-cell pe-3">{name}</td>
        <td className="d-lg-table-cell pe-3">
          <span
            className={`type-span ${prettyState === 'Active' ? 'span-green-tag' : 'span-red-tag'}`}
          >
            {prettyState}
          </span>
        </td>
        <td className="d-lg-table-cell pe-3 td-mobile">{acceptance_percentage}</td>
        <td className="d-lg-table-cell pe-3 td-mobile">{(threshold * 100).toFixed(0)}%</td>
        <td className="d-lg-table-cell pe-3 td-mobile">
          {numberUtils.prettyValue(start_height, 0)}
        </td>
        <td className="d-lg-table-cell pe-3 td-mobile">
          {numberUtils.prettyValue(minimum_activation_height, 0)}
        </td>
        <td className="d-lg-table-cell pe-3 td-mobile">
          {numberUtils.prettyValue(timeout_height, 0)}
        </td>
        <td className="d-lg-table-cell pe-3 td-mobile">{lock_in_on_timeout.toString()}</td>
        <td className="d-lg-table-cell pe-3 td-mobile">{version}</td>
        <td className="d-lg-table-cell pe-3 arrow-td-mobile">
          <RowDown
            onClick={() => setOpen(!open)}
            className="drop-arrow-color"
            width="24px"
            height="24px"
            style={{ transform: !open ? 'rotate(180deg)' : '' }}
          />
        </td>
      </tr>
      {open && (
        <>
          <tr className="tr-features-details">
            <td>
              <div className="address-container-title">acceptance</div>{' '}
            </td>
            <td>
              <span>{acceptance_percentage}</span>
            </td>
            <td></td>
          </tr>
          <tr className="tr-features-details">
            <td>
              <div className="address-container-title">threshold</div>{' '}
            </td>
            <td>
              <span>{(threshold * 100).toFixed(0)}%</span>
            </td>
            <td></td>
          </tr>
          <tr className="tr-features-details">
            <td>
              <div className="address-container-title">start height</div>{' '}
            </td>
            <td>
              <span>{numberUtils.prettyValue(start_height, 0)}</span>
            </td>
            <td></td>
          </tr>
          <tr className="tr-features-details">
            <td>
              <div className="address-container-title">minimum activ.height</div>{' '}
            </td>
            <td>
              <span>{numberUtils.prettyValue(minimum_activation_height, 0)}</span>
            </td>
            <td></td>
          </tr>
          <tr className="tr-features-details">
            <td>
              <div className="address-container-title">lock-in on timeout</div>{' '}
            </td>
            <td>
              <span>{lock_in_on_timeout.toString()}</span>
            </td>
            <td></td>
          </tr>
          <tr className="tr-features-details">
            <td>
              <div className="address-container-title">since version</div>
            </td>
            <td>
              <span>{version}</span>
            </td>
            <td></td>
          </tr>
        </>
      )}
    </>
  );

  return renderNewUi();
};

export default FeatureRow;
