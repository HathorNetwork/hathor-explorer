import React, { useState } from 'react';
import { ReactComponent as RowDown } from '../assets/images/chevron-up.svg';

export const DropDetails = props => {
  const [open, setOpen] = useState(props.startOpen);

  const click = () => {
    if (props.onT) {
      props.onT();
    }
    setOpen(!open);
  };

  return (
    <div className={`container-drop-div ${open ? 'container-drop-div-open' : ''}`}>
      <div className="container-drop-header">
        <div className="container-drop-header-title">{props.title}</div>
        <div onClick={click}>
          <RowDown
            className="drop-arrow-color"
            width="24px"
            height="24px"
            style={{ transform: `${open ? 'rotate(180deg)' : ''}` }}
          />
        </div>
      </div>

      {open && <div className="container-drop-body">{props.children}</div>}
    </div>
  );
};
