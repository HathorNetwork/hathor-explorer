import $ from 'jquery';

const helpers = {
  showAlert(id, duration) {
    const el = $(`#${id}`);
    el.addClass('show');
    setTimeout(() => {
      el.removeClass('show');
    }, duration);
  },
}

export default helpers;