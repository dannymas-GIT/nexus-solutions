"""Unit tests for the Nexus-Solutions Idea Studio proxy router."""
from __future__ import annotations

import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

import requests
from fastapi import FastAPI
from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.api.routes import auth, idea_studio  # noqa: E402
from app.db import portal_db  # noqa: E402

app = FastAPI()
app.include_router(auth.router, prefix="/api")
app.include_router(idea_studio.router, prefix="/api")


def _mock_response(status_code: int = 200, payload: object = None, text: str = "") -> MagicMock:
    resp = MagicMock()
    resp.status_code = status_code
    resp.ok = 200 <= status_code < 300
    resp.text = text
    if payload is None:
        resp.json.side_effect = ValueError("No JSON")
    else:
        resp.json.return_value = payload
    return resp


class IdeaStudioProxyTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmpdir = tempfile.TemporaryDirectory()
        self._env_backup = {
            key: os.environ.get(key)
            for key in (
                "DATABASE_URL",
                "AUTH_JWT_SECRET",
                "NEXUS_ADMIN_API_KEY",
                "IDEA_STUDIO_API_BASE_URL",
                "CONTROL_API_BASE_URL",
                "IDEA_STUDIO_PUBLIC_URL",
                "IDEA_STUDIO_TENANT_ID",
                "IDEA_STUDIO_STAGING_DOMAIN",
                "IDEA_STUDIO_API_TOKEN",
            )
        }
        for key in self._env_backup:
            os.environ.pop(key, None)

        os.environ["DATABASE_URL"] = f"sqlite:///{Path(self._tmpdir.name) / 'idea_studio.db'}"
        os.environ["AUTH_JWT_SECRET"] = "idea-studio-test-jwt-secret-999999"
        os.environ["NEXUS_ADMIN_API_KEY"] = "idea-studio-bootstrap-key"
        portal_db.reset_engine()
        self.client = TestClient(app)

        boot = self.client.post(
            "/api/v1/auth/bootstrap",
            headers={"X-Admin-Api-Key": "idea-studio-bootstrap-key"},
            json={
                "email": "studio@nexus.example",
                "password": "StrongPassword!123",
                "fullName": "Studio Operator",
            },
        )
        self.assertEqual(boot.status_code, 201, boot.text)
        self.auth_headers = {"Authorization": f"Bearer {boot.json()['accessToken']}"}

    def tearDown(self) -> None:
        portal_db.reset_engine()
        for key, value in self._env_backup.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value
        self._tmpdir.cleanup()

    def test_requires_authentication(self) -> None:
        self.assertEqual(self.client.get("/api/idea-studio/config").status_code, 401)
        self.assertEqual(self.client.get("/api/idea-studio/ideas").status_code, 401)
        self.assertEqual(
            self.client.post("/api/idea-studio/ideas", json={"title": "Test"}).status_code,
            401,
        )

    def test_config_when_unconfigured(self) -> None:
        res = self.client.get("/api/idea-studio/config", headers=self.auth_headers)
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertFalse(body["configured"])
        self.assertEqual(body["tenant"], "nexus-solutions")
        self.assertEqual(body["stagingDomain"], "nexus-solutions.us")
        self.assertIsNone(body["hostedUiUrl"])

    def test_config_derives_hosted_ui_url_from_api_base(self) -> None:
        os.environ["IDEA_STUDIO_API_BASE_URL"] = "https://control.example.com/"
        res = self.client.get("/api/idea-studio/config", headers=self.auth_headers)
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["configured"])
        self.assertEqual(
            body["hostedUiUrl"],
            "https://control.example.com/idea-studio?mode=public&tenant=nexus-solutions",
        )

    def test_returns_503_when_api_base_unconfigured(self) -> None:
        res = self.client.get("/api/idea-studio/ideas", headers=self.auth_headers)
        self.assertEqual(res.status_code, 503)
        self.assertIn("IDEA_STUDIO_API_BASE_URL", res.json()["detail"])

    @patch("app.api.routes.idea_studio.requests.request")
    def test_list_ideas_enforces_tenant_header_and_query(self, mock_req: MagicMock) -> None:
        os.environ["IDEA_STUDIO_API_BASE_URL"] = "https://control.example.com"
        mock_req.return_value = _mock_response(200, {"ideas": [{"id": "idea-1", "title": "Test"}]})

        res = self.client.get("/api/idea-studio/ideas", headers=self.auth_headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"ideas": [{"id": "idea-1", "title": "Test"}]})

        mock_req.assert_called_once()
        kwargs = mock_req.call_args.kwargs
        self.assertEqual(kwargs["method"], "GET")
        self.assertEqual(kwargs["url"], "https://control.example.com/api/mission-control/ideas")
        self.assertEqual(kwargs["headers"]["X-Tenant-Id"], "nexus-solutions")
        self.assertEqual(kwargs["params"], {"tenant_id": "nexus-solutions"})
        self.assertIsNone(kwargs["json"])

    @patch("app.api.routes.idea_studio.requests.request")
    def test_create_idea_overrides_cross_tenant_body_fields(self, mock_req: MagicMock) -> None:
        os.environ["IDEA_STUDIO_API_BASE_URL"] = "https://control.example.com"
        mock_req.return_value = _mock_response(201, {"idea": {"id": "idea-42", "title": "Portal"}})

        res = self.client.post(
            "/api/idea-studio/ideas",
            headers=self.auth_headers,
            json={
                "title": "Portal",
                "description": "Tenant portal",
                "tenantId": "other-tenant",
                "tenant_id": "other-tenant",
            },
        )
        self.assertEqual(res.status_code, 201)
        kwargs = mock_req.call_args.kwargs
        self.assertEqual(kwargs["headers"]["X-Tenant-Id"], "nexus-solutions")
        self.assertEqual(kwargs["params"]["tenant_id"], "nexus-solutions")
        self.assertEqual(kwargs["json"]["tenantId"], "nexus-solutions")
        self.assertNotIn("tenant_id", kwargs["json"])

    @patch("app.api.routes.idea_studio.requests.request")
    def test_all_lifecycle_endpoints_proxy_correctly(self, mock_req: MagicMock) -> None:
        os.environ["IDEA_STUDIO_API_BASE_URL"] = "https://control.example.com"
        os.environ["IDEA_STUDIO_API_TOKEN"] = "secret-tok"
        mock_req.return_value = _mock_response(200, {"ok": True})

        cases = [
            ("GET", "/api/idea-studio/ideas/idea-1/gates", "/api/mission-control/ideas/idea-1/gates", None),
            ("POST", "/api/idea-studio/ideas/idea-1/gates", "/api/mission-control/ideas/idea-1/gates", {"decision": "approve"}),
            ("POST", "/api/idea-studio/ideas/idea-1/reports/market-research", "/api/mission-control/ideas/idea-1/reports/market-research", {"offline": False}),
            ("POST", "/api/idea-studio/ideas/idea-1/reports/feasibility-viability", "/api/mission-control/ideas/idea-1/reports/feasibility-viability", {}),
            ("POST", "/api/idea-studio/ideas/idea-1/graduate", "/api/mission-control/ideas/idea-1/graduate", {}),
            ("POST", "/api/idea-studio/ideas/idea-1/scaffold", "/api/mission-control/ideas/idea-1/scaffold", {}),
            ("POST", "/api/idea-studio/ideas/idea-1/sprints/next", "/api/mission-control/ideas/idea-1/sprints/next", {"seedTasks": True}),
            ("POST", "/api/idea-studio/sprints/sprint-1/execute", "/api/mission-control/sprints/sprint-1/execute", {"openPr": True}),
            ("GET", "/api/idea-studio/staging", "/api/mission-control/staging", None),
            ("GET", "/api/idea-studio/ideas/idea-1/staging", "/api/mission-control/ideas/idea-1/staging", None),
            ("POST", "/api/idea-studio/ideas/idea-1/staging/provision", "/api/mission-control/ideas/idea-1/staging/provision", {}),
            ("GET", "/api/idea-studio/finops", "/api/mission-control/finops", None),
            ("GET", "/api/idea-studio/ideas/idea-1/finops", "/api/mission-control/ideas/idea-1/finops", None),
            ("GET", "/api/idea-studio/sprints", "/api/mission-control/sprints", None),
            ("POST", "/api/idea-studio/sprints", "/api/mission-control/sprints", {"ideaId": "idea-1"}),
            ("GET", "/api/idea-studio/initiatives", "/api/mission-control/initiatives", None),
        ]

        for method, local_path, expected_upstream, payload in cases:
            mock_req.reset_mock()
            if method == "GET":
                res = self.client.get(local_path, headers=self.auth_headers)
            else:
                res = self.client.post(local_path, headers=self.auth_headers, json=payload)
            self.assertEqual(res.status_code, 200, f"Failed for {method} {local_path}")
            kwargs = mock_req.call_args.kwargs
            self.assertEqual(kwargs["url"], f"https://control.example.com{expected_upstream}")
            self.assertEqual(kwargs["headers"]["Authorization"], "Bearer secret-tok")
            self.assertEqual(kwargs["headers"]["X-Tenant-Id"], "nexus-solutions")

    @patch("app.api.routes.idea_studio.requests.request")
    def test_rejects_invalid_resource_ids(self, mock_req: MagicMock) -> None:
        os.environ["IDEA_STUDIO_API_BASE_URL"] = "https://control.example.com"
        res = self.client.get("/api/idea-studio/ideas/..bad/gates", headers=self.auth_headers)
        self.assertEqual(res.status_code, 400)
        mock_req.assert_not_called()

    @patch("app.api.routes.idea_studio.requests.request")
    def test_upstream_timeout_returns_504(self, mock_req: MagicMock) -> None:
        os.environ["IDEA_STUDIO_API_BASE_URL"] = "https://control.example.com"
        mock_req.side_effect = requests.Timeout("timed out")
        res = self.client.get("/api/idea-studio/ideas", headers=self.auth_headers)
        self.assertEqual(res.status_code, 504)

    @patch("app.api.routes.idea_studio.requests.request")
    def test_upstream_connection_error_returns_502(self, mock_req: MagicMock) -> None:
        os.environ["IDEA_STUDIO_API_BASE_URL"] = "https://control.example.com"
        mock_req.side_effect = requests.ConnectionError("refused")
        res = self.client.get("/api/idea-studio/ideas", headers=self.auth_headers)
        self.assertEqual(res.status_code, 502)


if __name__ == "__main__":
    unittest.main()
