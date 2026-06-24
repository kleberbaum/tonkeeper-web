import{r as a,aa as F,a as W,ab as X,s as h,q as j,z as Y,h as g,j as t,ac as z,ad as B,ae as L,af as P,ag as E,ah as _,ai as q,aj as U,ak as $,L as D,al as A,am as K,an as Q,a5 as T,ao as G,ap as J,aq as I,ar as m,as as N,at as V,au as Z,a7 as ee,a8 as b}from"./index-i4fqPXcm.js";function te(){const e=a.useRef(!1);return a.useEffect(()=>(e.current=!0,()=>{e.current=!1}),[]),a.useCallback(()=>e.current,[])}const k={width:void 0,height:void 0};function ne(e){const{ref:s,box:n="content-box"}=e,[{width:r,height:i},o]=a.useState(k),l=te(),c=a.useRef({...k}),u=a.useRef(void 0);return u.current=e.onResize,a.useEffect(()=>{if(!s.current||typeof window>"u"||!("ResizeObserver"in window))return;const d=new ResizeObserver(([f])=>{const C=n==="border-box"?"borderBoxSize":n==="device-pixel-content-box"?"devicePixelContentBoxSize":"contentBoxSize",x=y(f,C,"inlineSize"),p=y(f,C,"blockSize");if(c.current.width!==x||c.current.height!==p){const S={width:x,height:p};c.current.width=x,c.current.height=p,u.current?u.current(S):l()&&o(S)}});return d.observe(s.current,{box:n}),()=>{d.disconnect()}},[n,s,l]),{width:r,height:i}}function y(e,s,n){return e[s]?Array.isArray(e[s])?e[s][0][n]:e[s][n]:s==="contentBoxSize"?e.contentRect[n==="inlineSize"?"width":"height"]:void 0}function se(){const e=a.useRef(null),[s,n]=a.useState({width:0,height:0,scrollWidth:0,scrollHeight:0}),r=a.useCallback(()=>{var i,o,l,c;n({width:((i=e.current)==null?void 0:i.offsetWidth)||0,height:((o=e.current)==null?void 0:o.offsetHeight)||0,scrollWidth:((l=e.current)==null?void 0:l.scrollWidth)||0,scrollHeight:((c=e.current)==null?void 0:c.scrollHeight)||0})},[]);return ne({ref:e,onResize:r}),[e,s]}const re=(e,s,n)=>{const r=new Date,i=F.stringify({utm_source:"tonkeeper",utm_campaign:s==="recommendation"?"recom":`feat-${r.getMonth()+1}-${r.getFullYear()}`,utm_medium:n}),o=e.includes("?")?"&":"?";return`${e}${o}${i}`};function R(e,s,n,r){const i=a.useRef(s);a.useLayoutEffect(()=>{i.current=s},[s]),a.useEffect(()=>{const o=(n==null?void 0:n.current)??window;if(!(o&&o.addEventListener))return;const l=c=>i.current(c);return o.addEventListener(e,l,r),()=>{o.removeEventListener(e,l,r)}},[e,n,r])}function oe({callback:e,precisionXPx:s,precisionYPx:n}){const r=a.useRef({clientX:0,clientY:0}),i=a.useRef(null),o=a.useCallback(c=>{r.current={clientY:c.clientY,clientX:c.clientX}},[]),l=a.useCallback(c=>{const u=Math.abs(c.clientX-r.current.clientX)<(s??10),d=Math.abs(c.clientY-r.current.clientY)<(n??10);u&&d&&e()},[e,s,n]);return R("mousedown",o,i),R("mouseup",l,i),i}function H(e,s,n){const r=W(),i=X(),o=a.useCallback(()=>{i(e,s),r.openPage(re(e,s,n))},[e,r,i]);return oe({callback:o})}const ie=h.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 1rem;
    gap: 1rem;
`,ae=h.button`
    border: none;
    background: transparent;
    height: fit-content;
    width: fit-content;
    color: ${e=>e.theme.textAccent};
    cursor: pointer;
    padding: 4px 8px;
`,ce=h.div`
    padding-left: 1rem;
    padding-right: 1rem;
`,v=h(j)`
    width: ${e=>e.width} !important;
    margin-left: ${e=>e.marginLeft} !important;
    margin-bottom: 0;
`,M=h.div`
    margin-left: auto;
    margin-right: 1rem;
    color: ${e=>e.theme.iconTertiary};
    transition: transform 0.15s ease;
`,de=h(Y)`
    padding-left: 1rem;

    &:hover ${M} {
        transform: translateX(2px);
    }
`,ue=({category:e,className:s})=>{const[n,{width:r}]=se(),i=r-36,o=a.useMemo(()=>e.apps.reduce((u,d,f)=>(f%3===0?u.push([d]):u[u.length-1].push(d),u),[]),[e.apps]),l=a.useMemo(()=>o.map(u=>u.map(d=>d.url).join("")),[o]),c=o.length>1;return t.jsxs("div",{className:s,ref:n,children:[t.jsxs(ie,{children:[t.jsx(q,{children:e.title}),c&&t.jsx(U,{to:"."+$.category+"/"+e.id,children:t.jsx(ae,{children:t.jsx(D,{children:"All"})})})]}),c?t.jsx(A,{gap:"8px",infinite:!1,children:o.map((u,d)=>t.jsx(v,{width:d===0||d===o.length-1?(i-28).toString()+"px":"unset",marginLeft:d===0?"-34px":"0",children:u.map(f=>t.jsx(w,{item:f},f.url))},l[d]))}):o.map((u,d)=>t.jsx(ce,{children:t.jsx(v,{width:"100%",children:u.map(f=>t.jsx(w,{item:f},f.url))},l[d])},l[d]))]})},w=({item:e})=>{const{tonendpoint:s}=g(),n=H(e.url,"recommendation",s.getTrack());return t.jsx(de,{ref:n,children:t.jsxs(z,{children:[t.jsx(B,{src:e.icon}),t.jsxs(L,{children:[t.jsx(P,{children:e.name}),t.jsx(E,{children:e.description})]}),t.jsx(M,{children:t.jsx(_,{})})]})},e.url)};function O(){const{tonendpoint:e}=g(),n=K().data||"en";return Q([T.featuredRecommendations,n],async()=>{const r=await e.getAppsPopular(n);return r.categories=r.categories.filter(i=>i.id!=="featured"),r})}const le=()=>{const{id:e}=G(),{data:s}=O(),n=s==null?void 0:s.categories.find(r=>r.id===e);return t.jsxs(t.Fragment,{children:[t.jsx(J,{title:n==null?void 0:n.title}),t.jsx(I,{children:n?t.jsx(j,{children:n.apps.map(r=>t.jsx(w,{item:r},r.url))}):t.jsxs(j,{children:[t.jsx(m,{}),t.jsx(m,{}),t.jsx(m,{}),t.jsx(m,{}),t.jsx(m,{})]})})]})},he=h.div`
    width: 100%;
    aspect-ratio: 2 / 1;

    background-image: ${e=>`url(${e.img})`};
    background-size: cover;
    border-radius: ${e=>e.theme.cornerSmall};

    display: inline-flex !important;
    align-items: flex-end;
    justify-content: flex-start;
    cursor: pointer;
`,fe=h(z)`
    margin-left: 1rem;
`,me=({apps:e,className:s,...n})=>{const{config:r}=g(),i=r.featured_play_interval||1e3*10;return t.jsx(A,{className:s,gap:"8px",autoplay:!0,centerPadding:"16px",autoplaySpeed:i,...n,children:e.map(o=>t.jsx(ge,{item:o},o.url))})},ge=({item:e})=>{const{tonendpoint:s}=g(),n=H(e.url,"featured",s.getTrack());return t.jsx(he,{img:e.poster,ref:n,children:t.jsxs(fe,{children:[t.jsx(B,{src:e.icon}),t.jsxs(L,{color:e.textColor,children:[t.jsx(P,{children:e.name}),t.jsx(E,{children:e.description})]})]})})},xe=h(I)`
    padding: 0;
`,pe=h(me)`
    margin-bottom: 1rem;
`,je=h(ue)`
    margin-bottom: 1rem;
`,we=h.div`
    padding: 0 1rem;
`,Ce=()=>{const{data:e}=O(),s=N();return a.useEffect(()=>{e&&s()},[s,e]),t.jsxs(t.Fragment,{children:[t.jsx(V,{}),t.jsx(xe,{children:e?t.jsxs(t.Fragment,{children:[t.jsx(pe,{apps:e.apps}),e.categories.map(n=>t.jsx(je,{category:n},n.id))]}):t.jsx(we,{children:t.jsx(Z,{})})})]})},ke=()=>t.jsxs(ee,{children:[t.jsx(b,{path:$.category+"/:id",element:t.jsx(le,{})}),t.jsx(b,{path:"*",element:t.jsx(Ce,{})})]});export{ke as default};
