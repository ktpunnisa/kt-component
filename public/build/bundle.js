var app=function(t){"use strict";function n(){}function e(t){return t()}function o(){return Object.create(null)}function r(t){t.forEach(e)}function s(t){return"function"==typeof t}function c(t,n){return t!=t?n==n:t!==n||t&&"object"==typeof t||"function"==typeof t}function a(t,n){t.appendChild(n)}function i(t,n,e){t.insertBefore(n,e||null)}function l(t){t.parentNode.removeChild(t)}function u(t){return document.createElement(t)}function f(t){return document.createTextNode(t)}function h(){return f(" ")}function m(t,n,e){null==e?t.removeAttribute(n):t.getAttribute(n)!==e&&t.setAttribute(n,e)}function d(t,n,e){n in t?t[n]=e:m(t,n,e)}function p(t,n){n=""+n,t.data!==n&&(t.data=n)}function g(t,n,e,o){t.style.setProperty(n,e,o?"important":"")}let $;function b(t){$=t}const y=[],x=[],k=[],w=[],C=Promise.resolve();let _=!1;function v(t){k.push(t)}let E=!1;const A=new Set;function M(){if(!E){E=!0;do{for(let t=0;t<y.length;t+=1){const n=y[t];b(n),R(n.$$)}for(y.length=0;x.length;)x.pop()();for(let t=0;t<k.length;t+=1){const n=k[t];A.has(n)||(A.add(n),n())}k.length=0}while(y.length);for(;w.length;)w.pop()();_=!1,E=!1,A.clear()}}function R(t){if(null!==t.fragment){t.update(),r(t.before_update);const n=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,n),t.after_update.forEach(v)}}const T=new Set;function H(t,n){-1===t.$$.dirty[0]&&(y.push(t),_||(_=!0,C.then(M)),t.$$.dirty.fill(0)),t.$$.dirty[n/31|0]|=1<<n%31}function L(t,c,a,i,l,u,f=[-1]){const h=$;b(t);const m=c.props||{},d=t.$$={fragment:null,ctx:null,props:u,update:n,not_equal:l,bound:o(),on_mount:[],on_destroy:[],before_update:[],after_update:[],context:new Map(h?h.$$.context:[]),callbacks:o(),dirty:f};let p=!1;var g,y;d.ctx=a?a(t,m,(n,e,...o)=>{const r=o.length?o[0]:e;return d.ctx&&l(d.ctx[n],d.ctx[n]=r)&&(d.bound[n]&&d.bound[n](r),p&&H(t,n)),e}):[],d.update(),p=!0,r(d.before_update),d.fragment=!!i&&i(d.ctx),c.target&&(c.hydrate?d.fragment&&d.fragment.l(function(t){return Array.from(t.childNodes)}(c.target)):d.fragment&&d.fragment.c(),c.intro&&((g=t.$$.fragment)&&g.i&&(T.delete(g),g.i(y))),function(t,n,o){const{fragment:c,on_mount:a,on_destroy:i,after_update:l}=t.$$;c&&c.m(n,o),v(()=>{const n=a.map(e).filter(s);i?i.push(...n):r(n),t.$$.on_mount=[]}),l.forEach(v)}(t,c.target,c.anchor),M()),b(h)}let N;function S(t){let e,o;return{c(){e=u("button"),o=f(t[0]),this.c=n,g(e,"--bgColor",t[1]),g(e,"--fontColor",t[2])},m(t,n){i(t,e,n),a(e,o)},p(t,[n]){1&n&&p(o,t[0]),2&n&&g(e,"--bgColor",t[1]),4&n&&g(e,"--fontColor",t[2])},i:n,o:n,d(t){t&&l(e)}}}function j(t,n,e){let{name:o="ktpunnisa"}=n,{bgcolor:r="pink"}=n,{fontcolor:s="black"}=n;return t.$set=t=>{"name"in t&&e(0,o=t.name),"bgcolor"in t&&e(1,r=t.bgcolor),"fontcolor"in t&&e(2,s=t.fontcolor)},[o,r,s]}"function"==typeof HTMLElement&&(N=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}connectedCallback(){for(const t in this.$$.slotted)this.appendChild(this.$$.slotted[t])}attributeChangedCallback(t,n,e){this[t]=e}$destroy(){!function(t,n){const e=t.$$;null!==e.fragment&&(r(e.on_destroy),e.fragment&&e.fragment.d(n),e.on_destroy=e.fragment=null,e.ctx=[])}(this,1),this.$destroy=n}$on(t,n){const e=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return e.push(n),()=>{const t=e.indexOf(n);-1!==t&&e.splice(t,1)}}$set(){}});function O(t){let e,o;return{c(){e=u("a"),o=f(t[0]),this.c=n,m(e,"href",t[2]),g(e,"--fontColor",t[1])},m(t,n){i(t,e,n),a(e,o)},p(t,[n]){1&n&&p(o,t[0]),4&n&&m(e,"href",t[2]),2&n&&g(e,"--fontColor",t[1])},i:n,o:n,d(t){t&&l(e)}}}function P(t,n,e){let{name:o="ktpunnisa"}=n,{fontcolor:r="blue"}=n,{url:s="https://www.facebook.com/ktpunnisa"}=n;return t.$set=t=>{"name"in t&&e(0,o=t.name),"fontcolor"in t&&e(1,r=t.fontcolor),"url"in t&&e(2,s=t.url)},[o,r,s]}customElements.define("my-button",class extends N{constructor(t){super(),this.shadowRoot.innerHTML="<style>button{background-color:var(--bgColor);color:var(--fontColor)}</style>",L(this,{target:this.shadowRoot},j,S,c,{name:0,bgcolor:1,fontcolor:2}),t&&(t.target&&i(t.target,this,t.anchor),t.props&&(this.$set(t.props),M()))}static get observedAttributes(){return["name","bgcolor","fontcolor"]}get name(){return this.$$.ctx[0]}set name(t){this.$set({name:t}),M()}get bgcolor(){return this.$$.ctx[1]}set bgcolor(t){this.$set({bgcolor:t}),M()}get fontcolor(){return this.$$.ctx[2]}set fontcolor(t){this.$set({fontcolor:t}),M()}});function q(t){let e,o,r,s,c;return{c(){e=u("h1"),e.textContent="kt-component",o=h(),r=u("my-link"),s=h(),c=u("my-button"),this.c=n,d(r,"name",t[0]),d(r,"url","https://www.facebook.com/ktpunnisa"),d(c,"name",t[0]),d(c,"bgcolor","blue"),d(c,"fontcolor","white")},m(t,n){i(t,e,n),i(t,o,n),i(t,r,n),i(t,s,n),i(t,c,n)},p(t,[n]){1&n&&d(r,"name",t[0]),1&n&&d(c,"name",t[0])},i:n,o:n,d(t){t&&l(e),t&&l(o),t&&l(r),t&&l(s),t&&l(c)}}}function B(t,n,e){let{name:o="ktpunnisa"}=n;return t.$set=t=>{"name"in t&&e(0,o=t.name)},[o]}customElements.define("my-link",class extends N{constructor(t){super(),this.shadowRoot.innerHTML="<style>a{color:var(--fontColor)}</style>",L(this,{target:this.shadowRoot},P,O,c,{name:0,fontcolor:1,url:2}),t&&(t.target&&i(t.target,this,t.anchor),t.props&&(this.$set(t.props),M()))}static get observedAttributes(){return["name","fontcolor","url"]}get name(){return this.$$.ctx[0]}set name(t){this.$set({name:t}),M()}get fontcolor(){return this.$$.ctx[1]}set fontcolor(t){this.$set({fontcolor:t}),M()}get url(){return this.$$.ctx[2]}set url(t){this.$set({url:t}),M()}});class z extends N{constructor(t){super(),this.shadowRoot.innerHTML="<style>h1{color:brown}</style>",L(this,{target:this.shadowRoot},B,q,c,{name:0}),t&&(t.target&&i(t.target,this,t.anchor),t.props&&(this.$set(t.props),M()))}static get observedAttributes(){return["name"]}get name(){return this.$$.ctx[0]}set name(t){this.$set({name:t}),M()}}return customElements.define("kt-component",z),t.App=z,t}({});
//# sourceMappingURL=bundle.js.map
