export function MapPanelSkeleton() {
  return (
    <div className="local-map-shell surface local-map-shell-skeleton" aria-hidden="true">
      <div className="local-map-shell-head">
        <div>
          <span className="eyebrow">Map view</span>
          <div className="route-loading-line is-medium" />
          <div className="route-loading-line is-long" />
        </div>
        <div className="local-map-mini-stats local-map-mini-stats-skeleton">
          <span className="route-loading-chip" />
          <span className="route-loading-chip" />
        </div>
      </div>

      <div className="local-map-layout">
        <div className="local-map-canvas">
          <div className="local-map-stage local-map-stage-skeleton">
            <div className="route-loading-media local-map-google-stage-skeleton" />
          </div>
        </div>

        <div className="local-map-sidebar">
          <div className="local-map-sidebar-card local-map-sidebar-card-skeleton">
            <div className="route-loading-line is-short" />
            <div className="route-loading-chip-row">
              <span className="route-loading-chip" />
              <span className="route-loading-chip" />
              <span className="route-loading-chip" />
            </div>
            <div className="route-loading-line is-medium" />
          </div>
        </div>
      </div>
    </div>
  );
}
