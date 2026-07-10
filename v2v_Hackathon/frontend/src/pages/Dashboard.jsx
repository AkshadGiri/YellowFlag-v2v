import { useAuth } from "../context/AuthContext";
import SOSButton from "../components/SOSButton";
import TrustedContacts from "../components/TrustedContacts";
import "./Dashboard.css";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Community Safety Network</h1>
          <p>Hi {user?.name?.split(" ")[0] || "there"}, stay safe out there.</p>
        </div>
        <button className="dashboard-logout" onClick={logout}>
          Log out
        </button>
      </header>

      <main className="dashboard-main">
        <SOSButton />
        <TrustedContacts />
      </main>
    </div>
  );
}
