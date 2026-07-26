import { AdminUserStatusForm } from "@/components/admin/admin-user-status-form";
import { EmptyState } from "@/components/ui/empty-state";
import { FlashMessage } from "@/components/ui/flash-message";
import { requireAdminViewer } from "@/lib/auth";
import { getAllUsersForAdmin } from "@/lib/data";
import { formatDate, getSingleParam } from "@/lib/utils";

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireAdminViewer();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const search = getSingleParam(resolvedSearchParams?.q);
  const users = await getAllUsersForAdmin(search);

  return (
    <>
      <FlashMessage message={getSingleParam(resolvedSearchParams?.success)} tone="success" />
      <FlashMessage message={getSingleParam(resolvedSearchParams?.error)} tone="error" />

      <div className="surface" style={{ marginBottom: "1.25rem" }}>
        <span className="eyebrow">All users</span>
        <h2 className="section-title">Suspend or restore user access</h2>
        <p className="section-copy">
          Suspending a user blocks them from signing in and hides their listings and storefronts until you
          restore access. This is separate from a user deactivating their own account.
        </p>

        <form method="get" className="action-row" style={{ marginTop: "1rem" }}>
          <input
            className="input"
            type="text"
            name="q"
            placeholder="Search by name or email"
            defaultValue={search ?? ""}
          />
          <button className="button button-secondary" type="submit">
            Search
          </button>
        </form>
      </div>

      {users.length === 0 ? (
        <EmptyState
          title="No users found"
          description={search ? "No users match that search." : "There are no users yet."}
        />
      ) : (
        <div className="dashboard-list">
          {users.map((user) => (
            <div className="dashboard-listing" key={user.id}>
              <div className="badge-row">
                <span className="badge badge-soft">{user.role === "admin" ? "Admin" : "Member"}</span>
                {user.suspended_at ? <span className="badge badge-danger">Suspended</span> : null}
                {user.deactivated_at ? <span className="badge badge-neutral">Deactivated by user</span> : null}
              </div>

              <h3>{user.full_name || "Unnamed member"}</h3>
              <p>
                {user.email || "No email on file"} · Joined {formatDate(user.created_at)}
              </p>

              {user.suspended_reason ? <p>Suspension reason: {user.suspended_reason}</p> : null}

              <AdminUserStatusForm
                userId={user.id}
                isSuspended={Boolean(user.suspended_at)}
                disabled={user.id === viewer.user.id}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
