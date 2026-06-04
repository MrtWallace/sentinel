import unittest

from api import ExecuteRequest, execute


class ExecuteApiTest(unittest.TestCase):
    def test_execute_returns_attempts_for_safe_intent(self):
        body = execute(ExecuteRequest(intent="Swap 0.01 ETH to USDC"))

        self.assertEqual(body["status"], "executed")
        self.assertEqual(body["decision"], "execute")
        self.assertEqual(len(body["attempts"]), 1)
        self.assertEqual(body["execution"]["status"], "not_submitted")

    def test_execute_retries_when_agent_suggests_safer_amount(self):
        body = execute(ExecuteRequest(intent="Swap 0.2 ETH to USDC"))

        self.assertEqual(body["status"], "executed")
        self.assertEqual(len(body["attempts"]), 2)
        self.assertEqual(body["attempts"][0]["decision"]["decision"], "reject")
        self.assertEqual(body["attempts"][1]["proposal"]["amount"], "0.01")

    def test_execute_rejects_hard_rule_without_retry(self):
        body = execute(ExecuteRequest(intent="Swap 1 ETH to USDC"))

        self.assertEqual(body["status"], "rejected")
        self.assertEqual(len(body["attempts"]), 1)
        self.assertIsNone(body["attempts"][0]["security_audit"])
