import React from 'react';
import './Sidebar.css';
import assets from '../assets/assets';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="logo">Clyrina</div>
      <menu>
        <nav className="nav">
          <ul>
            <li className="nav-item active"><span>Cameras</span></li>
            <li className="nav-item"><span>Trackers</span></li>
          </ul>
        </nav>
        <div className="profile-section">
          <img src={assets.pfp} alt="Profile" className="profile-pic" />
          <span className="profile-name">Arkraj Kundu</span>
          <button className="logout-btn">Log out</button>
        </div>
      </menu>
    </div>
  );
};

export default Sidebar;
