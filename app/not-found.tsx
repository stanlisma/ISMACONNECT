import Link from "next/link";

export default function NotFound() {
  return (
    <div className="section">
      <div className="container">
        <div className="empty-state">
          <h3>Page not found</h3>
          <p>The listing or page you were looking for is no longer available.</p>
          <Link className="button" href="/browse">
            Browse listings
          </Link>
        </div>
      </div>
    </div>
  );
}

