(function(e){function t(t){for(var s,i,r=t[0],l=t[1],c=t[2],m=0,d=[];m<r.length;m++)i=r[m],Object.prototype.hasOwnProperty.call(n,i)&&n[i]&&d.push(n[i][0]),n[i]=0;for(s in l)Object.prototype.hasOwnProperty.call(l,s)&&(e[s]=l[s]);p&&p(t);while(d.length)d.shift()();return o.push.apply(o,c||[]),a()}function a(){for(var e,t=0;t<o.length;t++){for(var a=o[t],s=!0,i=1;i<a.length;i++){var r=a[i];0!==n[r]&&(s=!1)}s&&(o.splice(t--,1),e=l(l.s=a[0]))}return e}var s={},i={app:0},n={app:0},o=[];function r(e){return l.p+"js/"+({About:"About",Awards:"Awards",Credits:"Credits",Error404:"Error404",GDPR:"GDPR",MIT:"MIT",PrivacyPolicy:"PrivacyPolicy",Productions:"Productions",Project:"Project",TermsOfUse:"TermsOfUse"}[e]||e)+"."+{About:"d573e2eb",Awards:"9fc17dd3",Credits:"a6b3f928",Error404:"4539a5b6",GDPR:"7c52bf96",MIT:"14244e27",PrivacyPolicy:"da124164",Productions:"8b194226",Project:"1c88ed36",TermsOfUse:"dcbe474e"}[e]+".js"}function l(t){if(s[t])return s[t].exports;var a=s[t]={i:t,l:!1,exports:{}};return e[t].call(a.exports,a,a.exports,l),a.l=!0,a.exports}l.e=function(e){var t=[],a={Awards:1,Error404:1,Project:1};i[e]?t.push(i[e]):0!==i[e]&&a[e]&&t.push(i[e]=new Promise((function(t,a){for(var s="css/"+({About:"About",Awards:"Awards",Credits:"Credits",Error404:"Error404",GDPR:"GDPR",MIT:"MIT",PrivacyPolicy:"PrivacyPolicy",Productions:"Productions",Project:"Project",TermsOfUse:"TermsOfUse"}[e]||e)+"."+{About:"31d6cfe0",Awards:"35da35bc",Credits:"31d6cfe0",Error404:"4553f88c",GDPR:"31d6cfe0",MIT:"31d6cfe0",PrivacyPolicy:"31d6cfe0",Productions:"31d6cfe0",Project:"35da35bc",TermsOfUse:"31d6cfe0"}[e]+".css",n=l.p+s,o=document.getElementsByTagName("link"),r=0;r<o.length;r++){var c=o[r],m=c.getAttribute("data-href")||c.getAttribute("href");if("stylesheet"===c.rel&&(m===s||m===n))return t()}var d=document.getElementsByTagName("style");for(r=0;r<d.length;r++){c=d[r],m=c.getAttribute("data-href");if(m===s||m===n)return t()}var p=document.createElement("link");p.rel="stylesheet",p.type="text/css",p.onload=t,p.onerror=function(t){var s=t&&t.target&&t.target.src||n,o=new Error("Loading CSS chunk "+e+" failed.\n("+s+")");o.code="CSS_CHUNK_LOAD_FAILED",o.request=s,delete i[e],p.parentNode.removeChild(p),a(o)},p.href=n;var u=document.getElementsByTagName("head")[0];u.appendChild(p)})).then((function(){i[e]=0})));var s=n[e];if(0!==s)if(s)t.push(s[2]);else{var o=new Promise((function(t,a){s=n[e]=[t,a]}));t.push(s[2]=o);var c,m=document.createElement("script");m.charset="utf-8",m.timeout=120,l.nc&&m.setAttribute("nonce",l.nc),m.src=r(e);var d=new Error;c=function(t){m.onerror=m.onload=null,clearTimeout(p);var a=n[e];if(0!==a){if(a){var s=t&&("load"===t.type?"missing":t.type),i=t&&t.target&&t.target.src;d.message="Loading chunk "+e+" failed.\n("+s+": "+i+")",d.name="ChunkLoadError",d.type=s,d.request=i,a[1](d)}n[e]=void 0}};var p=setTimeout((function(){c({type:"timeout",target:m})}),12e4);m.onerror=m.onload=c,document.head.appendChild(m)}return Promise.all(t)},l.m=e,l.c=s,l.d=function(e,t,a){l.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:a})},l.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},l.t=function(e,t){if(1&t&&(e=l(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var a=Object.create(null);if(l.r(a),Object.defineProperty(a,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var s in e)l.d(a,s,function(t){return e[t]}.bind(null,s));return a},l.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return l.d(t,"a",t),t},l.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},l.p="/",l.oe=function(e){throw console.error(e),e};var c=window["webpackJsonp"]=window["webpackJsonp"]||[],m=c.push.bind(c);c.push=t,c=c.slice();for(var d=0;d<c.length;d++)t(c[d]);var p=m;o.push([0,"chunk-vendors"]),a()})({0:function(e,t,a){e.exports=a("56d7")},"56d7":function(e,t,a){"use strict";a.r(t);var s=a("2b0e"),i=function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",{class:e.show_cookie?"":"show-banner",attrs:{id:"app"}},[a("h1",{staticClass:"hdn"},[e._v("luiskr.com")]),a("HeaderComponent"),a("transition",{attrs:{name:"fade",mode:"out-in"}},[a("router-view")],1),a("span",{staticClass:"loading"},[e._v("Loading")]),a("transition",{attrs:{name:"cookie"}},[!e.show_cookie&&e.domLoaded?a("div",{staticClass:"cookie-banner"},[a("div",{staticClass:"max-area"},[a("p",[e._v(" This site uses third-party cookies from Google Analytics and Facebook Pixel to track page visits and events. Get more info about data, cookies and terms of use at GDPR, Terms of Use and Privacy policy of this website. This page doesn't send pageviews and events without consent and doesn't store any visitor's data. All session data is stored locally on your own browser, by the use of the local storage API. The consent can be revoked by clearing your browser's locally stored data. ")]),a("div",{staticClass:"second-column"},[a("div",{staticClass:"second-column-fixed"},[a("button",{staticClass:"accept",on:{click:function(t){return e.accept()}}},[a("span",[e._v("I accept")])]),a("button",{staticClass:"refuse",on:{click:function(t){return e.close()}}},[a("span",[e._v("Ignore me")])])])])])]):e._e()])],1)},n=[],o=function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",[a("header",{staticClass:"header"},[a("h3",{staticClass:"hdn"},[e._v(e._s(e.array.title))]),a("div",{staticClass:"max-area"},[a("button",{staticClass:"header-link header-more",on:{click:function(t){return e.headerOpen()}}},[e.open?a("span",{staticClass:"hdn"},[e._v(e._s(e.array.toggle[1]))]):a("span",{staticClass:"hdn"},[e._v(e._s(e.array.toggle[0]))]),a("span",{staticClass:"header-more-line top"}),a("span",{staticClass:"header-more-line middle"}),a("span",{staticClass:"header-more-line bottom"})])]),a("transition",{attrs:{name:"menu-open"}},[a("div",{directives:[{name:"show",rawName:"v-show",value:e.open,expression:"open"}],staticClass:"header-modal"},[a("div",{staticClass:"header-modal-background"}),a("div",{staticClass:"max-area"},[a("div",[a("h4",{staticClass:"hover-span",on:{click:function(t){return e.sendAnalyticsEvent("modal_link","click",e.array.home[1],100)}}},[a("router-link",{staticClass:"header-modal-link",attrs:{to:e.array.home[0]}},[a("span",{staticClass:"header-modal-link-title",on:{click:function(t){return e.headerClose()}}},[e._v(e._s(e.array.home[1]))])])],1),a("h4",{staticClass:"hover-span",on:{click:function(t){return e.sendAnalyticsEvent("modal_link","click",e.array.about[1],100)}}},[a("router-link",{staticClass:"header-modal-link",attrs:{to:e.array.about[0]}},[a("span",{staticClass:"header-modal-link-title",on:{click:function(t){return e.headerClose()}}},[e._v(e._s(e.array.about[1]))])])],1),a("h4",{staticClass:"hover-span",on:{click:function(t){return e.sendAnalyticsEvent("modal_link","click",e.array.awards[1],100)}}},[a("router-link",{staticClass:"header-modal-link",attrs:{to:e.array.awards[0]}},[a("span",{staticClass:"header-modal-link-title",on:{click:function(t){return e.headerClose()}}},[e._v(e._s(e.array.awards[1]))])])],1),a("h4",{staticClass:"hover-span",on:{click:function(t){return e.sendAnalyticsEvent("modal_link","click",e.array.productions[1],100)}}},[a("router-link",{staticClass:"header-modal-link",attrs:{to:e.array.productions[0]}},[a("span",{staticClass:"header-modal-link-title",on:{click:function(t){return e.headerClose()}}},[e._v(e._s(e.array.productions[1]))])])],1),a("h4",{staticClass:"hover-span",on:{click:function(t){return e.sendAnalyticsEvent("modal_link","click",e.array.mail[1],200)}}},[a("a",{staticClass:"header-modal-link",attrs:{href:e.array.mail[0],rel:"noopener"}},[a("span",{staticClass:"header-modal-link-title",on:{click:function(t){return e.headerClose()}}},[e._v(e._s(e.array.mail[1]))])])]),a("h4",{staticClass:"hover-span",on:{click:function(t){return e.sendAnalyticsEvent("modal_link","click",e.array.phone[1],200)}}},[a("a",{staticClass:"header-modal-link",attrs:{href:e.array.phone[0],rel:"noopener"}},[a("span",{staticClass:"header-modal-link-title",on:{click:function(t){return e.headerClose()}}},[e._v(e._s(e.array.phone[1]))])])]),a("h4",{staticClass:"hover-span",on:{click:function(t){return e.sendAnalyticsEvent("modal_link","click",e.array.linkedin[1],100)}}},[a("a",{staticClass:"header-modal-link",attrs:{href:e.array.linkedin[0],rel:"noopener"}},[a("span",{staticClass:"header-modal-link-title",on:{click:function(t){return e.headerClose()}}},[e._v(e._s(e.array.linkedin[1]))])])])]),a("div",[a("h4",{staticClass:"hover-span",on:{click:function(t){return e.sendAnalyticsEvent("modal_link","click",e.array.github[1],100)}}},[a("a",{staticClass:"header-modal-link",attrs:{href:e.array.github[0],rel:"noopener"}},[a("span",{staticClass:"header-modal-link-title",on:{click:function(t){return e.headerClose()}}},[e._v(e._s(e.array.github[1]))])])]),a("h4",{staticClass:"hover-span",on:{click:function(t){return e.sendAnalyticsEvent("modal_link","click",e.array.instagram[1],100)}}},[a("a",{staticClass:"header-modal-link",attrs:{href:e.array.instagram[0],rel:"noopener"}},[a("span",{staticClass:"header-modal-link-title",on:{click:function(t){return e.headerClose()}}},[e._v(e._s(e.array.instagram[1]))])])]),a("h4",{staticClass:"hover-span",on:{click:function(t){return e.sendAnalyticsEvent("modal_link","click",e.array.credits[1],50)}}},[a("router-link",{staticClass:"header-modal-link",attrs:{to:e.array.credits[0]}},[a("span",{staticClass:"header-modal-link-title",on:{click:function(t){return e.headerClose()}}},[e._v(e._s(e.array.credits[1]))])])],1),a("h4",{staticClass:"hover-span",on:{click:function(t){return e.sendAnalyticsEvent("modal_link","click",e.array.GDPR[1],50)}}},[a("router-link",{staticClass:"header-modal-link",attrs:{to:e.array.GDPR[0]}},[a("span",{staticClass:"header-modal-link-title",on:{click:function(t){return e.headerClose()}}},[e._v(e._s(e.array.GDPR[1]))])])],1),a("h4",{staticClass:"hover-span",on:{click:function(t){return e.sendAnalyticsEvent("modal_link","click",e.array.terms_of_use[1],50)}}},[a("router-link",{staticClass:"header-modal-link",attrs:{to:e.array.terms_of_use[0]}},[a("span",{staticClass:"header-modal-link-title",on:{click:function(t){return e.headerClose()}}},[e._v(e._s(e.array.terms_of_use[1]))])])],1),a("h4",{staticClass:"hover-span",on:{click:function(t){return e.sendAnalyticsEvent("modal_link","click",e.array.privacy_policy[1],50)}}},[a("router-link",{staticClass:"header-modal-link",attrs:{to:e.array.privacy_policy[0]}},[a("span",{staticClass:"header-modal-link-title",on:{click:function(t){return e.headerClose()}}},[e._v(e._s(e.array.privacy_policy[1]))])])],1)])])])])],1)])},r=[],l={name:"HeaderComponent",data(){return{origin:this.$parent.origin,storage:this.$parent.storage,array:{title:"Menu",toggle:["Open Menu","Close Menu"],home:["/","Home"],about:["/about","About"],awards:["/awards/cssda-kudos-06-2020","awards"],productions:["/productions","productions"],mail:["mailto:luis.krotz@gmail.com?subject=Contact%20from%20luiskr.com&body","Mail"],privacy_policy:["/privacy-policy","Privacy Policy"],terms_of_use:["/terms-of-use","Terms of Use"],GDPR:["/GDPR","GDPR"],credits:["/credits","Credits"],instagram:["https://www.instagram.com/j_luiskrotz","Instagram"],linkedin:["https://www.linkedin.com/in/luis-kr%C3%B6tz/","linkedin"],github:["https://github.com/LuisKrotz","github"],phone:["tel:+5551982274782","phone"]},remember:0,open:!1}},created(){let e=this,t=0;function a(){document.body.classList.remove("header-open"),e.open=!1}a(),window.addEventListener("resize",(function(){t++,t>10&&e.open&&(a(),t=0)}))},methods:{headerClose(){document.body.classList.remove("header-open"),window.scrollTo(0,this.remember),document.querySelector(".main").style="",this.open=!1},headerOpen(){this.open?(this.headerClose(),this.sendAnalyticsEvent("modal","click","open",100)):(this.remember=window.scrollY,window.scrollTo(0,0),document.querySelector(".main").style=`transform: translateY(-${this.remember}px`,document.body.classList.add("header-open"),this.open=!0,this.sendAnalyticsEvent("modal","click","close",50))},sendAnalyticsEvent(e,t,a,s){this.$parent.sendAnalyticsEvent(e,t,a,s)}}},c=l,m=a("2877"),d=Object(m["a"])(c,o,r,!1,null,null,null),p=d.exports,u={components:{HeaderComponent:p},data(){return{show_cookie:Boolean(localStorage.getItem("cookie")),has_touch:!1,webp:".jpg",webp2:".jpg",placeholder:"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",storage:"https://storage.googleapis.com/luiskr.com/public/",origin:window.location.origin,domLoaded:!1,projects:{project:"Project",at:"Developed at:",role:"Role:",credits:["Check out for more info about "," at:"],checkit:"Visit this project",next:"next: ",prev:"previous: ",home:"home",home_link:"home",animation_title:"Animation by Giphy.com, credits on luiskr.com/credits",animation_alt:["GIPHY.com animation of ","representing the mouse cursor, more info at: luiskr.com/credits"],animation:["hands touching in pink background","hands touching in universe background","cat trying to get mouse pointer on computer","3d face o looking to poiner","handrawn man juggling an arrow "],contribuition:"My Contribuition:",description:"Description:"},awards:{next:"next: ",prev:"previous: ",checkit:"Check out this award",title:"Awards",animation_title:"Animation by Giphy.com, credits on luiskr.com/credits",animation_alt:["GIPHY.com animation of ","representing the mouse cursor, more info at: luiskr.com/credits"],animation:["hands touching in pink background","hands touching in universe background","cat trying to get mouse pointer on computer","3d face o looking to poiner","handrawn man juggling an arrow "]}}},created(){let e=this;Modernizr.on("webp",(function(t){e.webp=t?".webp":e.webp,e.webp2=t?".jpg.webp":e.webp2}));try{document.createEvent("TouchEvent"),e.has_touch=!0}catch(t){e.has_touch=!1}window.addEventListener("load",(function(){e.domLoaded=!0}))},methods:{getUrlParam(e,t){function a(){var e={};window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,(function(t,a,s){e[a]=s}));return e}var s=t;return window.location.href.indexOf(e)>-1&&(s=a()[e]),s},sendAnalyticsEvent(e,t,a,s){if(!0===Boolean(localStorage.getItem("cookie:accepted"))){function i(e,t,a,s){this.category=e,this.action=t,this.label=a,this.value=s}this.$ga.event({eventCategory:e,eventAction:t,eventLabel:a,eventValue:s}),void 0!==window.fbq&&window.fbq("track","Lead",{content_name:a,value:s,currency:"BRL"}),this.records&&console.table(new i(e,t,a,s))}else this.records&&console.log("Not tracking. Cookies not allowed")},accept(){localStorage.setItem("cookie",!0),this.show_cookie=!0,document.body.classList.remove("show-banner"),document.dispatchEvent(new Event("accepted"))},close(){this.show_cookie=!0,document.body.classList.remove("show-banner")}}},h=u,b=(a("5c0b"),Object(m["a"])(h,i,n,!1,null,null,null)),j=b.exports,M=a("8c4f"),f=a("0284"),y=a.n(f),w=function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("main",{staticClass:"home"},[a("div",{attrs:{id:"appendPicture"}}),a("div",{attrs:{id:"appendSVG"}}),a("div",{staticClass:"max-area"},[a("h3",{staticClass:"main-title"},[a("router-link",{attrs:{to:"/about"}},[e._v("I'm Luis. ")]),a("span",[e._v("Front-end developer and part time Freelancer. Check out some of the projects I've worked on below.")])],1)]),a("article",{staticClass:"main"},[a("div",{staticClass:"home-projects"},[a("div",{staticClass:"max-area"},e._l(e.posts,(function(t,s){return a("router-link",{key:s,staticClass:"home-project",attrs:{to:t.path}},[a("h3",{staticClass:"home-project-title",on:{click:function(a){return e.projectClick("portfolio_link","click",t.project,100)}}},[a("span",{directives:[{name:"view",rawName:"v-view"}]},[e._v(e._s(t.name))])])])})),1)])])])},C=[],v=a("5f86"),k=a.n(v);s["a"].use(k.a);var g={name:"HomeComponent",data(){return{storage:this.$parent.storage,origin:this.$parent.origin,webp:".gif",posts:[{path:"/projects/melissa-next-br",name:"Melissa | Next"},{path:"/projects/minimelissa-dreamers",name:"Minimelissa | AW'20"},{path:"/projects/minimelissa-color-me",name:"Minimelissa | SS'20"},{path:"/projects/melissa-dreamers-infinitos",name:"Melissa | Dreamers / Infinitos"},{path:"/projects/metcha-newsletter",name:"METCHA | Newsletter"},{path:"/projects/metcha-newsletter-generator",name:"METCHA | Newsletter Generator"},{path:"/projects/metcha-cms",name:"METCHA | CMS"},{path:"/projects/metcha-website",name:"METCHA | Website"},{path:"/projects/melissa-sustainability",name:"Melissa | Sustainability"},{path:"/projects/melissa-color-me",name:"Melissa | Color ME"},{path:"/projects/transainc-muda",name:"Transainc | Muda"},{path:"/projects/cicb-sustainability-forum-2019",name:"CICB | Sustainability Forum 2019"},{path:"/projects/cicb-sustainability-forum-2018",name:"CICB | Sustainability Forum 2018"},{path:"/projects/cicb-sustainability-forum-2017",name:"CICB | Sustainability Forum 2017"},{path:"/projects/cicb-sustainability-forum-2016",name:"CICB | Sustainability Forum 2016"},{path:"/projects/coza-webpage",name:"Coza | Webpage"},{path:"/projects/coza-where-to-find",name:"Coza | Where to Find"},{path:"/projects/melissa-family",name:"Melissa | Family"},{path:"/projects/melissa-mapping",name:"Melissa | Mapping"},{path:"/projects/melissa-mirror",name:"Melissa | Mirror"},{path:"/projects/melissa-open-vibes",name:"Melissa | Open Vibes"},{path:"/projects/melissa-a-la-garconne",name:"Melissa | À Lá Garçonne"},{path:"/projects/melissa-awaytomars",name:"Melissa | AWAYTOMARS"},{path:"/projects/melissa-baja-east",name:"Melissa | Baja East"},{path:"/projects/melissa-melissa+csc",name:"Melissa | Melissa + CSC"},{path:"/projects/melissa-fabula",name:"Melissa | Fábula"},{path:"/projects/melissa-melissa+rider",name:"Melissa | Melissa + Rider"},{path:"/projects/melissa-galleries-sp-nyc-lon",name:"Melissa | Galleries SP/NYC/LON"},{path:"/projects/melissa-bike",name:"Melissa | Bike"},{path:"/projects/melissa-creatives",name:"Melissa | Creatives"},{path:"/projects/melissa-sk8",name:"Melissa | SK8"},{path:"/projects/melissa-possession",name:"Melissa | Possession"},{path:"/projects/minimelissa-candy-framework",name:"Minimelissa | Candy Framework"},{path:"/projects/minimelissa-website",name:"Minimelissa | Website"},{path:"/projects/minimelissa-a-w16",name:"Minimelissa | A/W'16"},{path:"/projects/minimelissa-a-w17",name:"Minimelissa | A/W'17"},{path:"/projects/minimelissa-a-w18",name:"Minimelissa | A/W'18"},{path:"/projects/minimelissa-a-w19",name:"Minimelissa | A/W'19"},{path:"/projects/minimelissa-where-to-find",name:"Minimelissa | Where to Find"},{path:"/projects/minimelissa-s-s16",name:"Minimelissa | S/S'16"},{path:"/projects/minimelissa-s-s17",name:"Minimelissa | S/S'17"},{path:"/projects/minimelissa-s-s18",name:"Minimelissa | S/S'18"},{path:"/projects/minimelissa-s-s19",name:"Minimelissa | S/S'19"},{path:"/projects/mor-website",name:"Mor | Website"},{path:"/projects/mor-where-to-find",name:"Mor | Where to Find"},{path:"/projects/cicb-cscb-leather-law-brazilian-portal",name:"CICB / CSCB/ Leather Law / Brazilian Leather | Portal"},{path:"/projects/melissa-new-features",name:"Melissa | New Features"},{path:"/projects/melissa-flygrl",name:"Melissa | Flygrl"},{path:"/projects/melissa-mashup",name:"Melissa | Mashup"},{path:"/projects/melissa-cine-melissa",name:"Melissa | Cine Melissa"},{path:"/projects/melissa-dance-machine",name:"Melissa | Dance Machine"},{path:"/projects/melissa-eat-my-melissa",name:"Melissa | Eat My Melissa"},{path:"/projects/melissa-nation",name:"Melissa | Nation"},{path:"/projects/melissa-starwalker",name:"Melissa | Starwalker"},{path:"/projects/melissa-wanna-be-carioca",name:"Melissa | Wanna Be Carioca"},{path:"/projects/melissa-we-are-flowers",name:"Melissa | We are Flowers"},{path:"/projects/melissa-campana",name:"Melissa | Campana"},{path:"/projects/melissa-gaetano-pesce",name:"Melissa | Gaetano Pesce"},{path:"/projects/melissa-gareth-pugh",name:"Melissa | Gareth Pugh"},{path:"/projects/melissa-j-maskrey",name:"Melissa | J Maskrey"},{path:"/projects/melissa-jason-wu",name:"Melissa | Jason Wu"},{path:"/projects/melissa-jeremy-scott",name:"Melissa | Jeremy Scott"},{path:"/projects/melissa-karl-lagerfeld",name:"Melissa | Karl Lagerfeld"},{path:"/projects/melissa-sebastian-errazuriz",name:"Melissa | Sebastian Errazuriz"},{path:"/projects/melissa-vitorino-campos",name:"Melissa | Vitorino Campos"},{path:"/projects/melissa-vivienne-westwood",name:"Melissa | Vivienne Westwood"},{path:"/projects/melissa-zaha-hadid",name:"Melissa | Zaha Hadid"},{path:"/projects/melissa-where-to-find",name:"Melissa | Where to Find"},{path:"/projects/melissa-roller-joy",name:"Melissa | Roller Joy"},{path:"/projects/melissa-tropico-surreal",name:"Melissa | Tropico Surreal"},{path:"/projects/mor-loja-mor",name:"Mor | Loja Mor"},{path:"/projects/vibra-website",name:"Vibra | Website"},{path:"/projects/genesysinf-sageweb",name:"GenesysInf | SageWeb"}]}},created(){let e=this;Modernizr.on("webp",(function(t){e.webp=t?e.webp:".gif"}))},mounted(){document.title=this.$route.meta.title},methods:{sendAnalyticsEvent(e,t,a,s){this.$parent.sendAnalyticsEvent(e,t,a,s)},projectClick(e,t,a,s){this.$parent.sendAnalyticsEvent(e,t,a,s)}}},P=g,L=Object(m["a"])(P,w,C,!1,null,null,null),A=L.exports;s["a"].use(M["a"]);const z=73,_=4,S=[{path:"/",name:"Home",component:A,meta:{title:"Luis Krötz"}},{path:"/about",name:"About",component:()=>a.e("About").then(a.bind(null,"f820")),meta:{title:"Luis Krötz - About"}},{path:"/productions",name:"Productions",component:()=>a.e("Productions").then(a.bind(null,"8226")),meta:{title:"Luis Krötz - Productions"}},{path:"/credits",name:"Credits",component:()=>a.e("Credits").then(a.bind(null,"b096")),meta:{title:"Luis Krötz - Credits"}},{path:"/gdpr",name:"GDPR",component:()=>a.e("GDPR").then(a.bind(null,"9e7f")),meta:{title:"Luis Krötz - GDPR"}},{path:"/privacy-policy",name:"Privacy Policy",component:()=>a.e("PrivacyPolicy").then(a.bind(null,"729e")),meta:{title:"Luis Krötz - Privacy Policy"}},{path:"/terms-of-use",name:"Terms of Use",component:()=>a.e("TermsOfUse").then(a.bind(null,"474a")),meta:{title:"Luis Krötz - Terms of Use"}},{path:"/license",name:"License",component:()=>a.e("MIT").then(a.bind(null,"aa97")),meta:{title:"Luis Krötz - License"}},{path:"/awards/cssda-kudos-06-2020",name:"cssda-kudos-06-2020",component:()=>a.e("Awards").then(a.bind(null,"6cae")),meta:{title:"Luis Krötz - Awards",last:!0,id:4,total:_}},{path:"/awards/cssda-inn-06-2020",name:"cssda-inn-06-2020",component:()=>a.e("Awards").then(a.bind(null,"6cae")),meta:{title:"Luis Krötz - Awards",id:3,total:_}},{path:"/awards/cssda-ux-06-2020",name:"cssda-ux-06-2020",component:()=>a.e("Awards").then(a.bind(null,"6cae")),meta:{title:"Luis Krötz - Awards",id:2,total:_}},{path:"/awards/cssda-ui-06-2020",name:"cssda-ui-06-2020",component:()=>a.e("Awards").then(a.bind(null,"6cae")),meta:{title:"Luis Krötz - Awards",id:1,total:_}},{path:"/projects/melissa-next-br",name:"Melissa | Next",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{title:"Luis Krötz - Melissa | Next",last:!0,id:73,total:z}},{path:"/projects/minimelissa-dreamers",name:"Minimelissa | AW'20",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:72,total:z,title:"Luis Krötz - Minimelissa | AW'20"}},{path:"/projects/minimelissa-color-me",name:"Minimelissa | SS'20",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:71,total:z,title:"Luis Krötz - Minimelissa | SS'20"}},{path:"/projects/melissa-dreamers-infinitos",name:"Melissa | Dreamers / Infinitos",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:70,total:z,title:"Luis Krötz -  Melissa Dreamers / Infinitos"}},{path:"/projects/metcha-newsletter",name:"METCHA | Newsletter",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:69,total:z,title:"Luis Krötz - METCHA | Newsletter"}},{path:"/projects/metcha-newsletter-generator",name:"METCHA | Newsletter Generator",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:68,total:z,title:"Luis Krötz - METCHA | Newsletter Generator"}},{path:"/projects/metcha-cms",name:"METCHA | CMS",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:67,total:z,title:"Luis Krötz - METCHA | CMS"}},{path:"/projects/metcha-website",name:"METCHA | Website",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:66,total:z,title:"Luis Krötz - METCHA | Website"}},{path:"/projects/melissa-sustainability",name:"Melissa | Sustainability",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:65,total:z,title:"Luis Krötz - Melissa | Sustainability"}},{path:"/projects/melissa-color-me",name:"Melissa | Color ME",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:64,total:z,title:"Luis Krötz - Melissa | Color ME"}},{path:"/projects/transainc-muda",name:"Transainc | Muda",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:63,total:z,title:"Luis Krötz - Transainc | Muda"}},{path:"/projects/cicb-sustainability-forum-2019",name:"CICB | Sustainability Forum 2019",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:62,total:z,title:"Luis Krötz - CICB | Sustainability Forum 2019"}},{path:"/projects/cicb-sustainability-forum-2018",name:"CICB | Sustainability Forum 2018",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:61,total:z,title:"Luis Krötz - CICB | Sustainability Forum 2018"}},{path:"/projects/cicb-sustainability-forum-2017",name:"CICB | Sustainability Forum 2017",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:60,total:z,title:"Luis Krötz - CICB | Sustainability Forum 2017"}},{path:"/projects/cicb-sustainability-forum-2016",name:"CICB | Sustainability Forum 2016",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:59,total:z,title:"Luis Krötz - CICB | Sustainability Forum 2016"}},{path:"/projects/coza-webpage",name:"Coza | Webpage",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:58,total:z,title:"Luis Krötz - Coza | Webpage"}},{path:"/projects/coza-where-to-find",name:"Coza | Where to Find",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:57,total:z,title:"Luis Krötz - Coza | Where to Find"}},{path:"/projects/melissa-family",name:"Melissa | Family",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:56,total:z,title:"Luis Krötz - Melissa | Family"}},{path:"/projects/melissa-mapping",name:"Melissa | Mapping",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:55,total:z,title:"Luis Krötz - Melissa | Mapping"}},{path:"/projects/melissa-mirror",name:"Melissa | Mirror",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:54,total:z,title:"Luis Krötz - Melissa | Mirror"}},{path:"/projects/melissa-open-vibes",name:"Melissa | Open Vibes",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:53,total:z,title:"Luis Krötz - Melissa | Open Vibes"}},{path:"/projects/melissa-a-la-garconne",name:"Melissa | À Lá Garçonne",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:52,total:z,title:"Luis Krötz - Melissa | À Lá Garçonne"}},{path:"/projects/melissa-awaytomars",name:"Melissa | AWAYTOMARS",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:51,total:z,title:"Luis Krötz - Melissa | AWAYTOMARS"}},{path:"/projects/melissa-baja-east",name:"Melissa | Baja East",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:50,total:z,title:"Luis Krötz - Melissa | Baja East"}},{path:"/projects/melissa-melissa+csc",name:"Melissa | Melissa + CSC",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:49,total:z,title:"Luis Krötz - Melissa | Melissa + CSC"}},{path:"/projects/melissa-fabula",name:"Melissa | Fábula",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:48,total:z,title:"Luis Krötz - Melissa | Fábula"}},{path:"/projects/melissa-melissa+rider",name:"Melissa | Melissa + Rider",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:47,total:z,title:"Luis Krötz - Melissa | Melissa + Rider"}},{path:"/projects/melissa-galleries-sp-nyc-lon",name:"Melissa | Galleries SP/NYC/LON",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:46,total:z,title:"Luis Krötz - Melissa | Galleries SP/NYC/LON"}},{path:"/projects/melissa-bike",name:"Melissa | Bike",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:45,total:z,title:"Luis Krötz - Melissa | Bike"}},{path:"/projects/melissa-creatives",name:"Melissa | Creatives",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:44,total:z,title:"Luis Krötz - Melissa | Creatives"}},{path:"/projects/melissa-sk8",name:"Melissa | SK8",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:43,total:z,title:"Luis Krötz - Melissa | SK8"}},{path:"/projects/melissa-possession",name:"Melissa | Possession",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:42,total:z,title:"Luis Krötz - Melissa | Possession"}},{path:"/projects/minimelissa-candy-framework",name:"Minimelissa | Candy Framework",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:41,total:z,title:"Luis Krötz - Minimelissa | Candy Framework"}},{path:"/projects/minimelissa-website",name:"Minimelissa | Website",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:40,total:z,title:"Luis Krötz - Minimelissa | Website"}},{path:"/projects/minimelissa-a-w16",name:"Minimelissa | A/W'16",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:39,total:z,title:"Luis Krötz - Minimelissa | A/W'16"}},{path:"/projects/minimelissa-a-w17",name:"Minimelissa | A/W'17",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:38,total:z,title:"Luis Krötz - Minimelissa | A/W'17"}},{path:"/projects/minimelissa-a-w18",name:"Minimelissa | A/W'18",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:37,total:z,title:"Luis Krötz - Minimelissa | A/W'18"}},{path:"/projects/minimelissa-a-w19",name:"Minimelissa | A/W'19",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:36,total:z,title:"Luis Krötz - Minimelissa | A/W'19"}},{path:"/projects/minimelissa-where-to-find",name:"Minimelissa | Where to Find",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:35,total:z,title:"Luis Krötz - Minimelissa | Where to Find"}},{path:"/projects/minimelissa-s-s16",name:"Minimelissa | S/S'16",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:34,total:z,title:"Luis Krötz - Minimelissa | S/S'16"}},{path:"/projects/minimelissa-s-s17",name:"Minimelissa | S/S'17",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:33,total:z,title:"Luis Krötz - Minimelissa | S/S'17"}},{path:"/projects/minimelissa-s-s18",name:"Minimelissa | S/S'18",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:32,total:z,title:"Luis Krötz - Minimelissa | S/S'18"}},{path:"/projects/minimelissa-s-s19",name:"Minimelissa | S/S'19",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:31,total:z,title:"Luis Krötz - Minimelissa | S/S'19"}},{path:"/projects/mor-website",name:"Mor | Website",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:30,total:z,title:"Luis Krötz - Mor | Website"}},{path:"/projects/mor-where-to-find",name:"Mor | Where to Find",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:29,total:z,title:"Luis Krötz - Mor | Where to Find"}},{path:"/projects/cicb-cscb-leather-law-brazilian-portal",name:"CICB / CSCB/ Leather Law / Brazilian Leather | Portal",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:28,total:z,title:"Luis Krötz - CICB / CSCB/ Leather Law / Brazilian Leather | Portal"}},{path:"/projects/melissa-new-features",name:"Melissa | New Features",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:27,total:z,title:"Luis Krötz - Melissa | New Features"}},{path:"/projects/melissa-flygrl",name:"Melissa | Flygrl",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:26,total:z,title:"Luis Krötz - Melissa | Flygrl"}},{path:"/projects/melissa-mashup",name:"Melissa | Mashup",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:25,total:z,title:"Luis Krötz - Melissa | Mashup"}},{path:"/projects/melissa-cine-melissa",name:"Melissa | Cine Melissa",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:24,total:z,title:"Luis Krötz - Melissa | Cine Melissa"}},{path:"/projects/melissa-dance-machine",name:"Melissa | Dance Machine",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:23,total:z,title:"Luis Krötz - Melissa | Dance Machine"}},{path:"/projects/melissa-eat-my-melissa",name:"Melissa | Eat My Melissa",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:22,total:z,title:"Luis Krötz - Melissa | Eat My Melissa"}},{path:"/projects/melissa-nation",name:"Melissa | Nation",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:21,total:z,title:"Luis Krötz - Melissa | Nation"}},{path:"/projects/melissa-starwalker",name:"Melissa | Starwalker",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:20,total:z,title:"Luis Krötz - Melissa | Starwalker"}},{path:"/projects/melissa-wanna-be-carioca",name:"Melissa | Wanna Be Carioca",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:19,total:z,title:"Luis Krötz - Melissa | Wanna Be Carioca"}},{path:"/projects/melissa-we-are-flowers",name:"Melissa | We are Flowers",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:18,total:z,title:"Luis Krötz - Melissa | We are Flowers"}},{path:"/projects/melissa-campana",name:"Melissa | Campana",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:17,total:z,title:"Luis Krötz - Melissa | Campana"}},{path:"/projects/melissa-gaetano-pesce",name:"Melissa | Gaetano Pesce",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:16,total:z,title:"Luis Krötz - Melissa | Gaetano Pesce"}},{path:"/projects/melissa-gareth-pugh",name:"Melissa | Gareth Pugh",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:15,total:z,title:"Luis Krötz - Melissa | Gareth Pugh"}},{path:"/projects/melissa-j-maskrey",name:"Melissa | J Maskrey",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:14,total:z,title:"Luis Krötz - Melissa | J Maskrey"}},{path:"/projects/melissa-jason-wu",name:"Melissa | Jason Wu",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:13,total:z,title:"Luis Krötz - Melissa | Jason Wu"}},{path:"/projects/melissa-jeremy-scott",name:"Melissa | Jeremy Scott",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:12,total:z,title:"Luis Krötz - Melissa | Jeremy Scott"}},{path:"/projects/melissa-karl-lagerfeld",name:"Melissa | Karl Lagerfeld",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:11,total:z,title:"Luis Krötz - Melissa | Karl Lagerfeld"}},{path:"/projects/melissa-sebastian-errazuriz",name:"Melissa | Sebastian Errazuriz",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:10,total:z,title:"Luis Krötz - Melissa | Sebastian Errazuriz"}},{path:"/projects/melissa-vitorino-campos",name:"Melissa | Vitorino Campos",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:9,total:z,title:"Luis Krötz - Melissa | Vitorino Campos"}},{path:"/projects/melissa-vivienne-westwood",name:"Melissa | Vivienne Westwood",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:8,total:z,title:"Luis Krötz - Melissa | Vivienne Westwood"}},{path:"/projects/melissa-zaha-hadid",name:"Melissa | Zaha Hadid",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:7,total:z,title:"Luis Krötz - Melissa | Zaha Hadid"}},{path:"/projects/melissa-where-to-find",name:"Melissa | Where to Find",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:6,total:z,title:"Luis Krötz - Melissa | Where to Find"}},{path:"/projects/melissa-roller-joy",name:"Melissa | Roller Joy",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:5,total:z,title:"Luis Krötz - Melissa | Roller Joy"}},{path:"/projects/melissa-tropico-surreal",name:"Melissa | Tropico Surreal",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:4,total:z,title:"Luis Krötz - Melissa | Tropico Surreal"}},{path:"/projects/mor-loja-mor",name:"Mor | Loja Mor",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:3,total:z,title:"Luis Krötz - Mor | Loja Mor"}},{path:"/projects/vibra-website",name:"Vibra | Website",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:2,total:z,title:"Luis Krötz - Vibra | Website"}},{path:"/projects/genesysinf-sageweb",name:"GenesysInf | SageWeb",component:()=>a.e("Project").then(a.bind(null,"07bd")),meta:{id:1,total:z,title:"Luis Krötz - GenesysInf | SageWeb"}},{path:"*",name:"Error404",component:()=>a.e("Error404").then(a.bind(null,"9703")),meta:{title:"Luis Krötz - 404"}}],K=new M["a"]({mode:"history",base:"/",routes:S});function E(){s["a"].use(y.a,{id:"UA-142757641-1",router:K,autoTracking:{skipSamePath:!0,pageviewTemplate(e){return{page:e.path,title:document.title,location:window.location.href}}}})}!0===Boolean(localStorage.getItem("cookie"))?E():document.addEventListener("accepted",(function(){!0===Boolean(localStorage.getItem("cookie"))&&E()}));var W=K,T=a("9483");Object(T["a"])("/service-worker.js",{ready(){console.log("App is being served from cache by a service worker.\nFor more details, visit https://goo.gl/AFskqB")},registered(){console.log("Service worker has been registered.")},cached(){console.log("Content has been cached for offline use.")},updatefound(){console.log("New content is downloading.")},updated(){console.log("New content is available; please refresh.")},offline(){console.log("No internet connection found. App is running in offline mode.")},error(e){console.error("Error during service worker registration:",e)}}),s["a"].config.productionTip=!1,new s["a"]({router:W,render:e=>e(j)}).$mount("#app")},"5c0b":function(e,t,a){"use strict";var s=a("9c0c"),i=a.n(s);i.a},"9c0c":function(e,t,a){}});
//# sourceMappingURL=app.aafd74b8.js.map