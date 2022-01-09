"use strict";(self.webpackChunkdocumentation=self.webpackChunkdocumentation||[]).push([[36],{3905:function(e,t,n){n.d(t,{Zo:function(){return s},kt:function(){return d}});var r=n(7294);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function a(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},i=Object.keys(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var c=r.createContext({}),u=function(e){var t=r.useContext(c),n=t;return e&&(n="function"==typeof e?e(t):a(a({},t),e)),n},s=function(e){var t=u(e.components);return r.createElement(c.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},f=r.forwardRef((function(e,t){var n=e.components,o=e.mdxType,i=e.originalType,c=e.parentName,s=l(e,["components","mdxType","originalType","parentName"]),f=u(n),d=o,m=f["".concat(c,".").concat(d)]||f[d]||p[d]||i;return n?r.createElement(m,a(a({ref:t},s),{},{components:n})):r.createElement(m,a({ref:t},s))}));function d(e,t){var n=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var i=n.length,a=new Array(i);a[0]=f;var l={};for(var c in t)hasOwnProperty.call(t,c)&&(l[c]=t[c]);l.originalType=e,l.mdxType="string"==typeof e?e:o,a[1]=l;for(var u=2;u<i;u++)a[u]=n[u];return r.createElement.apply(null,a)}return r.createElement.apply(null,n)}f.displayName="MDXCreateElement"},5593:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return l},contentTitle:function(){return c},metadata:function(){return u},toc:function(){return s},default:function(){return f}});var r=n(7462),o=n(3366),i=(n(7294),n(3905)),a=["components"],l={sidebar_position:1},c="Rules",u={unversionedId:"rules/index",id:"rules/index",title:"Rules",description:"This project implements various different rules to make your code more consistent and easier to read - similar to tools like ESLint, with the idea that all rules should be fixable without intervention.",source:"@site/docs/rules/index.md",sourceDirName:"rules",slug:"/rules/",permalink:"/collation/docs/rules/",editUrl:"https://github.com/brandongregoryscott/collation/tree/main/documentation/docs/docs/rules/index.md",tags:[],version:"current",sidebarPosition:1,frontMatter:{sidebar_position:1},sidebar:"tutorialSidebar",previous:{title:"Options",permalink:"/collation/docs/cli/options"},next:{title:"Alphabetize Dependency Lists",permalink:"/collation/docs/rules/alphabetize-dependency-lists"}},s=[],p={toc:s};function f(e){var t=e.components,l=(0,o.Z)(e,a);return(0,i.kt)("wrapper",(0,r.Z)({},p,l,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("h1",{id:"rules"},"Rules"),(0,i.kt)("p",null,"This project implements various different rules to make your code more consistent and easier to read - similar to tools like ",(0,i.kt)("inlineCode",{parentName:"p"},"ESLint"),", with the idea that ",(0,i.kt)("strong",{parentName:"p"},"all rules should be fixable without intervention"),"."),(0,i.kt)("p",null,"Rules are custom functions that implement a common interface, ",(0,i.kt)("a",{target:"_blank",href:n(7285).Z},(0,i.kt)("code",null,"RuleFunction")),", and return a ",(0,i.kt)("a",{target:"_blank",href:n(3212).Z},(0,i.kt)("code",null,"RuleResult"))," containing any errors and a diff of the changes."))}f.isMDXComponent=!0},3212:function(e,t,n){t.Z=n.p+"assets/files/rule-result-912bb4380890f0021cf2265391fe60e5.ts"},7285:function(e,t,n){t.Z=n.p+"assets/files/rule-function-476021f8151693c8943a6e0dba578978.ts"}}]);