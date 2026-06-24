import{av as f,b_ as h,aY as m,h as p,r as s,a5 as A,b$ as v,j as e,c0 as o,c1 as j,aq as P,bc as F}from"./index-i4fqPXcm.js";import{u as N,a as _,g as E,M as b}from"./useFetchNext-NXnDNyrk.js";const I=f.lazy(()=>h(()=>import("./EmptyActivity-8mAxxEIP.js"),__vite__mapDeps([0,1,2,3,4,5]))),M=()=>{const a=m(),{api:u,standalone:x}=p(),n=s.useRef(null),{isFetched:d,fetchNextPage:l,hasNextPage:g,isFetchingNextPage:y,data:i}=N({queryKey:[a.rawAddress,A.activity,"all"],queryFn:({pageParam:t=void 0})=>new v(u.tonApiV2).getAccountEvents({accountId:a.rawAddress,limit:20,beforeLt:t,subjectOnly:!0}),getNextPageParam:t=>t.nextFrom>0?t.nextFrom:void 0}),r=y;_(g,r,l,x,n);const c=s.useMemo(()=>E(i,void 0),[i]);return d?c.length===0?e.jsx(s.Suspense,{fallback:e.jsx(o,{}),children:e.jsx(I,{})}):e.jsxs(e.Fragment,{children:[e.jsx(j,{}),e.jsxs(P,{ref:n,children:[e.jsx(b,{items:c}),r&&e.jsx(F,{size:3})]})]}):e.jsx(o,{})};export{M as default};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/EmptyActivity-8mAxxEIP.js","assets/index-i4fqPXcm.js","assets/index-eqTA7-MZ.css","assets/BuyAction-IdF2BYtg.js","assets/BuyItemNotification-VRx-4tjn.js","assets/v4-OErdnafK.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
