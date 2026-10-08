const {chromium}=require('playwright');
const {readFileSync,writeFileSync}=require('node:fs');
const {resolve}=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({reducedMotion:'reduce'}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('file:'))requests.push(r.url())});
 const url='file://'+resolve(__dirname,'../src/mirqat-reader-current.html');
 await page.goto(url+'#ilm/ILM-D-H248');
 const reader=()=>page.frames().find(f=>f!==page.mainFrame());
 await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.MIRQAT_READER?.getSelected()==='ILM-D-H248');
 const embedded=await page.locator('#embedded-books').textContent();
 for(const [key,html] of Object.entries(JSON.parse(embedded)))assert.equal(html,readFileSync(resolve(__dirname,'../src/'+key+'-reader-current.html'),'utf8'));
 const layouts=[];
 for(const key of ['fitan','ilm']){
  await reader().locator('.book-switch a[href="'+key+'-reader-current.html"]').click();
  await page.waitForFunction(count=>document.querySelector('iframe').contentWindow.MIRQAT_READER?.hadithCount===count,key==='fitan'?31:83);
  const f=reader();
  assert.equal(await f.locator('.unit-wrap').count(),key==='fitan'?210:289);
  for(const width of [320,375,390,430,768,1024,1280,1440,1600]){
   await page.setViewportSize({width,height:900});
   await f.evaluate(()=>MIRQAT_READER.setStudy(true));
   for(const layer of ['original','vocalised']){
    await f.evaluate(layer=>document.querySelectorAll('[data-layer="'+layer+'"]').forEach(n=>n.click()),layer);
    assert.equal(await f.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    layouts.push({book:key,width,layer,overflow:false});
   }
  }
  await f.evaluate(()=>MIRQAT_READER.setStudy(false));
  const id=await f.locator('.unit-wrap:not(.hadith-unit)').first().getAttribute('id');
  await f.locator('[data-unit="'+id+'"]').click();
  assert.equal(decodeURIComponent(new URL(page.url()).hash),'#'+key+'/'+id);
  await page.reload();
  await page.waitForFunction(id=>document.querySelector('iframe').contentWindow.MIRQAT_READER?.getSelected()===id,id);
  assert.equal(await reader().locator('[data-layer=original]').first().getAttribute('aria-pressed'),'true');
 }
 await reader().locator('.book-switch a[href="fitan-reader-current.html"]').click();
 await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.MIRQAT_READER?.hadithCount===31);
 await page.goBack();await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.MIRQAT_READER?.hadithCount===83);
 await page.goForward();await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.MIRQAT_READER?.hadithCount===31);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/mirqat-combined-mobile.png'});
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 writeFileSync(resolve(__dirname,'online_browser_checks_current.json'),JSON.stringify({checks:['both exact embedded readers','114 hadiths','385 commentary units','offline book switching','deep links and reload','Back/Forward','original Arabic on reload'],layouts,javascriptErrors:errors,externalRequests:requests},null,2)+'\n');
 await browser.close();console.log('PASS: combined edition, 36 book/layer/viewport layouts, exact embedded readers, offline switching and deep links.');
})().catch(e=>{console.error(e);process.exit(1)});
