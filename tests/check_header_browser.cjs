const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});const p=await b.newPage({reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('file://'+require('node:path').resolve(__dirname,'../src/mirqat-reader-current.html')+'#fitan/5380-C15');
let layouts=0;
for(const book of ['fitan','ilm','taharah']){
 await p.evaluate(book=>location.hash=book,book);await p.waitForFunction(book=>document.querySelector('iframe').contentDocument?.querySelector('.book-switch [aria-current=page]')?.getAttribute('href')===book+'-reader-current.html',book);
 const f=p.frames()[1];await f.waitForFunction(()=>window.MIRQAT_READER);
 for(const width of [320,375,390,600,768,1024,1100,1280,1440,1600]){
 await p.setViewportSize({width,height:900});await p.waitForTimeout(50);
 const state=await f.evaluate(()=>{const h=document.querySelector('.topbar'),nav=h.querySelector('.book-switch'),active=nav.querySelector('[aria-current=page]');const rect=h.getBoundingClientRect();return{overflow:document.documentElement.scrollWidth>innerWidth,menus:document.querySelectorAll('.book-switch').length,contained:nav.parentElement===h,activeVisible:active.getBoundingClientRect().left>=nav.getBoundingClientRect().left-1&&active.getBoundingClientRect().right<=nav.getBoundingClientRect().right+1,toolbarInside:h.querySelector('.toolbar').getBoundingClientRect().right<=innerWidth,height:rect.height,bar:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar'))}});
 assert.equal(state.overflow,false,JSON.stringify({book,width,state}));assert.equal(state.menus,1);assert(state.contained&&state.activeVisible&&state.toolbarInside,JSON.stringify({book,width,state}));assert.equal(state.height,state.bar);layouts++;
 }
 await p.setViewportSize({width:1440,height:900});await p.screenshot({path:'/tmp/mirqat-header-desktop.png'});
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(100);await p.screenshot({path:'/tmp/mirqat-header-mobile.png'});
 const next=book==='taharah'?'fitan':'taharah';await f.locator('.topbar .book-switch a[href="'+next+'-reader-current.html"]').click();await p.waitForFunction(next=>location.hash==='#'+next,next);
}
await p.evaluate(()=>location.hash='fitan/5380-C15');await p.waitForFunction(()=>document.querySelector('iframe').contentWindow?.MIRQAT_READER?.getSelected()==='5380-C15');
assert.deepEqual(errors,[]);await b.close();console.log('PASS: '+layouts+' book/width layouts, visible selected book, header sizes, switching and passage link; no JS errors.');})().catch(e=>{console.error(e);process.exit(1)});
