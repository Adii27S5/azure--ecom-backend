# Azure E-Commerce Backend & Capacity Study
**Project ID:** 24CC3046-P056  
**Repository:** [https://github.com/Adii27S5/azure--ecom-backend](https://github.com/Adii27S5/azure--ecom-backend)

Production-ready backend API service designed for Microsoft Azure App Service with live Application Insights telemetry and capacity breaking point analysis using Azure Load Testing.

---

## Features
- **API Endpoints**:
  - `GET /health` — Liveness & health probe returning HTTP 200 with memory usage and instance identity.
  - `GET /api/products` — Product catalog with pagination and category filtering.
  - `GET /api/products/:id` — Single product details by ID.
  - `GET /api/search?q=laptop` — Full-text search across products and categories.
  - `GET /api/dashboard` — Aggregations across users, products, orders, and total revenue.
  - `GET /api/orders` — Order history retrieval.
  - `POST /api/orders` — Transactional order placement with itemized lines.
  - `GET /api/heavy-operation` — Cryptographic hash loop & memory stressor for capacity breaking point analysis.
- **Database Support**:
  - PostgreSQL (Azure Database for PostgreSQL Flexible Server) with connection pooling (`pg`).
  - Auto-seeding of 100 users, 500 products, and 1,000 orders.
  - In-memory pure JS fallback for offline / local testing.
- **Monitoring & Observability**:
  - Azure Application Insights APM integration tracking requests, dependencies, and live metrics.
- **Azure Load Testing**:
  - Apache JMeter test plan (`loadtest/capacity_study.jmx`) configured for 40/20/15/10/10/5 mixed user distribution.
- **Infrastructure as Code**:
  - ARM template (`deploy/azuredeploy.json`) for one-click portal deployment.
  - Automated PowerShell deployment script (`deploy/deploy-azure.ps1`).

---

## Local Quick Start

```bash
# Install dependencies
npm install

# Run automated verification tests
npm test

# Start the server
npm start
```

Default local URL: `http://localhost:8080`

---

## Azure Deployment

### Option 1: One-Click ARM Template in Azure Portal
1. Open [Azure Portal](https://portal.azure.com) -> Search **Deploy a custom template**.
2. Upload `deploy/azuredeploy.json`.
3. Choose Resource Group `rg-loadtest-capacity-study` and click **Review + Create**.
4. Deploy the zip package via Kudu or Azure CLI:
   ```powershell
   az webapp deploy --resource-group rg-loadtest-capacity-study --name <YOUR_APP_NAME> --src-path "deploy/app-package.zip" --type zip
   ```

### Option 2: Automated Script
```powershell
.\deploy\deploy-azure.ps1
```
