import{s as n,n as m,e0 as O,p as h,A as T,L as w,ai as B,e1 as D,a as b,aY as A,h as I,u as _,r as R,e2 as P,j as s,z as N,ah as L,aC as M,b as U,J as E,e3 as $,f as F,i as z,an as H,F as Q,o as W}from"./index-i4fqPXcm.js";import{a as X}from"./v4-OErdnafK.js";const y=n.img`
    pointer-events: none;

    ${e=>e.large?m`
                  width: 72px;
                  height: 72px;
                  margin-bottom: 20px;
                  border-radius: ${t=>t.theme.cornerSmall};
              `:m`
                  width: 44px;
                  height: 44px;
                  border-radius: ${t=>t.theme.cornerExtraSmall};
              `}
`,G=n.div`
    display: flex;
    gap: 1rem;
    align-items: center;
`,J=n.div`
    display: flex;
    flex-direction: column;

    user-select: none;
`,f=n(h)`
    color: ${e=>e.theme.textSecondary};
`,C=n.div`
    display: flex;
    color: ${e=>e.theme.iconTertiary};
`,Y=n(T)`
    transition: color 0.1s ease;

    &:hover ${C} {
        color: ${e=>e.theme.iconPrimary};
    }
`,q=n.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`,K=n.div`
    text-align: center;
`,V=n.span`
    margin: 28px 0 0;
    display: flex;
`,Z=n.div`
    margin: 2rem 0;
    padding: 18px 18px;
    box-sizing: border-box;
    display: flex;
    gap: 0.5rem;
    flex-direction: column;
    width: 100%;

    background: ${e=>e.theme.backgroundContent};
    border-radius: ${e=>e.theme.cornerSmall};
`,ee=n(h)`
    display: block;
`,se=n(h)`
    cursor: pointer;
    color: ${e=>e.theme.textSecondary};
    margin-right: 0.75rem;
    transition: color 0.1s ease;

    &:hover {
        color: ${e=>e.theme.textPrimary};
    }
`,te=({buttons:e})=>{const{t}=_(),r=b();return s.jsxs(Z,{children:[s.jsx(ee,{children:t("exchange_method_open_warning")}),e&&e.length>0&&s.jsx("div",{children:e.map((o,a)=>s.jsx(se,{onClick:()=>r.openPage(o.url),children:o.title},a))})]})},ne=(e,t)=>{const r=$(),o=F();return z(async a=>{await r.set(`${t}_${e}`,a),await o.invalidateQueries([e,t])})},oe=(e,t)=>{const r=$();return H([e,t],async()=>{const o=await r.get(`${t}_${e}`);return o===null?!1:o})},re=(e,t,r,o,a)=>{const[i,l]=a==="buy"?[o,"TON"]:["TON",o],c=Q(r.rawAddress);if(e=e.replace("{ADDRESS}",c).replace("{CUR_FROM}",i).replace("{CUR_TO}",l),e.includes("TX_ID")){const d="mercuryo_"+X();e=e.replace(/\{TX_ID\}/g,d),e=e.replace(/\=TON\&/gi,"=TONCOIN&"),e+=`&signature=${W.sha512_sync(`${c}${t.mercuryoSecret??""}`).toString("hex")}`}return e},ae=n(w)`
    display: flex;
    align-items: center;
    gap: 6px;
`,ce=n(B)`
    display: flex;
    align-items: center;
    gap: 6px;
`,j=n.div`
    color: ${e=>e.theme.accentBlue};
    background-color: ${e=>O(e.theme.accentBlue,.26)};
    border-radius: 3px;
    padding: 2px 4px;
    font-size: 8.5px;
    font-style: normal;
    font-weight: 510;
    line-height: 12px;
`,de=({item:e,kind:t})=>{const r=D(),o=b(),a=A(),{config:i,fiat:l}=I(),{t:c}=_(),[d,x]=R.useState(!1),{data:p}=oe(e.title,t),{mutate:v}=ne(e.title,t),{mutateAsync:S}=P(),u=async()=>{r(e.action_button.url);let g=e.action_button.url;e.id==="mercuryo_pro"&&(g=await S(e.action_button.url)),o.openPage(re(g,i,a,l,t)),x(!1)},k=()=>{p?u():x(!0)};return s.jsxs(s.Fragment,{children:[s.jsx(N,{onClick:k,children:s.jsxs(Y,{children:[s.jsxs(G,{children:[s.jsx(y,{src:e.icon_url}),s.jsxs(J,{children:[s.jsxs(ae,{children:[e.title,e.badge&&s.jsx(j,{children:e.badge})]}),s.jsx(f,{children:e.description})]})]}),s.jsx(C,{children:s.jsx(L,{})})]})},e.title),s.jsx(M,{isOpen:d,handleClose:()=>x(!1),children:()=>s.jsxs(q,{children:[s.jsx(y,{large:!0,src:e.icon_url}),s.jsxs(ce,{children:[e.title,e.badge&&s.jsx(j,{children:e.badge})]}),s.jsx(K,{children:s.jsx(f,{children:e.description})}),s.jsx(te,{buttons:e.info_buttons}),s.jsx(U,{size:"large",fullWidth:!0,primary:!0,onClick:u,children:e.action_button.title}),s.jsx(V,{children:s.jsx(E,{checked:!!p,onChange:v,children:c("exchange_method_dont_show_again")})})]})})]})};export{de as B,Z as D};
