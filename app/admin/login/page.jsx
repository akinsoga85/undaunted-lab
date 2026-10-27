import { requestLogin } from '../actions';
import Submit from '@/components/admin/Submit';

export const dynamic = 'force-dynamic';

export default function Login({ searchParams }) {
  const sent = searchParams?.sent === '1';
  const expired = searchParams?.error === 'expired';
  return (
    <main className="a-login">
      <div className="a-card">
        <img src="/logo.png" alt="" />
        <h1>Sign in to the lab</h1>
        {sent ? (
          <div className="a-note ok" role="status">If that email is allowed, a sign-in link is on its way. It works once and expires in 15 minutes.</div>
        ) : (
          <p className="a-muted">Enter your email and we’ll send you a one-time sign-in link.</p>
        )}
        {expired && <div className="a-note err" role="alert">That link has expired or was already used. Ask for a new one.</div>}
        <form action={requestLogin} className="a-form">
          <label className="a-field" htmlFor="email"><span>Email</span>
            <input id="email" name="email" type="email" autoComplete="email" required placeholder="you@undauntedlab.com" />
          </label>
          <Submit>Email me a sign-in link</Submit>
        </form>
        <a href="/" className="a-muted" style={{ fontSize: 14 }}>← Back to the site</a>
      </div>
    </main>
  );
}
