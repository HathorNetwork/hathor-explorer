/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RecoveredTokenRow from './RecoveredTokenRow';

const UID = 'ab'.repeat(32);

describe('RecoveredTokenRow', () => {
  it('shows the recovered uid as text, never as a link', () => {
    const html = renderToStaticMarkup(<RecoveredTokenRow uid={UID} />);
    expect(html).toContain(UID);
    expect(html).toContain('abababab…');
    expect(html).not.toMatch(/<a[\s>]/);
    expect(html).not.toContain('token_detail');
  });
});
