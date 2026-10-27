import './admin.css';

export const metadata = { title: 'Admin · Undaunted Lab', robots: { index: false, follow: false } };

export default function AdminRoot({ children }) {
  return <div className="adm">{children}</div>;
}
