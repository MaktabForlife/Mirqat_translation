/* Run with Playwright installed; CHROME_PATH may override the system Chromium. */
const {chromium} = require('playwright');
const {writeFileSync} = require('node:fs');
const {resolve} = require('node:path');
const assert = require('node:assert/strict');
(async()=>{
  const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true});
  const page = await browser.newPage({reducedMotion:'reduce'});
  const errors=[], requests=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(!r.url().startsWith('file:'))requests.push(r.url());});
  await page.goto('file://'+resolve(__dirname,'../src/fitan-reader-current.html'));
  await page.waitForFunction(()=>window.MIRQAT_READER);
  const integrity=await page.evaluate(()=>{
    const data=JSON.parse(document.getElementById('reader-data').textContent), failures=[];
    const check=(ok,msg)=>{if(!ok)failures.push(msg)};
    const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);check(ids.length===new Set(ids).size,'duplicate DOM IDs');
    for(const [h,u] of Object.entries(data.hadith)){
      const wrap=document.getElementById(h+'-M'), ar=wrap.querySelector('.arabic-unit'), en=ar.nextElementSibling;
      check(ar.querySelector('.arabic-text').textContent===u.ar_reading,h+' Arabic');
      const expected=document.createElement('div');expected.innerHTML=u.english_html_from_draft04;
      check(en.querySelector('.translation-text').innerHTML===expected.innerHTML,h+' Robson markup');
      check(!en.hidden&&en.id==='en-'+h+'-M',h+' adjacent English');
      check(!wrap.matches('[class*="tone-"]')&&!wrap.querySelector('[class*="tone-"]'),h+' colour classes');
      check(getComputedStyle(ar).backgroundColor===getComputedStyle(en).backgroundColor,h+' neutral pair');
    }
    for(const u of data.commentary){
      const wrap=document.getElementById(u.id),ar=wrap.querySelector('.arabic-unit'),en=ar.nextElementSibling;
      check(ar.querySelector('.arabic-text').textContent===u.reading_ar,u.id+' Arabic');
      check(ar.getAttribute('aria-controls')===en.id&&en.dataset.inline===u.id,u.id+' inline target');
      const clone=en.querySelector('.commentary-english').cloneNode(true);clone.querySelectorAll('.script-bracket').forEach(n=>n.remove());
      check(clone.textContent===u.english,u.id+' English');
      check(en.querySelectorAll('.commentary-english .script-bracket').length===u.annotations.length,u.id+' annotation count');
      check(en.querySelectorAll('.note-item').length===u.notes.length,u.id+' notes');
      [...en.querySelectorAll('.note-item')].forEach((n,i)=>{const c=n.cloneNode(true);c.querySelectorAll('.script-bracket').forEach(n=>n.remove());check(c.textContent===u.notes[i],u.id+' note '+i)});
    }
    return {hadiths:Object.keys(data.hadith).length,commentary:data.commentary.length,failures};
  });assert.deepEqual(integrity.failures,[]);
  const widths=[320,375,390,430,768,1024,1280,1440,1600], layouts=[];
  for(const width of widths){
    await page.setViewportSize({width,height:900});
    await page.evaluate(()=>MIRQAT_READER.setStudy(false));
    const first=page.locator('[data-unit="5379-C01"]');await first.click();
    assert.equal(await first.getAttribute('aria-expanded'),'true');
    await first.press('Space');assert.equal(await first.getAttribute('aria-expanded'),'false');
    await first.press('Enter');assert.equal(await first.getAttribute('aria-expanded'),'true');
    await page.locator('[data-unit="5379-C02"]').click();assert.equal(await first.getAttribute('aria-expanded'),'false');
    await page.keyboard.press('Escape');assert.equal(await page.locator('[data-unit="5379-C02"]').getAttribute('aria-expanded'),'false');
    await page.locator('#study-toggle').click();
    assert.equal(await page.locator('.commentary-translation:not([hidden])').count(),179);
    const layout=await page.evaluate(()=>{
      const overflow=[...document.querySelectorAll('.unit-wrap,.unit-inline,.arabic-text,.translation-text')].filter(n=>n.scrollWidth>n.clientWidth+1).map(n=>n.id||n.className);
      const bad=[...document.querySelectorAll('.commentary-translation')].filter(n=>Math.abs(n.getBoundingClientRect().top-n.previousElementSibling.getBoundingClientRect().bottom)>2).map(n=>n.id);
      return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,unitsOverflow:overflow,nonAdjacent:bad};
    });assert.equal(layout.overflow,false);assert.deepEqual(layout.unitsOverflow,[]);assert.deepEqual(layout.nonAdjacent,[]);layouts.push(layout);
    await first.focus();await page.keyboard.press('Escape');assert.equal(await first.getAttribute('aria-expanded'),'false');
    await page.locator('#study-toggle').click();assert.equal(await page.locator('.hadith-english:not([hidden])').count(),31);
  }
  await page.locator('#search-toggle').click();await page.locator('#search-input').fill('5396-C04');await page.waitForTimeout(150);
  await page.locator('.search-result').click();assert.equal(await page.locator('[data-unit="5396-C04"]').getAttribute('aria-expanded'),'true');
  await page.reload();await page.waitForFunction(()=>window.MIRQAT_READER?.getSelected()==='5396-C04');
  await page.evaluate(()=>MIRQAT_READER.openUnit('5409-M'));assert.equal(await page.locator('#en-5409-M').isVisible(),true);
  await page.setViewportSize({width:390,height:844});await page.locator('#menu-toggle').click();await page.locator('.nav-entry[href="#h5379"]').click();
  await page.locator('[data-unit="5379-C01"]').click();
  await page.screenshot({path:'/tmp/fitan-mobile.png'});
  await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'/tmp/fitan-desktop.png'});
  // Storage denial must not break local reading.
  const denied=await browser.newPage();await denied.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('denied')}}));
  await denied.goto('file://'+resolve(__dirname,'../src/fitan-reader-current.html'));
  await denied.waitForFunction(()=>window.MIRQAT_READER);await denied.locator('[data-unit="5379-C01"]').click();
  assert.equal(await denied.locator('#en-5379-C01').isVisible(),true);
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  const report={integrity,layouts,checks:['click toggle','Enter/Space/Escape','single-open commentary','study mode','search','deep-link reload','hadith links','mobile contents','blocked storage','reduced motion'],javascriptErrors:errors,externalRequests:requests};
  writeFileSync(resolve(__dirname,'browser_checks_current.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
