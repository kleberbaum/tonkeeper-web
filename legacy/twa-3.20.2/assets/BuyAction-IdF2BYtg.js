import{j as e,s as c,n as u,r as i,aC as h,U as x,a as p,am as g,u as m,h as k,dX as j,dY as y,dZ as f,d_ as w,V as b,aE as B,ai as C,d$ as L,af as v,dV as M,ca as N,aU as _,dg as P,q as S}from"./index-i4fqPXcm.js";import{B as A}from"./BuyItemNotification-VRx-4tjn.js";const H=()=>e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:"28",height:"28",viewBox:"0 0 28 28",fill:"none",children:e.jsx("path",{d:"M14 21.5V14M14 14V6.5M14 14H21.5M14 14H6.5",stroke:"currentColor",strokeWidth:"3",strokeLinecap:"round",strokeLinejoin:"round"})}),W=()=>e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:"28",height:"28",viewBox:"0 0 28 28",fill:"none",children:e.jsx("path",{d:"M14 6.5V21.5M14 6.5L7.5 13M14 6.5L20.5 13",stroke:"currentColor",strokeWidth:"3",strokeLinecap:"round",strokeLinejoin:"round"})}),q=()=>e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:"28",height:"28",viewBox:"0 0 28 28",fill:"none",children:e.jsx("path",{d:"M14 21.5V6.5M14 21.5L7.5 15M14 21.5L20.5 15",stroke:"currentColor",strokeWidth:"3",strokeLinecap:"round",strokeLinejoin:"round"})}),R=({items:t,kind:o})=>e.jsx(S,{margin:!1,children:t.filter(n=>!n.disabled).map(n=>e.jsx(A,{item:n,kind:o},n.title))}),U=c.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`,V=({item:t,kind:o,handleClose:n})=>{const s=x(),a=p(),{data:r}=g(),{t:l}=m(),{config:d}=k();return e.jsxs(U,{children:[e.jsx(j,{children:e.jsx(y,{children:e.jsxs(f,{children:[e.jsx(w,{country:r,onClick:()=>s(b.settings+B.country)}),e.jsx(C,{children:t.title}),e.jsx(L,{handleClose:n})]})})}),e.jsx(R,{items:t.items,kind:o}),e.jsx($,{children:e.jsx(I,{onClick:()=>d.exchangePostUrl&&a.openPage(d.exchangePostUrl),children:l(o==="buy"?"exchange_modal_other_ways_to_buy":"exchange_other_ways")})})]})},$=c.div`
    text-align: center;

    ${t=>t.theme.displayType==="full-width"&&u`
            padding-bottom: 1rem;
        `}
`,I=c(v)`
    cursor: pointer;
    padding: 7.5px 1rem 8.5px;
    background-color: ${t=>t.theme.backgroundContent};
    transition: background-color 0.1s ease;
    border-radius: ${t=>t.theme.cornerMedium};
    display: inline-block;

    &:hover {
        background-color: ${t=>t.theme.backgroundHighlighted};
    }
`,T=({buy:t,open:o,handleClose:n})=>{const s=i.useCallback(()=>{if(!(!o||!t))return e.jsx(V,{item:t,kind:"buy",handleClose:n})},[o,t]);return e.jsx(h,{isOpen:o&&t!=null,handleClose:n,hideButton:!0,children:s})},F=()=>{const{data:t}=M(),o=N(),[n,s]=_(),a=i.useMemo(()=>new URLSearchParams(n).get("buy")==="open",[n,o]),r=i.useCallback(()=>{n.has("buy")?n.delete("buy"):n.append("buy","open"),s(n,{replace:!0})},[n,s]);return e.jsxs(e.Fragment,{children:[e.jsx(P,{icon:e.jsx(H,{}),title:"wallet_buy",action:r}),e.jsx(T,{buy:t,open:a,handleClose:r})]})};export{F as B,q as R,W as S,T as a};
