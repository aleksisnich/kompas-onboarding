"""Validate isolated public demo without external API services."""
import http.cookiejar
import json
import sys
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.request import build_opener, HTTPCookieProcessor, Request

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server


class PublicDemoTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.was_public = server.PUBLIC_DEMO
        server.PUBLIC_DEMO = True
        server.PUBLIC_SESSIONS.clear()
        cls.http = ThreadingHTTPServer(('127.0.0.1', 0), server.Handler)
        cls.port = cls.http.server_address[1]
        cls.worker = threading.Thread(target=cls.http.serve_forever, daemon=True)
        cls.worker.start()

    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown()
        cls.http.server_close()
        server.PUBLIC_SESSIONS.clear()
        server.PUBLIC_DEMO = cls.was_public

    def base(self, suffix):
        return f'http://127.0.0.1:{self.port}{suffix}'

    def visitor(self):
        return build_opener(HTTPCookieProcessor(http.cookiejar.CookieJar()))

    def get(self, client, path='/api/state'):
        with client.open(self.base(path)) as response:
            return json.load(response)

    def post(self, client, path, data):
        req = Request(self.base(path), data=json.dumps(data, ensure_ascii=False).encode('utf-8'),
                      headers={'Content-Type':'application/json'}, method='POST')
        with client.open(req) as response:
            return json.load(response)

    def test_separate_browsers_have_separate_state(self):
        alice, bob = self.visitor(), self.visitor()
        self.assertEqual(len(self.get(alice)['issues']), 3)
        self.assertEqual(len(self.get(bob)['issues']), 3)
        self.post(alice, '/api/survey', {'employee_id':'e1','day':14,'mood':2,
                                        'kind':'Обучение','text':'Нужна помощь по тестовому заказу'})
        self.assertEqual(len(self.get(alice)['issues']), 4)
        self.assertEqual(len(self.get(bob)['issues']), 3)
        self.post(alice, '/api/reset', {'confirm':True})
        self.assertEqual(len(self.get(alice)['issues']), 3)

    def test_public_demo_works_without_key(self):
        client = self.visitor()
        state = self.get(client)
        self.assertFalse(state['ai_ready'])
        result = self.post(client,'/api/chat', {'employee_id':'e1','message':'Что делать при возврате товара?'})
        self.assertEqual(result['sources'][0]['id'], 'returns')
        self.assertIn('поиск', result['mode'])
        self.assertTrue(self.get(client, '/api/health')['ok'])

if __name__ == '__main__':
    unittest.main()
