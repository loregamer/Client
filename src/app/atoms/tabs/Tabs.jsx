import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';

import RawIcon from '../system-icons/RawIcon';
import Button from '../button/Button';

const TabItem = React.forwardRef(
  (
    {
      selected = false,
      iconSrc = null,
      faSrc = null,
      onClick = null,
      children,
      disabled = false,
      className = '',
    },
    ref,
  ) => {
    const isSelected = selected ? 'active' : '';

    return (
      <td ref={ref} className="p-0 border-0" style={{ minWidth: '150px' }}>
        <Button
          className={`btn-outline-theme-bg py-2 rounded-0 rounded-top w-100 ${isSelected} ${className}`}
          iconSrc={iconSrc}
          faSrc={faSrc}
          onClick={onClick}
          disabled={disabled}
        >
          {children}
        </Button>
      </td>
    );
  },
);

TabItem.propTypes = {
  selected: PropTypes.bool,
  className: PropTypes.string,
  iconSrc: PropTypes.string,
  faSrc: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
};

function Tabs({
  items,
  defaultSelected = 0,
  onSelect,
  className,
  isFullscreen = false,
  id,
  requestClose,
}) {
  const [selectedItem, setSelectedItem] = useState(items[defaultSelected]);
  const tabRef = useRef(null);

  const handleTabSelection = (item, index) => {
    if (selectedItem === item) return;
    setSelectedItem(item);
    onSelect(item, index);
  };

  let isFullscreenMode = isFullscreen;
  if (isFullscreen && window.matchMedia('screen and (max-width: 768px)').matches) {
    isFullscreenMode = false;
  }

  return !isFullscreenMode ? (
    <div
      id={id}
      ref={tabRef}
      className={`table-responsive hide-scrollbar noselect ${className}`}
      onWheel={(e) => {
        const scrollContainer = tabRef.current;
        scrollContainer.scrollLeft -= e.deltaY;
      }}
    >
      <table className="table border-0 m-0">
        <tbody>
          <tr>
            {items.map(
              (item, index) =>
                item.type !== 'divider' && (
                  <TabItem
                    key={`tabs_${id}_tabItem_${item.key}`}
                    selected={selectedItem.text === item.text}
                    iconSrc={item.iconSrc}
                    faSrc={item.faSrc}
                    className={item.className}
                    onClick={
                      typeof item.onClick !== 'function'
                        ? () => handleTabSelection(item, index)
                        : item.onClick
                    }
                    disabled={item.disabled}
                  >
                    {item.text}
                    {item.badge && typeof item.badge.text === 'string' ? (
                      <span
                        className={
                          typeof item.badge.color === 'string'
                            ? `badge bg-${item.badge.color} ms-1`
                            : null
                        }
                      >
                        <span>{item.badge.text}</span>
                      </span>
                    ) : null}
                  </TabItem>
                ),
            )}
          </tr>
        </tbody>
      </table>
    </div>
  ) : (
    <div id={id} ref={tabRef} className={`d-flex align-items-start noselect ${className}`}>
      <div
        className="nav flex-column nav-pills me-3 w-100"
        id="tabs-scroll-pills-tab"
        role="tablist"
        aria-orientation="vertical"
      >
        <button
          id="setting-close"
          className="nav-link"
          data-bs-toggle="pill"
          type="button"
          role="tab"
          aria-selected="false"
          onClick={requestClose}
        >
          <RawIcon size="small" className="me-2" fa="fa-solid fa-circle-xmark" />
          <span>Close</span>
        </button>

        <hr id="setting-close-hr" className="border-bg2" />

        {items.map((item, index) => {
          if (item.type !== 'divider') {
            return (
              <button
                key={`tabs_items_${item.key}`}
                className={`nav-link small ${item.className} ${selectedItem.text === item.text ? 'active' : ''}`}
                data-bs-toggle="pill"
                type="button"
                role="tab"
                aria-selected="false"
                onClick={
                  typeof item.onClick !== 'function'
                    ? () => handleTabSelection(item, index)
                    : item.onClick
                }
                disabled={item.disabled ? 'disabled' : null}
              >
                {item.iconSrc && <RawIcon size="small" className="me-2" src={item.iconSrc} />}
                {item.faSrc && <RawIcon size="small" className="me-2" fa={item.faSrc} />}
                {item.text}
                {item.badge && typeof item.badge.text === 'string' ? (
                  <span
                    className={
                      typeof item.badge.color === 'string'
                        ? `badge bg-${item.badge.color} ms-1`
                        : null
                    }
                  >
                    <span>{item.badge.text}</span>
                  </span>
                ) : null}
              </button>
            );
          }

          return <hr key={`tabs_items_divider_${item.key}`} className="border-bg2" />;
        })}
      </div>
    </div>
  );
}

Tabs.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      iconSrc: PropTypes.string,
      text: PropTypes.string,
      disabled: PropTypes.bool,
    }),
  ).isRequired,
  isFullscreen: PropTypes.bool,
  defaultSelected: PropTypes.number,
  className: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
};

export default Tabs;
