export const metadata = { title: 'Page not found · Undaunted Lab' };

// Any unknown address lands here, including old links to pages from the previous site.
export default function NotFound() {
  return (
    <main className="ul-404">
      <div className="in">
        <img src="/logo.png" alt="" width={64} height={64} />
        <span className="kicker">Page not found</span>
        <h1>This page has drifted off the map.</h1>
        <p>The link may be old or mistyped. Everything we make is on the map.</p>
        <a className="btn" href="/">Back to the map</a>
      </div>
    </main>
  );
}
