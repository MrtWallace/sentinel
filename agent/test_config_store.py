import tempfile
import unittest

from config_store import UserConfigStore


USER = "0xabc0000000000000000000000000000000000000"


class UserConfigStoreTest(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.store = UserConfigStore(f"{self.tmpdir.name}/config.db")

    def tearDown(self):
        self.tmpdir.cleanup()

    def test_get_returns_default_synced_config(self):
        body = self.store.get_config(USER)

        self.assertEqual(body["user_address"], USER.lower())
        self.assertEqual(body["config_status"], "synced")
        self.assertEqual(body["config_version"], 1)
        self.assertEqual(body["pact_config_version"], 1)
        self.assertEqual(body["config"]["transfer_amount_threshold_confirm"], "0.1")

    def test_update_increments_version_and_marks_pact_update_needed(self):
        body = self.store.update_config(
            USER,
            {"transfer_amount_threshold_confirm": "0.05", "frequency_limit": 2},
        )

        self.assertEqual(body["config_status"], "needs_pact_update")
        self.assertEqual(body["config_version"], 2)
        self.assertEqual(body["pact_config_version"], 1)
        self.assertEqual(body["config"]["transfer_amount_threshold_confirm"], "0.05")
        self.assertEqual(body["config"]["frequency_limit"], 2)

    def test_mark_pact_synced_snapshots_current_config(self):
        self.store.update_config(USER, {"frequency_limit": 2})

        body = self.store.mark_pact_synced(USER, {"frequency_limit": 2})

        self.assertEqual(body["config_status"], "synced")
        self.assertEqual(body["config_version"], 2)
        self.assertEqual(body["pact_config_version"], 2)
        self.assertEqual(body["pact_limits_snapshot"]["frequency_limit"], 2)

    def test_reset_restores_defaults_and_requires_pact_update(self):
        self.store.update_config(USER, {"frequency_limit": 2})

        body = self.store.reset_config(USER)

        self.assertEqual(body["config_status"], "needs_pact_update")
        self.assertEqual(body["config_version"], 3)
        self.assertEqual(body["config"]["frequency_limit"], 3)
