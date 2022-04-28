import React from "react";

const TokenErrorMessage = (props) => {
    return (
        <div className='col-12'>
            <span>
                <i className={`fa fa-frown-o`}></i>
                <strong> {props.message} </strong>
            </span>
        </div>
    )
}

export default TokenErrorMessage;