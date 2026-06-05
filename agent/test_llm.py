import unittest

from llm import extract_json_object


class LLMClientTest(unittest.TestCase):
    def test_extracts_plain_json_object(self):
        result = extract_json_object('{"passed": true}')

        self.assertEqual(result, {"passed": True})

    def test_extracts_json_object_from_wrapped_text(self):
        result = extract_json_object('Here is JSON:\n{"passed": false}\nDone')

        self.assertEqual(result, {"passed": False})

    def test_rejects_non_json_response(self):
        with self.assertRaises(ValueError):
            extract_json_object("not json")
