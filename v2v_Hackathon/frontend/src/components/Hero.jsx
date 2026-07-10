import { Link } from "react-router-dom";
import woman from "../assets/images/women-Photoroom.png";
import "./Hero.css";

export default function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-left">
        <span className="hero-badge">🌼 Women's Safety Platform</span>

        <h1>
          Your Safety,
          <br />
          <span>One Tap Away.</span>
        </h1>

        <p>
          SafeSphere empowers women with instant SOS alerts, trusted contacts,
          and live location sharing whenever they need help.
        </p>

        <div className="hero-buttons">
          <Link to="/register" className="hero-primary">
            Get Started
          </Link>

          <a href="#features" className="hero-secondary">
            Learn More
          </a>
        </div>
      </div>

      <div className="hero-right">
        <img src={woman} alt="Woman using phone" className="hero-image" />
      </div>
    </section>
  );
}
