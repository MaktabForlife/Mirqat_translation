/* Kitab al-Fitan • Online 01. Vanilla JavaScript; no network requests or external dependencies. */
(() => {
  'use strict';
  const DATA = JSON.parse(document.getElementById('reader-data').textContent);
  const $ = id => document.getElementById(id);
  const root = $('reading-content');
  const wide = matchMedia('(min-width:1280px)');
  const reduceMotion = matchMedia('(prefers-reduced-motion:reduce)');
  const storeKey = 'mirqat.fitan.online01';
  const saved = (() => {try {return JSON.parse(localStorage.getItem(storeKey) || '{}') || {};} catch (_) {return {};}})();
  let selected = null, study = false, textSize = Number(saved.textSize) || (innerWidth <= 600 ? 24 : 27);
  textSize = Math.max(20, Math.min(38, textSize));
  let toastTimer, returnFocus = null, navFocus = null, observedHadith = 5379, searchTimer;
  const units = [], unitMap = new Map(), nodes = new Map(), navLinks = new Map();
  const allData = DATA.commentary;
  const ordinal = new Map(allData.map((u,i) => [u.id,i]));
  const arabicNumbers = n => String(n).replace(/\d/g, x => '٠١٢٣٤٥٦٧٨٩'[+x]);
  const sectionFor = n => n <= 5392 ? 1 : n <= 5407 ? 2 : 3;
  const sectionEn = ['','Section One','Section Two','Section Three'];
  const sectionAr = ['','الْفَصْلُ الْأَوَّلُ','الْفَصْلُ الثَّانِي','الْفَصْلُ الثَّالِثُ'];
  function el(tag, classes, text) {const n=document.createElement(tag); if(classes)n.className=classes; if(text!==undefined)n.textContent=text; return n;}
  function icon(name) {const t=$('icon-'+name);return t.content.cloneNode(true);}
  function toast(message) {$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2400);}
  function persist() {try {localStorage.setItem(storeKey, JSON.stringify({textSize,lastUnit:saved.lastUnit || '',lastHadith:observedHadith}));} catch(_) {/* File/privacy modes may deny storage; reading remains available. */}}
  function setHash(hash,replace=false) {try {history[replace?'replaceState':'pushState'](null,'','#'+encodeURIComponent(hash));}catch(_){/* Some file viewers prohibit history changes. */}}
  function normalise(s) {return s.normalize('NFD').replace(/[\u0300-\u036f\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[۰-۹]/g,c=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).toLowerCase().replace(/[ʿʾ'’`]/g,'').replace(/[\s\-–—]+/g,' ').trim();}
  function appendAnnotated(parent,text,annotations=[]) {
    let last=0;
    for(const a of annotations) {
      parent.append(document.createTextNode(text.slice(last,a.start)));
      parent.append(el('span','transliteration',text.slice(a.start,a.end)));
      const bracket=el('span','script-bracket'); bracket.dir='ltr';bracket.dataset.editorial='arabic-reading-aid';
      bracket.append(document.createTextNode(' ['));
      const word=el('bdi','',a.arabic);word.lang='ar';word.dir='rtl';bracket.append(word,document.createTextNode(']'));
      parent.append(bracket);last=a.end;
    }
    parent.append(document.createTextNode(text.slice(last)));
  }
  function enrichPlain(text,annotations=[]) {let value='',last=0;for(const a of annotations){value+=text.slice(last,a.end)+' ['+a.arabic+']';last=a.end;}return value+text.slice(last);}
  function safeSourceURL(url) {try {const u=new URL(url);return u.protocol==='https:' && u.hostname==='sunnah.com' ? u.href : null;}catch(_){return null;}}
  function addNotes(host,u) {
    const notes=u.notes || [];
    if(notes.length){
      const det=el('details','review-note'),sum=el('summary','',`Editorial review notes (${notes.length})`);det.append(sum);
      notes.forEach((text,i)=>{const p=el('p','note-item');appendAnnotated(p,text,(u.note_annotations||[])[i]||[]);det.append(p);});host.append(det);
    }
  }
  function addEnglish(host,u,withSource=true) {
    const body=el('div','translation-text'); body.lang='en'; body.dir='ltr';
    if(u.kind==='matn') {
      // Exact, pre-escaped paragraph markup carried over from the accepted Draft 04 package.
      const template=document.createElement('template');template.innerHTML=u.english_html_from_draft04;
      body.append(template.content.cloneNode(true));
    } else {
      const p=el('p','commentary-english');appendAnnotated(p,u.english,u.annotations);body.append(p);
    }
    host.append(body);addNotes(host,u);
    if(withSource){
      const source=el('div','source-note');
      if(u.kind==='matn') {
        source.append(el('div','',`Mishkāt al-Maṣābīḥ ${u.hadith} · James Robson, as supplied.`));
        source.append(el('div','','Arabic: the Draft 04 collated reading. English wording and supplied notes are unchanged.'));
        const url=safeSourceURL(u.source_url);
        if(url){const a=el('a','','Source reference · Sunnah.com ↗');a.href=url;a.target='_blank';a.rel='noopener noreferrer';source.append(a);}
      } else {
        const pages=u.source_pdf_pages.join(', '),printed=u.source_pdf_pages.map(p=>p+2).join(', ');
        source.append(el('div','',`Mirqāt scan · PDF page${u.source_pdf_pages.length>1?'s':''} ${pages} · printed ${printed}.`));
        source.append(el('div','','New commentary translation from Draft 04. Arabic brackets are editorial reading aids; the text and its vocalisation remain a review draft.'));
      }
      host.append(source);
    }
  }
  function addUnit(article,u) {
    unitMap.set(u.id,u);units.push(u);
    const matn=u.kind==='matn';
    const wrap=el('div',`unit-wrap ${matn?'hadith-unit':u.tone}`);wrap.id=u.id;
    const button=el('div',`arabic-unit${matn?' matn':''}`);button.tabIndex=0;button.dataset.unit=u.id;
    const meta=el('div','unit-meta');
    meta.append(el('span','unit-key',u.id));
    if(!matn){
      button.role='button';button.setAttribute('aria-controls','en-'+u.id);button.setAttribute('aria-expanded','false');
      const hint=el('span','unit-action');hint.append(icon('translate'),el('span','full-hint','Read translation'));meta.append(hint);
    }
    button.append(meta);
    const text=el('p','arabic-text',u.arabic);text.lang='ar';text.dir='rtl';button.append(text);
    const box=el('div',`unit-inline ${matn?'hadith-english':'commentary-translation'}`);box.id='en-'+u.id;box.dataset.inline=u.id;box.hidden=!matn;
    addEnglish(box,u);
    const actions=el('div','inline-actions');
    const copyEnglish=el('button','text-copy','Copy English');copyEnglish.type='button';
    copyEnglish.addEventListener('click',()=>copy(matn?u.english_source_paragraphs.join('\n\n'):enrichPlain(u.english,u.annotations)));
    const ref=el('button','text-copy','Copy reference');ref.type='button';ref.addEventListener('click',()=>copy(location.protocol==='file:'?u.id:location.href.split('#')[0]+'#'+u.id));
    actions.append(copyEnglish,ref);box.append(actions);
    wrap.append(button,box);article.append(wrap);nodes.set(u.id,button);
    if(!matn){
      const toggle=()=>{const sel=window.getSelection();if(sel&&!sel.isCollapsed&&sel.toString().trim())return;
        if(!box.hidden){selected=u.id;returnFocus=button;closePanel();}else openUnit(u.id);
      };
      button.addEventListener('click',toggle);
      button.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});
    }
  }
  function makeContent() {
    let section=0;
    const frag=document.createDocumentFragment();
    for(let h=5379;h<=5409;h++) {
      const s=sectionFor(h);
      if(s!==section){
        section=s;const sh=el('div','section-heading');sh.id='section-'+s;
        sh.append(el('span','',sectionEn[s]));const h2=el('h2','',sectionAr[s]);h2.lang='ar';sh.append(h2);frag.append(sh);
      }
      const article=el('section','hadith-section');article.id='h'+h;article.setAttribute('aria-labelledby','heading-'+h);
      const heading=el('div','hadith-heading');const left=el('div','hadith-id',`MISHKĀT ${h}`);left.append(el('span','hadith-sub',`${h-5378} / 31 · ${sectionEn[s]}`));
      const h3=el('h3','',`الْحَدِيثُ ${arabicNumbers(h)}`);h3.lang='ar';h3.id='heading-'+h;heading.append(left,h3);article.append(heading);
      const hdata=DATA.hadith[String(h)];
      addUnit(article,{...hdata,id:`${h}-M`,hadith:h,kind:'matn',arabic:hdata.ar_reading,tone:'',english:hdata.english_source_paragraphs.join('\n\n')});
      const label=el('div','commentary-label');label.append(el('span','','Mirqāt commentary'));const arLabel=el('bdi','','شَرْحُ الْمِرْقَاةِ');arLabel.lang='ar';arLabel.dir='rtl';label.append(arLabel);article.append(label);
      allData.filter(u=>u.hadith===h).forEach(u=>addUnit(article,{...u,kind:'commentary',arabic:u.reading_ar,tone:'tone-'+(ordinal.get(u.id)%4)}));
      frag.append(article);
    }
    root.append(frag);
    for(const u of units)u.searchText=normalise(u.id+' '+u.arabic+' '+u.english+' '+(u.english_with_arabic||''));
    makeNavigation();
  }
  function makeNavigation(){const nav=$('nav-list');let sec=0;
    for(let h=5379;h<=5409;h++){
      const s=sectionFor(h);if(s!==sec){sec=s;const group=el('div','section-link');group.append(el('span','',sectionEn[s]),el('span','',s===1?'14':s===2?'15':'2'));nav.append(group);}
      const a=el('a','nav-entry');a.href='#h'+h;a.setAttribute('aria-label',`Go to hadith ${h}`);
      const text=DATA.hadith[String(h)].ar_reading;
      a.append(el('span','nav-number',String(h)));const ar=el('bdi','nav-ar',text.slice(0,78));ar.lang='ar';ar.dir='rtl';a.append(ar);
      a.addEventListener('click',e=>{e.preventDefault();goHadith(h);});nav.append(a);navLinks.set(h,a);
    }
    setCurrent(5379);updateResume();
  }
  function setCurrent(h){observedHadith=h;navLinks.forEach((a,n)=>a.setAttribute('aria-current',String(n===h)));$('current-number').textContent=h;}
  function updateResume(){const id=typeof saved.lastUnit==='string'&&unitMap.has(saved.lastUnit)?saved.lastUnit:null;const btn=$('resume-button');btn.hidden=!id;if(id){$('resume-label').textContent=`Resume ${id}`;btn.dataset.target=id;}}
  function remember(u){saved.lastUnit=u.id;setCurrent(u.hadith);persist();updateResume();}
  function ensureVisible(id,force=false){
    const n=nodes.get(id);if(!n)return;
    const r=n.getBoundingClientRect(),header=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar')) || 76;
    const bottom=innerHeight;
    if(force||r.top<header+15||r.top>bottom-85|| (r.bottom>bottom-20&&r.height<bottom-header-45)) {
      const top=scrollY+r.top-header-24;window.scrollTo({top:Math.max(0,top),behavior:reduceMotion.matches?'auto':'smooth'});
    }
  }
  function setExpanded(id,expanded){
    if(unitMap.get(id).kind==='matn')return;
    const node=nodes.get(id);$('en-'+id).hidden=!expanded;
    node.classList.toggle('selected',expanded);node.setAttribute('aria-expanded',String(expanded));
    node.querySelector('.full-hint').textContent=expanded?'Hide translation':'Read translation';
  }
  function openUnit(id,{focus=true,hash=true,scroll=true}={}) {
    const u=unitMap.get(id);if(!u)return;
    closeMenu(false);returnFocus=nodes.get(id);
    // Keep the activated Arabic in place when an earlier translation collapses.
    const before=returnFocus.getBoundingClientRect().top;
    if(!study)for(const item of allData)setExpanded(item.id,false);
    selected=id;setExpanded(id,true);
    const after=returnFocus.getBoundingClientRect().top;
    window.scrollBy({top:after-before,behavior:'instant'});
    remember(u);if(hash)setHash(id,true);
    if(focus)returnFocus.focus({preventScroll:true});
    if(scroll)ensureVisible(id);
    updateProgress();
  }
  function closePanel({focus=true,hash=true}={}) {
    const id=selected;if(!id)return;
    setExpanded(id,false);selected=null;
    if(hash)setHash('h'+unitMap.get(id).hadith,true);
    if(focus&&returnFocus)returnFocus.focus({preventScroll:true});
    updateProgress();
  }
  function moveUnit(delta){if(!selected)return;const i=units.findIndex(u=>u.id===selected),u=units[i+delta];if(u)openUnit(u.id);}
  function goHadith(h,{hash=true}={}) {const article=$('h'+h);if(!article)return;closePanel({focus:false,hash:false});closeMenu(false);setCurrent(h);if(hash)setHash('h'+h);const target=$('heading-'+h);target.tabIndex=-1;target.focus({preventScroll:true});article.scrollIntoView({block:'start',behavior:reduceMotion.matches?'auto':'smooth'});}
  function setStudy(value){
    study=value;selected=null;
    for(const u of allData)setExpanded(u.id,value);
    $('study-toggle').setAttribute('aria-pressed',String(value));$('study-label').textContent=value?'Hide commentary':'Study mode';
    updateProgress();
  }
  function adjustSize(delta){textSize=Math.max(20,Math.min(38,textSize+delta));applySize();persist();}
  function applySize(){document.documentElement.style.setProperty('--arabic-size',textSize+'px');document.querySelectorAll('[data-size-output]').forEach(n=>n.textContent=textSize);document.querySelectorAll('[data-size-down]').forEach(n=>n.disabled=textSize<=20);document.querySelectorAll('[data-size-up]').forEach(n=>n.disabled=textSize>=38);}
  function openMenu(){navFocus=document.activeElement;$('contents').classList.add('is-open');$('nav-scrim').classList.add('visible');$('menu-toggle').setAttribute('aria-expanded','true');syncMenuAccessibility();$('nav-close').focus({preventScroll:true});}
  function closeMenu(focus=true){$('contents').classList.remove('is-open');$('nav-scrim').classList.remove('visible');$('menu-toggle').setAttribute('aria-expanded','false');syncMenuAccessibility();if(focus&&navFocus)navFocus.focus({preventScroll:true});}
  function syncMenuAccessibility(){const visible=wide.matches||$('contents').classList.contains('is-open');$('contents').inert=!visible;$('contents').setAttribute('aria-hidden',String(!visible));}
  function openDialog(id){closeMenu(false);const dialog=$(id);if(typeof dialog.showModal==='function'){dialog.showModal();}else {dialog.setAttribute('open','');}if(id==='search-dialog'){setTimeout(()=>$('search-input').focus(),20);runSearch();}}
  function closeDialog(id){const d=$(id);if(typeof d.close==='function')d.close();else d.removeAttribute('open');}
  function runSearch(){
    const q=normalise($('search-input').value),out=$('search-results');out.replaceChildren();
    if(!q){$('search-count').textContent='Search Arabic, English or a reference, such as 5396-C04.';return;}
    const qs=q.split(/\s+/).filter(Boolean);const hits=units.filter(u=>qs.every(t=>u.searchText.includes(t)));
    $('search-count').textContent=hits.length?`${hits.length} matching passage${hits.length===1?'':'s'}${hits.length>50?' · showing first 50':''}`:'No matching passages.';
    if(!hits.length){out.append(el('p','search-empty','Try a hadith number, an Arabic word without vowel marks, or an English expression.'));return;}
    const wantsArabic=/[\u0600-\u06ff]/.test($('search-input').value)||/^\d/.test(q);
    for(const u of hits.slice(0,50)){
      const b=el('button','search-result');b.type='button';b.append(el('span','result-meta',`${u.id} · ${u.kind==='matn'?'Hadith matn':'Mirqāt commentary'}`));
      const text=wantsArabic?u.arabic:u.english;let start=0;
      if(!wantsArabic){const needle=$('search-input').value.toLowerCase();const pos=text.toLowerCase().indexOf(needle);start=Math.max(0,pos-60);}
      const snippet=el('span','result-snippet',(start?'… ':'')+text.slice(start,start+(wantsArabic?115:185))+(text.length>start+185?' …':''));snippet.lang=wantsArabic?'ar':'en';snippet.dir=wantsArabic?'rtl':'ltr';b.append(snippet);
      b.addEventListener('click',()=>{closeDialog('search-dialog');openUnit(u.id);setTimeout(()=>ensureVisible(u.id,true),270);});out.append(b);
    }
  }
  async function copy(text){try{if(navigator.clipboard && window.isSecureContext){await navigator.clipboard.writeText(text);toast('Copied');return;}}catch(_){}
    const area=el('textarea','',text);area.value=text;area.style.cssText='position:fixed;left:-9999px;top:0';document.body.append(area);area.select();let ok=false;try{ok=document.execCommand('copy');}catch(_){}area.remove();toast(ok?'Copied':'Copy unavailable here. Select the text to copy it.');
  }
  function routeFromHash(){let hash='';try{hash=decodeURIComponent(location.hash.slice(1));}catch(_){return;}if(unitMap.has(hash))openUnit(hash,{focus:false,hash:false});else if(/^h\d{4}$/.test(hash))goHadith(+hash.slice(1),{hash:false});}
  function updateProgress(){const max=document.documentElement.scrollHeight-innerHeight;const fraction=max>0?scrollY/max:0;$('progress-fill').style.width=Math.max(0,Math.min(100,fraction*100))+'%';}
  // Bind controls before enabling the reader.
  $('study-toggle').addEventListener('click',()=>setStudy(!study));
  $('menu-toggle').addEventListener('click',()=> $('contents').classList.contains('is-open')?closeMenu():openMenu());
  $('nav-close').addEventListener('click',()=>closeMenu());$('nav-scrim').addEventListener('click',()=>closeMenu());
  $('resume-button').addEventListener('click',()=>{const id=$('resume-button').dataset.target;if(unitMap.has(id)){closeMenu(false);openUnit(id);setTimeout(()=>ensureVisible(id,true),270);}});
  $('search-toggle').addEventListener('click',()=>openDialog('search-dialog'));$('about-toggle').addEventListener('click',()=>openDialog('about-dialog'));
  document.querySelectorAll('[data-dialog-close]').forEach(n=>n.addEventListener('click',()=>closeDialog(n.dataset.dialogClose)));
  $('search-input').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(runSearch,90);});
  document.querySelectorAll('[data-size-down]').forEach(n=>n.addEventListener('click',()=>adjustSize(-1)));document.querySelectorAll('[data-size-up]').forEach(n=>n.addEventListener('click',()=>adjustSize(1)));
  document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog(d.id);}}));
  document.addEventListener('keydown',e=>{
    const inInput=/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)||e.target.isContentEditable;
    if(e.key==='Escape'){
      if($('contents').classList.contains('is-open')){e.preventDefault();closeMenu();}
      else if(!document.querySelector('dialog[open]')){
        const active=document.activeElement.closest('.unit-wrap');
        if(active&&unitMap.get(active.id)?.kind==='commentary'&&!$('en-'+active.id).hidden){selected=active.id;returnFocus=nodes.get(active.id);}
        if(selected){e.preventDefault();closePanel();}
      }
    }
    if(!inInput&&!document.querySelector('dialog[open]')){
      if(e.key==='/'){e.preventDefault();openDialog('search-dialog');}
      if(selected&&$(selected).contains(document.activeElement)){if(e.key==='ArrowRight'){e.preventDefault();moveUnit(1);}else if(e.key==='ArrowLeft'){e.preventDefault();moveUnit(-1);}}
    }
    // The compact contents drawer behaves as a small modal navigation region.
    if(e.key==='Tab'&&!wide.matches&&$('contents').classList.contains('is-open')){
      const focusables=[...$('contents').querySelectorAll('button:not([hidden]),a')].filter(n=>n.getClientRects().length);
      const first=focusables[0],last=focusables[focusables.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
  window.addEventListener('hashchange',routeFromHash);wide.addEventListener('change',()=>{if(wide.matches)closeMenu(false);syncMenuAccessibility();});
  window.addEventListener('resize',()=>{updateProgress();});
  let scheduled=false;window.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(()=>{updateProgress();scheduled=false;});}},{passive:true});
  makeContent();applySize();syncMenuAccessibility();updateProgress();
  const observer = new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)setCurrent(+e.target.dataset.observeHadith);},{rootMargin:'-80px 0px -70% 0px',threshold:0});
  document.querySelectorAll('.hadith-heading').forEach(n=>{n.dataset.observeHadith=n.parentElement.id.slice(1);observer.observe(n);});
  requestAnimationFrame(()=>{routeFromHash();$('loading-message').hidden=true;});
  window.MIRQAT_READER=Object.freeze({version:'Inline 02',textVersion:'Draft 04',unitCount:units.length,hadithCount:31,commentaryCount:179,openUnit,closePanel,setStudy,goHadith,getSelected:()=>selected});
})();
