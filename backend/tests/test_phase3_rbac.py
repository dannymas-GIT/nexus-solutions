"""Unit tests for Phase 3 Auth, Bootstrap Lockdown, RBAC, Protected Role Tiers, and Workspace Gating."""
from __future__ import annotations

import os
import sys
import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.dependencies import create_access_token  # noqa: E402
from app.db import portal_db  # noqa: E402
from app.main import app  # noqa: E402


class Phase3RbacTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmpdir = tempfile.TemporaryDirectory()
        self._env_keys = (
            "DATABASE_URL",
            "AUTH_JWT_SECRET",
            "NEXUS_ADMIN_API_KEY",
            "PORTAL_API_KEY",
        )
        self._env_backup = {k: os.environ.get(k) for k in self._env_keys}
        os.environ["DATABASE_URL"] = f"sqlite:///{Path(self._tmpdir.name) / 'rbac.db'}"
        os.environ["AUTH_JWT_SECRET"] = "phase3-rbac-strong-jwt-secret-99999"
        os.environ["NEXUS_ADMIN_API_KEY"] = "phase3-bootstrap-admin-key"
        os.environ.pop("PORTAL_API_KEY", None)
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

    def test_bootstrap_requires_admin_api_key_and_disables_public_signup(self) -> None:
        # Public status reports zero users and public signup disabled
        status_before = self.client.get("/api/v1/auth/status")
        self.assertEqual(status_before.status_code, 200)
        self.assertFalse(status_before.json()["hasUsers"])
        self.assertFalse(status_before.json()["publicSignupEnabled"])

        bootstrap_payload = {
            "email": "founder@nexus.example",
            "password": "StrongPassword!123",
            "fullName": "Danny Admin",
            "organizationName": "Nexus Corp",
        }

        # Unauthenticated register & bootstrap rejected with 401
        self.assertEqual(
            self.client.post("/api/v1/auth/register", json=bootstrap_payload).status_code,
            401,
        )
        self.assertEqual(
            self.client.post("/api/v1/auth/bootstrap", json=bootstrap_payload).status_code,
            401,
        )

        # Wrong X-Admin-Api-Key rejected with 401
        self.assertEqual(
            self.client.post(
                "/api/v1/auth/bootstrap",
                headers={"X-Admin-Api-Key": "wrong-key"},
                json=bootstrap_payload,
            ).status_code,
            401,
        )

        # Missing server-side key config returns 503 when key supplied, 401 when omitted
        os.environ.pop("NEXUS_ADMIN_API_KEY", None)
        self.assertEqual(
            self.client.post("/api/v1/auth/bootstrap", json=bootstrap_payload).status_code,
            401,
        )
        self.assertEqual(
            self.client.post(
                "/api/v1/auth/bootstrap",
                headers={"X-Admin-Api-Key": "anything"},
                json=bootstrap_payload,
            ).status_code,
            503,
        )

        # PORTAL_API_KEY fallback works for initial platform_admin bootstrap
        os.environ["PORTAL_API_KEY"] = "portal-fallback-key"
        boot = self.client.post(
            "/api/v1/auth/bootstrap",
            headers={"X-Admin-Api-Key": "portal-fallback-key"},
            json=bootstrap_payload,
        )
        self.assertEqual(boot.status_code, 201, boot.text)
        self.assertEqual(boot.json()["user"]["role"], "platform_admin")

        # Once a user exists, public registration & bootstrap are permanently rejected (403)
        second_payload = {
            "email": "outsider@nexus.example",
            "password": "OutsiderPassword!123",
            "fullName": "Outside Visitor",
        }
        self.assertEqual(
            self.client.post("/api/v1/auth/register", json=second_payload).status_code,
            403,
        )
        self.assertEqual(
            self.client.post(
                "/api/v1/auth/register",
                headers={"X-Admin-Api-Key": "portal-fallback-key"},
                json=second_payload,
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.post(
                "/api/v1/auth/bootstrap",
                headers={"X-Admin-Api-Key": "portal-fallback-key"},
                json=second_payload,
            ).status_code,
            403,
        )

    def test_workspace_apis_require_auth_while_public_endpoints_remain_open(self) -> None:
        # Public endpoints remain accessible without auth
        self.assertEqual(self.client.get("/api/health").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/auth/status").status_code, 200)
        lead_res = self.client.post(
            "/api/v1/leads",
            json={
                "name": "Jordan Buyer",
                "email": "jordan@buyer.example",
                "company": "Buyer Corp",
            },
        )
        self.assertEqual(lead_res.status_code, 201)

        # Workspace APIs reject anonymous callers with 401
        gated_get_paths = [
            "/api/v1/auth/me",
            "/api/admin/users",
            "/api/v1/convergence/overview",
            "/api/v1/convergence/sources",
            "/api/v1/convergence/kpis",
            "/api/v1/convergence/kpi-templates",
            "/api/v1/convergence/reports",
            "/api/v1/documents/tree",
            "/api/v1/documents/templates?document_type=pdf",
            "/api/v1/documents/files/marketing/content/product_datasheet.md",
            "/api/idea-studio/config",
            "/api/idea-studio/ideas",
            "/api/idea-studio/sprints",
            "/api/idea-studio/initiatives",
            "/api/idea-studio/staging",
            "/api/idea-studio/finops",
        ]
        for path in gated_get_paths:
            res = self.client.get(path)
            self.assertEqual(res.status_code, 401, f"Expected 401 for anonymous GET {path}")

        # Bootstrap admin and verify login + authenticated access succeed
        boot = self.client.post(
            "/api/v1/auth/register",
            headers={"X-Admin-Api-Key": "phase3-bootstrap-admin-key"},
            json={
                "email": "founder@nexus.example",
                "password": "StrongPassword!123",
                "fullName": "Danny Admin",
            },
        )
        self.assertEqual(boot.status_code, 201)

        login = self.client.post(
            "/api/v1/auth/login",
            json={"email": "founder@nexus.example", "password": "StrongPassword!123"},
        )
        self.assertEqual(login.status_code, 200)
        headers = {"Authorization": f"Bearer {login.json()['accessToken']}"}

        self.assertEqual(self.client.get("/api/v1/convergence/overview", headers=headers).status_code, 200)
        self.assertEqual(self.client.get("/api/v1/documents/tree", headers=headers).status_code, 200)
        self.assertEqual(self.client.get("/api/idea-studio/config", headers=headers).status_code, 200)

    def test_bootstrap_least_privilege_rbac_protected_tiers_and_audit(self) -> None:
        # 1. First user bootstraps as platform_admin with X-Admin-Api-Key
        r1 = self.client.post(
            "/api/v1/auth/bootstrap",
            headers={"X-Admin-Api-Key": "phase3-bootstrap-admin-key"},
            json={
                "email": "founder@nexus.example",
                "password": "StrongPassword!123",
                "fullName": "Danny Admin",
                "organizationName": "Nexus Corp",
            },
        )
        self.assertEqual(r1.status_code, 201, r1.text)
        admin_token = r1.json()["accessToken"]
        admin_user = r1.json()["user"]
        self.assertEqual(admin_user["role"], "platform_admin")
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # 2. Public self-registration is disabled; admin creates a least-privilege viewer
        blocked_self_signup = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": "viewer@nexus.example",
                "password": "ViewerPassword!123",
                "fullName": "Val Viewer",
            },
        )
        self.assertEqual(blocked_self_signup.status_code, 403)

        created_viewer = self.client.post(
            "/api/admin/users",
            headers=admin_headers,
            json={
                "email": "viewer@nexus.example",
                "fullName": "Val Viewer",
                "role": "viewer",
                "temporaryPassword": "ViewerPassword!123",
            },
        )
        self.assertEqual(created_viewer.status_code, 201, created_viewer.text)
        viewer_id = created_viewer.json()["user"]["id"]
        self.assertEqual(created_viewer.json()["user"]["role"], "viewer")

        viewer_login = self.client.post(
            "/api/v1/auth/login",
            json={"email": "viewer@nexus.example", "password": "ViewerPassword!123"},
        )
        self.assertEqual(viewer_login.status_code, 200)
        viewer_token = viewer_login.json()["accessToken"]

        # Viewer is blocked from admin endpoints
        self.assertEqual(
            self.client.get(
                "/api/admin/users", headers={"Authorization": f"Bearer {viewer_token}"}
            ).status_code,
            403,
        )

        # 3. Platform admin creates a workspace_admin
        created_wa = self.client.post(
            "/api/admin/users",
            headers=admin_headers,
            json={
                "email": "opsadmin@nexus.example",
                "fullName": "Taylor Ops",
                "role": "workspace_admin",
                "temporaryPassword": "TempPassword!456",
            },
        )
        self.assertEqual(created_wa.status_code, 201, created_wa.text)
        wa_id = created_wa.json()["user"]["id"]
        self.assertTrue(created_wa.json()["user"]["mustChangePassword"])

        # Login as workspace_admin
        wa_login = self.client.post(
            "/api/v1/auth/login",
            json={"email": "opsadmin@nexus.example", "password": "TempPassword!456"},
        )
        self.assertEqual(wa_login.status_code, 200)
        wa_headers = {"Authorization": f"Bearer {wa_login.json()['accessToken']}"}

        # 4. Protected tier: workspace_admin cannot create or modify platform_admin
        escalate = self.client.post(
            "/api/admin/users",
            headers=wa_headers,
            json={
                "email": "sneaky@nexus.example",
                "fullName": "Sneaky Escalate",
                "role": "platform_admin",
                "temporaryPassword": "TempPassword!789",
            },
        )
        self.assertEqual(escalate.status_code, 403)

        reset_platform = self.client.post(
            f"/api/admin/users/{admin_user['id']}/reset-password",
            headers=wa_headers,
            json={"temporaryPassword": "HijackPassword!999"},
        )
        self.assertEqual(reset_platform.status_code, 403)

        # 5. Admin resets viewer password; audit log records reset without password value
        secret_temp = "ResetTempPass!2026"
        reset_res = self.client.post(
            f"/api/admin/users/{viewer_id}/reset-password",
            headers=admin_headers,
            json={"temporaryPassword": secret_temp},
        )
        self.assertEqual(reset_res.status_code, 200)

        audit = self.client.get("/api/admin/audit-logs", headers=admin_headers)
        self.assertEqual(audit.status_code, 200)
        self.assertNotIn(secret_temp, audit.text)
        actions = [entry["action"] for entry in audit.json()["logs"]]
        self.assertIn("user.create", actions)
        self.assertIn("user.password_reset", actions)

        # 6. Viewer changes own password via canonical /api/users/me/password
        v_login = self.client.post(
            "/api/v1/auth/login",
            json={"email": "viewer@nexus.example", "password": secret_temp},
        )
        self.assertEqual(v_login.status_code, 200)
        v_headers = {"Authorization": f"Bearer {v_login.json()['accessToken']}"}

        chg = self.client.post(
            "/api/users/me/password",
            headers=v_headers,
            json={"currentPassword": secret_temp, "newPassword": "BrandNewPass!2026"},
        )
        self.assertEqual(chg.status_code, 200)

        # Impersonating token is blocked from self-service password change
        db = portal_db.get_session_factory()()
        try:
            u = db.query(portal_db.UserAccount).filter_by(email="viewer@nexus.example").first()
            imp_token = create_access_token(
                u, act_as={"actor_user_id": admin_user["id"], "mode": "preview"}
            )
        finally:
            db.close()

        blocked_imp = self.client.post(
            "/api/users/me/password",
            headers={"Authorization": f"Bearer {imp_token}"},
            json={"currentPassword": "BrandNewPass!2026", "newPassword": "AnotherNewPass!2026"},
        )
        self.assertEqual(blocked_imp.status_code, 403)

        # 7. Soft-deactivate workspace_admin -> blocks login and existing JWT
        deact = self.client.patch(
            f"/api/admin/users/{wa_id}",
            headers=admin_headers,
            json={"isActive": False},
        )
        self.assertEqual(deact.status_code, 200)
        self.assertFalse(deact.json()["user"]["isActive"])

        self.assertEqual(
            self.client.get("/api/v1/auth/me", headers=wa_headers).status_code, 403
        )
        self.assertEqual(
            self.client.post(
                "/api/v1/auth/login",
                json={"email": "opsadmin@nexus.example", "password": "TempPassword!456"},
            ).status_code,
            403,
        )


if __name__ == "__main__":
    unittest.main()
