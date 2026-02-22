import PropTypes from 'prop-types';

const ErrorMessageWithIcon = ({ message }) => {
  return (
    <div className="col-12">
      <span>
        <i className={`fa fa-frown-o`}></i>
        <strong> {message} </strong>
      </span>
    </div>
  );
};

/**
 * message: Error message that will be shown to the customer with the icon
 */
ErrorMessageWithIcon.propTypes = {
  message: PropTypes.string.isRequired,
};

export default ErrorMessageWithIcon;
