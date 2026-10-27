import { verifyLogin } from '../actions';
import Submit from '@/components/admin/Submit';

export const dynamic = 'force-dynamic';

// A button rather than an automatic sign-in, so email link scanners can't use up the one-time link.
export default function Verify({ searchParams }) {
  const token = String(searchParams?.token || '');
  return (
    <main className="a-login">
      <div className="a-card">
        <img src="/logo.png" alt="" />
        <h1>Welcome back</h1>
        <p className="a-muted">Continue to open the Undaunted Lab admin on this device.</p>
        <form action={verifyLogin} className="a-form">
          <input type="hidden" name="token" value={token} />
          <Submit>Continue to admin</Submit>
        </form>
      </div>
    </main>
  );
}
