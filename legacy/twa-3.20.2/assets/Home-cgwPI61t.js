import{s as a,n as h,u as p,j as t,L as f,c2 as R,B as I,r as m,U as C,c3 as v,c4 as S,c5 as E,c6 as g,c7 as w,z as T,V as N,c8 as _,q as b,c9 as k,ca as P,aU as U,cb as K,cc as D,cd as H,ce as M,cf as z,cg as V}from"./index-i4fqPXcm.js";import{H as W}from"./TonActions-oiqhnx5Z.js";import"./BuyAction-IdF2BYtg.js";import"./BuyItemNotification-VRx-4tjn.js";import"./v4-OErdnafK.js";const O=a.div`
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1rem 1rem 0;
    box-sizing: border-box;
    gap: 1rem;
    width: 100%;
`,$=a.img`
    width: 44px;
    height: 44px;
    border-radius: ${e=>e.theme.cornerFull};

    pointer-events: none;
`,q=a.div`
    flex-grow: 1;

    display: flex;
    flex-direction: column;

    white-space: nowrap;
`,J=a.div`
    display: grid;
    grid-template-columns: auto 1fr 0fr;
    gap: 0.25rem;
    width: 100%;
`,G=a(f)`
    text-overflow: ellipsis;
    overflow: hidden;

    display: flex;
    align-items: center;
`,Q=a(R)`
    display: inline-block;
    margin-left: 8px;
    padding: 3px 4px;
    border-radius: ${e=>e.theme.corner3xSmall};
    background: ${e=>e.theme.backgroundContentTint};
    color: ${e=>e.theme.textSecondary};
`,X=a.div`
    display: flex;
    justify-content: space-between;
`,L=a(I)`
    color: ${e=>e.theme.textSecondary};
`,Y=a(f)`
    color: ${e=>e.theme.textSecondary};
`,Z=a.span`
    color: ${e=>e.theme.accentOrange};
`,B=({name:e,symbol:s,balance:c,secondary:n,fiatAmount:o,label:r,rate:i,verification:l})=>{const{t:u}=p();return t.jsxs(q,{children:[t.jsxs(J,{children:[t.jsxs(G,{children:[s??e,r?t.jsx(Q,{children:r}):null]}),t.jsx(Y,{}),t.jsx(f,{children:c})]}),t.jsxs(X,{children:[t.jsx(L,{children:l==="none"?t.jsx(Z,{children:u("approval_unverified_token")}):t.jsxs(t.Fragment,{children:[n," ",t.jsx(te,{data:i})]})}),t.jsx(L,{children:o})]})]})},ee=a.span`
  margin-left: 0.5rem;
  opacity: 0.64;

  ${e=>e.positive?h`
                color: ${e.theme.accentGreen};
            `:h`
                color: ${e.theme.accentRed};
            `}}
`,te=({data:e})=>{if(!e||!e.diff24h||e.diff24h=="0.00%")return null;const s=e.diff24h.startsWith("+");return t.jsx(ee,{positive:s,children:e.diff24h})},se=m.forwardRef(({info:e,className:s},c)=>{const{t:n}=p(),o=C(),r=m.useMemo(()=>v(e.balance),[e.balance]),i=S(r),{data:l}=E(g.TON),{fiatPrice:u,fiatAmount:j}=w(l,r);return t.jsx(T,{onClick:()=>o(N.coins+"/ton"),className:s,ref:c,children:t.jsxs(O,{children:[t.jsx($,{src:"https://wallet.tonkeeper.com/img/toncoin.svg"}),t.jsx(B,{name:n("Toncoin"),symbol:g.TON,balance:i,secondary:u,fiatAmount:j,rate:l})]})})}),ne=m.forwardRef(({jetton:e,className:s},c)=>{const{t:n}=p(),o=C(),[r,i]=m.useMemo(()=>[v(e.balance,e.jetton.decimals),_.Address.parse(e.jetton.address).toString()],[e]),l=S(r,e.jetton.decimals),{data:u}=E(i),{fiatPrice:j,fiatAmount:A}=w(u,r);return t.jsx(T,{onClick:()=>o(N.coins+`/${encodeURIComponent(e.jetton.address)}`),className:s,ref:c,children:t.jsxs(O,{children:[t.jsx($,{src:e.jetton.image}),t.jsx(B,{name:e.jetton.name??n("Unknown_COIN"),verification:e.jetton.verification,symbol:e.jetton.symbol,balance:l,secondary:j,fiatAmount:A,rate:u})]})})}),F=({assets:{ton:{info:e,jettons:s},tron:c}})=>t.jsxs(t.Fragment,{children:[t.jsx(b,{noUserSelect:!0,children:t.jsx(se,{info:e})}),t.jsx(b,{noUserSelect:!0,children:s.balances.map(n=>t.jsx(ne,{jetton:n},n.jetton.address))})]}),oe=({assets:e,nfts:s})=>t.jsxs(t.Fragment,{children:[t.jsx(F,{assets:e}),t.jsx(k,{nfts:s})]}),re=a.div`
    display: flex;
    padding-top: 1rem;
    margin-bottom: 1.5rem;
    position: relative;
    justify-content: center;
    gap: 2.25rem;

    user-select: none;
`,y=a.div`
    cursor: pointer;

    padding: 0.5rem;
    margin: -0.5rem;
    box-sizing: border-box;

    ${e=>e.active?h`
                  color: ${e.theme.textPrimary};
              `:h`
                  color: ${e.theme.textSecondary};
              `}
`,ae=a.div`
    position: absolute;
    height: 3px;
    width: 0px;
    bottom: -0.5rem;
    border-radius: ${e=>e.theme.corner3xSmall};
    background: ${e=>e.theme.accentBlue};
`;var d;(function(e){e[e.TOKENS=0]="TOKENS",e[e.COLLECTIBLES=1]="COLLECTIBLES"})(d||(d={}));const ce=({tab:e,onTab:s})=>{const{t:c}=p(),n=m.useRef(null),o=m.useRef(null);return m.useEffect(()=>{if(n.current&&o.current){const r=n.current.childNodes[e],i=40;o.current.style.width=i+"px",o.current.style.left=r.offsetLeft+(r.clientWidth-i)/2+"px",window.requestAnimationFrame(()=>{o.current&&(o.current.style.transition="all 0.3s ease-in-out")})}},[n,o,e]),t.jsxs(re,{ref:n,children:[t.jsx(y,{active:e===d.TOKENS,onClick:()=>s(d.TOKENS),children:t.jsx(f,{children:c("jettons_list_title")})}),t.jsx(y,{active:e===d.COLLECTIBLES,onClick:()=>s(d.COLLECTIBLES),children:t.jsx(f,{children:c("wallet_collectibles_tab_lable")})}),t.jsx(ae,{ref:o})]})},x="collectibles",ie=({assets:e,nfts:s})=>{const c=P(),[n,o]=U(),r=m.useMemo(()=>new URLSearchParams(n).get(x)==="open"?d.COLLECTIBLES:d.TOKENS,[n,c]),i=m.useCallback(l=>{l===d.COLLECTIBLES?n.has(x)||n.append(x,"open"):n.has(x)&&n.delete(x),o(n,{replace:!0})},[n,o]);return t.jsxs(t.Fragment,{children:[t.jsx(ce,{tab:r,onTab:i}),r===d.COLLECTIBLES?t.jsx(k,{nfts:s}):t.jsx(F,{assets:e})]})},le=({assets:e,nfts:s})=>e.ton.jettons.balances.length+s.length<10||e.ton.jettons.balances.length<3?t.jsx(oe,{assets:e,nfts:s}):t.jsx(ie,{assets:e,nfts:s}),he=()=>{const{isFetched:e}=K(),[s,c,n,o]=D(),{data:r,error:i,isFetching:l}=H(),u=n||l;return!r||!s||!e?t.jsx(M,{}):t.jsxs(t.Fragment,{children:[t.jsx(z,{assets:s,error:c,isFetching:u}),t.jsx(W,{chain:V.TON}),t.jsx(le,{assets:s,nfts:r})]})};export{he as default};
