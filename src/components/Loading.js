/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useEffect, useState } from 'react';

import Spinner from './Spinner';
import colors from '../index.scss';

const Loading = props => {
  const slowDelay = props.slowDelay || 3000;

  const [slowLoad, setSlowLoad] = useState(false);

  useEffect(() => {
    const updateSlowLoad = setTimeout(() => setSlowLoad(true), slowDelay);

    return () => {
      clearTimeout(updateSlowLoad);
    };
  });

  const { showSlowLoadMessage, useLoadingWrapper, ...reactLoadProps } = props;

  const renderNewUi = () => {
    return (
      <div className={useLoadingWrapper ? 'loading-wrapper' : ''}>
        <Spinner {...reactLoadProps} />
        {slowLoad && showSlowLoadMessage ? <span>Still loading... Please, be patient.</span> : null}
      </div>
    );
  };

  return renderNewUi();
};

Loading.defaultProps = {
  type: 'spin',
  color: colors.purpleHathor,
  delay: 500,
  showSlowLoadMessage: true,
  useLoadingWrapper: true,
};

export default Loading;
