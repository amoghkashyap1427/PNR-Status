import "./style.css";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const navItems = [
  {
    section: "OVERVIEW",
    items: [
      { label: "Introduction",           icon: "fa-solid fa-house",                  path: "/introduction"       },
    ],
  },
  {
    section: "TRAINS",
    items: [
      { label: "PNR Status",             icon: "fa-solid fa-qrcode",                 path: "/pnr-status"         },
      { label: "Trains Between Stations",icon: "fa-solid fa-arrow-right-arrow-left", path: "/trains-between"     },
      { label: "Live Train Status",      icon: "fa-solid fa-satellite-dish",         path: "/live-train-status"  },
      { label: "Train Route",            icon: "fa-solid fa-route",                  path: "/train-route"        },
      { label: "Live Train Maps", icon: "fa-solid fa-bus-simple",         path: "/live-train-map"  },
    ],
  },
  {
    section: "STATIONS",
    items: [
      { label: "Station Board",          icon: "fa-solid fa-clipboard-list",         path: "/station-board"      },
      { label: "Station Live Board",     icon: "fa-solid fa-tower-broadcast",        path: "/station-live-board" },
    ],
  },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();     // tells us the current URL path

  return (
    <>
      <button className="sidebarToggle" onClick={() => setIsOpen(!isOpen)}>
        <i className={`fa-solid ${isOpen ? "fa-xmark" : "fa-bars"}`}></i>
      </button>

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
                  className={`navItem ${location.pathname === item.path ? "navItemActive" : ""}`}
                  onClick={() => {
                    navigate(item.path);
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