const r=window.location.hostname;let u=null;async function l(){document.getElementById("diagnostics-container");try{const e=await(await fetch(`/api/booking/diagnose?hotelDomain=${encodeURIComponent(r)}`)).json();e.success?(u=e.diagnostics,v(e.diagnostics,e.connectionTest)):d(e.error||"Failed to load diagnostics")}catch(s){d(s.message)}}function v(s,e){const i=document.getElementById("diagnostics-container"),t=s.issues.length>0,o=t?"error":"success",c=t?"❌":"✅";i.innerHTML=`
        <!-- Overall Status -->
        <div class="alert alert-${o}">
          <div class="flex items-center">
            <span class="mr-3 text-2xl">${c}</span>
            <div>
              <h3 class="font-bold">
                ${t?"Configuration Issues Detected":"System Configuration OK"}
              </h3>
              <p class="text-sm">
                ${t?`${s.issues.length} issue(s) found`:"All systems operational"}
              </p>
            </div>
          </div>
        </div>

        <!-- Hotel Information -->
        <div class="bg-base-100 shadow-xl card">
          <div class="card-body">
            <h3 class="text-primary card-title">Hotel Information</h3>
            <div class="gap-4 grid grid-cols-1 md:grid-cols-2">
              <div>
                <p><strong>Name:</strong> ${s.hotel.name}</p>
                <p><strong>Domain:</strong> ${s.hotel.domain}</p>
              </div>
              <div>
                <p><strong>ID:</strong> ${s.hotel.id}</p>
                <p><strong>PMS Type:</strong> ${s.hotel.pms_type}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Configuration Status -->
        <div class="bg-base-100 shadow-xl card">
          <div class="card-body">
            <h3 class="text-primary card-title">Configuration Status</h3>
            
            <div class="space-y-4">
              <div>
                <h4 class="mb-2 font-semibold">Booking Capabilities</h4>
                <div class="badge ${s.configuration.hasBookingCapabilities?"badge-success":"badge-error"}">
                  ${s.configuration.hasBookingCapabilities?"✅ Enabled":"❌ Disabled"}
                </div>
              </div>
              
              <div>
                <h4 class="mb-2 font-semibold">Cloudbeds Configuration</h4>
                <div class="gap-2 grid grid-cols-2 md:grid-cols-4">
                  <div class="badge ${s.configuration.cloudbeds.client_id.includes("✅")?"badge-success":"badge-error"}">
                    Client ID: ${s.configuration.cloudbeds.client_id}
                  </div>
                  <div class="badge ${s.configuration.cloudbeds.client_secret.includes("✅")?"badge-success":"badge-error"}">
                    Client Secret: ${s.configuration.cloudbeds.client_secret}
                  </div>
                  <div class="badge ${s.configuration.cloudbeds.api_key.includes("✅")?"badge-success":"badge-error"}">
                    API Key: ${s.configuration.cloudbeds.api_key}
                  </div>
                  <div class="badge ${s.configuration.cloudbeds.property_id.includes("✅")?"badge-success":"badge-error"}">
                    Property ID: ${s.configuration.cloudbeds.property_id}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 class="mb-2 font-semibold">Other Settings</h4>
                <p><strong>Default Currency:</strong> ${s.configuration.other.default_currency}</p>
                <p><strong>Default Language:</strong> ${s.configuration.other.default_language}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Room Information -->
        <div class="bg-base-100 shadow-xl card">
          <div class="card-body">
            <h3 class="text-primary card-title">Room Configuration</h3>
            
            <div class="shadow mb-4 stats stats-vertical lg:stats-horizontal">
              <div class="stat">
                <div class="stat-title">Total Rooms</div>
                <div class="text-primary stat-value">${s.rooms.total}</div>
              </div>
              
              <div class="stat">
                <div class="stat-title">With PMS ID</div>
                <div class="text-success stat-value">${s.rooms.withPmsId}</div>
              </div>
              
              <div class="stat">
                <div class="stat-title">Without PMS ID</div>
                <div class="stat-value ${s.rooms.withoutPmsId>0?"text-warning":"text-success"}">${s.rooms.withoutPmsId}</div>
              </div>
            </div>
            
            ${s.rooms.list.length>0?`
              <div class="overflow-x-auto">
                <table class="table table-zebra">
                  <thead>
                    <tr>
                      <th>Room Name</th>
                      <th>Type</th>
                      <th>Max Occupancy</th>
                      <th>PMS Room ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${s.rooms.list.map(a=>`
                      <tr>
                        <td>${a.name}</td>
                        <td>${a.room_type}</td>
                        <td>${a.max_occupancy}</td>
                        <td>
                          <span class="badge ${a.pms_room_id!=="Not set"?"badge-success":"badge-warning"}">
                            ${a.pms_room_id}
                          </span>
                        </td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            `:'<p class="opacity-70 text-center">No rooms configured</p>'}
          </div>
        </div>

        <!-- Issues and Recommendations -->
        ${s.issues.length>0?`
          <div class="bg-base-100 shadow-xl card">
            <div class="card-body">
              <h3 class="text-error card-title">Issues Found</h3>
              <ul class="space-y-1 list-disc list-inside">
                ${s.issues.map(a=>`<li class="text-error">${a}</li>`).join("")}
              </ul>
            </div>
          </div>
        `:""}

        ${s.recommendations.length>0?`
          <div class="bg-base-100 shadow-xl card">
            <div class="card-body">
              <h3 class="text-warning card-title">Recommendations</h3>
              <ul class="space-y-1 list-disc list-inside">
                ${s.recommendations.map(a=>`<li class="text-warning">${a}</li>`).join("")}
              </ul>
            </div>
          </div>
        `:""}

        <!-- Connection Test Results -->
        ${e?`
          <div class="bg-base-100 shadow-xl card">
            <div class="card-body">
              <h3 class="text-primary card-title">Connection Test</h3>
              <div class="alert ${e.status==="success"?"alert-success":"alert-error"}">
                <span>${e.message}</span>
              </div>
              ${e.error?`
                <details class="mt-4">
                  <summary class="font-semibold cursor-pointer">Error Details</summary>
                  <pre class="bg-base-200 mt-2 p-2 rounded overflow-x-auto text-xs">${e.error}</pre>
                </details>
              `:""}
            </div>
          </div>
        `:""}
      `}function d(s){const e=document.getElementById("diagnostics-container");e.innerHTML=`
        <div class="alert alert-error">
          <svg class="stroke-current w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Error loading diagnostics: ${s}</span>
        </div>
      `}async function n(s){const e=document.getElementById(`test-${s}`);e.textContent,e.classList.add("loading"),e.disabled=!0;try{const t=await(await fetch("/api/booking/diagnose",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({hotelDomain:r,action:`test-${s}`})})).json();if(t.success&&t.result){const o=t.result.status==="success"?"success":"error";alert(`${s.charAt(0).toUpperCase()+s.slice(1)} Test: ${t.result.message}`)}else alert(`Test failed: ${t.error||"Unknown error"}`)}catch(i){alert(`Test failed: ${i.message}`)}finally{e.classList.remove("loading"),e.disabled=!1}}document.getElementById("refresh-diagnostics")?.addEventListener("click",l);document.getElementById("test-connection")?.addEventListener("click",()=>n("connection"));document.getElementById("test-availability")?.addEventListener("click",()=>n("availability"));l();
