const {chromium}=require('playwright');
const {readFileSync,writeFileSync}=require('node:fs');
const {resolve}=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({reducedMotion:'reduce'}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('file:'))requests.push(r.url())});
 const source=JSON.parse(readFileSync(resolve(__dirname,'../data/taharah/sources/commentary-d1-d3.json'),'utf8'));
 await page.goto('file://'+resolve(__dirname,'../src/taharah-reader-current.html'));await page.waitForFunction(()=>window.MIRQAT_READER);
 const integrity=await page.evaluate(source=>{
  const failures=[],check=(x,msg)=>{if(!x)failures.push(msg)},data=JSON.parse(document.getElementById('reader-data').textContent);
  const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);check(ids.length===new Set(ids).size,'unique IDs');
  for(const u of source.units){
   const wrap=document.getElementById(u.unit_id),ar=wrap.querySelector('.arabic-text'),en=document.getElementById('en-'+u.unit_id);
   check(ar.textContent===u.D1_source_ar,u.unit_id+' original');check(en.hidden,u.unit_id+' hidden');
   wrap.querySelector('[data-layer=vocalised]').click();check(ar.textContent===u.D3_vocalised_commentary_ar,u.unit_id+' vocalised');
   wrap.querySelector('[data-layer=original]').click();
   check(en.querySelector('.commentary-english').textContent===u.D2_translation_en,u.unit_id+' translation');
   check(JSON.stringify([...en.querySelectorAll('.note-item')].map(n=>n.textContent))===JSON.stringify(u.editorial_notes),u.unit_id+' notes');
  }
  for(let n=281;n<=563;n++){
   const u=data.hadith[n],wrap=document.getElementById(u.id),ar=wrap.querySelector('.arabic-unit'),en=ar.nextElementSibling;
   check(ar.querySelector('.arabic-text').textContent===u.ar_supplied,u.id+' matn');
   check(wrap.querySelector('[data-layer=vocalised]').disabled,u.id+' pending vowels');
   check(!en.hidden&&en.id==='en-'+u.id,u.id+' adjacent English');
   check(en.querySelector('.hadith-translation').textContent===u.english_source_paragraphs[0],u.id+' English');
   check(en.querySelector('.english-status').textContent===u.english_status,u.id+' status');
   check(!wrap.querySelector('[class*=tone-]'),u.id+' neutral colour');
  }
  return {matn:283,commentary:339,failures};
 },source);assert.deepEqual(integrity.failures,[]);
 await page.setViewportSize({width:390,height:844});
 const unit=page.locator('[data-unit="TAH-D1-BOOK-INTRO"]');await unit.press('Enter');assert.equal(await unit.getAttribute('aria-expanded'),'true');
 await page.locator('#TAH-D1-BOOK-INTRO [data-layer=vocalised]').press('Space');assert.equal(await page.locator('#en-TAH-D1-BOOK-INTRO').isVisible(),true);
 await page.keyboard.press('Escape');assert.equal(await page.locator('#en-TAH-D1-BOOK-INTRO').isVisible(),false);
 await page.locator('#search-toggle').click();await page.locator('#search-input').fill('TAH-D1-H563');await page.waitForTimeout(150);await page.locator('.search-result').click();
 await page.reload();await page.waitForFunction(()=>MIRQAT_READER.getSelected()==='TAH-D1-H563');
 assert.equal(await page.locator('#TAH-D1-H563 [data-layer=original]').getAttribute('aria-pressed'),'true');
 await page.locator('.brand').click();await page.screenshot({path:'/tmp/taharah-mobile.png'});
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 writeFileSync(resolve(__dirname,'taharah_browser_checks_current.json'),JSON.stringify({integrity,checks:['exact source layers and English','all commentary notes','neutral hadith blocks','pending matn vowels','keyboard and translation state','search through 563','reload with original Arabic'],javascriptErrors:errors,externalRequests:requests},null,2)+'\n');
 await browser.close();console.log('PASS: Taharah DOM preservation, keyboard controls, pending labels, search and reload.');
})().catch(e=>{console.error(e);process.exit(1)});
