import{s,u as c,a as l,r as d,dV as p,j as t,af as m,bP as x,dW as u,B as y,b as f}from"./index-i4fqPXcm.js";import{a as h}from"./BuyAction-IdF2BYtg.js";import"./BuyItemNotification-VRx-4tjn.js";import"./v4-OErdnafK.js";const j=s.div`
    margin-top: -64px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
`,B=s(y)`
    color: ${e=>e.theme.textSecondary};
    margin-bottom: 1.5rem;
`,g=s.div`
    display: flex;
    flex-direction: row;
    gap: 0.75rem;
`,n=s(f)`
    display: flex;
    gap: 6px;

    > svg {
        color: ${e=>e.theme.buttonTertiaryForeground};
    }
`,E=()=>{const{t:e}=c(),a=l(),[i,o]=d.useState(!1),{data:r}=p();return t.jsxs(j,{children:[t.jsx(m,{children:e("activity_empty_transaction_title")}),t.jsx(B,{children:e("activity_empty_transaction_caption")}),t.jsxs(g,{children:[t.jsxs(n,{size:"small",onClick:()=>o(!0),children:[t.jsx(x,{}),e("exchange_title")]}),t.jsxs(n,{size:"small",onClick:()=>a.uiEvents.emit("receive",{method:"receive",params:{}}),children:[t.jsx(u,{}),e("wallet_receive")]})]}),t.jsx(h,{buy:r,open:i,handleClose:()=>o(!1)})]})};export{E as default};
