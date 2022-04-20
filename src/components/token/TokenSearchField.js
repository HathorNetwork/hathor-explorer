import React from 'react'
import PropTypes from 'prop-types';
import Loading from '../Loading';

class TokenSearchField extends React.Component {
    render() {
        return (
            <div className="d-flex flex-row align-items-center navigation-search-token">
                <div className="d-flex flex-row align-items-center col-12">
                    <input className="form-control mr-2 search-input" type="search" value={this.props.searchText} onKeyUp={this.props.onSearchTextKeyUp} onChange={this.props.onSearchTextChanged} placeholder="Search UID, name, symbol, or type" aria-label="Search" ref="tokenSearch" />
                    {(this.props.isSearchLoading && !this.props.loading) ?
                        <Loading width={25} height={25} delay={0} useLoadingWrapper={false} showSlowLoadMessage={false} /> :
                        <i className="fa fa-search pointer" onClick={(e) => this.props.onSearchButtonClicked(e)} />
                    }
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
