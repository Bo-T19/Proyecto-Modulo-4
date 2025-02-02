import * as React from "react";
import * as Router from "react-router-dom"

export function Sidebar() {
  return (
    <aside id="sidebar" >
      <img id="company-logo" src="./assets/be-bop-tools-logo.jpg" alt="Be-bop Tools" />
      <ul id="nav-buttons">

        <Router.Link to="/users">
          <li><span className="material-icons-round">people</span>Users</li>
        </Router.Link>

        <Router.Link to="/">
          <li id="home button"><span className="material-icons-round">apartment</span>Projects</li>
        </Router.Link>
      </ul>
    </aside>
  )
}