import{a as i,j as s,dg as o,s as r,dh as d,di as m,dj as p,bv as l,cm as x,dk as j}from"./index-i4fqPXcm.js";import{S as u,R as A,B as S}from"./BuyAction-IdF2BYtg.js";const w=({asset:t,chain:e})=>{const n=i();return s.jsx(o,{icon:s.jsx(u,{}),title:"wallet_send",action:()=>n.uiEvents.emit("transfer",{method:"transfer",id:Date.now(),params:{asset:t,chain:e}})})},h=({chain:t,jetton:e})=>{const n=i();return s.jsx(o,{icon:s.jsx(A,{}),title:"wallet_receive",action:()=>n.uiEvents.emit("receive",{method:"receive",params:{chain:t,jetton:e}})})},v=r(d)`
    height: 24px;
    width: 24px;
    color: ${t=>t.theme.iconPrimary};
`,R=({fromAsset:t})=>{const[e,n]=m(),[_,a]=p(),c=()=>{t&&a(t),n(!0)};return s.jsx(o,{icon:s.jsx(v,{}),title:"swap_title",action:c})},y=({chain:t})=>{const e=l();return s.jsxs(x,{children:[s.jsx(S,{}),!e&&s.jsx(w,{asset:"TON",chain:t}),s.jsx(h,{}),!e&&s.jsx(R,{fromAsset:j})]})};export{y as H,h as R,w as S,R as a};
