(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["Project8"],{1598:function(t,s,e){"use strict";var i=function(){var t=this,s=t.$createElement,e=t._self._c||s;return e("div",{staticClass:"main"},[e("article",{staticClass:"home-project max-area"},[void 0===t.post.img&&void 0===t.post.video?e("img",{staticClass:"project-background",attrs:{src:"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",alt:""}}):void 0===t.post.video?e("picture",[e("source",{attrs:{type:"image/jpeg",srcset:t.storage+t.post.img.src+".jpg"}}),e("source",{attrs:{type:"image/webp",srcset:t.storage+t.post.img.src+".webp"}}),e("img",{staticClass:"project-background",attrs:{src:t.storage+t.post.img.src+".jpg",width:t.post.img.width,height:t.post.img.height,alt:t.post.img.alt,loading:"lazy"}})]):e("video",{staticClass:"project-background",attrs:{width:t.post.video.width,height:t.post.video.height,poster:t.storage+t.post.video.img,alt:t.post.video.alt,loading:"lazy",playsinline:"",autoplay:"",muted:"",loop:""},domProps:{muted:!0}},[e("source",{attrs:{type:"application/vnd.apple.mpegurl",src:t.storage+t.post.video.src+".m3u8"}}),e("source",{attrs:{type:"video/mp4",src:t.storage+t.post.video.src+".mp4"}}),e("source",{attrs:{type:"video/webm",src:t.storage+t.post.video.src+".webm"}})]),e("h2",{staticClass:"project-title"},[t._v(t._s(t.translations.project))]),e("h3",{staticClass:"project-subtitle"},[t._v(t._s(t.post.project))]),e("div",{staticClass:"project-info"},[void 0===t.post.img&&void 0===t.post.video?e("img",{staticClass:"project-media",attrs:{src:"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",alt:""}}):void 0===t.post.video?e("picture",[e("source",{attrs:{type:"image/jpeg",srcset:t.storage+t.post.img.src+".jpg"}}),e("source",{attrs:{type:"image/webp",srcset:t.storage+t.post.img.src+".webp"}}),e("img",{staticClass:"project-media",attrs:{src:t.storage+t.post.img.src+".jpg",width:t.post.img.width,height:t.post.img.height,alt:t.post.img.alt,loading:"lazy"}})]):e("video",{staticClass:"project-media",attrs:{width:t.post.video.width,height:t.post.video.height,poster:t.storage+t.post.video.img,alt:t.post.video.alt,loading:"lazy",playsinline:"",autoplay:"",muted:"",loop:"",controls:""},domProps:{muted:!0}},[e("source",{attrs:{type:"application/vnd.apple.mpegurl",src:t.storage+t.post.video.src+".m3u8"}}),e("source",{attrs:{type:"video/mp4",src:t.storage+t.post.video.src+".mp4"}}),e("source",{attrs:{type:"video/webm",src:t.storage+t.post.video.src+".webm"}})]),e("div",{staticClass:"project-info-content"},[e("div",{staticClass:"project-info-description"},[e("a",{staticClass:"project-info-link",attrs:{href:t.post.at_link}},[e("h4",{staticClass:"project-info-link-title"},[t._v(t._s(t.translations.at))]),t._v(" "+t._s(t.post.at_place)+" ")]),e("h5",{staticClass:"project-info-role"},[e("span",{staticClass:"project-info-role-title"},[t._v(t._s(t.translations.role))]),t._v(" "),e("span",[t._v(t._s(t.post.role))])]),e("div",{staticClass:"project-info-more"},[e("h6",{staticClass:"first"},[t._v(t._s(t.translations.description))]),e("p",{domProps:{innerHTML:t._s(t.post.description)}}),e("h6",[t._v(t._s(t.translations.contribuition))]),e("p",{domProps:{innerHTML:t._s(t.post.part)}})])]),e("a",{staticClass:"project-info-check",attrs:{href:t.post.link,target:"_blank",rel:"noopener"}},[void 0===t.translations.animation_alt?e("img",{staticClass:"project-info-check-it",attrs:{src:"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",alt:""}}):e("video",{staticClass:"project-info-check-it",attrs:{width:"480",height:"480",poster:t.origin+"/assets/animations/"+t.random+".jpg",title:t.translations.animation_title,alt:t.translations.animation_alt[0]+t.translations.animation[t.random]+t.translations.animation_alt[1],loading:"lazy",playsinline:"",autoplay:"",muted:"",loop:""},domProps:{muted:!0}},[e("source",{attrs:{type:"application/vnd.apple.mpegurl",src:t.origin+"/assets/animations/"+t.random+".m3u8"}}),e("source",{attrs:{type:"video/mp4",src:t.origin+"/assets/animations/"+t.random+".mp4"}}),e("source",{attrs:{type:"video/webm",src:t.origin+"/assets/animations/"+t.random+".webm"}})]),e("span",{staticClass:"project-info-check-txt"},[t._v(" "+t._s(t.translations.checkit)+" ")])])])]),e("div",{staticClass:"project-iframe-parent",style:t.itoggle?"width: 414px":""},[e("button",{staticClass:"project-iframe-toggle",on:{click:function(s){return t.toggleiframe()}}},[e("span",{staticClass:"project-iframe-mark",style:t.itoggle?"transform: translateX(100%);":""}),e("span",{staticClass:"project-iframe-slide"},[e("svg",{staticClass:"left",staticStyle:{fill:"white"},attrs:{width:"13",height:"13"}},[e("use",{attrs:{"xlink:href":"#svg-desktop"}})]),e("svg",{staticClass:"right",staticStyle:{fill:"white"},attrs:{width:"14",height:"14"}},[e("use",{attrs:{"xlink:href":"#svg-mobile"}})])])]),e("iframe",{staticClass:"project-iframe",attrs:{frameborder:"0",src:t.ilink}})])]),e("footer",{staticClass:"footer has-media"},[e("div",{staticClass:"max-area"},[e("router-link",{staticClass:"footer-link left",attrs:{to:t.prev.path}},[e("span",[void 0===t.prev.img&&void 0===t.prev.video?e("img",{staticClass:"footer-link-video",attrs:{src:"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",alt:""}}):void 0===t.prev.video?e("picture",[e("source",{attrs:{type:"image/jpeg",srcset:t.storage+t.prev.img.src+".jpg"}}),e("source",{attrs:{type:"image/webp",srcset:t.storage+t.prev.img.src+".webp"}}),e("img",{staticClass:"footer-link-video",attrs:{src:t.storage+t.prev.img.src+".jpg",width:t.prev.img.width,height:t.prev.img.height,alt:t.prev.img.alt,loading:"lazy"}})]):e("video",{staticClass:"footer-link-video",attrs:{width:t.prev.video.width,height:t.prev.video.height,poster:t.storage+t.prev.video.img,alt:t.prev.video.alt,loading:"lazy",playsinline:"",autoplay:"",muted:"",loop:""},domProps:{muted:!0}},[e("source",{attrs:{type:"application/vnd.apple.mpegurl",src:t.storage+t.prev.video.src+".m3u8"}}),e("source",{attrs:{type:"video/mp4",src:t.storage+t.prev.video.src+".mp4"}}),e("source",{attrs:{type:"video/webm",src:t.storage+t.prev.video.src+".webm"}})]),e("svg",{staticStyle:{fill:"white"},attrs:{width:"24",height:"24"}},[e("use",{attrs:{"xlink:href":"#svg-arrow-left"}})])]),e("p",{staticClass:"hdn"},[t._v(t._s(t.translations.prev))])]),e("router-link",{staticClass:"footer-link",attrs:{to:"/"}},[e("svg",{staticClass:"shuttle",staticStyle:{fill:"white"},attrs:{width:"18",height:"18"}},[e("use",{attrs:{"xlink:href":"#svg-space-shuttle"}})]),e("p",{staticClass:"footer-link-title"},[t._v(t._s(t.translations.home))])]),e("router-link",{staticClass:"footer-link right",attrs:{to:t.next.path}},[e("span",[void 0===t.next.img&&void 0===t.next.video?e("img",{staticClass:"footer-link-video",attrs:{src:"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",alt:""}}):void 0===t.next.video?e("picture",[e("source",{attrs:{type:"image/jpeg",srcset:t.storage+t.next.img.src+".jpg"}}),e("source",{attrs:{type:"image/webp",srcset:t.storage+t.next.img.src+".webp"}}),e("img",{staticClass:"footer-link-video",attrs:{src:t.storage+t.next.img.src+".jpg",width:t.next.img.width,height:t.next.img.height,alt:t.next.img.alt,loading:"lazy"}})]):e("video",{staticClass:"footer-link-video",attrs:{width:t.next.video.width,height:t.next.video.height,poster:t.storage+t.next.video.img,alt:t.next.video.alt,loading:"lazy",playsinline:"",autoplay:"",muted:"",loop:""},domProps:{muted:!0}},[e("source",{attrs:{type:"application/vnd.apple.mpegurl",src:t.storage+t.next.video.src+".m3u8"}}),e("source",{attrs:{type:"video/mp4",src:t.storage+t.next.video.src+".mp4"}}),e("source",{attrs:{type:"video/webm",src:t.storage+t.next.video.src+".webm"}})]),e("svg",{staticStyle:{fill:"white"},attrs:{width:"24",height:"24"}},[e("use",{attrs:{"xlink:href":"#svg-arrow-right"}})])]),e("p",{staticClass:"hdn"},[t._v(t._s(t.translations.next))])])],1)]),e("router-view")],1)},a=[],o={name:"ProjectComponent",data(){return{ilink:"",itoggle:!1,storage:"",origin:this.$parent.origin,translations:Object,post:Object,random:Math.round(5*Math.random())+1,next:{path:"/"},prev:{path:"/"}}},props:{data_id:{required:!0},last:{default:!1,required:!1}},created(){document.body.classList.add("black"),document.body.scrollTop=0,document.documentElement.scrollTop=0},mounted(){this.storage=this.$parent.storage,this.getPost()},methods:{getPost(){let t=this;fetch(`${t.origin}/projects/${t.data_id}.json`).then(t=>t.json()).then(s=>{t.post=s,t.ilink=t.post.link}),fetch(`${t.origin}/translations/en_us/projects.json`).then(t=>t.json()).then(s=>{t.translations=s,fetch(`${t.origin}/projects/${Number(t.translations.total)===Number(t.data_id)?1:Number(t.data_id)+1}.json`).then(t=>t.json()).then(s=>{t.next=s}),fetch(`${t.origin}/projects/${1===t.data_id?t.translations.total:Number(t.data_id)-1}.json`).then(t=>t.json()).then(s=>{t.prev=s})})},toggleiframe(){this.ilink="",this.itoggle?(this.itoggle=!1,window.setTimeout(()=>this.ilink=this.post.link,500)):(this.itoggle=!0,window.setTimeout(()=>this.ilink=this.post.link,500))}}},r=o,n=(e("47cb"),e("2877")),l=Object(n["a"])(r,i,a,!1,null,null,null);s["a"]=l.exports},"35d8":function(t,s,e){},"47cb":function(t,s,e){"use strict";var i=e("35d8"),a=e.n(i);a.a},b579:function(t,s,e){"use strict";e.r(s);var i=function(){var t=this,s=t.$createElement,e=t._self._c||s;return e("main",{staticClass:"project-internal"},[e("RenderProject",{attrs:{data_id:"8"}})],1)},a=[],o=e("1598"),r={name:"Project8",data(){return{placeholder:this.$parent.placeholder,storage:this.$parent.storage,origin:this.$parent.origin}},components:{RenderProject:o["a"]}},n=r,l=e("2877"),p=Object(l["a"])(n,i,a,!1,null,null,null);s["default"]=p.exports}}]);
//# sourceMappingURL=Project8.152b348e.js.map