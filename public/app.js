// My Life Note のデータは、この端末のブラウザに保存されます。
// 項目やテーマを増やしたいときは、CATEGORIES と PRESETS を編集してください。
const CATEGORIES = ['生活・日常','気持ち・マインド','仕事・勉強','お金','美容・健康','人間関係','趣味・好きなこと','旅行・おでかけ','挑戦・新しいこと','思い出・記録'];
const PRESETS = {
  koreanBlue:{name:'KOREAN BLUE',note:'淡いブルー × アイボリー',colors:{bg:'#f2f9f8',main:'#94bec6',accent:'#c8e1e4',card:'#fffefa',text:'#5b7278',button:'#86adb5'}},
  milkBeige:{name:'MILK BEIGE',note:'アイボリー × ベージュ',colors:{bg:'#faf6ef',main:'#bea98e',accent:'#e7d8c8',card:'#fffefa',text:'#6e6257',button:'#b7a086'}},
  babyPink:{name:'SOFT PINK',note:'淡いピンク × クリーム',colors:{bg:'#fcf0ef',main:'#cfa9af',accent:'#f0d1d3',card:'#fffdfa',text:'#765d62',button:'#c6a0a7'}},
  lavender:{name:'LAVENDER',note:'淡い紫 × アイボリー',colors:{bg:'#f2f0f8',main:'#a99fc0',accent:'#ddd6ed',card:'#fffefa',text:'#635d71',button:'#9b92b6'}},
  mono:{name:'MINIMAL',note:'ホワイト × グレー',colors:{bg:'#f7f8f8',main:'#7f8789',accent:'#dce1e2',card:'#ffffff',text:'#384143',button:'#717a7c'}}
};
const DEFAULT_COLORS = PRESETS.koreanBlue.colors;
const $ = selector => document.querySelector(selector);
const today = () => new Date().toISOString().slice(0,10);
const clone = value => JSON.parse(JSON.stringify(value));
const escape = value => String(value || '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const jpDate = date => new Intl.DateTimeFormat('ja-JP',{month:'long',day:'numeric',weekday:'short'}).format(new Date((date || today()) + 'T00:00:00'));
const image = (url, className = '') => url ? `<img class="${className}" src="${url}" alt="">` : '';

function normalize(raw){
  const data = {...raw};
  ['wishes','journals','events','goals','places','memories'].forEach(key => { if(!Array.isArray(data[key])) data[key] = []; });
  // 以前の4テーマ（blue / ivory / pink / gray）を新しいプリセットへ引き継ぎます。
  const oldTheme = {blue:'koreanBlue',ivory:'milkBeige',pink:'babyPink',gray:'mono'}[data.theme];
  if(!data.themeConfig || !data.themeConfig.colors){
    const preset = oldTheme || 'koreanBlue';
    data.themeConfig = {preset,colors:clone(PRESETS[preset].colors)};
  }
  // 以前の標準ブルーを使っている場合だけ、明るい新しい標準色へ更新します。
  // 自分で選んだ色は触らないため、着せ替え設定はそのまま残ります。
  const previousBlue = {bg:'#dbe9eb',main:'#537a86',accent:'#d9a2a1',card:'#fffaf0',text:'#35515a',button:'#547c86'};
  const currentBlue = {bg:'#e8f4f4',main:'#78aeba',accent:'#e4b7b2',card:'#fffdf8',text:'#49636b',button:'#709eaa'};
  if(data.themeConfig.preset==='koreanBlue' && (JSON.stringify(data.themeConfig.colors)===JSON.stringify(previousBlue)||JSON.stringify(data.themeConfig.colors)===JSON.stringify(currentBlue))) data.themeConfig.colors=clone(PRESETS.koreanBlue.colors);
  const olderPresetColors = {
    milkBeige:{bg:'#f3ecdf',main:'#967a61',accent:'#d1ad92',card:'#fffdf8',text:'#594b40',button:'#8b725b'},
    babyPink:{bg:'#f5e1e0',main:'#9d7178',accent:'#d69aa4',card:'#fffaf3',text:'#5d4a4d',button:'#a7767e'},
    lavender:{bg:'#e7e2f1',main:'#766c96',accent:'#ae98c7',card:'#fffdf8',text:'#4e4964',button:'#796f9b'},
    mono:{bg:'#edf0f0',main:'#4f5659',accent:'#9ba2a3',card:'#ffffff',text:'#25292a',button:'#414749'}
  };
  const presetKey=data.themeConfig.preset;
  if(olderPresetColors[presetKey] && JSON.stringify(data.themeConfig.colors)===JSON.stringify(olderPresetColors[presetKey])) data.themeConfig.colors=clone(PRESETS[presetKey].colors);
  data.theme = data.themeConfig.preset || 'custom';
  data.wishes.forEach(w => { if(w.done && !w.completedAt) w.completedAt = w.created || today(); });
  data.places.forEach(p => { if(p.done && !p.completedAt) p.completedAt = p.due || today(); });
  return data;
}
const store = {get(){try{return normalize(JSON.parse(localStorage.getItem('my-life-note-v1') || '{}'));}catch{return normalize({});}},set(value){localStorage.setItem('my-life-note-v1',JSON.stringify(value));}};
let data = store.get();
let tab = 'home';
let month = new Date();
let openedTheme = null;

function applyTheme(){
  const colors = {...DEFAULT_COLORS,...(data.themeConfig?.colors || {})};
  Object.entries(colors).forEach(([key,value]) => document.documentElement.style.setProperty(`--${key}`,value));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',colors.main);
}
function save(){store.set(data);render();}
function close(){
  // 着せ替え画面を保存せず閉じた場合は、開く前の色へ戻します。
  if(openedTheme){data.themeConfig=openedTheme;openedTheme=null;applyTheme();}
  $('#modal').hidden = true;
}
function modal(html){
  $('#modal').innerHTML = `<div class="sheet">${html}</div>`;
  $('#modal').hidden = false;
  $('#modal').onclick = event => { if(event.target === $('#modal')) close(); };
  document.querySelectorAll('[data-close]').forEach(button => button.onclick = close);
}
function fileInput(name = 'photo'){return `<label>写真 <input type="file" name="${name}" accept="image/*"></label>`;}
function readPhoto(form){
  const file = form.querySelector('input[type=file]')?.files[0];
  return file ? new Promise(resolve => {const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(file);}) : Promise.resolve('');
}
function layout(content){return `<div class="app"><header class="top"><div><div class="wordmark">MY LIFE NOTE</div><div class="date">MY LITTLE DIGITAL DIARY</div></div><div class="top-actions"><button class="icon-btn style-btn" data-open="customize" aria-label="着せ替え">✦</button><button class="icon-btn" data-action="menu" aria-label="メニュー">☰</button></div></header>${content}</div>`;}

function wishCard(wish){return `<article class="card wish-card">${image(wish.photo)}<div class="veil"></div><div><span class="tag">${escape(wish.category)}</span><h3>${escape(wish.title)}</h3><p>${wish.done ? `叶った日 ${jpDate(wish.completedAt)}` : wish.due ? `叶えたい日 ${jpDate(wish.due)}` : 'いつか叶えたい'}</p></div></article>`;}
function home(){
  const recent = [...data.wishes].filter(item=>!item.done).sort((a,b)=>(b.created||'').localeCompare(a.created||'')).slice(0,2);
  const journals = [...data.journals].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,2);
  const done = data.wishes.filter(item=>item.done).slice(0,2);
  const thisMonth = String(new Date().getMonth()+1);
  return layout(`<section class="hero"><p class="eyebrow">TODAY'S NOTE　${jpDate()}</p><h1>今日も、わたしを<br>大切にする日。</h1><small>small steps, lovely life ♡</small></section>
  <section class="section"><div class="section-head"><h2>MONTHLY GOALS</h2><button class="mini-btn" data-open="goal">編集</button></div><div class="card wide">${data.goals.filter(g=>g.kind==='month'&&g.month===thisMonth).map(g=>`<h3>${escape(g.title)}</h3>`).join('')||'<p>今月叶えたいことを、ひとつ書いてみよう。</p>'}</div></section>
  <section class="section"><div class="section-head"><h2>WISH LIST</h2><button class="mini-btn" data-tab="wish">すべて見る</button></div><div class="grid">${recent.map(wishCard).join('')||'<div class="empty wide">叶えたいことを、自由に追加してみよう。</div>'}</div></section>
  <section class="section"><div class="section-head"><h2>JOURNAL</h2><button class="mini-btn" data-tab="journal">すべて見る</button></div>${journals.map(j=>`<div class="entry"><h3>${escape(j.title||'今日のこと')}</h3><p>${jpDate(j.date)}　${escape(j.mood||'')}</p></div>`).join('')||'<div class="empty">今日の気持ちを、そっと残しておこう。</div>'}</section>
  <section class="section"><div class="section-head"><h2>MEMORY</h2><button class="mini-btn" data-open="memory">見る</button></div><div class="grid">${done.map(wishCard).join('')||'<div class="empty wide">叶った願いが、ここに並びます。</div>'}</div></section>`);
}
function wishItem(wish){return `<article class="item ${wish.done?'complete':''}" data-category="${escape(wish.category)}"><div class="thumb">${image(wish.photo)||'◇'}</div><div class="item-main"><h3>${escape(wish.title)}</h3><div class="meta">${escape(wish.category)}　${wish.due ? '叶えたい日 '+jpDate(wish.due) : '追加日 '+jpDate(wish.created)}</div></div><div class="item-actions"><button data-done="${wish.id}" title="叶った">${wish.done?'✓':'♡'}</button><button data-editwish="${wish.id}" title="編集">✎</button><button data-delete="wish:${wish.id}" title="削除">×</button></div></article>`;}
function wish(){return layout(`<h1 class="page-title">WISH LIST</h1><p class="sub">叶えたいことを、自由に追加してみよう。</p><div class="toolbar"><button class="tag" data-action="addwish">＋ 願いを追加</button>${CATEGORIES.map(category=>`<button class="tag" data-filter="${category}">${category}</button>`).join('')}</div><div id="wish-list">${data.wishes.filter(item=>!item.done).map(wishItem).join('')||'<div class="empty">最初の願いを追加してみよう。</div>'}</div>`);}
function calendar(){
  const year=month.getFullYear(), number=month.getMonth(), first=new Date(year,number,1).getDay(), last=new Date(year,number+1,0).getDate(), days=[];
  for(let n=0;n<first;n++) days.push('<div class="day muted"></div>');
  for(let day=1;day<=last;day++){
    const date=`${year}-${String(number+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const count=[...data.events.filter(e=>e.date===date),...data.wishes.filter(w=>w.due===date&&!w.done),...data.goals.filter(g=>g.date===date)].length;
    days.push(`<button class="day ${date===today()?'today':''}" data-date="${date}">${day}${count?'<i class="dot"></i>':''}</button>`);
  }
  const prefix=`${year}-${String(number+1).padStart(2,'0')}`;
  const notes=[...data.events,...data.wishes.filter(w=>w.due&&!w.done).map(w=>({title:w.title,date:w.due,note:'願い・'+w.category})),...data.goals.filter(g=>g.date)].filter(item=>item.date?.startsWith(prefix)).sort((a,b)=>a.date.localeCompare(b.date));
  const monthLabel = new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric'}).format(new Date(year,number,1)).toUpperCase();
  return layout(`<h1 class="page-title">CALENDAR</h1><p class="sub">予定と、叶えたい日をひとつに。</p><section class="calendar"><div class="cal-head"><button class="icon-btn" data-month="-1" aria-label="前の月">←</button><h2>${monthLabel}</h2><button class="icon-btn" data-month="1" aria-label="次の月">→</button></div><div class="cal-grid">${['SUN','MON','TUE','WED','THU','FRI','SAT'].map(day=>`<div class="weekday">${day}</div>`).join('')}${days.join('')}</div></section><section class="section"><div class="section-head"><h2>THIS MONTH</h2><button class="mini-btn" data-action="addevent">＋ 追加</button></div>${notes.map(item=>`<div class="entry"><h3>${escape(item.title)}</h3><p>${jpDate(item.date)} ${escape(item.note||'')}</p></div>`).join('')||'<div class="empty">予定を追加すると、ここに並びます。</div>'}</section>`);
}
function journalItem(journal){return `<article class="item"><div class="thumb">${image(journal.photo)||journal.mood||'☁'}</div><div class="item-main"><h3>${escape(journal.title||'今日のこと')}</h3><div class="meta">${jpDate(journal.date)}　${escape((journal.body||'').slice(0,32))}</div></div><div class="item-actions"><button data-editjournal="${journal.id}" title="編集">✎</button><button data-delete="journal:${journal.id}" title="削除">×</button></div></article>`;}
function journal(){return layout(`<h1 class="page-title">JOURNAL</h1><p class="sub">今日の気持ちを残しておこう。</p><div class="toolbar"><button class="tag" data-action="addjournal">＋ 日記を書く</button><input id="search" placeholder="日記を検索"></div><div id="journal-list">${[...data.journals].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(journalItem).join('')||'<div class="empty">最初の1ページを書いてみよう。</div>'}</div>`);}
function more(){return layout(`<h1 class="page-title">MY PLANNER</h1><p class="sub">わたしの毎日を、もっと好きに。</p><div class="menu-grid"><button data-open="goal"><span>☆</span>GOALS<br><small>今年と今月の目標</small></button><button data-open="place"><span>⌖</span>PLACES TO GO<br><small>行きたい場所を集めよう</small></button><button data-open="memory"><span>◇</span>MEMORY<br><small>叶ったことと思い出</small></button><button data-open="customize"><span>✦</span>CUSTOMIZE<br><small>好きな色に変える</small></button></div>`);}

function render(){applyTheme();$('#app').innerHTML=({home,wish,calendar,journal,more})[tab]();document.querySelectorAll('[data-tab]').forEach(button=>button.classList.toggle('active',button.dataset.tab===tab));bind();}
function bind(){
  document.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>{tab=button.dataset.tab;render();});
  document.querySelectorAll('[data-action=add],[data-action=menu]').forEach(button=>button.onclick=addMenu);
  document.querySelector('[data-action=addwish]')?.addEventListener('click',()=>wishForm());
  document.querySelector('[data-action=addevent]')?.addEventListener('click',()=>eventForm());
  document.querySelector('[data-action=addjournal]')?.addEventListener('click',()=>journalForm());
  document.querySelectorAll('[data-open]').forEach(button=>button.onclick=()=>openFeature(button.dataset.open));
  document.querySelectorAll('[data-done]').forEach(button=>button.onclick=()=>{const wish=data.wishes.find(item=>item.id===button.dataset.done);wish.done=!wish.done;if(wish.done)wish.completedAt=today();save();});
  document.querySelectorAll('[data-delete]').forEach(button=>{button.onclick=()=>{const [kind,itemId]=button.dataset.delete.split(':');const map={wish:'wishes',journal:'journals',event:'events',goal:'goals',place:'places',memory:'memories'};data[map[kind]]=data[map[kind]].filter(item=>item.id!==itemId);save();};});
  document.querySelectorAll('[data-editwish]').forEach(button=>button.onclick=()=>wishForm(data.wishes.find(item=>item.id===button.dataset.editwish)));
  document.querySelectorAll('[data-editjournal]').forEach(button=>button.onclick=()=>journalForm(data.journals.find(item=>item.id===button.dataset.editjournal)));
  document.querySelectorAll('[data-month]').forEach(button=>button.onclick=()=>{month.setMonth(month.getMonth()+Number(button.dataset.month));render();});
  document.querySelectorAll('[data-date]').forEach(button=>button.onclick=()=>eventForm({date:button.dataset.date}));
  document.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>document.querySelectorAll('#wish-list .item').forEach(item=>item.hidden=item.dataset.category!==button.dataset.filter));
  $('#search')?.addEventListener('input',event=>document.querySelectorAll('#journal-list .item').forEach((item,index)=>item.hidden=!JSON.stringify(data.journals[index]).includes(event.target.value)));
}
function addMenu(){modal(`<button class="secondary" data-close>← 戻る</button><h2>何を追加しますか？</h2><div class="add-menu"><button data-add="wish"><span>◇</span>願いを追加</button><button data-add="goal"><span>☆</span>目標を追加</button><button data-add="event"><span>□</span>予定を追加</button><button data-add="journal"><span>✎</span>日記を書く</button><button data-add="place"><span>⌖</span>行きたい場所を追加</button><button data-add="memory"><span>✦</span>思い出を追加</button></div>`);document.querySelectorAll('[data-add]').forEach(button=>button.onclick=()=>{const action=button.dataset.add;close();({wish:()=>wishForm(),goal:goalPage,event:()=>eventForm(),journal:()=>journalForm(),place:placePage,memory:memoryForm})[action]();});}

function wishForm(wish={}){modal(`<button class="secondary" data-close>← 戻る</button><h2>${wish.id?'願いを編集':'願いを追加'}</h2><form class="form" id="wishform"><label>タイトル<input name="title" required value="${escape(wish.title)}" placeholder="例：ひとりで海を見に行く"></label><label>詳細<textarea name="detail" placeholder="どんな気持ちで叶えたい？">${escape(wish.detail)}</textarea></label><label>カテゴリー<select name="category">${CATEGORIES.map(category=>`<option ${wish.category===category?'selected':''}>${category}</option>`).join('')}</select></label><div class="row"><label>叶えたい日<input type="date" name="due" value="${wish.due||''}"></label><label>追加日<input type="date" name="created" value="${wish.created||today()}"></label></div>${fileInput()}<button class="primary">保存する</button></form>`);$('#wishform').onsubmit=async event=>{event.preventDefault();const form=event.target,values=Object.fromEntries(new FormData(form)),photo=await readPhoto(form);if(wish.id){Object.assign(wish,values);if(photo)wish.photo=photo;}else data.wishes.unshift({...values,id:id(),photo,done:false});close();save();};}
function journalForm(journal={}){modal(`<button class="secondary" data-close>← 戻る</button><h2>${journal.id?'日記を編集':'日記を書く'}</h2><form class="form" id="journalform"><label>日付<input type="date" name="date" value="${journal.date||today()}" required></label><label>タイトル<input name="title" value="${escape(journal.title)}" placeholder="今日のこと"></label><label>本文<textarea name="body" placeholder="今の気持ちを自由に書いてね。">${escape(journal.body)}</textarea></label><label>気分</label><div class="moods">${['☀️','☺️','☁️','😌','🌙'].map(mood=>`<button type="button" class="mood ${journal.mood===mood?'selected':''}" data-mood="${mood}">${mood}</button>`).join('')}</div><input type="hidden" name="mood" value="${journal.mood||'☺️'}">${fileInput()}<button class="primary">日記を保存する</button></form>`);document.querySelectorAll('[data-mood]').forEach(button=>button.onclick=()=>{$('[name=mood]').value=button.dataset.mood;document.querySelectorAll('[data-mood]').forEach(item=>item.classList.toggle('selected',item===button));});$('#journalform').onsubmit=async event=>{event.preventDefault();const form=event.target,values=Object.fromEntries(new FormData(form)),photo=await readPhoto(form);if(journal.id){Object.assign(journal,values);if(photo)journal.photo=photo;}else data.journals.unshift({...values,id:id(),photo});close();save();};}
function eventForm(eventItem={}){modal(`<button class="secondary" data-close>← 戻る</button><h2>${eventItem.id?'予定を編集':'予定を追加'}</h2><form class="form" id="eventform"><label>予定<input name="title" required value="${escape(eventItem.title)}" placeholder="例：カフェでゆっくりする"></label><label>日付<input type="date" name="date" value="${eventItem.date||today()}" required></label><label>メモ<textarea name="note">${escape(eventItem.note)}</textarea></label><button class="primary">予定を保存する</button></form>`);$('#eventform').onsubmit=event=>{event.preventDefault();const values=Object.fromEntries(new FormData(event.target));if(eventItem.id)Object.assign(eventItem,values);else data.events.push({...values,id:id()});close();save();};}
function openFeature(kind){({goal:goalPage,place:placePage,memory:memoryPage,customize:customizePage})[kind]?.();}
function goalPage(){modal(`<button class="secondary" data-close>← 戻る</button><h2>目標</h2><form class="form" id="goalform"><label>種類<select name="kind"><option value="theme">今年のテーマ</option><option value="wish">今年叶えたいこと</option><option value="year">年間目標</option><option value="month">月ごとの目標</option></select></label><label>内容<input name="title" required placeholder="例：自分のご機嫌を自分でとる"></label><label>月（任意）<input type="number" min="1" max="12" name="month"></label><label>日付（任意）<input type="date" name="date"></label><button class="primary">目標を追加する</button></form><section class="section">${data.goals.map(goal=>`<div class="item"><div class="item-main"><h3>${escape(goal.title)}</h3><div class="meta">${({theme:'今年のテーマ',wish:'今年叶えたいこと',year:'年間目標',month:'月ごとの目標'})[goal.kind]||'目標'} ${goal.month?'・'+goal.month+'月':''}</div></div><button class="delete" data-goal-delete="${goal.id}">×</button></div>`).join('')||'<div class="empty">今年の想いを書いてみよう。</div>'}</section>`);$('#goalform').onsubmit=event=>{event.preventDefault();data.goals.unshift({...Object.fromEntries(new FormData(event.target)),id:id()});close();save();};document.querySelectorAll('[data-goal-delete]').forEach(button=>button.onclick=()=>{data.goals=data.goals.filter(goal=>goal.id!==button.dataset.goalDelete);goalPage();store.set(data);});}
function placePage(){modal(`<button class="secondary" data-close>← 戻る</button><h2>行きたい場所</h2><form class="form" id="placeform"><label>場所<input name="title" required placeholder="例：済州島の海辺"></label><div class="row"><label>エリア<select name="area"><option>国内</option><option>海外</option></select></label><label>行きたい日<input type="date" name="due"></label></div><label>メモ<textarea name="memo"></textarea></label>${fileInput()}<button class="primary">場所を追加する</button></form><section class="section">${data.places.map(place=>`<div class="item ${place.done?'complete':''}"><div class="thumb">${image(place.photo)||'⌖'}</div><div class="item-main"><h3>${escape(place.title)}</h3><div class="meta">${escape(place.area||'')}　${place.done?'行った':'行きたい'}</div></div><div class="item-actions"><button data-place="${place.id}">${place.done?'✓':'♡'}</button><button data-delete="place:${place.id}">×</button></div></div>`).join('')||'<div class="empty">行きたい場所を、地図のように集めよう。</div>'}</section>`);$('#placeform').onsubmit=async event=>{event.preventDefault();const form=event.target;data.places.unshift({...Object.fromEntries(new FormData(form)),id:id(),photo:await readPhoto(form),done:false});close();save();};document.querySelectorAll('[data-place]').forEach(button=>button.onclick=()=>{const place=data.places.find(item=>item.id===button.dataset.place);place.done=!place.done;if(place.done)place.completedAt=today();placePage();store.set(data);});document.querySelectorAll('[data-delete]').forEach(button=>button.onclick=()=>{data.places=data.places.filter(place=>place.id!==button.dataset.delete.split(':')[1]);placePage();store.set(data);});}
function memoryCards(){return [...data.wishes.filter(w=>w.done).map(w=>({...w,label:'叶った願い',date:w.completedAt||w.created,memo:w.detail})),...data.places.filter(p=>p.done).map(p=>({...p,label:'行った場所',date:p.completedAt||p.due,memo:p.memo})),...data.memories.map(m=>({...m,label:'思い出',date:m.date,memo:m.memo})),...data.journals.filter(j=>j.photo).map(j=>({...j,label:'日記',date:j.date,memo:j.body}))].sort((a,b)=>(b.date||'').localeCompare(a.date||''));}
function memoryPage(){const cards=memoryCards();modal(`<button class="secondary" data-close>← 戻る</button><h2>思い出</h2><p class="sub">叶ったことと、忘れたくない瞬間。</p><button class="tag" data-action="addmemory" style="margin-top:15px">＋ 思い出を追加</button><div class="album">${cards.map(card=>`<article class="memory">${image(card.photo)}<div><small>${card.label}　${card.date?jpDate(card.date):''}</small><br><strong>${escape(card.title||'思い出')}</strong>${card.memo?`<br><span>${escape(card.memo).slice(0,34)}</span>`:''}</div></article>`).join('')||'<div class="empty wide">願いが叶ったら、ここがアルバムになります。</div>'}</div>`);document.querySelector('[data-action=addmemory]')?.addEventListener('click',memoryForm);}
function memoryForm(){modal(`<button class="secondary" data-close>← 戻る</button><h2>思い出を追加</h2><form class="form" id="memoryform"><label>タイトル<input name="title" required placeholder="例：夏の小さな旅"></label><label>日付<input type="date" name="date" value="${today()}"></label><label>メモ<textarea name="memo" placeholder="残しておきたいこと"></textarea></label>${fileInput()}<button class="primary">思い出を保存する</button></form>`);$('#memoryform').onsubmit=async event=>{event.preventDefault();const form=event.target;data.memories.unshift({...Object.fromEntries(new FormData(form)),id:id(),photo:await readPhoto(form)});close();save();};}
function customizePage(){
  // プリセットを押して画面を描き直しても、最初に開いた時点の色は保持します。
  // そのため「戻る」で保存前の変更をまとめて取り消せます。
  if(!openedTheme) openedTheme=clone(data.themeConfig);
  const colors={...DEFAULT_COLORS,...data.themeConfig.colors};
  modal(`<button class="secondary" data-cancel-theme>← 戻る</button><h2>着せ替え</h2><p class="sub">今の気分に合わせて、手帳を着せ替えよう。</p><div class="theme-list">${Object.entries(PRESETS).map(([key,preset])=>`<button class="theme ${data.themeConfig.preset===key?'active':''}" data-preset="${key}"><span class="swatch" style="background:linear-gradient(135deg,${preset.colors.bg} 50%,${preset.colors.main} 50%)"></span><b>${preset.name}</b><small>${preset.note}</small></button>`).join('')}<button class="theme ${data.themeConfig.preset==='custom'?'active':''}" data-preset="custom"><span class="swatch" style="background:conic-gradient(#d8a1a1,#d9e9eb,#d4c6e8,#d8a1a1)"></span><b>自分で作る</b><small>好きな色を自由に設定</small></button></div><div class="custom-colors">${[['bg','背景色'],['main','メインカラー'],['accent','アクセントカラー'],['card','カードの色'],['text','文字色'],['button','ボタンの色']].map(([key,label])=>`<label class="color-control">${label}<input type="color" data-color="${key}" value="${colors[key]}"></label>`).join('')}</div><button class="primary" data-save-theme>この着せ替えを保存する</button><div class="footer-note">背景やカードは好きな色に変えられます。文字を記入する欄は、どのテーマでも白で見やすく表示されます。</div>`);
  document.querySelectorAll('[data-preset]').forEach(button=>button.onclick=()=>{const key=button.dataset.preset;if(key==='custom'){data.themeConfig.preset='custom';}else{data.themeConfig={preset:key,colors:clone(PRESETS[key].colors)};}applyTheme();customizePage();});
  document.querySelectorAll('[data-color]').forEach(input=>input.oninput=()=>{data.themeConfig.preset='custom';data.themeConfig.colors[input.dataset.color]=input.value;applyTheme();});
  $('[data-save-theme]').onclick=()=>{data.theme=data.themeConfig.preset;store.set(data);openedTheme=null;close();render();};
  $('[data-cancel-theme]').onclick=()=>close();
}
document.querySelector('.bottom-nav').addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;if(button.dataset.tab){tab=button.dataset.tab;render();}if(button.dataset.action==='add')addMenu();});
render();
