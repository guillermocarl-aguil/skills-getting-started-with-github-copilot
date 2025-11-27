from fastapi.testclient import TestClient
import pytest

from src.app import app, activities


client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Expect at least one known activity
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    test_email = "testuser@example.com"

    # Ensure clean state: remove if already present
    if test_email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(test_email)

    # Signup
    resp = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "Signed up" in body.get("message", "")

    # Confirm in participants list
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert test_email in data[activity]["participants"]

    # Unregister
    resp = client.delete(f"/activities/{activity}/participants?email={test_email}")
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "Unregistered" in body.get("message", "")

    # Confirm removed
    resp = client.get("/activities")
    data = resp.json()
    assert test_email not in data[activity]["participants"]
