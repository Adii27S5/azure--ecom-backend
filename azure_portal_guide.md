# Complete Azure Portal Implementation Guide
## Project ID: 24CC3046-P056 — Azure Load Testing for a Web Application Capacity Study

This guide provides the exact click-by-click instructions in the **Azure Cloud Portal** (`https://portal.azure.com`) to execute all 17 phases of the project with real Azure resources.

---

## Pre-requisites
1. Active Azure Subscription (Free Tier, Student, or Pay-As-You-Go).
2. Browser open to [Azure Portal](https://portal.azure.com).
3. The project files in this folder:
   - Web application source & package: `deploy/app-package.zip`
   - JMeter test scenario: `loadtest/capacity_study.jmx`
   - ARM Template: `deploy/azuredeploy.json`

---

## FASTEST OPTION: One-Click Template Deployment via Azure Portal
If you want all resources (Resource Group, App Service Plan, App Service, App Insights, Log Analytics, Azure Load Testing, Autoscale rules) created simultaneously in 3 minutes:
1. In the Azure Portal search bar, type **Deploy a custom template** and select it.
2. Click **Build your own template in the editor**.
3. Click **Load file** and select [azuredeploy.json](file:///c:/Users/LOQ/Downloads/Azure%20Load%20Testing%20Hackathon/deploy/azuredeploy.json).
4. Click **Save**.
5. Select your Subscription and Resource Group `rg-loadtest-capacity-study` (click *Create new* if not existing).
6. Click **Review + create** -> **Create**.
7. Deploy the code package: Go to the created App Service -> **Deployment Center** -> **Zip Deploy** (or run `deploy-azure.ps1`).

---

## DETAILED MANUAL PORTAL WALKTHROUGH (PHASE BY PHASE)

### PHASE 1 — RESOURCE GROUP
1. In the top search bar, type `Resource groups` and select it.
2. Click **+ Create**.
3. Fill in:
   - **Subscription**: Your subscription
   - **Resource group**: `rg-loadtest-capacity-study`
   - **Region**: Select a low-cost region near you (e.g., `East US`, `Central US`, or `Central India`).
4. Click **Review + create** -> **Create**.

---

### PHASE 2 & 4 — APP SERVICE, PLAN & APPLICATION INSIGHTS
1. In the search bar, search for `App Services` and click **+ Create** -> **Web App**.
2. **Basics Tab**:
   - **Resource Group**: `rg-loadtest-capacity-study`
   - **Name**: `app-capacity-study-[your-initials-or-id]` (must be globally unique, e.g., `app-capacity-study-24cc`)
   - **Publish**: `Code`
   - **Runtime stack**: `Node 20 LTS`
   - **Operating System**: `Linux`
   - **Region**: Same as Phase 1 (e.g., `East US`)
   - **Pricing Plan**: Click *Explore pricing plans* -> Select **Standard S1** (1 Core, 1.75 GB RAM).
     *(Note: S1 is the lowest tier that supports dynamic Autoscaling and manual scale-out up to 10 instances).*
3. **Monitoring Tab**:
   - **Enable Application Insights**: Select **Yes**.
   - **Application Insights name**: `appi-capacity-study` (Azure automatically creates a connected Log Analytics workspace).
4. Click **Review + create** -> **Create**.
5. Once deployment completes, click **Go to resource**.
6. **Deploy the Code**:
   - In the left menu under **Development Tools**, click **Advanced Tools (Kudu)** -> click **Go**.
   - In Kudu, click **Bash** / **Zip Push Deploy** (or use VS Code / Azure CLI).
   - Alternatively, under **Deployment** -> **Deployment Center** -> select **FTPS credentials** or **Local Git / Zip Deploy**.
   - Or deploy via Azure CLI:
     ```powershell
     az webapp deploy --resource-group rg-loadtest-capacity-study --name <YOUR_APP_NAME> --src-path "deploy/app-package.zip" --type zip
     ```
7. Open the App URL in your browser: `https://<YOUR_APP_NAME>.azurewebsites.net/health`.
   - Verify it returns HTTP 200:
     ```json
     { "status": "healthy", ... }
     ```

---

### PHASE 3 — DATABASE SETUP (AZURE DATABASE FOR POSTGRESQL)
1. In the top search bar, search for `Azure Database for PostgreSQL flexible servers` -> **+ Create**.
2. Fill in:
   - **Resource group**: `rg-loadtest-capacity-study`
   - **Server name**: `psql-capacity-study-[id]`
   - **Workload type**: `Development` (Burstable B1ms — 1 vCore, 2 GiB RAM, lowest cost).
   - **Admin username**: `azureuser`
   - **Password**: `<YourSecurePassword123!>`
3. **Networking Tab**:
   - Check **Allow public access from any Azure service within Azure to this server**.
   - Click **+ Add current client IP address** so your local machine can connect.
4. Click **Review + create** -> **Create**.
5. Once created, add the connection string to the App Service:
   - Go to your App Service -> **Settings** -> **Environment variables** (or **Configuration**).
   - Add:
     - `DB_HOST`: `psql-capacity-study-[id].postgres.database.azure.com`
     - `DB_USER`: `azureuser`
     - `DB_PASSWORD`: `<YourSecurePassword123!>`
     - `DB_NAME`: `postgres`
     - `DB_PORT`: `5432`
   - Click **Apply**. The web app will automatically connect and seed the tables on startup!

---

### PHASE 5 — AZURE LOAD TESTING RESOURCE
1. In the top search bar, search for `Azure Load Testing` -> **+ Create**.
2. Fill in:
   - **Resource Group**: `rg-loadtest-capacity-study`
   - **Name**: `alt-capacity-study`
   - **Region**: Same region as your App Service.
3. Click **Review + create** -> **Create**.
4. Once deployed, open `alt-capacity-study`.

---

### PHASE 6 & 7 — BASELINE & PROGRESSIVE LOAD TESTS
Inside `alt-capacity-study`:

#### 1. Baseline Test (Health Endpoint)
1. Click **Tests** -> **+ Create** -> **Create a URL-based test**.
2. **Basics Tab**:
   - **Test name**: `test-baseline-10users`
   - **Test description**: `Phase 5 baseline test targeting /health`
3. **Test plan Tab**:
   - Add URL: `https://<YOUR_APP_NAME>.azurewebsites.net/health`
   - HTTP Method: `GET`
4. **Load Tab**:
   - **Load pattern**: Linear
   - **Virtual users**: `10`
   - **Test duration**: `5` minutes
   - **Ramp-up time**: `1` minute
5. **App components Tab**:
   - Click **Add/modify** -> Select your App Service `app-capacity-study` and App Service Plan so Azure Monitor server-side metrics (CPU, Memory) are tracked automatically alongside client-side latency!
6. Click **Review + create** -> **Create**.
7. Click **Run test** and wait for completion. Record total requests, average latency, P95, and error percentage.

---

### PHASE 8 & 9 — ADVANCED JMETER TEST (MIXED WORKLOAD & THRESHOLDS)
1. In `alt-capacity-study`, click **Tests** -> **+ Create** -> **Upload a JMeter script**.
2. **Basics Tab**:
   - **Test name**: `test-mixed-workload-capacity`
   - **Test description**: `Phase 7E & 8 mixed user distribution`
3. **Test plan Tab**:
   - Select and upload [capacity_study.jmx](file:///c:/Users/LOQ/Downloads/Azure%20Load%20Testing%20Hackathon/loadtest/capacity_study.jmx).
   - In **Parameters / User Defined Variables**:
     - `app_host`: `<YOUR_APP_NAME>.azurewebsites.net`
     - `threads`: `50` (or `100`, `250`, `500`)
     - `duration`: `300`
     - `rampup`: `60`
4. **Test failure criteria Tab (PHASE 9 THRESHOLDS)**:
   - Click **+ Add rule**:
     - **Metric**: `Response time (p95)` | **Aggregate**: `p95` | **Condition**: `>` | **Threshold**: `1000` ms
   - Click **+ Add rule**:
     - **Metric**: `Response time (p99)` | **Aggregate**: `p99` | **Condition**: `>` | **Threshold**: `2000` ms
   - Click **+ Add rule**:
     - **Metric**: `Error percentage` | **Aggregate**: `Percentage` | **Condition**: `>` | **Threshold**: `1` %
5. **App components Tab**:
   - Add your App Service and App Service Plan.
   - Configure Server metric thresholds:
     - `CpuPercentage > 80%`
     - `MemoryPercentage > 80%`
6. Click **Review + create** -> **Create**.

---

### PHASE 10 — BREAKING POINT IDENTIFICATION RUNS
Run the test plan sequentially at:
- Run 1: **10 users** (Baseline - Expect PASS)
- Run 2: **50 users** (Low Load - Expect PASS)
- Run 3: **100 users** (Moderate Load - Expect PASS)
- Run 4: **250 users** (High Load - Observe response time & CPU rise)
- Run 5: **500 users** (Thresholds breach: P95 > 1000ms or CPU > 80% — Breaking Point)
- Run 6: **750 / 1000 users** (Execute only if safe within subscription quota)

---

### PHASE 11 — SCALE-OUT EXPERIMENT (1 vs 2 vs 4 INSTANCES)
1. Go to your **App Service Plan** (`asp-capacity-study`).
2. In the left menu under **Settings**, click **Scale out (App Service plan)**.
3. Select **Manual scale**.
4. **Experiment A (1 Instance)**:
   - Set instance count to `1` -> Click **Save**.
   - Run the 250-user load test. Record RPS, P95, CPU, Error %.
5. **Experiment B (2 Instances)**:
   - Set instance count to `2` -> Click **Save**. Wait 1 minute for instances to be ready.
   - Run the same 250-user load test. Record metrics and notice throughput increase & latency reduction!
6. **Experiment C (4 Instances)**:
   - Set instance count to `4` -> Click **Save**.
   - Run the test again and record results.

---

### PHASE 12 — AZURE MONITOR AUTOSCALING CONFIGURATION
1. In your App Service Plan -> **Scale out (App Service plan)** -> Select **Rule-based**.
2. Click **+ Add a rule** (Scale-Out Rule):
   - **Metric source**: Current resource
   - **Metric name**: `CPU Percentage`
   - **Time grain**: 1 minute
   - **Statistic**: Average
   - **Time window**: 5 minutes
   - **Operator**: `Greater than`
   - **Threshold**: `70` %
   - **Action**:
     - **Operation**: `Increase count by`
     - **Instance count**: `1`
     - **Cool down**: `5` minutes
   - Click **Add**.
3. Click **+ Add a rule** (Scale-In Rule):
   - **Metric name**: `CPU Percentage`
   - **Operator**: `Less than`
   - **Threshold**: `30` %
   - **Action**:
     - **Operation**: `Decrease count by`
     - **Instance count**: `1`
     - **Cool down**: `5` minutes
   - Click **Add**.
4. Instance limits:
   - **Minimum**: `1`
   - **Maximum**: `4`
   - **Default**: `1`
5. Click **Save**.
6. Trigger the Spike Test or Heavy Operation test in Azure Load Testing, then check the **Run history** in the autoscale tab to show the real autoscale scale-out event!

---

### PHASE 13 — TELEMETRY & KUSTO (KQL) QUERIES
In **Application Insights** (`appi-capacity-study`) -> **Logs**, run these exact queries:

**1. Request Rate & Latency Percentiles:**
```kql
requests
| summarize 
    TotalRequests = count(),
    AvgDurationMs = round(avg(duration), 1),
    P95DurationMs = round(percentile(duration, 95), 1),
    P99DurationMs = round(percentile(duration, 99), 1),
    FailedRequests = countif(success == false)
    by bin(timestamp, 1m)
| render timechart
```

**2. Failures & Error Breakdown:**
```kql
requests
| where success == false
| summarize count() by resultCode, name
| order by count_ desc
```

**3. Database Dependencies Duration:**
```kql
dependencies
| where type == "SQL" or type == "PostgreSQL"
| summarize AvgDuration = avg(duration), P95Duration = percentile(duration, 95), CallCount = count() by name
```

---

### PHASE 15 — AZURE PORTAL DASHBOARD
1. In Azure Portal, click the top-left hamburger menu -> **Dashboard**.
2. Click **+ Create** -> **Dashboard**.
3. Pin the following tiles from your App Service and Application Insights:
   - CPU Percentage chart
   - Memory Percentage chart
   - Requests / Throughput chart
   - Response Time (Average & P95) chart
   - Failed Requests chart
   - Azure Load Testing Live Results widget
4. Click **Save**.
