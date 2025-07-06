/** @jsxImportSource @builder.io/qwik */
import { $, component$, useSignal, useTask$ } from '@builder.io/qwik';

interface RoomSyncManagerProps {
  hotelDomain: string;
  className?: string;
}

interface SyncRecommendation {
  directusRoomId: string;
  directusRoomName: string;
  suggestedCloudbedsRoomId: string;
  cloudbedsRoomName: string;
  confidence: string;
}

interface SyncStatus {
  totalRooms: number;
  roomsWithPmsId: number;
  roomsWithoutPmsId: number;
  mappingCoverage: number;
}

interface SyncResult {
  roomName: string;
  status: string;
  error?: string;
  pmsRoomId?: string;
}

interface SyncData {
  syncStatus: SyncStatus;
  syncRecommendations: SyncRecommendation[];
  summary: {
    totalRooms: number;
    mappedRooms: number;
    roomsNeedingSync: number;
    roomsUpdated: number;
    roomsWithErrors: number;
  };
}

export const RoomSyncManager = component$<RoomSyncManagerProps>(
  ({ hotelDomain, className = '' }) => {
    const syncData = useSignal<SyncData | null>(null);
    const isLoading = useSignal(false);
    const error = useSignal('');
    const isAutoSyncing = useSignal(false);
    const syncResults = useSignal<SyncResult[]>([]);

    // Load sync status
    const loadSyncStatus = $(async () => {
      isLoading.value = true;
      error.value = '';

      try {
        const response = await fetch(
          `/api/booking/sync-room-ids?hotelDomain=${encodeURIComponent(hotelDomain)}`
        );
        const data = await response.json();

        if (data.success) {
          syncData.value = data;
        } else {
          error.value = data.error || 'Failed to load sync status';
        }
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Unknown error';
      } finally {
        isLoading.value = false;
      }
    });

    // Perform automatic sync
    const performAutoSync = $(async () => {
      isAutoSyncing.value = true;
      error.value = '';

      try {
        const response = await fetch('/api/booking/sync-room-ids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hotelDomain,
            autoUpdate: true,
          }),
        });

        const data = await response.json();

        if (data.success) {
          syncResults.value = data.updatedRooms || [];
          syncData.value = data;

          // Show success message
          const successCount = data.summary.roomsUpdated;
          const errorCount = data.summary.roomsWithErrors;

          if (successCount > 0) {
            alert(
              `Successfully synced ${successCount} room${successCount > 1 ? 's' : ''}!${errorCount > 0 ? ` ${errorCount} room${errorCount > 1 ? 's' : ''} had errors.` : ''}`
            );
          } else if (errorCount > 0) {
            alert(
              `Failed to sync ${errorCount} room${errorCount > 1 ? 's' : ''}. Please check the logs.`
            );
          } else {
            alert('No rooms needed syncing.');
          }
        } else {
          error.value = data.error || 'Failed to perform auto sync';
        }
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Unknown error';
      } finally {
        isAutoSyncing.value = false;
      }
    });

    // Load data on component mount
    useTask$(() => {
      void loadSyncStatus();
    });

    const getSyncStatusColor = () => {
      if (!syncData.value) return 'neutral';
      const coverage = syncData.value.syncStatus.mappingCoverage;
      if (coverage >= 90) return 'success';
      if (coverage >= 70) return 'warning';
      return 'error';
    };

    const getSyncPercentage = () => {
      if (!syncData.value) return 0;
      const { roomsWithPmsId, totalRooms } = syncData.value.syncStatus;
      return totalRooms > 0
        ? Math.round((roomsWithPmsId / totalRooms) * 100)
        : 0;
    };

    return (
      <div class={`room-sync-manager ${className}`}>
        <div class="bg-base-100 shadow-xl card">
          <div class="card-body">
            <h3 class="text-primary card-title">
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>Sync icon</title>
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              PMS Room ID Synchronization
            </h3>

            {isLoading.value && (
              <div class="flex justify-center py-8">
                <span class="loading loading-spinner loading-lg"></span>
              </div>
            )}

            {error.value && (
              <div class="alert alert-error">
                <svg
                  class="stroke-current w-6 h-6 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <title>Error icon</title>
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{error.value}</span>
              </div>
            )}

            {syncData.value && (
              <div class="space-y-6">
                {/* Sync Status Overview */}
                <div class="shadow stats stats-vertical lg:stats-horizontal">
                  <div class="stat">
                    <div class="stat-title">Total Rooms</div>
                    <div class="text-primary stat-value">
                      {syncData.value.syncStatus.totalRooms}
                    </div>
                  </div>

                  <div class="stat">
                    <div class="stat-title">Synced Rooms</div>
                    <div class={`stat-value text-${getSyncStatusColor()}`}>
                      {syncData.value.syncStatus.roomsWithPmsId}
                    </div>
                    <div class="stat-desc">{getSyncPercentage()}% synced</div>
                  </div>

                  <div class="stat">
                    <div class="stat-title">Mapping Coverage</div>
                    <div class="text-info stat-value">
                      {Math.round(syncData.value.syncStatus.mappingCoverage)}%
                    </div>
                    <div class="stat-desc">Cloudbeds mapping</div>
                  </div>
                </div>

                {/* Sync Progress */}
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span>Sync Progress</span>
                    <span>{getSyncPercentage()}%</span>
                  </div>
                  <progress
                    class={`progress progress-${getSyncStatusColor()} w-full`}
                    value={getSyncPercentage()}
                    max="100"
                  ></progress>
                </div>

                {/* Sync Recommendations */}
                {syncData.value.syncRecommendations.length > 0 && (
                  <div>
                    <div class="flex justify-between items-center mb-4">
                      <h4 class="font-semibold text-warning">
                        🔄 Rooms Ready for Sync
                      </h4>
                      <button
                        type="button"
                        class={`btn btn-primary btn-sm ${isAutoSyncing.value ? 'loading' : ''}`}
                        onClick$={performAutoSync}
                        disabled={isAutoSyncing.value || isLoading.value}
                      >
                        {isAutoSyncing.value ? 'Syncing...' : 'Auto-Sync All'}
                      </button>
                    </div>

                    <div class="space-y-2">
                      {syncData.value.syncRecommendations.map(
                        (recommendation, index) => (
                          <div
                            key={`${recommendation.directusRoomName}-${index}`}
                            class="flex justify-between items-center bg-warning/10 p-3 rounded-lg"
                          >
                            <div>
                              <span class="font-medium">
                                {recommendation.directusRoomName}
                              </span>
                              <span class="opacity-70 ml-2 text-sm">
                                → {recommendation.cloudbedsRoomName}
                              </span>
                            </div>
                            <div class="text-right">
                              <div class="badge badge-warning">
                                {recommendation.confidence} confidence
                              </div>
                              <div class="opacity-70 mt-1 text-xs">
                                ID: {recommendation.suggestedCloudbedsRoomId}
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Recent Sync Results */}
                {syncResults.value.length > 0 && (
                  <div>
                    <h4 class="mb-3 font-semibold text-success">
                      ✅ Recent Sync Results
                    </h4>
                    <div class="space-y-2">
                      {syncResults.value.map((result, index) => (
                        <div
                          key={`${result.roomName}-${result.status}-${index}`}
                          class={`flex justify-between items-center p-3 rounded-lg ${
                            result.status === 'updated'
                              ? 'bg-success/10'
                              : 'bg-error/10'
                          }`}
                        >
                          <div>
                            <span class="font-medium">{result.roomName}</span>
                            {result.error && (
                              <p class="mt-1 text-error text-sm">
                                {result.error}
                              </p>
                            )}
                          </div>
                          <div class="text-right">
                            <div
                              class={`badge ${result.status === 'updated' ? 'badge-success' : 'badge-error'}`}
                            >
                              {result.status}
                            </div>
                            {result.pmsRoomId && (
                              <div class="opacity-70 mt-1 text-xs">
                                PMS ID: {result.pmsRoomId}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Sync Needed */}
                {syncData.value.syncRecommendations.length === 0 &&
                  syncData.value.syncStatus.roomsWithoutPmsId === 0 && (
                    <div class="alert alert-success">
                      <svg
                        class="stroke-current w-6 h-6 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <title>Success icon</title>
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>All rooms are properly synced with PMS IDs!</span>
                    </div>
                  )}

                {/* Instructions */}
                <div class="alert alert-info">
                  <svg
                    class="stroke-current w-6 h-6 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <title>Information icon</title>
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h4 class="font-bold">About PMS Room ID Sync</h4>
                    <ul class="space-y-1 mt-2 text-sm">
                      <li>
                        • PMS Room IDs link Directus rooms to Cloudbeds rooms
                      </li>
                      <li>
                        • Auto-sync matches rooms by name and updates Directus
                      </li>
                      <li>
                        • This enables real-time availability and booking
                        functionality
                      </li>
                      <li>
                        • Sync is required for the booking system to work
                        properly
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Refresh Button */}
                <div class="justify-center card-actions">
                  <button
                    type="button"
                    class={`btn btn-outline ${isLoading.value ? 'loading' : ''}`}
                    onClick$={loadSyncStatus}
                    disabled={isLoading.value || isAutoSyncing.value}
                  >
                    {isLoading.value ? 'Refreshing...' : 'Refresh Status'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
