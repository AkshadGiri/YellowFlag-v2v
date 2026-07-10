import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        🦋 <span>SafeSphere</span>
      </div>

      <ul className="navbar-links">
        <li>
          <a href="#home">Home</a>
        </li>
        <li>
          <a href="#about">About</a>
        </li>
        <li>
          <a href="#features">Features</a>
        </li>
        <li>
          <a href="#contact">Contact</a>
        </li>
      </ul>

      <div className="navbar-buttons">
        <Link to="/login" className="login-btn">
          Login
        </Link>

        <Link to="/register" className="register-btn">
          Register
        </Link>
      </div>
    </nav>
  );
}
