export function SetupNotice() {
  return (
    <div className="setup-notice">
      <h3>Connect Supabase to load marketplace data</h3>
      <p>
        Add your project URL and anon key to <code>.env.local</code>, then run the SQL files in the
        <code> supabase/</code> folder to enable auth, listings, and seed data.
      </p>
    </div>
  );
}

