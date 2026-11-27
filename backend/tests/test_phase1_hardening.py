"""Unit tests for Phase 1 security hardening, documents fixes, portal safety, and lead capture."""
from __future__ import annotations

import io
import os
import sys
import tarfile
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


def _make_tar_gz(entries: dict[str, bytes], symlink: tuple[str, str] | None = None) -> bytes:
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tf:
        for name, content in entries.items():
            info = tarfile.TarInfo(name=name)
            info.size = len(content)
            tf.addfile(info, io.BytesIO(content))
        if symlink:
            link_name, link_target = symlink
            sinfo = tarfile.TarInfo(name=link_name)
            sinfo.type = tarfile.SYMTYPE
            sinfo.linkname = link_target
            tf.addfile(sinfo)
    return buf.getvalue()


class Phase1BackendTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmpdir = tempfile.TemporaryDirectory()
        self._env_keys = (
            "DATABASE_URL",
            "PORTAL_API_KEY",
            "PORTAL_JWT_SECRET",
            "PORTAL_BUNDLE_ROOT",
            "NEXUS_ADMIN_API_KEY",
            "NEXUS_WORKSPACE_ROOT",
            "LEADS_NOTIFY_EMAIL",
            "SES_SOURCE_EMAIL",
        )
        self._env_backup = {k: os.environ.get(k) for k in self._env_keys}
        db_path = Path(self._tmpdir.name) / "test_portal.db"
        os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"
        os.environ["PORTAL_BUNDLE_ROOT"] = str(Path(self._tmpdir.name) / "bundles")
        os.environ["PORTAL_API_KEY"] = "test-portal-key-123"
        os.environ["NEXUS_ADMIN_API_KEY"] = "test-admin-key-456"
        os.environ["PORTAL_JWT_SECRET"] = "super-strong-test-jwt-secret-value-999"
        os.environ["NEXUS_WORKSPACE_ROOT"] = str(BACKEND_DIR.parent)
        os.environ.pop("LEADS_NOTIFY_EMAIL", None)
        os.environ.pop("SES_SOURCE_EMAIL", None)
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

    def test_storage_routes_require_admin_api_key(self) -> None:
        res_unauth = self.client.get("/api/v1/storage/status")
        self.assertEqual(res_unauth.status_code, 401)

        res_bad = self.client.get(
            "/api/v1/storage/status", headers={"X-Admin-Api-Key": "wrong"}
        )
        self.assertEqual(res_bad.status_code, 401)

        res_del = self.client.delete("/api/v1/storage/files/anything.txt")
        self.assertEqual(res_del.status_code, 401)

        os.environ.pop("NEXUS_ADMIN_API_KEY", None)
        os.environ.pop("PORTAL_API_KEY", None)
        res_unconfigured = self.client.get("/api/v1/storage/status")
        self.assertEqual(res_unconfigured.status_code, 503)

    def test_documents_tree_and_file_read(self) -> None:
        res = self.client.get("/api/v1/documents/tree")
        self.assertEqual(res.status_code, 200)
        tree = res.json()
        top_ids = [n["id"] for n in tree]
        self.assertIn("marketing", top_ids)

        md = self.client.get("/api/v1/documents/files/marketing/content/product_datasheet.md")
        self.assertEqual(md.status_code, 200)
        self.assertIn("Nexus", md.json()["content"])

        escape = self.client.get("/api/v1/documents/files/../../etc/passwd")
        self.assertIn(escape.status_code, (400, 403, 404))

    def test_documents_generate_direct_download_and_storage_guard(self) -> None:
        payload = {
            "business_name": "Acme Converged",
            "tagline": "Data convergence test",
            "business_description": "Unified KPI reporting.",
            "target_market": "Mid-market ops",
            "year1_revenue": "$500,000",
        }
        res_pdf = self.client.post(
            "/api/v1/documents/generate?template_name=business_summary&document_type=pdf",
            json=payload,
        )
        self.assertEqual(res_pdf.status_code, 200)
        self.assertEqual(res_pdf.headers["content-type"], "application/pdf")
        self.assertTrue(res_pdf.content.startswith(b"%PDF"))

        res_docx = self.client.post(
            "/api/v1/documents/generate?template_name=business_plan&document_type=docx",
            json=payload,
        )
        self.assertEqual(res_docx.status_code, 200)
        self.assertGreater(len(res_docx.content), 100)

        res_storage_unauth = self.client.post(
            "/api/v1/documents/generate?template_name=business_summary&document_type=pdf&storage_path=out/a.pdf",
            json=payload,
        )
        self.assertEqual(res_storage_unauth.status_code, 401)

    def test_portal_rejects_tarslip_and_symlinks(self) -> None:
        headers = {"X-Portal-Api-Key": "test-portal-key-123"}
        created = self.client.post(
            "/api/portal/deliverables",
            headers=headers,
            json={
                "opportunityId": "eng-001",
                "title": "Security Review",
                "clientEmail": "client@example.com",
            },
        )
        self.assertEqual(created.status_code, 200)
        did = created.json()["deliverableId"]

        evil_tar = _make_tar_gz({"../escape.txt": b"pwned"})
        res_escape = self.client.put(
            f"/api/portal/deliverables/{did}/bundle",
            headers=headers,
            files={"bundle": ("evil.tar.gz", evil_tar, "application/gzip")},
        )
        self.assertEqual(res_escape.status_code, 400)

        sym_tar = _make_tar_gz({"index.html": b"<h1>hi</h1>"}, symlink=("leak", "/etc/passwd"))
        res_sym = self.client.put(
            f"/api/portal/deliverables/{did}/bundle",
            headers=headers,
            files={"bundle": ("sym.tar.gz", sym_tar, "application/gzip")},
        )
        self.assertEqual(res_sym.status_code, 400)

    def test_portal_end_to_end_session_download_actions_and_revoke(self) -> None:
        headers = {"X-Portal-Api-Key": "test-portal-key-123"}
        created = self.client.post(
            "/api/portal/deliverables",
            headers=headers,
            json={
                "opportunityId": "eng-002",
                "title": "Q4 Executive Pack",
                "description": "Board-ready KPI deliverable",
                "clientEmail": "buyer@example.com",
            },
        )
        self.assertEqual(created.status_code, 200)
        did = created.json()["deliverableId"]

        good_tar = _make_tar_gz({"index.html": b"<h1>Executive Summary</h1>", "data.csv": b"a,b\n1,2\n"})
        up = self.client.put(
            f"/api/portal/deliverables/{did}/bundle",
            headers=headers,
            files={"bundle": ("bundle.tar.gz", good_tar, "application/gzip")},
        )
        self.assertEqual(up.status_code, 200)

        # Reject weak JWT secret
        os.environ["PORTAL_JWT_SECRET"] = "change-me-in-production"
        weak = self.client.post(
            f"/api/portal/deliverables/{did}/links",
            headers=headers,
            json={"sendEmail": False},
        )
        self.assertEqual(weak.status_code, 503)

        os.environ["PORTAL_JWT_SECRET"] = "super-strong-test-jwt-secret-value-999"
        minted = self.client.post(
            f"/api/portal/deliverables/{did}/links",
            headers=headers,
            json={"sendEmail": False},
        )
        self.assertEqual(minted.status_code, 200)
        token = minted.json()["token"]

        sess = self.client.get(f"/api/portal/session?token={token}")
        self.assertEqual(sess.status_code, 200)
        sbody = sess.json()
        self.assertEqual(sbody["deliverable"]["title"], "Q4 Executive Pack")
        self.assertEqual(sbody["usesRemaining"], 3)
        self.assertEqual(sbody["actions"], [])
        self.assertIsNotNone(sbody["expiresAt"])

        static = self.client.get(f"/api/portal/static/{did}/index.html?token={token}")
        self.assertEqual(static.status_code, 200)
        self.assertIn(b"Executive Summary", static.content)

        dl = self.client.get(f"/api/portal/download/{did}?token={token}")
        self.assertEqual(dl.status_code, 200)
        with zipfile.ZipFile(io.BytesIO(dl.content)) as zf:
            self.assertIn("index.html", zf.namelist())
            self.assertIn("data.csv", zf.namelist())

        act = self.client.post(
            "/api/portal/actions",
            json={"token": token, "action": "approve", "message": "Looks great!"},
        )
        self.assertEqual(act.status_code, 200)
        self.assertEqual(act.json()["usesRemaining"], 2)

        sess2 = self.client.get(f"/api/portal/session?token={token}")
        self.assertEqual(len(sess2.json()["actions"]), 1)
        self.assertEqual(sess2.json()["actions"][0]["action"], "approve")

        events = self.client.get("/api/portal/events?since=0", headers=headers)
        self.assertEqual(events.status_code, 200)
        self.assertEqual(events.json()["events"][0]["message"], "Looks great!")

        revoked = self.client.delete(f"/api/portal/deliverables/{did}", headers=headers)
        self.assertEqual(revoked.status_code, 200)

        after_static = self.client.get(f"/api/portal/static/{did}/index.html?token={token}")
        self.assertEqual(after_static.status_code, 404)

    def test_leads_capture_and_admin_listing(self) -> None:
        bad = self.client.post(
            "/api/v1/leads",
            json={"name": "Alex", "email": "not-an-email", "company": "Acme"},
        )
        self.assertEqual(bad.status_code, 422)

        ok = self.client.post(
            "/api/v1/leads",
            json={
                "name": "Alex Rivera",
                "email": "alex@acme.example",
                "company": "Acme Ops LLC",
                "role": "VP Operations",
                "dataSources": ["QuickBooks", "HubSpot", "Spreadsheets"],
                "painPoint": "Monthly board decks take 3 days of manual spreadsheet work.",
            },
        )
        self.assertEqual(ok.status_code, 201)
        lead_id = ok.json()["id"]
        self.assertEqual(ok.json()["status"], "received")

        unauth_list = self.client.get("/api/v1/leads")
        self.assertEqual(unauth_list.status_code, 401)

        auth_list = self.client.get(
            "/api/v1/leads", headers={"X-Admin-Api-Key": "test-admin-key-456"}
        )
        self.assertEqual(auth_list.status_code, 200)
        leads = auth_list.json()["leads"]
        self.assertEqual(len(leads), 1)
        self.assertEqual(leads[0]["id"], lead_id)
        self.assertEqual(leads[0]["company"], "Acme Ops LLC")
        self.assertEqual(leads[0]["dataSources"], ["QuickBooks", "HubSpot", "Spreadsheets"])


if __name__ == "__main__":
    unittest.main()
