/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState } from 'react';

import ReactLoading from 'react-loading';
import Spinner from './Spinner';
import colors from '../index.scss';
import { useNewUiEnabled } from '../hooks';

const Loading = props => {
  const newUiEnabled = useNewUiEnabled();
  const slowDelay = props.slowDelay || 3000;

  const [slowLoad, setSlowLoad] = useState(false);

  useEffect(() => {
    const updateSlowLoad = setTimeout(() => setSlowLoad(true), slowDelay);

    return () => {
      clearTimeout(updateSlowLoad);
    };
  });

  const { showSlowLoadMessage, useLoadingWrapper, ...reactLoadProps } = props;

  const renderUi = () => {
    return (
      <div className={useLoadingWrapper ? 'loading-wrapper' : ''}>
        <ReactLoading {...reactLoadProps} />
        {slowLoad && showSlowLoadMessage ? <span>Still loading... Please, be patient.</span> : null}
      </div>
    );
  };

  const renderNewUi = () => {
    return (
      <div className={useLoadingWrapper ? 'loading-wrapper' : ''}>
        <Spinner {...reactLoadProps} />
        {slowLoad && showSlowLoadMessage ? <span>Still loading... Please, be patient.</span> : null}
      </div>
    );
  };

  return newUiEnabled ? renderNewUi() : renderUi();
};

Loading.defaultProps = {
  type: 'spin',
  color: colors.purpleHathor,
  delay: 500,
  showSlowLoadMessage: true,
  useLoadingWrapper: true,
};

export default Loading;
