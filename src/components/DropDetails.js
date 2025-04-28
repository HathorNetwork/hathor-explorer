import React, { useState } from 'react';
import { ReactComponent as RowDown } from '../assets/images/chevron-up.svg';

/**
 * DropDetails component renders a collapsible section with a title and content body.
 * The body section can be toggled open or closed by clicking on the title.
 * Optionally, an external callback function can be triggered when the toggle occurs.
 *
 * @param {string} title - The title displayed in the header of the dropdown section.
 * @param {boolean} startOpen - Determines if the dropdown is open by default when the component is first rendered.
 * @param {Function} onToggle - Optional callback function triggered when the dropdown is toggled.
 *                          This function is called every time the user clicks to open or close the dropdown.
 * @param {ReactNode} children - The content displayed inside the dropdown body when it's open.
 *
 * @returns {JSX.Element} The DropDetails component, which includes a title and a collapsible body.
 */
export const DropDetails = ({ title, startOpen, onToggle, children }) => {
  const [open, setOpen] = useState(startOpen ?? false);

  /**
   * Toggles the open/close state of the dropdown and calls the optional onT callback.
   */
  const click = () => {
    if (onToggle) {
      onToggle(); // Trigger the onT callback if provided
    }
    setOpen(!open); // Toggle the open/close state of the dropdown
  };

  return (
    <div className={`container-drop-div ${open ? 'container-drop-div-open' : ''}`}>
      <div className="container-drop-header" onClick={click}>
        <div className="container-drop-header-title">{title}</div>
        <div>
          <RowDown
            className={`drop-arrow-color`}
            width="24px"
            height="24px"
            style={{ transform: `${!open ? 'rotate(180deg)' : ''}` }}
          />
        </div>
      </div>

      {open && <div className="container-drop-body">{children}</div>}
    </div>
  );
};
