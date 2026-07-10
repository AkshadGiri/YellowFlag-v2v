import { useAuth } from "../context/AuthContext";
import SOSButton from "../components/SOSButton";
import TrustedContacts from "../components/TrustedContacts";
import "./Dashboard.css";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-title">
          <h1>🦋 SafeSphere</h1>
          <h2>
            Welcome, <span>{user?.name?.split(" ")[0]}</span> 👋
          </h2>
          <p>
            Your safety is our priority. Press the SOS button only in case of
            emergency.
          </p>
        </div>

        <button className="dashboard-logout" onClick={logout}>
          Logout
        </button>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-sos">
          <SOSButton />
        </div>

        <div className="dashboard-contacts">
          <TrustedContacts />
        </div>
      </main>
    </div>
  );
}
