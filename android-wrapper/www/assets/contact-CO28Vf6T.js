import{c as i}from"./index-DXcH3c3r.js";/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=i("MessageCircle",[["path",{d:"M7.9 20A9 9 0 1 0 4 16.1L2 22Z",key:"vv11sd"}]]);function o(e,t=4){const s=e?.replace(/\D/g,"")??"";if(!s)return"غير مضاف";const n=s.slice(0,t),a=Math.max(4,s.length-n.length);return`${n}${"×".repeat(a)}`}function l(e){return`tel:${e.trim().replace(/[^\d+]/g,"")}`}function h(e){const t=e.replace(/\D/g,"");return`https://wa.me/${t.startsWith("00")?t.slice(2):t.startsWith("0")?`967${t.slice(1)}`:t.length===9&&t.startsWith("7")?`967${t}`:t}`}export{c as M,h as a,o as m,l as t};
