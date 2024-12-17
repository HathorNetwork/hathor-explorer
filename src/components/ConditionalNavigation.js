import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { useFlag } from '@unleash/proxy-client-react';

const ConditionalNavigation = ({ featureToggle, to, label }) => {
  return useFlag(featureToggle) ? (
    <span className="nav-item">
      <NavLink
        to={to}
        exact
        className="nav-link"
        activeClassName="active"
        activeStyle={{ fontWeight: 'bold' }}
      >
        {label}
      </NavLink>
    </span>
  ) : null;
};

/**
 * featureToggle: The feature flag that will be evaluated to check if this component must be rendered
 * label: Navigation link that will render if feature toggle is enabled
 * to: Where this navigation link will point to
 */
ConditionalNavigation.propTypes = {
  featureToggle: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
};

export default ConditionalNavigation;
