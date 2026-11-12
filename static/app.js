/* Kompas. All people and materials are fictional demo content. */
let db = null;
let employeeId = 'e1';
let page = 'home';
let searchTerm = '';
let category = 'Все';
let mood = 4;
let chatHistory = [];
let toastTimer;
const tasks = [
  ['welcome','Познакомиться с наставником','Узнать, к кому обратиться с вопросами.'],
  ['rules','Прочитать правила первых дней','График, рабочие вопросы, контакты.'],
  ['buddy','Обсудить задачи на первую неделю','Сверить ожидания и приоритеты.'],
  ['faq','Посмотреть инструкции по своей роли','Изучить основные рабочие сценарии.'],
  ['feedback','Пройти короткий опрос','Расскажите, всё ли понятно.']
];
const $ = sel => document.querySelector(sel);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const profile = () => db.employees.find(e => e.id === employeeId) || db.employees[0];
const dayAt = e => Math.max(1,Math.floor((new Date().setHours(0,0,0,0) - new Date(e.start_date+'T00:00:00')) / 86400000) + 1);
const titleNames = {home:'Главная',knowledge:'База знаний',chat:'Помощник',feedback:'Нужна помощь',hr:'Панель HR'};

async function request(path, body){
  const res = await fetch(path,body ? {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)} : {});
  const payload = await res.json();
  if(!res.ok) throw new Error(payload.error || `Ошибка ${res.status}`);
  return payload;
}
async function refresh(){db=await request('/api/state');renderChrome();render();}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3500)}
function go(target){page=target;searchTerm='';category='Все';renderChrome();render();window.scrollTo({top:0,behavior:'smooth'});$('#sidebar').classList.remove('open')}
function renderChrome(){
  $('#page-crumb').textContent=titleNames[page];
  document.querySelectorAll('[data-page]').forEach(el=>el.classList.toggle('active',el.dataset.page===page));
  $('#employee-picker').innerHTML=db.employees.map(e=>`<option value="${e.id}" ${e.id===employeeId?'selected':''}>${esc(e.name)}</option>`).join('');
  $('#avatar').textContent=profile().name.split(' ').map(x=>x[0]).join('').slice(0,2);
  $('#mode-pill').textContent=db.ai_ready?'✦ ИИ подключён':'● Демо';
}
function title(kicker, heading, subtitle, right=''){return `<div class="page-top"><div><div class="eyebrow">${esc(kicker)}</div><h1>${esc(heading)}</h1><p>${esc(subtitle)}</p></div>${right}</div>`}
function docIcon(d){return ({'Первые дни':'✦','Общие правила':'▤','Магазин':'♧','Склад':'▣','Продажи и офис':'▥'})[d.category]||'◈'}
function roleDocs(){return db.knowledge.filter(d=>d.role==='all'||d.role===profile().role)}
function formatDate(){return new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long'}).format(new Date())}

function renderHome(){
 const e=profile(),first=e.name.split(' ')[0],checked=db.checked[e.id]||[],progress=Math.round(100*checked.length/tasks.length),day=dayAt(e);
 const due=day>=14?14:7, lastSurvey=(db.survey_days[e.id]||[]).includes(due);
 $('#app').innerHTML=title('ТВОЯ АДАПТАЦИЯ',`Привет, ${first}! 👋`,'Здесь всё необходимое, чтобы освоиться на новом месте.', `<div class="date-line">${esc(formatDate())}</div>`)+
 `<div class="home-grid"><section class="hero"><div class="hero-content"><div class="hero-tag">ТВОИ ПЕРВЫЕ 90 ДНЕЙ</div><h2>Уверенный старт в команде.</h2><p>Спрашивай, изучай инструкции и двигайся в своём темпе. Мы рядом, чтобы помочь.</p><button class="btn" data-go="chat">✦ Задать вопрос помощнику</button></div><div class="progress-ring"><div style="text-align:center"><div class="ring-number">${day}</div><div class="ring-sub">день из 90</div></div></div></section>
 <section class="card card-pad"><div class="card-head"><h3>Как идут дела?</h3><span class="chip">Первые 90 дней</span></div><div class="status-note ${lastSurvey?'':'warning'}"><div class="round-icon">${lastSurvey?'✓':'♡'}</div><div><strong>${lastSurvey?'Спасибо за обратную связь':'Расскажи, как проходит работа'}</strong><p>${lastSurvey?'Твой ответ сохранён.':'Это поможет вовремя получить поддержку.'}</p></div></div><div class="callout"><b>${esc(e.department)}</b><br>${esc(e.position)}<br>Дата выхода: ${new Date(e.start_date+'T00:00:00').toLocaleDateString('ru-RU')}</div><button class="btn outline" style="width:100%;margin-top:14px" data-go="feedback">${lastSurvey?'Открыть обратную связь':'Пройти опрос →'}</button></section></div>
<section class="sport-roles"><div class="sport-role store"><b>МАГАЗИН</b><h3>В ритме продаж</h3></div><div class="sport-role warehouse"><b>СКЛАД</b><h3>Слаженная команда</h3></div><div class="sport-role office"><b>ОФИС</b><h3>Движение вперёд</h3></div></section> <div class="row-2"><section class="card card-pad"><div class="card-head"><h3>Мои первые шаги</h3><span class="chip">${checked.length} из ${tasks.length}</span></div><div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div><div class="muted small" style="margin-bottom:6px">${progress}% шагов выполнено</div>${tasks.map(t=>`<label class="task-row ${checked.includes(t[0])?'completed':''}"><input class="check" type="checkbox" data-task="${t[0]}" ${checked.includes(t[0])?'checked':''}/><span><span class="task-label">${esc(t[1])}</span><div class="task-desc">${esc(t[2])}</div></span></label>`).join('')}</section>
 <section class="card card-pad"><div class="card-head"><h3>Полезное рядом</h3><button class="text-link" data-go="knowledge">Все материалы →</button></div>
 <div class="feature-row" data-go="knowledge"><span class="round-icon" style="background:#eaf7f3;color:#17866e">▤</span><span><b>База знаний</b><small>Чёткие инструкции для твоих задач</small></span><span class="end-arrow">›</span></div>
 <div class="feature-row" data-go="chat"><span class="round-icon" style="background:#eef0fc;color:#6776b4">✦</span><span><b>Помощник</b><small>Можно задать даже «глупый» вопрос</small></span><span class="end-arrow">›</span></div>
 <div class="feature-row" data-go="feedback"><span class="round-icon" style="background:#fff0ea;color:#cb785c">♡</span><span><b>Попросить поддержку</b><small>Сообщить HR о сложностях</small></span><span class="end-arrow">›</span></div></section></div>
 <section class="mini-banner"><div class="round-icon" style="background:#d8ecf0;color:#24738b">☼</div><div><h3>Не уверен(а), как поступить?</h3><p>Лучше уточнить заранее, чем исправлять ошибку потом. Здесь можно спрашивать без стеснения.</p></div><button class="btn outline" data-go="chat">Спросить →</button></section>`;
}
function renderKnowledge(detail=null){
 if(detail){
  const d=db.knowledge.find(x=>x.id===detail);if(!d){renderKnowledge();return}
  $('#app').innerHTML=`<button class="back" data-go="knowledge">← Вернуться к базе знаний</button><section class="card doc-detail" style="margin-top:19px"><div class="doc-icon" style="font-size:36px;color:var(--teal)">${docIcon(d)}</div><span class="chip">${esc(d.category)}</span><h2>${esc(d.title)}</h2><p class="muted">${esc(d.summary)}</p><ol>${d.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><div class="notice">Это учебный материал на вымышленных данных, а не подтверждённый регламент компании. При сомнениях уточни порядок у наставника.</div><div style="margin-top:20px"><button class="btn" data-go="chat">✦ Задать вопрос по инструкции</button></div></section>`;
  return;
 }
 let docs=roleDocs();
 if(category!=='Все')docs=docs.filter(d=>d.category===category);
 if(searchTerm){const q=searchTerm.toLowerCase();docs=docs.filter(d=>(d.title+d.summary+d.steps.join(' ')+d.tags.join(' ')).toLowerCase().includes(q))}
 const categories=['Все',...new Set(roleDocs().map(d=>d.category))];
 $('#app').innerHTML=title('БАЗА ЗНАНИЙ','Всё нужное — под рукой','Короткие инструкции без лишней бюрократии. Материалы подбираются под твою роль.')+
 `<div class="toolbar"><label class="search"><span>⌕</span><input id="search-input" placeholder="Поиск: возврат, смена, заказ…" value="${esc(searchTerm)}" /></label><div class="segmented">${categories.map(c=>`<button class="segment ${category===c?'active':''}" data-category="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>
 <div id="knowledge-results" class="knowledge-list">${docCards(docs)}</div><div class="muted-row">ⓘ Инструкции вымышлены для демонстрации и должны быть согласованы с компанией перед внедрением.</div>`;
 $('#search-input').addEventListener('input',ev=>{searchTerm=ev.target.value;let filtered=roleDocs();if(category!=='Все')filtered=filtered.filter(d=>d.category===category);if(searchTerm.trim())filtered=filtered.filter(d=>(d.title+d.summary+d.steps.join(' ')+d.tags.join(' ')).toLowerCase().includes(searchTerm.toLowerCase()));$('#knowledge-results').innerHTML=docCards(filtered)});
}
function docCards(docs){return docs.length?docs.map(d=>`<section class="card doc-card"><div class="doc-icon">${docIcon(d)}</div><h3>${esc(d.title)}</h3><p>${esc(d.summary)}</p><div class="doc-bottom"><span class="chip">${esc(d.category)}</span><button class="text-link" data-doc="${d.id}">Читать →</button></div></section>`).join(''):'<div class="card empty" style="grid-column:1/-1">Ничего не найдено. Попробуй другой запрос.</div>'}
function renderChat(){
 $('#app').innerHTML=title('БЕЗ ЛИШНИХ ПЕРЕЖИВАНИЙ','Спрашивать — нормально','Помощник объясняет рабочие вопросы на основе базы знаний. Ответы требуют проверки для важных решений.')+
 `<div class="chat-shell"><section class="card chat-main"><div class="chat-head"><div class="bot-icon">⌖</div><div><b>Помощник «Компас»</b><small>Здесь можно спокойно разобраться в непонятном</small></div><div class="chat-mode">${db.ai_ready?'✦ ИИ подключён':'⌕ Поиск по базе'}</div></div>
 <div class="chat-messages" id="chat-messages"><div class="message bot">Привет! 👋 Я помогу найти ответ в наших учебных инструкциях. Можно спросить про возвраты, заказы, график, помощь наставника и многое другое.<div class="message-meta">Ничего страшного, если ты чего-то не знаешь.</div></div></div>
 <div class="suggestions">${['Как попросить помощи у наставника?','Что делать при ошибке?','Как узнать свой график?'].map(q=>`<button class="prompt-pill" data-question="${esc(q)}">${esc(q)}</button>`).join('')}</div>
 <form id="chat-form" class="chat-form"><input id="chat-input" aria-label="Вопрос помощнику" maxlength="1200" placeholder="Напиши свой вопрос…" autocomplete="off" required/><button class="btn" id="send-btn">Отправить ↗</button></form></section>
 <aside class="card side-info"><h3>Как работает помощник</h3><div class="info-bullet"><span>✓</span><div>Ищет релевантные ответы в учебных материалах для твоей роли.</div></div><div class="info-bullet"><span>✓</span><div>Указывает, из какой инструкции взята информация.</div></div><div class="info-bullet"><span>✓</span><div>Если точного ответа нет, советует обратиться к наставнику.</div></div><div class="info-note"><b>Важно про конфиденциальность</b><br>Сообщения не сохраняются на сервере этого демо и не попадают в HR-панель. ${db.ai_ready?'Когда ИИ подключён, вопрос отправляется провайдеру модели для ответа.':'Сейчас включён локальный поиск по базе знаний, а не генеративная модель.'} Не отправляй личные данные, пароли и документы.</div></aside></div>`;
 chatHistory.forEach(m=>appendMessage(m.type,m.text,m.sources||[],m.mode||''));
 $('#chat-form').addEventListener('submit',async e=>{e.preventDefault();const input=$('#chat-input');const msg=input.value.trim();if(!msg)return;input.value='';await submitQuestion(msg)});
}
function appendMessage(type,text,sources=[],mode=''){
 const list=$('#chat-messages');if(!list)return;
 const item=document.createElement('div');item.className=`message ${type}`;item.textContent=text;
 if(mode){const meta=document.createElement('div');meta.className='message-meta';meta.textContent=mode;item.appendChild(meta)}
 if(sources.length){const links=document.createElement('div');sources.forEach(s=>{const b=document.createElement('button');b.className='source-link';b.textContent='▤ '+s.title;b.dataset.doc=s.id;links.appendChild(b)});item.appendChild(links)}
 list.appendChild(item);list.scrollTop=list.scrollHeight;
}
async function submitQuestion(msg){
 chatHistory.push({type:'user',text:msg});appendMessage('user',msg);
 const button=$('#send-btn');button.disabled=true;button.textContent='Думаю…';
 try{const response=await request('/api/chat',{employee_id:employeeId,message:msg});const m={type:'bot',text:response.answer,sources:response.sources,mode:response.mode};chatHistory.push(m);appendMessage('bot',m.text,m.sources,m.mode)}
 catch(e){appendMessage('bot','Не удалось получить ответ. '+e.message)}
 finally{button.disabled=false;button.textContent='Отправить ↗';$('#chat-input').focus()}
}
function renderFeedback(){
 const e=profile(),days=db.survey_days[e.id]||[];
 $('#app').innerHTML=title('ОБРАТНАЯ СВЯЗЬ','Как тебе на новом месте?','Твоё мнение важно. Если нужна помощь — сообщи, и HR увидит обращение.')+
 `<div class="survey-layout"><form class="card survey-form" id="survey-form"><div class="form-group"><label class="field-label" for="survey-day">Когда проходит опрос?</label><select id="survey-day"><option value="7">7-й день — первые впечатления ${days.includes(7)?'(уже отвечали)':''}</option><option value="14" ${dayAt(e)>=14?'selected':''}>14-й день — адаптация ${days.includes(14)?'(уже отвечали)':''}</option><option value="30">30-й день — итоги первого месяца ${days.includes(30)?'(уже отвечали)':''}</option></select><small>В демо можно пройти любой этап, даже если дата ещё не наступила.</small></div>
 <div class="form-group"><div class="field-label">Как ты себя чувствуешь на работе?</div><div class="mood-row">${[['1','😟','Трудно'],['2','😕','Не очень'],['3','😐','Нормально'],['4','🙂','Хорошо'],['5','😄','Отлично']].map(([v,face,text])=>`<button type="button" class="mood-btn ${mood===Number(v)?'active':''}" data-mood="${v}"><span class="emoji">${face}</span><small>${text}</small></button>`).join('')}</div></div>
 <div class="form-group"><label class="field-label" for="kind">Нужна ли помощь?</label><select id="kind"><option>Всё хорошо</option><option>Обучение</option><option>Наставник</option><option>Процессы</option><option>Нагрузка</option><option>Другое</option></select></div>
 <div class="form-group"><label class="field-label" for="detail">Что бы ты хотел(а) улучшить?</label><textarea id="detail" maxlength="600" placeholder="Опиши ситуацию своими словами…"></textarea><small>Если выбрана проблема, описание обязательно. Не указывай персональные данные.</small></div><button class="btn" type="submit">Отправить отзыв →</button></form>
 <aside><div class="explain-note"><b>♡ Что происходит с ответом?</b>Если всё хорошо — мы просто фиксируем прохождение опроса. Если ты указал(а) проблему, в HR-панели появится обращение, которое можно взять в работу.<br><br><b>Твой чат с помощником отдельно</b>Вопросы из чата не передаются HR. В демоверсии нет авторизации — это не система для настоящих персональных данных.</div><div class="card card-pad" style="margin-top:17px"><div class="card-head"><h3>Уже пройденные опросы</h3></div><p class="muted small">${days.length?days.map(x=>`День ${x}`).join(' · '):'Пока нет ответов'}</p></div></aside></div>`;
 $('#survey-form').addEventListener('submit',submitSurvey);
}
async function submitSurvey(ev){ev.preventDefault();const day=Number($('#survey-day').value),kind=$('#kind').value,text=$('#detail').value.trim();try{await request('/api/survey',{employee_id:employeeId,day,mood,kind,text});await refresh();toast(kind==='Всё хорошо'?'Спасибо! Ответ сохранён.':'Обращение отправлено в HR-панель.') }catch(e){toast(e.message)}}
function renderHR(){
 const issues=db.issues,open=issues.filter(x=>x.status==='open'),emp=db.employees;
 const name=id=>emp.find(x=>x.id===id)?.name||'Неизвестный';
 $('#app').innerHTML=title('УПРАВЛЕНИЕ АДАПТАЦИЕЙ','Панель HR','Обзор учебных сотрудников и обращений, которые требуют внимания.',`<span class="chip">● Данные вымышленные</span>`)+
 `<div class="hr-stats"><div class="card stat"><div class="stat-top">Сотрудников на адаптации</div><div class="stat-value">${emp.length}</div><div class="stat-hint">Тестовые карточки</div></div><div class="card stat"><div class="stat-top">Открытых обращений</div><div class="stat-value alert">${open.length}</div><div class="stat-hint">Ожидают реакции HR</div></div><div class="card stat"><div class="stat-top">Решённых обращений</div><div class="stat-value">${issues.length-open.length}</div><div class="stat-hint">Закрыты в демо</div></div></div>
 <div class="hr-grid"><section class="card card-pad"><div class="card-head"><h3>Сотрудники на адаптации</h3><span class="chip">Всего ${emp.length}</span></div><div class="table-wrapper"><table class="table"><thead><tr><th>Сотрудник</th><th>День</th><th>Прогресс</th><th>Статус</th></tr></thead><tbody>${emp.map(e=>{const n=open.filter(q=>q.employee_id===e.id).length,checked=(db.checked[e.id]||[]).length;return `<tr><td><div class="person-name">${esc(e.name)}</div><div class="person-dept">${esc(e.department)}</div></td><td>${dayAt(e)} / 90</td><td>${checked} / 5</td><td><span class="pill ${n?'red':'green'}">${n?`${n} обращение`:'Нет открытых'}</span></td></tr>`}).join('')}</tbody></table></div></section>
 <section class="card card-pad"><div class="card-head"><h3>Обращения новичков</h3><span class="chip">${issues.length} всего</span></div><div>${issues.slice().reverse().map(q=>`<div class="issue"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b class="small">${esc(name(q.employee_id))}</b><span class="pill ${q.status==='open'?'red':'green'}">${q.status==='open'?'Открыто':'Решено'}</span></div><div class="issue-meta">${esc(q.kind)} · ${new Date(q.created_at).toLocaleDateString('ru-RU')}</div><p>${esc(q.text)}</p><button class="btn tiny ${q.status==='open'?'':'ghost'}" data-resolve="${q.id}" data-status="${q.status}">${q.status==='open'?'✓ Отметить решённым':'↺ Вернуть в работу'}</button></div>`).join('')}</div></section></div>
 <div class="mini-banner"><div class="round-icon" style="background:#d8ecf0;color:#24738b">ⓘ</div><div><h3>Ограничения демо</h3><p>Это прототип без входа по ролям, уведомлений и подключения к Битрикс24. Для реальных сотрудников понадобятся авторизация, согласование регламентов и правила обработки данных.</p></div></div>`;
}
function render(){if(!db)return;try{switch(page){case 'home':renderHome();break;case 'knowledge':renderKnowledge();break;case 'chat':renderChat();break;case 'feedback':renderFeedback();break;case 'hr':renderHR();break;default:renderHome()}}catch(e){console.error(e);$('#app').innerHTML=`<div class="error">Не удалось показать страницу: ${esc(e.message)}</div>`}}

document.addEventListener('click',async e=>{
 const nav=e.target.closest('[data-page],[data-go]');if(nav){go(nav.dataset.page||nav.dataset.go);return}
 const doc=e.target.closest('[data-doc]');if(doc){page='knowledge';renderChrome();renderKnowledge(doc.dataset.doc);window.scrollTo({top:0,behavior:'smooth'});return}
 const cat=e.target.closest('[data-category]');if(cat){category=cat.dataset.category;renderKnowledge();return}
 const question=e.target.closest('[data-question]');if(question){$('#chat-input').value=question.dataset.question;$('#chat-form').requestSubmit();return}
 const m=e.target.closest('[data-mood]');if(m){mood=Number(m.dataset.mood);document.querySelectorAll('[data-mood]').forEach(el=>el.classList.toggle('active',el.dataset.mood==mood));return}
 const resolve=e.target.closest('[data-resolve]');if(resolve){try{await request('/api/resolve',{issue_id:resolve.dataset.resolve,resolved:resolve.dataset.status==='open'});await refresh();toast('Статус обращения обновлён')}catch(err){toast(err.message)}return}
});
document.addEventListener('change',async e=>{
 if(e.target.id==='employee-picker'){employeeId=e.target.value;chatHistory=[];mood=4;renderChrome();render();return}
 if(e.target.matches('[data-task]')){const task=e.target;try{await request('/api/check',{employee_id:employeeId,task_id:task.dataset.task,done:task.checked});await refresh()}catch(err){toast(err.message)}return}
});
$('#mobile-toggle').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
$('#reset-btn').addEventListener('click',async()=>{if(!confirm('Сбросить все изменения в вымышленных демо-данных?'))return;try{await request('/api/reset',{confirm:true});chatHistory=[];employeeId='e1';await refresh();toast('Демо-данные сброшены')}catch(e){toast(e.message)}});
refresh().catch(e=>$('#app').innerHTML=`<div class="error">Не удалось подключиться к приложению. ${esc(e.message)}. Запустите сервер командой python server.py.</div>`);
