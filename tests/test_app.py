import json
import sys
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.request import urlopen, Request

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server


class AppTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        server.DATA = Path(cls.tmp.name) / 'test_state.json'
        cls.http = ThreadingHTTPServer(('127.0.0.1', 0), server.Handler)
        cls.port = cls.http.server_address[1]
        cls.t = threading.Thread(target=cls.http.serve_forever, daemon=True)
        cls.t.start()

    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown()
        cls.http.server_close()
        cls.tmp.cleanup()

    def setUp(self):
        server.save_state(server.seed())

    def get(self, path):
        with urlopen(f'http://127.0.0.1:{self.port}{path}') as resp:
            return json.load(resp)

    def post(self, path, body):
        req=Request(f'http://127.0.0.1:{self.port}{path}',
                    data=json.dumps(body).encode(),
                    headers={'Content-Type':'application/json'},method='POST')
        with urlopen(req) as resp:
            return json.load(resp)

    def test_health(self):
        self.assertTrue(self.get('/api/health')['ok'])
        self.assertEqual(self.get('/api/health')['app'], 'kompas')

    def test_knowledge_retrieval_is_role_specific(self):
        store=server.relevant_docs('Как оформить возврат товара?', 'store')
        warehouse=server.relevant_docs('Как оформить возврат товара?', 'warehouse')
        self.assertEqual(store[0]['id'],'returns')
        self.assertFalse(any(doc['id']=='returns' for doc in warehouse))

    def test_return_question_does_not_show_warehouse_material(self):
        message = 'Что делать, если покупатель хочет вернуть товар, а я не знаю, как оформить возврат?'
        docs, mismatch = server.search_with_role_check(message, 'warehouse')
        self.assertEqual(docs, [])
        self.assertIsNotNone(mismatch)
        self.assertEqual(mismatch['id'], 'returns')
        result = self.post('/api/chat', {'employee_id':'e2', 'message':message})
        self.assertIn('выбран профиль', result['answer'])
        self.assertFalse(result['sources'])
        self.assertNotIn('Приёмка поставки', result['answer'])

    def test_return_question_suggests_right_article_in_store(self):
        message = 'Что делать, если покупатель хочет вернуть товар, а я не знаю, как оформить возврат?'
        docs, mismatch = server.search_with_role_check(message, 'store')
        self.assertIsNone(mismatch)
        self.assertEqual(docs[0]['id'], 'returns')
        result = self.post('/api/chat', {'employee_id':'e1', 'message':message})
        self.assertEqual(result['sources'][0]['id'], 'returns')
        self.assertIn('Спокойно выслушайте покупателя', result['answer'])

    def test_chat_returns_sources_without_api(self):
        result=self.post('/api/chat', {'employee_id':'e1','message':'Что делать при возврате товара?'})
        self.assertIn('returns',[x['id'] for x in result['sources']])
        self.assertIn('поиск',result['mode'])
        self.assertTrue(result['answer'])

    def test_survey_hr_closed_loop(self):
        initial=self.get('/api/state')
        self.assertEqual(len(initial['issues']),3)
        self.post('/api/survey', {'employee_id':'e1','day':14,'mood':2,
                                  'kind':'Обучение','text':'Не знаю, как оформить возврат'})
        state=self.get('/api/state')
        self.assertEqual(len(state['issues']),4)
        issue=state['issues'][-1]
        self.assertEqual(issue['status'],'open')
        self.assertIn(14,state['survey_days']['e1'])
        self.post('/api/resolve', {'issue_id':issue['id'],'resolved':True})
        self.assertEqual(self.get('/api/state')['issues'][-1]['status'],'resolved')

    def test_checklist_persists(self):
        self.post('/api/check',{'employee_id':'e1','task_id':'rules','done':True})
        self.assertIn('rules',self.get('/api/state')['checked']['e1'])

    def test_reset_restores_seed(self):
        self.post('/api/survey', {'employee_id':'e1','day':7,'mood':4,'kind':'Всё хорошо','text':''})
        self.post('/api/reset', {'confirm':True})
        state=self.get('/api/state')
        self.assertEqual(state['issues'].__len__(),3)
        self.assertEqual(state['survey_days'],{})

if __name__=='__main__': unittest.main()
