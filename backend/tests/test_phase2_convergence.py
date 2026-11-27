"""End-to-end tests for Phase 2: CSV upload -> Corporate KPI engine -> Report Studio -> Client Portal."""
from __future__ import annotations

import io
import os
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db import portal_db  # noqa: E402
from app.main import app  # noqa: E402


class Phase2ConvergenceTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmpdir = tempfile.TemporaryDirectory()
        self._env_keys = (
            "DATABASE_URL",
            "PORTAL_API_KEY",
            "PORTAL_JWT_SECRET",
            "PORTAL_BUNDLE_ROOT",
            "PORTAL_PUBLIC_BASE",
            "NEXUS_ADMIN_API_KEY",
            "AUTH_JWT_SECRET",
        )
        self._env_backup = {k: os.environ.get(k) for k in self._env_keys}
        db_path = Path(self._tmpdir.name) / "phase2.db"
        os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"
        os.environ["PORTAL_BUNDLE_ROOT"] = str(Path(self._tmpdir.name) / "bundles")
        os.environ["PORTAL_API_KEY"] = "phase2-portal-key"
        os.environ["NEXUS_ADMIN_API_KEY"] = "phase2-admin-key"
        os.environ["PORTAL_JWT_SECRET"] = "phase2-strong-jwt-secret-value-123456"
        os.environ["AUTH_JWT_SECRET"] = "phase2-auth-jwt-secret-value-999999"
        os.environ["PORTAL_PUBLIC_BASE"] = "https://nexus-solutions.us"
        portal_db.reset_engine()
        self.client = TestClient(app)

    def tearDown(self) -> None:
        portal_db.reset_engine()
        for k, v in self._env_backup.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v
        self._tmpdir.cleanup()

    def _bootstrap_auth_headers(self) -> dict[str, str]:
        res = self.client.post(
            "/api/v1/auth/bootstrap",
            headers={"X-Admin-Api-Key": "phase2-admin-key"},
            json={
                "email": "ops@nexus.example",
                "password": "StrongPassword!123",
                "fullName": "Phase Two Admin",
            },
        )
        self.assertEqual(res.status_code, 201, res.text)
        return {"Authorization": f"Bearer {res.json()['accessToken']}"}

    def test_full_csv_to_kpi_to_report_to_portal_loop(self) -> None:
        # 0. Anonymous callers are rejected from workspace convergence routes
        self.assertEqual(self.client.get("/api/v1/convergence/overview").status_code, 401)
        self.assertEqual(self.client.get("/api/v1/convergence/sources").status_code, 401)
        self.assertEqual(self.client.get("/api/v1/convergence/kpis").status_code, 401)
        self.assertEqual(self.client.get("/api/v1/convergence/reports").status_code, 401)

        auth_headers = self._bootstrap_auth_headers()

        # 1. Upload CSV dataset
        csv_bytes = (
            b"Account,MRR,GrossMarginPct,DSO\n"
            b"Northwind,\"$42,500\",71%,28\n"
            b"Contoso,\"$58,000\",67%,34\n"
            b"Fabrikam,\"$29,500\",72%,31\n"
        )
        up = self.client.post(
            "/api/v1/convergence/sources/upload-csv",
            headers=auth_headers,
            data={"name": "Q4 Finance Export", "category": "Financial"},
            files={"file": ("q4_finance.csv", csv_bytes, "text/csv")},
        )
        self.assertEqual(up.status_code, 201, up.text)
        source = up.json()["source"]
        self.assertEqual(source["rowCount"], 3)
        mrr_col = next(c for c in source["columns"] if c["name"] == "MRR")
        self.assertEqual(mrr_col["type"], "number")
        self.assertEqual(mrr_col["stats"]["sum"], 130000.0)

        # 2. Fetch corporate KPI templates
        tpl = self.client.get("/api/v1/convergence/kpi-templates", headers=auth_headers)
        self.assertEqual(tpl.status_code, 200)
        self.assertGreaterEqual(len(tpl.json()["templates"]), 5)

        # 3. Create CSV-bound MRR KPI (auto-computed sum = 130,000 vs target 125,000)
        kpi_mrr = self.client.post(
            "/api/v1/convergence/kpis",
            headers=auth_headers,
            json={
                "name": "Monthly Recurring Revenue",
                "category": "Revenue",
                "unit": "USD",
                "direction": "higher_is_better",
                "targetValue": 125000,
                "sourceId": source["id"],
                "sourceColumn": "MRR",
                "aggregation": "sum",
            },
        )
        self.assertEqual(kpi_mrr.status_code, 201, kpi_mrr.text)
        mrr_data = kpi_mrr.json()["kpi"]
        self.assertEqual(mrr_data["actualValue"], 130000.0)
        self.assertEqual(mrr_data["status"], "on_track")
        self.assertGreater(mrr_data["attainmentPct"], 100.0)

        # 4. Create lower-is-better DSO KPI bound to CSV average (31.0 vs target 35 -> on_track)
        kpi_dso = self.client.post(
            "/api/v1/convergence/kpis",
            headers=auth_headers,
            json={
                "name": "Days Sales Outstanding",
                "category": "Cash & Finance",
                "unit": "Days",
                "direction": "lower_is_better",
                "targetValue": 35,
                "sourceId": source["id"],
                "sourceColumn": "DSO",
                "aggregation": "avg",
            },
        )
        self.assertEqual(kpi_dso.status_code, 201)
        self.assertEqual(kpi_dso.json()["kpi"]["actualValue"], 31.0)
        self.assertEqual(kpi_dso.json()["kpi"]["status"], "on_track")

        # Update DSO target via PATCH
        patched = self.client.patch(
            f"/api/v1/convergence/kpis/{kpi_dso.json()['kpi']['id']}",
            headers=auth_headers,
            json={"targetValue": 20},
        )
        self.assertEqual(patched.status_code, 200)
        self.assertEqual(patched.json()["kpi"]["status"], "off_track")

        # 5. Create Executive Report and export PDF, DOCX, PPTX
        rep = self.client.post(
            "/api/v1/convergence/reports",
            headers=auth_headers,
            json={
                "title": "Q4 Executive Convergence Pack",
                "companyName": "Acme Operations Inc.",
                "periodLabel": "Q4 2026",
                "executiveSummary": "MRR exceeded target while DSO requires tighter collections.",
            },
        )
        self.assertEqual(rep.status_code, 201)
        report_id = rep.json()["report"]["id"]
        self.assertEqual(rep.json()["report"]["kpiCount"], 2)

        pdf = self.client.get(
            f"/api/v1/convergence/reports/{report_id}/export?format=pdf",
            headers=auth_headers,
        )
        self.assertEqual(pdf.status_code, 200)
        self.assertTrue(pdf.content.startswith(b"%PDF"))

        docx = self.client.get(
            f"/api/v1/convergence/reports/{report_id}/export?format=docx",
            headers=auth_headers,
        )
        self.assertEqual(docx.status_code, 200)
        self.assertTrue(docx.content.startswith(b"PK"))

        pptx = self.client.get(
            f"/api/v1/convergence/reports/{report_id}/export?format=pptx",
            headers=auth_headers,
        )
        self.assertEqual(pptx.status_code, 200)
        self.assertTrue(pptx.content.startswith(b"PK"))

        # 6. Publish report to Client Portal (requires authenticated user + operator portal API key)
        unauth_pub = self.client.post(
            f"/api/v1/convergence/reports/{report_id}/publish-portal",
            headers=auth_headers,
            json={"clientEmail": "cfo@acme.example", "sendEmail": False},
        )
        self.assertEqual(unauth_pub.status_code, 401)

        portal_headers = {"X-Portal-Api-Key": "phase2-portal-key"}
        pub = self.client.post(
            f"/api/v1/convergence/reports/{report_id}/publish-portal",
            headers={**auth_headers, **portal_headers},
            json={"clientEmail": "cfo@acme.example", "expiresInDays": 14, "sendEmail": False},
        )
        self.assertEqual(pub.status_code, 201, pub.text)
        pub_data = pub.json()
        did = pub_data["deliverableId"]
        token = pub_data["token"]
        self.assertTrue(pub_data["portalUrl"].startswith("https://nexus-solutions.us/portal/"))

        # Verify bundle download contains HTML, CSV, and PDF (client-token endpoint remains public)
        zip_res = self.client.get(f"/api/portal/download/{did}?token={token}")
        self.assertEqual(zip_res.status_code, 200)
        with zipfile.ZipFile(io.BytesIO(zip_res.content)) as zf:
            names = set(zf.namelist())
            self.assertIn("index.html", names)
            self.assertIn("kpis.csv", names)
            self.assertIn("executive-report.pdf", names)

        # Client approves the report via portal
        act = self.client.post(
            "/api/portal/actions",
            json={"token": token, "action": "approve", "message": "Board-ready!"},
        )
        self.assertEqual(act.status_code, 200)

        # 7. Operator console lists deliverable with client approval status
        listing = self.client.get("/api/portal/deliverables", headers=portal_headers)
        self.assertEqual(listing.status_code, 200)
        deliverables = listing.json()["deliverables"]
        self.assertEqual(len(deliverables), 1)
        self.assertEqual(deliverables[0]["latestAction"], "approve")
        self.assertEqual(deliverables[0]["latestMessage"], "Board-ready!")

        # 8. Overview reflects full state
        ov = self.client.get("/api/v1/convergence/overview", headers=auth_headers)
        self.assertEqual(ov.status_code, 200)
        ov_data = ov.json()
        self.assertEqual(ov_data["sourceCount"], 1)
        self.assertEqual(ov_data["totalRowsIngested"], 3)
        self.assertEqual(ov_data["kpiCount"], 2)
        self.assertEqual(ov_data["reportCount"], 1)
        self.assertEqual(ov_data["publishedPortalCount"], 1)


if __name__ == "__main__":
    unittest.main()
