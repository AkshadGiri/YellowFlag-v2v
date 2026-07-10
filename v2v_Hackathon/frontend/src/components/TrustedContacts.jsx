import { useEffect, useState } from "react";
import { getContacts, addContact, deleteContact } from "../api/contacts";
import "./TrustedContacts.css";

export default function TrustedContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", phone: "", email: "", relation: "Friend", isPrimary: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    getContacts()
      .then(setContacts)
      .catch((e) => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setSaving(true);
    setError(null);
    try {
      await addContact(form);
      setForm({ name: "", phone: "", email: "", relation: "Friend", isPrimary: false });
      load();
    } catch (e2) {
      setError(e2.response?.data?.message || e2.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await deleteContact(id);
    load();
  };

  return (
    <div className="contacts-card">
      <h3>Trusted Contacts</h3>
      <p className="contacts-hint">
        Primary contacts are notified even at Level 1 (Feeling Unsafe). Everyone is notified at Level 2+.
      </p>

      {loading ? (
        <p className="contacts-hint">Loading…</p>
      ) : contacts.length === 0 ? (
        <p className="contacts-hint">No contacts yet — add someone below.</p>
      ) : (
        <ul className="contacts-list">
          {contacts.map((c) => (
            <li key={c._id} className="contacts-list-item">
              <div>
                <strong>{c.name}</strong> <span className="contacts-relation">({c.relation})</span>
                {c.isPrimary && <span className="contacts-primary-badge">Primary</span>}
                <div className="contacts-detail">{c.phone}{c.email ? ` · ${c.email}` : ""}</div>
              </div>
              <button className="contacts-remove" onClick={() => handleDelete(c._id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="contacts-form" onSubmit={handleSubmit}>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
        />
        <input
          placeholder="Email (optional)"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <select value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })}>
          <option>Friend</option>
          <option>Parent</option>
          <option>Sibling</option>
          <option>Partner</option>
          <option>Other</option>
        </select>
        <label className="contacts-checkbox">
          <input
            type="checkbox"
            checked={form.isPrimary}
            onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
          />
          Primary contact
        </label>
        <button type="submit" disabled={saving}>
          {saving ? "Adding…" : "Add Contact"}
        </button>
      </form>

      {error && <p className="sos-error">{error}</p>}
    </div>
  );
}
