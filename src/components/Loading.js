/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

import ReactLoading from 'react-loading';
import colors from '../index.scss';


const Loading = (props) => {
    return (
        <div className="loading-wrapper">
            <ReactLoading {...props} />
        </div>
    ) 
} 

Loading.defaultProps =  {
    type: 'spin',
    color: colors.purpleHathor,
    delay: 500
}

export default Loading;