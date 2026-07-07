import "./style.css";
import { useState } from "react";

const navItems = [
  {
    section: "OVERVIEW",
    items: [{ label: "Introduction", icon: "fa-solid fa-house" }],
  },
  {
    section: "TRAINS",
    items: [
      { label: "PNR Status",          icon: "fa-solid fa-qrcode"          },
      { label: "Trains Between Stations", icon: "fa-solid fa-arrow-right-arrow-left" },
      { label: "Get Train Details",   icon: "fa-solid fa-train"            },
      { label: "Live Train Status",   icon: "fa-solid fa-satellite-dish"   },
      { label: "Train Route",         icon: "fa-solid fa-route"            },
    ],
  },
  {
    section: "STATIONS",
    items: [
      { label: "Station Board",       icon: "fa-solid fa-clipboard-list"   },
      { label: "Station Live Board",  icon: "fa-solid fa-tower-broadcast"  },
    ],
  },
];

const Sidebar = ({ activeItem, setActiveItem }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button className="sidebarToggle" onClick={() => setIsOpen(!isOpen)}>
        <i className={`fa-solid ${isOpen ? "fa-xmark" : "fa-bars"}`}></i>
      </button>

      {/* Overlay on mobile */}
      {isOpen && (
        <div className="sidebarOverlay" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`sidebar ${isOpen ? "sidebarOpen" : ""}`}>
        <div className="sidebarLogo">
          <i className="fa-solid fa-train-subway"></i>
          <span>RAIL<span className="logoAccent">ROUTE</span></span>
        </div>

        <nav className="sidebarNav">
          {navItems.map((group) => (
            <div className="navGroup" key={group.section}>
              <p className="navGroupLabel">{group.section}</p>
              {group.items.map((item) => (
                <button
                  key={item.label}
                  className={`navItem ${activeItem === item.label ? "navItemActive" : ""}`}
                  onClick={() => {
                    setActiveItem(item.label);
                    setIsOpen(false);
                  }}
                >
                  <i className={item.icon}></i>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebarFooter">
          <i className="fa-solid fa-circle statusDot"></i>
          <span>API Connected</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;