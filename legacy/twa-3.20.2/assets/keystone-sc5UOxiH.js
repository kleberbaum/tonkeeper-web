import{s as u,av as D,r as d,bV as E,j as t,bW as H,n as j,c as q,p as S,B as G,a as A,u as _,C as M,bl as W,b as N,h as U,U as z,bX as K,V as R,bY as X,o as Y,a3 as Z,f as F,i as J,bZ as ee,a5 as te,bg as ne}from"./index-i4fqPXcm.js";const se=u.div`
    max-height: 240px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    overflow: auto;
    position: relative;

    &::-webkit-scrollbar {
        display: none;
        width: 0;
        background: transparent;
        height: 0;
    }

    -ms-overflow-style: none;
    scrollbar-width: none;

    /* optimise large emojis list rendering avoiding styled components */
    > .emoji-button {
        height: 32px;
        width: 32px;
        line-height: 24px;
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }
`,V=u.div`
    position: sticky;
    width: 100%;
    height: 16px;
`,oe=u(V)`
    bottom: -1px;
    background: ${e=>e.theme.gradientBackgroundBottom};
`,re=u(V)`
    top: 0;
    background: ${e=>e.theme.gradientBackgroundTop};
`,ae=E.slice(0,150),me=D.memo(({onClick:e,keepShortListForMS:s})=>{const[o,i]=d.useState(s?ae:E);return d.useEffect(()=>{s&&setTimeout(()=>i(E),s)},[]),t.jsxs(se,{children:[t.jsx(re,{}),H.map(n=>t.jsx("div",{className:"emoji-button",onClick:()=>e(n.name),children:t.jsx(n.icon,{})},n.name)),o.map(n=>t.jsx("div",{className:"emoji-button",onClick:()=>e(n),children:n},n)),t.jsx(oe,{})]})}),k=u.div`
    display: flex;
    text-align: center;
    gap: 1rem;
    flex-direction: column;

    & + & {
        margin-top: 2rem;
    }
`,T=u(q)`
    user-select: none;
`,L=u(S)`
    user-select: none;

    text-align: center;
    color: ${e=>e.theme.textSecondary};
`,ie=u.div`
    display: grid;
    grid-template-rows: repeat(12, minmax(0, 1fr));
    grid-auto-flow: column;
    gap: 0.5rem;
    place-content: space-evenly;
    margin: 1rem 0;

    white-space: normal;
`,ce=u(S)``,le=u(G)`
    display: inline-block;
    width: 24px;
    line-height: 24px;
    color: ${e=>e.theme.textSecondary};

    user-select: none;
`,O=u(S)`
    display: inline-block;
    width: 26px;
    text-align: right;

    font-size: 15px;

    color: ${e=>e.theme.textSecondary};
`;u.div`
    display: flex;
`;const ge=({mnemonic:e,onBack:s,onCheck:o})=>{const i=A(),{t:n}=_();return d.useEffect(()=>{i.twaExpand&&i.twaExpand()},[]),t.jsxs(M,{children:[t.jsx(W,{onClick:s}),t.jsx(k,{children:t.jsxs("div",{children:[t.jsx(T,{children:n("secret_words_title")}),t.jsx(L,{children:n("secret_words_caption")})]})}),t.jsx(ie,{children:e.map((r,x)=>t.jsxs(ce,{children:[t.jsxs(le,{children:[" ",x+1,"."]})," ",r," "]},x))}),t.jsx(N,{size:"large",fullWidth:!0,primary:!0,marginTop:!0,onClick:o,children:n("continue")})]})},P=u.input`
    outline: none;
    border: none;
    background: transparent;
    flex-grow: 1;
    font-weight: 500;
    font-size: 16px;

    color: ${e=>e.theme.textPrimary};
`,de=u.label`
    width: 100%;
    line-height: 54px;
    border-radius: ${e=>e.theme.cornerSmall};
    padding: 0 1rem;
    box-sizing: border-box;
    text-align: left;

    ${e=>e.submitted?e.valid?e.active?j`
                      border: 1px solid ${e.theme.fieldActiveBorder};
                      background: ${e.theme.fieldBackground};
                  `:j`
                      border: 1px solid ${e.theme.fieldBackground};
                      background: ${e.theme.fieldBackground};
                  `:j`
                      border: 1px solid ${e.theme.fieldErrorBorder};
                      background: ${e.theme.fieldErrorBackground};
                  `:e.active?j`
                      border: 1px solid ${e.theme.fieldActiveBorder};
                      background: ${e.theme.fieldBackground};
                  `:e.valid?j`
                      border: 1px solid ${e.theme.fieldBackground};
                      background: ${e.theme.fieldBackground};
                  `:j`
                      border: 1px solid ${e.theme.fieldErrorBorder};
                      background: ${e.theme.fieldErrorBackground};
                  `}

    ${O} {
        display: inline-block;
        line-height: 54px;
        padding-right: 0.35rem;
    }
    ${P} {
        display: inline-block;
        width: calc(100% - 38px);
        height: 54px;
        line-height: 54px;
        box-sizing: border-box;
    }
`,C=({value:e,test:s,onChange:o,focusNext:i,isValid:n,tabIndex:r})=>{const[x,h]=d.useState(!1),[g,v]=d.useState(!1),b=g?n===!0:n||x,w=d.useCallback(p=>{p.key==="Enter"&&i()},[i]);return t.jsxs(de,{submitted:g,active:x,valid:b,children:[t.jsxs(O,{children:[s,":"]}),t.jsx(P,{tabIndex:r,autoComplete:"off",value:e,onChange:p=>o(p.target.value.toLocaleLowerCase()),onFocus:()=>h(!0),onKeyDown:w,onBlur:()=>{v(!0),h(!1)}})]})};function B(e,s){return Math.floor(Math.random()*(s-e))+e}const $=(e,s)=>{if(e==="en"){const o=new Intl.PluralRules(e,{type:"ordinal"}),i=new Map([["one","st"],["two","nd"],["few","rd"],["other","th"]]),n=o.select(s),r=i.get(n);return`${s}${r}`}else return`${s}`},I=(e,s)=>e===""||e.toLowerCase().trim()===s,pe=({onBack:e,onConfirm:s,mnemonic:o,isLoading:i})=>{const{t:n,i18n:r}=_(),[x,h]=d.useState(""),[g,v]=d.useState(""),[b,w]=d.useState(""),p=d.useRef(null),[c,a,l]=d.useMemo(()=>[B(1,8),B(8,16),B(16,24)],[]),f=d.useMemo(()=>n("check_words_caption").replace("%1%",$(r.language,c)).replace("%2%",$(r.language,a)).replace("%3%",$(r.language,l)),[n,c,a,l]),m=x.toLowerCase().trim()===o[c-1]&&g.toLowerCase().trim()===o[a-1]&&b.toLowerCase().trim()===o[l-1];return t.jsxs(M,{children:[t.jsx(W,{onClick:e}),t.jsx(k,{children:t.jsxs("div",{children:[t.jsx(T,{children:n("check_words_title")}),t.jsx(L,{children:f})]})}),t.jsxs(k,{ref:p,children:[t.jsx(C,{tabIndex:1,test:c,value:x,onChange:h,isValid:I(x,o[c-1]),focusNext:()=>y(p.current,1)}),t.jsx(C,{tabIndex:2,test:a,value:g,onChange:v,isValid:I(g,o[a-1]),focusNext:()=>y(p.current,2)}),t.jsx(C,{tabIndex:3,test:l,value:b,onChange:w,isValid:I(b,o[l-1]),focusNext:()=>m?s():void 0})]}),t.jsx(k,{children:t.jsx(N,{tabIndex:4,size:"large",fullWidth:!0,primary:!0,loading:i,disabled:!m,onClick:s,children:n("continue")})})]})},ue=u.div`
    display: grid;
    grid-template-rows: repeat(12, minmax(0, 1fr));
    grid-auto-flow: column;
    gap: 0.5rem;

    @media (max-width: 768px) {
        grid-template-rows: repeat(24, minmax(0, 1fr));
    }

    ${e=>e.theme.displayType==="full-width"&&j`
            grid-template-rows: repeat(8, minmax(0, 1fr));
        `}
`,he=e=>K.includes(e),y=(e,s)=>{var i;if(!e)return;const o=e.childNodes[s];o&&((i=o.querySelector("input"))==null||i.focus())},fe=({isLoading:e,onMnemonic:s})=>{const o=A(),{standalone:i}=U(),n=d.useRef(null),{t:r}=_(),x=z(),[h,g]=d.useState(Array(24).fill("")),v=d.useCallback((c,a)=>{if(c.includes(" ")||c.includes(" ")){let l=c.trim().replace(/\xA0/g," ").replace(/[0-9]/g,"").replace(/\./g,"").replace(/\s+/g," ").split(" ");if(l.length===1)g(f=>f.map((m,Q)=>Q===a?l[0]:m)),y(n.current,a+1);else{const f=Math.min(24-a,l.length);l=l.slice(0,f),g(m=>(m=[...m],m.splice(a,f,...l),m)),y(n.current,f-1)}return}else return g(l=>l.map((f,m)=>m===a?c:f))},[n.current]),b=d.useMemo(()=>h.map(c=>c===""||K.includes(c)),[h]),w=()=>{o.topMessage(r("import_wallet_wrong_words_err")),o.hapticNotification("error")},p=async()=>{const c=h.findIndex(l=>!he(l));c!==-1&&(y(n.current,c),w()),h.length<24&&(y(n.current,h.length-1),w()),o.isIOs()&&X("text"),await Y.mnemonicValidate(h)?s(h):w()};return t.jsxs(t.Fragment,{children:[t.jsx(W,{onClick:()=>x(R.home)}),t.jsx(k,{children:t.jsxs("div",{children:[t.jsx(T,{children:r("import_wallet_title")}),t.jsx(L,{children:r("import_wallet_caption")})]})}),t.jsx(k,{children:t.jsx(ue,{ref:n,children:h.map((c,a)=>t.jsx(C,{value:c,test:a+1,isValid:b[a],onChange:l=>v(l,a),tabIndex:a+1,focusNext:()=>y(n.current,a+1)},a))})}),t.jsx(k,{children:t.jsx(N,{size:"large",fullWidth:!0,primary:!0,loading:e,onClick:p,bottom:i,children:r("continue")})})]})},be=()=>{const e=A(),s=Z(),o=z(),i=F();return J(async n=>{try{const r=await ee(n,e.storage);if(await s.getAccount(r.id))throw new Error("Wallet already exist");await s.addAccountToState(r),await s.setActiveAccountId(r.id),await i.invalidateQueries([te.account]),o(R.home)}catch(r){throw r instanceof Error&&e.alert(r.message),r}})},we=()=>ne().type==="keystone";export{pe as C,me as E,fe as I,ge as W,ie as a,le as b,we as c,be as u};
