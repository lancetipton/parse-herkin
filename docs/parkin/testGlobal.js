System.register(["./test-354f8679.js","./globalScope-9788190d.js","./wait-26c5e7c6-fdf32dc0.js"],(function(t){"use strict";var e,s,n;return{setters:[function(t){e=t.P,s=t.g},function(t){n=t.r},function(){}],execute:function(){const setGlobals=t=>{const c=new e,i=n(),r=t||process.env.PARKIN_TEST_GLOBALS_OVERRIDE;i.ParkinTest&&!r||(i.ParkinTest=e),i.PTE&&!r||(i.PTE=c),Object.values(s).map((t=>(!i[t]||r)&&(i[t]=c[t].bind(c))))};setGlobals();t("setParkinTestGlobals",((t=!0)=>setGlobals(t)))}}}));
