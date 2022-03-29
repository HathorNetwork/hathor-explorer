import React from 'react'
import PropTypes from 'prop-types';

class TokenSearchField extends React.Component {
    render() {
        return (
            <div className="d-flex flex-row align-items-center navigation-search-token">
                <div className="d-flex flex-row align-items-center col-12">
                    <input className="form-control mr-2" type="search" value={this.props.searchText} onChange={this.props.onSearchTextChanged} placeholder="Search UID, name, symbol, or type" aria-label="Search" ref="tokenSearch" />
                    <i className="fa fa-search pointer" onClick={(e) => this.props.onSearchButtonClicked(e)}></i>
                </div>
            </div>
        )
    }
}

/**
 * onSearchButtonClicked: Function called when search button is clicked
 * onSearchTextChanged: Function called when search text changes
 * searchText: Search text inputted by user
 */
TokenSearchField.propTypes = {
    onSearchButtonClicked: PropTypes.func.isRequired,
    onSearchTextChanged: PropTypes.func.isRequired,
    searchText: PropTypes.string.isRequired
}

export default TokenSearchField;
