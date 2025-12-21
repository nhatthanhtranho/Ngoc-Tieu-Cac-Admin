import{c as o,j as e}from"./index-dd31sK6r.js";import{B as h}from"./book-B1k_D54A.js";const p=[["path",{d:"m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z",key:"1fy3hk"}]],x=o("bookmark",p);const u=[["path",{d:"M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3",key:"139s4v"}],["path",{d:"M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4",key:"1dlkgp"}],["path",{d:"M5 21h14",key:"11awu3"}]],f=o("sprout",u);const b=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],g=o("x",b);function j({title:t,thumbnailUrl:l,handleClick:a,isBookmarked:r=!1,latestEbook:n=!1,hasEbook:i=!1,currentChapter:s,isSeed:c,onToggleBookmark:d}){return e.jsxs("div",{className:"relative cursor-pointer w-full group",onClick:a,children:[e.jsx("div",{className:"relative rounded-xl overflow-hidden shadow-md",children:e.jsx("img",{src:l,alt:t,className:"w-full aspect-2/3 object-cover group-hover:scale-105 transition-transform duration-300",loading:"lazy"})}),e.jsx("h3",{className:"mt-2 text-sm font-semibold line-clamp-2 text-slate-800",children:t}),e.jsx("button",{onClick:m=>{m.stopPropagation(),d?.()},className:"absolute top-2 right-2 z-20",children:e.jsx(x,{size:20,className:`transition-colors fill-gray-500 cursor-pointer hover:fill-yellow-400 hover:text-yellow-400 ${r?"fill-yellow-400 text-yellow-400":"text-gray-500"}`})}),e.jsxs("div",{className:`absolute top-2 right-10 z-20 px-2 py-0.5
              text-white text-[11px] font-medium rounded-md 
              backdrop-blur-sm shadow-sm
              ${s===0?"bg-red-600":"bg-black/70"}`,children:["Ch.",s]}),i&&e.jsx("button",{className:"absolute top-2  left-2 z-20",children:e.jsx(h,{size:24,className:`transition-colors cursor-pointer ${n?"text-emerald-500 fill-emerald-300":"text-yellow-500 fill-yellow-300 "}`})}),c&&e.jsx("button",{className:`\r
      absolute top-10 left-2 z-20\r
      flex items-center justify-center\r
      w-9 h-9\r
      rounded-full\r
      bg-green-50\r
      shadow-md\r
      hover:bg-green-100\r
      active:scale-95\r
      transition-all\r
    `,title:"Seed chapter",children:e.jsx(f,{size:18,className:"text-green-600"})})]})}export{j as B,g as X};
