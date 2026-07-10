import "./Features.css";

export default function Features() {
  return (
    <section className="features" id="features">
      <h2>Why Choose SafeSphere?</h2>

      <p className="features-subtitle">
        Built to provide quick assistance and peace of mind whenever you need
        it.
      </p>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">🚨</div>
          <h3>Instant SOS</h3>
          <p>
            Press and hold the SOS button to instantly notify your trusted
            contacts.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📍</div>
          <h3>Live Location</h3>
          <p>
            Your real-time location is shared so your loved ones know exactly
            where you are.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">👨‍👩‍👧</div>
          <h3>Trusted Contacts</h3>
          <p>
            Add family and friends who will receive emergency notifications.
          </p>
        </div>
      </div>
    </section>
  );
}
