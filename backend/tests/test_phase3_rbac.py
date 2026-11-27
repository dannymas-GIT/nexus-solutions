"""Unit tests for Phase 3 Auth, RBAC, Protected Role Tiers, Soft-Deactivate, Audit Logs, and Profile Password."""
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

from app.core.dependencies import create_access_token
from app.db import portal_db
from app.main import app


class Phase3RbacTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmpdir = tempfile.TemporaryDirectory()
        self._env_backup = {
            k: os.environ.get(k) for k in ("DATABASE_URL", "AUTH_JWT_SECRET")
        }
        os.environ["DATABASE_URL"] = f"sqlite:///{Path(self._tmpdir.name) / 'rbac.db'}"
        os.environ["AUTH_JWT_SECRET"] = "phase3-rbac-strong-jwt-secret-99999"
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

    def test_bootstrap_least_privilege_rbac_protected_tiers_and_audit(self) -> None:
        # 1. First user bootstraps as platform_admin
        r1 = self.client.post(
            "/api/v1/auth/register",
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

        # 2. Second self-registered user defaults to least-privilege viewer
        r2 = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": "viewer@nexus.example",
                "password": "ViewerPassword!123",
                "fullName": "Val Viewer",
            },
        )
        self.assertEqual(r2.status_code, 201)
        viewer_token = r2.json()["accessToken"]
        self.assertEqual(r2.json()["user"]["role"], "viewer")

        # Viewer is blocked from admin endpoints
        self.assertEqual(
            self.client.get(
                "/api/admin/users", headers={"Authorization": f"Bearer {viewer_token}"}
            ).status_code,
            403,
        )

        # 3. Platform admin creates a workspace_admin
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
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
            f"/api/admin/users/{r2.json()['user']['id']}/reset-password",
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
