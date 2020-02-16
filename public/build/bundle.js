var app=function(t){"use strict";function e(){}function n(t){return t()}function o(){return Object.create(null)}function r(t){t.forEach(n)}function s(t){return"function"==typeof t}function c(t,e){return t!=t?e==e:t!==e||t&&"object"==typeof t||"function"==typeof t}function i(t,e){t.appendChild(e)}function a(t,e,n){t.insertBefore(e,n||null)}function l(t){t.parentNode.removeChild(t)}function u(t){return document.createElement(t)}function f(t){return document.createTextNode(t)}function h(){return f(" ")}function d(t,e,n){null==n?t.removeAttribute(e):t.getAttribute(e)!==n&&t.setAttribute(e,n)}function m(t,e,n){e in t?t[e]=n:d(t,e,n)}function p(t,e){e=""+e,t.data!==e&&(t.data=e)}function g(t,e,n,o){t.style.setProperty(e,n,o?"important":"")}let $;function b(t){$=t}const y=[],x=[],k=[],v=[],w=Promise.resolve();let C=!1;function _(t){k.push(t)}let A=!1;const E=new Set;function M(){if(!A){A=!0;do{for(let t=0;t<y.length;t+=1){const e=y[t];b(e),T(e.$$)}for(y.length=0;x.length;)x.pop()();for(let t=0;t<k.length;t+=1){const e=k[t];E.has(e)||(E.add(e),e())}k.length=0}while(y.length);for(;v.length;)v.pop()();C=!1,A=!1,E.clear()}}function T(t){if(null!==t.fragment){t.update(),r(t.before_update);const e=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,e),t.after_update.forEach(_)}}const H=new Set;function L(t,e){-1===t.$$.dirty[0]&&(y.push(t),C||(C=!0,w.then(M)),t.$$.dirty.fill(0)),t.$$.dirty[e/31|0]|=1<<e%31}function R(t,c,i,a,l,u,f=[-1]){const h=$;b(t);const d=c.props||{},m=t.$$={fragment:null,ctx:null,props:u,update:e,not_equal:l,bound:o(),on_mount:[],on_destroy:[],before_update:[],after_update:[],context:new Map(h?h.$$.context:[]),callbacks:o(),dirty:f};let p=!1;var g,y;m.ctx=i?i(t,d,(e,n,...o)=>{const r=o.length?o[0]:n;return m.ctx&&l(m.ctx[e],m.ctx[e]=r)&&(m.bound[e]&&m.bound[e](r),p&&L(t,e)),n}):[],m.update(),p=!0,r(m.before_update),m.fragment=!!a&&a(m.ctx),c.target&&(c.hydrate?m.fragment&&m.fragment.l(function(t){return Array.from(t.childNodes)}(c.target)):m.fragment&&m.fragment.c(),c.intro&&((g=t.$$.fragment)&&g.i&&(H.delete(g),g.i(y))),function(t,e,o){const{fragment:c,on_mount:i,on_destroy:a,after_update:l}=t.$$;c&&c.m(e,o),_(()=>{const e=i.map(n).filter(s);a?a.push(...e):r(e),t.$$.on_mount=[]}),l.forEach(_)}(t,c.target,c.anchor),M()),b(h)}let S;function N(t){let n,o;return{c(){n=u("button"),o=f(t[0]),this.c=e,g(n,"--bgColor",t[1]),g(n,"--fontColor",t[2])},m(t,e){a(t,n,e),i(n,o)},p(t,[e]){1&e&&p(o,t[0]),2&e&&g(n,"--bgColor",t[1]),4&e&&g(n,"--fontColor",t[2])},i:e,o:e,d(t){t&&l(n)}}}function j(t,e,n){let{name:o="ktpunnisa"}=e,{bgcolor:r="pink"}=e,{fontcolor:s="black"}=e;return t.$set=t=>{"name"in t&&n(0,o=t.name),"bgcolor"in t&&n(1,r=t.bgcolor),"fontcolor"in t&&n(2,s=t.fontcolor)},[o,r,s]}"function"==typeof HTMLElement&&(S=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}connectedCallback(){for(const t in this.$$.slotted)this.appendChild(this.$$.slotted[t])}attributeChangedCallback(t,e,n){this[t]=n}$destroy(){!function(t,e){const n=t.$$;null!==n.fragment&&(r(n.on_destroy),n.fragment&&n.fragment.d(e),n.on_destroy=n.fragment=null,n.ctx=[])}(this,1),this.$destroy=e}$on(t,e){const n=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return n.push(e),()=>{const t=n.indexOf(e);-1!==t&&n.splice(t,1)}}$set(){}});function O(t){let n,o;return{c(){n=u("a"),o=f(t[0]),this.c=e,d(n,"href",t[2]),g(n,"--fontColor",t[1])},m(t,e){a(t,n,e),i(n,o)},p(t,[e]){1&e&&p(o,t[0]),4&e&&d(n,"href",t[2]),2&e&&g(n,"--fontColor",t[1])},i:e,o:e,d(t){t&&l(n)}}}function P(t,e,n){let{name:o="ktpunnisa"}=e,{fontcolor:r="blue"}=e,{url:s="https://www.facebook.com/ktpunnisa"}=e;return t.$set=t=>{"name"in t&&n(0,o=t.name),"fontcolor"in t&&n(1,r=t.fontcolor),"url"in t&&n(2,s=t.url)},[o,r,s]}customElements.define("my-button",class extends S{constructor(t){super(),this.shadowRoot.innerHTML="<style>button{background-color:var(--bgColor);color:var(--fontColor)}</style>",R(this,{target:this.shadowRoot},j,N,c,{name:0,bgcolor:1,fontcolor:2}),t&&(t.target&&a(t.target,this,t.anchor),t.props&&(this.$set(t.props),M()))}static get observedAttributes(){return["name","bgcolor","fontcolor"]}get name(){return this.$$.ctx[0]}set name(t){this.$set({name:t}),M()}get bgcolor(){return this.$$.ctx[1]}set bgcolor(t){this.$set({bgcolor:t}),M()}get fontcolor(){return this.$$.ctx[2]}set fontcolor(t){this.$set({fontcolor:t}),M()}});function q(t){let n,o,r,s,c,d,g,$;return{c(){n=u("h1"),o=f(t[0]),r=h(),s=u("my-link"),c=h(),d=u("div"),d.innerHTML="<p>SASS is working!</p>",g=h(),$=u("my-button"),this.c=e,m(s,"name","svelte"),m(s,"url","https://svelte.dev/"),m($,"name",t[0]),m($,"bgcolor","blue"),m($,"fontcolor","white")},m(t,e){a(t,n,e),i(n,o),a(t,r,e),a(t,s,e),a(t,c,e),a(t,d,e),a(t,g,e),a(t,$,e)},p(t,[e]){1&e&&p(o,t[0]),1&e&&m($,"name",t[0])},i:e,o:e,d(t){t&&l(n),t&&l(r),t&&l(s),t&&l(c),t&&l(d),t&&l(g),t&&l($)}}}function B(t,e,n){let{name:o}=e;return t.$set=t=>{"name"in t&&n(0,o=t.name)},[o]}customElements.define("my-link",class extends S{constructor(t){super(),this.shadowRoot.innerHTML="<style>a{color:var(--fontColor)}</style>",R(this,{target:this.shadowRoot},P,O,c,{name:0,fontcolor:1,url:2}),t&&(t.target&&a(t.target,this,t.anchor),t.props&&(this.$set(t.props),M()))}static get observedAttributes(){return["name","fontcolor","url"]}get name(){return this.$$.ctx[0]}set name(t){this.$set({name:t}),M()}get fontcolor(){return this.$$.ctx[1]}set fontcolor(t){this.$set({fontcolor:t}),M()}get url(){return this.$$.ctx[2]}set url(t){this.$set({url:t}),M()}});class z extends S{constructor(t){super(),this.shadowRoot.innerHTML="<style>h1{color:brown}div{background:green}div>p{color:#fff}</style>",R(this,{target:this.shadowRoot},B,q,c,{name:0}),t&&(t.target&&a(t.target,this,t.anchor),t.props&&(this.$set(t.props),M()))}static get observedAttributes(){return["name"]}get name(){return this.$$.ctx[0]}set name(t){this.$set({name:t}),M()}}return customElements.define("kt-app",z),t.App=z,t}({});
//# sourceMappingURL=bundle.js.map
