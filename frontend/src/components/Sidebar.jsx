import logo from "../assets/logo-white.png";

const NAV_ITEMS = [
  { id:"dashboard", label:"Dashboard", icon:"⊞" },
  { id:"fleetview", label:"Fleet View", icon:"⊟" },
  { id:"activity",  label:"Activity",   icon:"≡" },
  { id:"trends",    label:"Trends",     icon:"∿" },
  { id:"dataentry", label:"Data Entry", icon:"✎" },
  { id:"inventory", label:"Inventry",   icon:"⬡" },
  { id:"reports",   label:"Reports",    icon:"⎙" },
  { id:"taskbar",   label:"Taskbar",    icon:"☰" },
  { id:"alarms",    label:"Alarms",     icon:"🔔" },
  { id:"files",     label:"Files",      icon:"📁" },
  { id:"accounts",  label:"Accounts",   icon:"⚙" },
  { id:"analytics", label:"Analitics",  icon:"⊙" },
];

export default function Sidebar({ activeNav, setActiveNav }) {
  return (
    <aside className="sidebar">

      {/* Logo */}
      <div className="sidebar-logo">
        <img src={logo} alt="Ariceo" />
        <sup className="topbar-tm">™</sup>
      </div>

      {/* Nav links */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <div
            key={item.id}
            className={`nav-item${activeNav === item.id ? " active" : ""}`}
            onClick={() => setActiveNav(item.id)}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      {/* User profile */}
      {/* <div className="sidebar-user">
        <div className="sidebar-avatar">A</div>
        <div>
          <div style={{ color:"#fff", fontSize:12, fontWeight:700 }}>Akshay S.</div>
          <div style={{ color:"rgba(160,190,220,0.7)", fontSize:10, textTransform:"uppercase" }}>Admin</div>
        </div>
      </div> */}

    </aside>
  );
}
