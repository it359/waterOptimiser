export default function Navbar() {
  return (
    <header className="shell-navbar">

      {/* Search box */}
      <div className="navbar-search">
        <span style={{ color:"#90a4ae" }}>🔍</span>
        <input type="text" placeholder="Search here for an account" />
      </div>

      {/* Right icons */}
      <div className="navbar-icons">

        <button className="navbar-icon-btn">❓</button>

        <div style={{ position:"relative" }}>
          <button className="navbar-icon-btn">🔔</button>
          {/* <div className="navbar-badge" style={{ background:"#fb8c00" }}>2</div> */}
        </div>

        <div style={{ position:"relative" }}>
          <button className="navbar-icon-btn">⬆</button>
          {/* <div className="navbar-badge" style={{ background:"#1976d2" }}>15</div> */}
        </div>

        <div style={{ position:"relative" }}>
          <button className="navbar-icon-btn">💬</button>
          {/* <div className="navbar-badge" style={{ background:"#43a047" }}>7</div> */}
        </div>

        <button className="navbar-icon-btn">👤</button>

      </div>
    </header>
  );
}
