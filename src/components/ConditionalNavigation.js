import React from "react";
import { NavLink } from 'react-router-dom';
import { useFlag } from '@unleash/proxy-client-react';

const ConditionalNavigation = ({ featureToggle, to, label }) => {
    return (
        useFlag(featureToggle) ?
            <li className="nav-item">
                <NavLink to={to} exact className="nav-link" activeClassName="active" activeStyle={{ fontWeight: 'bold' }}>{label}</NavLink>
            </li> : null
    )
}

export default ConditionalNavigation;
