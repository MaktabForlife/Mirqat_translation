const {chromium}=require('playwright');
const {readFileSync,writeFileSync}=require('node:fs');
const {resolve}=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({reducedMotion:'reduce'}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('file:'))requests.push(r.url())});
 const source=JSON.parse(readFileSync(resolve(__dirname,'../data/ilm/sources/commentary-d3.json'),'utf8'));
 await page.goto('file://'+resolve(__dirname,'../src/ilm-reader-current.html'));await page.waitForFunction(()=>window.MIRQAT_READER);
 const integrity=await page.evaluate(source=>{
  const failures=[],check=(x,msg)=>{if(!x)failures.push(msg)},data=JSON.parse(document.getElementById('reader-data').textContent);
  const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);check(ids.length===new Set(ids).size,'duplicate IDs');
  for(const g of source.groups)for(const u of g.units){
   const wrap=document.getElementById(u.id),ar=wrap.querySelector('.arabic-text'),en=document.getElementById('en-'+u.id);
   check(ar.textContent===u.source_ar,u.id+' original');check(en.hidden,u.id+' initially hidden');
   wrap.querySelector('[data-layer=vocalised]').click();check(ar.textContent===u.vocalized_ar,u.id+' vocalised');
   wrap.querySelector('[data-layer=original]').click();check(ar.textContent===u.source_ar,u.id+' restored');
   check(en.querySelector('.commentary-english').textContent===u.translation_en,u.id+' English');
   check(wrap.querySelector('.arabic-unit').getAttribute('aria-controls')===en.id,u.id+' target');
   for(const f of u.fragments||[])check(!!document.getElementById(f.id),f.id+' source ref');
  }
  for(const n of source.editorial_notes)check(document.getElementById(n.id)?.textContent===n.text,n.id+' note');
  for(let n=198;n<=280;n++){
   check(document.querySelector('.nav-entry[href="#h'+n+'"] .nav-number')?.textContent===String(n),n+' numbered navigation');
   const wrap=document.getElementById(n+'-M'),ar=wrap.querySelector('.arabic-unit'),en=ar.nextElementSibling;
   check(ar.querySelector('.arabic-text').textContent===data.hadith[n].ar_reading,n+' matn');
   check(en.id==='en-'+n+'-M'&&!en.hidden,n+' adjacent English');
   check(!wrap.matches('[class*=tone-]')&&!wrap.querySelector('[class*=tone-]'),n+' no commentary colour');
   if(n>=219)check(en.querySelector('.translation-pending')&&en.querySelector('.text-copy').disabled,n+' pending');
   else check(en.querySelector('.hadith-translation').textContent===data.hadith[n].english_source_paragraphs[0],n+' Robson');
  }
  return {matn:83,commentary:206,editorialNotes:450,failures};
 },source);assert.deepEqual(integrity.failures,[]);
 const layouts=[];
 for(const width of [320,375,390,430,768,1024,1280,1440,1600]){
  await page.setViewportSize({width,height:900});await page.evaluate(()=>MIRQAT_READER.setStudy(false));
  const unit=page.locator('[data-unit="ILM-I01"]');await unit.click();assert.equal(await unit.getAttribute('aria-expanded'),'true');
  await unit.press('Space');assert.equal(await unit.getAttribute('aria-expanded'),'false');await unit.press('Enter');
  await page.locator('[data-unit="ILM-I02"]').click();assert.equal(await unit.getAttribute('aria-expanded'),'false');
  await page.keyboard.press('Escape');assert.equal(await page.locator('#en-ILM-I02').isVisible(),false);
  await page.locator('#study-toggle').click();assert.equal(await page.locator('.commentary-translation:not([hidden])').count(),206);
  for(const layer of ['original','vocalised']){
   await page.evaluate(layer=>document.querySelectorAll('[data-layer="'+layer+'"]').forEach(n=>n.click()),layer);
   const layout=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,
    unitsOverflow:[...document.querySelectorAll('.unit-wrap,.unit-inline,.translation-text,.arabic-text')].filter(n=>n.scrollWidth>n.clientWidth+1).map(n=>n.id||n.className),
    nonAdjacent:[...document.querySelectorAll('.commentary-translation')].filter(n=>Math.abs(n.getBoundingClientRect().top-n.previousElementSibling.getBoundingClientRect().bottom)>2).map(n=>n.id)}));
   assert.equal(layout.overflow,false);assert.deepEqual(layout.unitsOverflow,[]);assert.deepEqual(layout.nonAdjacent,[]);layouts.push({...layout,layer});
  }
  await page.locator('#study-toggle').click();
 }
 await page.locator('#search-toggle').click();await page.locator('#search-input').fill('ILM-D-H280');await page.waitForTimeout(150);await page.locator('.search-result').click();
 assert.equal(await page.locator('#en-ILM-D-H280').isVisible(),true);
 await page.reload();await page.waitForFunction(()=>MIRQAT_READER.getSelected()==='ILM-D-H280');
 assert.equal(await page.locator('#ILM-D-H280 [data-layer=original]').getAttribute('aria-pressed'),'true');
 await page.locator('#ILM-D-H280 [data-layer=vocalised]').press('Enter');assert.equal(await page.locator('#en-ILM-D-H280').isVisible(),true);
 await page.locator('#ILM-D-H280 [data-layer=original]').press('Space');assert.equal(await page.locator('#ILM-D-H280 [data-layer=original]').getAttribute('aria-pressed'),'true');
 await page.setViewportSize({width:390,height:844});await page.locator('#menu-toggle').click();await page.locator('.nav-entry[href="#group-ILM-D-S2-XREF01"]').click();
 await page.locator('[data-unit="ILM-D-S2-XREF01"]').click();assert.equal(await page.locator('#en-ILM-D-S2-XREF01').isVisible(),true);
 await page.locator('#menu-toggle').click();await page.locator('.nav-entry[href="#h280"]').click();
 await page.locator('[data-unit="ILM-D-H280"]').click();await page.screenshot({path:'/tmp/ilm-mobile.png'});
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>MIRQAT_READER.goHadith(280));await page.screenshot({path:'/tmp/ilm-desktop.png'});
 await page.locator('.book-switch a[href="fitan-reader-current.html"]').click();await page.waitForFunction(()=>MIRQAT_READER.hadithCount===31);
 await page.locator('.book-switch a[href="ilm-reader-current.html"]').click();await page.waitForFunction(()=>MIRQAT_READER.hadithCount===83);
 await page.setViewportSize({width:1440,height:1000});await page.locator('#resume-button').click();assert.equal(await page.locator('#en-ILM-D-H280').isVisible(),true);
 const denied=await browser.newPage();await denied.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('denied')}}));
 await denied.goto('file://'+resolve(__dirname,'../src/ilm-reader-current.html'));await denied.waitForFunction(()=>window.MIRQAT_READER);
 await denied.locator('[data-unit="ILM-I01"]').click();assert.equal(await denied.locator('#en-ILM-I01').isVisible(),true);
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 writeFileSync(resolve(__dirname,'ilm_browser_checks_current.json'),JSON.stringify({integrity,layouts,checks:['source and reading layers','450 note IDs/texts','hadith English pending','keyboard controls','study mode','deep-link reload','search through 280','supplementary navigation','offline book switching','blocked storage'],javascriptErrors:errors,externalRequests:requests},null,2)+'\n');
 console.log('PASS: Ilm content, all 18 layer/viewport layouts, navigation, keyboard controls, search, reload and offline book switching.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
