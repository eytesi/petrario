import { useState, useEffect, useRef } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────
const ROCK_TYPES = ["Ígnea Plutónica","Ígnea Volcánica","Sedimentaria Clástica","Sedimentaria Química","Sedimentaria Orgánica","Metamórfica de Contacto","Metamórfica Regional","Mineral","Gema","Fósil","Meteorito","Concha Marina","Coral","Cristal","Otro"];
const COLORS = ["Negro","Blanco","Gris","Marrón","Rojo","Naranja","Amarillo","Verde","Azul","Violeta","Rosa","Multicolor","Translúcido","Metálico"];
const LUSTER = ["Vítreo","Resinoso","Nacarado","Sedoso","Metálico","Mate","Adamantino","Terroso"];
const TEXTURE = ["Lisa","Rugosa","Granular","Cristalina","Fibrosa","Escamosa","Masiva","Porosa"];

const RARITY = {
  Común:          { label:"Común",          color:"#8a9a7a", glow:"rgba(138,154,122,0.3)",  border:"rgba(138,154,122,0.4)",  bg:"rgba(138,154,122,0.08)", stars:1 },
  Inusual:        { label:"Inusual",         color:"#6aa8c8", glow:"rgba(106,168,200,0.35)", border:"rgba(106,168,200,0.45)", bg:"rgba(106,168,200,0.08)", stars:2 },
  Raro:           { label:"Raro",            color:"#c8a96e", glow:"rgba(200,169,110,0.4)",  border:"rgba(200,169,110,0.6)",  bg:"rgba(200,169,110,0.1)",  stars:3 },
  Extraordinario: { label:"Extraordinario",  color:"#c86aa0", glow:"rgba(200,106,160,0.45)", border:"rgba(200,106,160,0.6)",  bg:"rgba(200,106,160,0.1)",  stars:4 },
};

const MOHS_SCALE = [
  {n:1, name:"Talco",      ref:"Uña",             color:"#b8d4a0"},
  {n:2, name:"Yeso",       ref:"Uña (duro)",       color:"#a8c890"},
  {n:3, name:"Calcita",    ref:"Moneda de cobre",  color:"#98bc80"},
  {n:4, name:"Fluorita",   ref:"Clavo de hierro",  color:"#88b070"},
  {n:5, name:"Apatita",    ref:"Cuchillo",         color:"#c8a96e"},
  {n:6, name:"Feldespato", ref:"Vidrio",           color:"#b89858"},
  {n:7, name:"Cuarzo",     ref:"Lima de acero",    color:"#e8b860"},
  {n:8, name:"Topacio",    ref:"Topacio",          color:"#6aa8c8"},
  {n:9, name:"Corindón",   ref:"Rubí / Zafiro",    color:"#c86aa0"},
  {n:10,name:"Diamante",   ref:"Diamante",         color:"#e8d9f8"},
];

const TYPE_EMOJI = {"Mineral":"💎","Gema":"💎","Fósil":"🦴","Meteorito":"☄️","Concha Marina":"🐚","Coral":"🪸","Cristal":"🔮","Ígnea Volcánica":"🌋","Ígnea Plutónica":"🏔️"};
const getEmoji = t => TYPE_EMOJI[t] || "🪨";

const DEFAULT_SPECIMENS = [
  {id:"1",name:"Cuarzo Rosa",type:"Mineral",rarity:"Raro",color:"Rosa",luster:"Vítreo",texture:"Cristalina",size:"8",weight:"320",location:"Ushuaia, Tierra del Fuego",lat:-54.8019,lng:-68.303,date:"2026-04-12",notes:"Encontrado en la orilla del canal Beagle.",aiInfo:{identified:true,name:"Cuarzo Rosa",scientificName:"Cuarzo (var. rosa)",formula:"SiO₂",mohs:"7",group:"Tectosílicatos",formation:"Ígnea/Pegmatítica",curiosity:"El color rosa se debe a impurezas de titanio o aluminio.",confidence:"alta"},image:null,expeditionId:null,editHistory:[]},
  {id:"2",name:"Basalto Columnar",type:"Ígnea Volcánica",rarity:"Común",color:"Negro",luster:"Mate",texture:"Masiva",size:"15",weight:"890",location:"Cabo Polonio, Uruguay",lat:-34.4042,lng:-53.7765,date:"2025-11-03",notes:"Fragmento de colada lávica.",aiInfo:{identified:true,name:"Basalto",scientificName:"Basalto toleítico",formula:"SiO₂+MgO+FeO",mohs:"6",group:"Ígneas Volcánicas",formation:"Enfriamiento rápido de lava basáltica",curiosity:"Es la roca volcánica más abundante en la corteza oceánica.",confidence:"alta"},image:null,expeditionId:null,editHistory:[]},
  {id:"3",name:"Amatista Geoda",type:"Cristal",rarity:"Extraordinario",color:"Violeta",luster:"Vítreo",texture:"Cristalina",size:"12",weight:"640",location:"Salto, Uruguay",lat:-31.3833,lng:-57.9667,date:"2025-08-19",notes:"Geoda con cristales bien definidos.",aiInfo:{identified:true,name:"Amatista",scientificName:"Cuarzo (var. amatista)",formula:"SiO₂ (+Fe)",mohs:"7",group:"Tectosílicatos",formation:"Cavidades en rocas volcánicas",curiosity:"El color violeta se debe a trazas de hierro irradiadas.",confidence:"alta"},image:null,expeditionId:"exp1",editHistory:[]},
  {id:"4",name:"Pirita Cúbica",type:"Mineral",rarity:"Inusual",color:"Metálico",luster:"Metálico",texture:"Cristalina",size:"5",weight:"180",location:"San Juan, Argentina",lat:-31.5375,lng:-68.5364,date:"2026-01-07",notes:"Cristales cúbicos perfectos.",aiInfo:{identified:true,name:"Pirita",scientificName:"Disulfuro de hierro",formula:"FeS₂",mohs:"6.5",group:"Sulfuros",formation:"Sedimentaria/hidrotermal",curiosity:"Llamada 'oro de los tontos' por su parecido al oro.",confidence:"alta"},image:null,expeditionId:"exp1",editHistory:[]},
];

const DEFAULT_EXPEDITIONS = [
  {id:"exp1",name:"Uruguay Norte 2026",date:"2025-08-19",location:"Salto y alrededores, Uruguay",notes:"Salida de tres días por el litoral norte.",color:"#c8a96e"},
];

// ─── STORAGE ─────────────────────────────────────────────────────────
const load = (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

// ─── SPLASH ──────────────────────────────────────────────────────────
function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = [setTimeout(()=>setPhase(1),300), setTimeout(()=>setPhase(2),1000), setTimeout(()=>setPhase(3),1800), setTimeout(()=>onDone(),2800)];
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <div style={{position:"fixed",inset:0,background:"#0d0a05",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:1000,transition:"opacity 0.6s",opacity:phase>=3?0:1,pointerEvents:phase>=3?"none":"all"}}>
      <style>{`@keyframes rockFloat{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-12px) rotate(3deg)}}@keyframes glowPulse{0%,100%{opacity:0.3}50%{opacity:0.8}}@keyframes barFill{from{width:0%}to{width:100%}}@keyframes shimmer{0%{background-position:-200px 0}100%{background-position:200px 0}}`}</style>
      <div style={{position:"absolute",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(200,169,110,0.12),transparent 70%)",animation:"glowPulse 2s ease-in-out infinite"}}/>
      <div style={{fontSize:72,marginBottom:24,animation:phase>=1?"rockFloat 3s ease-in-out infinite":"none",opacity:phase>=1?1:0,transform:phase>=1?"scale(1)":"scale(0.5)",transition:"all 0.5s"}}>🪨</div>
      <div style={{opacity:phase>=1?1:0,transform:phase>=1?"translateY(0)":"translateY(16px)",transition:"all 0.6s 0.2s",textAlign:"center",marginBottom:8}}>
        <div style={{fontFamily:"'Nunito',sans-serif",fontWeight:900,fontSize:42,fontStyle:"italic",letterSpacing:-2,background:"linear-gradient(135deg,#e8d9b8 30%,#c8a96e 70%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Petrario</div>
        <div style={{color:"#4a3a1a",fontSize:10,letterSpacing:4,marginTop:4,fontFamily:"'Nunito',sans-serif"}}>COLECCIÓN GEOLÓGICA</div>
      </div>
      <div style={{opacity:phase>=2?1:0,transition:"all 0.5s",color:"#6a5a3a",fontSize:12,fontStyle:"italic",fontFamily:"'Nunito',sans-serif",marginBottom:48}}>Cada piedra tiene una historia</div>
      <div style={{width:160,height:3,background:"rgba(200,169,110,0.1)",borderRadius:3,overflow:"hidden",opacity:phase>=2?1:0}}>
        <div style={{height:"100%",borderRadius:3,background:"linear-gradient(90deg,#c8a96e,#e8d9b8,#c8a96e)",backgroundSize:"200px 100%",animation:phase>=2?"barFill 1.4s ease-out forwards,shimmer 1.2s linear infinite":"none"}}/>
      </div>
    </div>
  );
}

// ─── LEAFLET MAP ─────────────────────────────────────────────────────
function LeafletMap({ specimens, onSelect, singleLocation }) {
  const ref = useRef(null); const inst = useRef(null);
  useEffect(() => {
    if (inst.current) return;
    const lnk = document.createElement("link"); lnk.rel="stylesheet"; lnk.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"; document.head.appendChild(lnk);
    const sc = document.createElement("script"); sc.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    sc.onload=()=>{
      const L=window.L; const data=singleLocation?[singleLocation]:specimens.filter(s=>s.lat&&s.lng);
      const center=data.length>0?[data[0].lat,data[0].lng]:[-35,-65];
      const map=L.map(ref.current,{zoomControl:true,scrollWheelZoom:true}).setView(center,singleLocation?10:4); inst.current=map;
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{attribution:"©OpenStreetMap ©CartoDB",maxZoom:19}).addTo(map);
      data.forEach(sp=>{
        if(!sp.lat||!sp.lng)return; const r=RARITY[sp.rarity]||RARITY.Común;
        const icon=L.divIcon({className:"",html:`<div style="background:${r.color};border:2px solid ${r.border};border-radius:50% 50% 50% 0;width:30px;height:30px;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 12px ${r.glow}"><span style="transform:rotate(45deg);font-size:14px">${getEmoji(sp.type)}</span></div>`,iconSize:[30,30],iconAnchor:[15,30]});
        const mk=L.marker([sp.lat,sp.lng],{icon}).addTo(map).bindPopup(`<div style="font-family:sans-serif;text-align:center;padding:4px"><b>${sp.name}</b><br><small>${sp.location||""}</small></div>`);
        if(onSelect) mk.on("click",()=>onSelect(sp.id));
      });
    };
    document.head.appendChild(sc);
  },[]);
  return <div ref={ref} style={{width:"100%",height:"100%",borderRadius:"inherit"}}/>;
}

// ─── MOHS BAR ────────────────────────────────────────────────────────
function MohsBar({ value }) {
  const v=parseFloat(value)||0;
  return(
    <div>
      <div style={{color:"#4a3a1a",fontSize:9,letterSpacing:1,marginBottom:10}}>ESCALA DE DUREZA MOHS</div>
      <div style={{display:"flex",gap:3,marginBottom:10}}>
        {MOHS_SCALE.map(m=>(<div key={m.n} title={`${m.n} — ${m.name}`} style={{flex:1}}><div style={{height:32,width:"100%",borderRadius:6,background:v>=m.n?m.color:"rgba(255,255,255,0.04)",border:Math.round(v)===m.n?`2px solid ${m.color}`:"1px solid rgba(255,255,255,0.06)",boxShadow:v>=m.n?`0 0 8px ${m.color}55`:"none",transition:"all 0.3s",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:v>=m.n?"#1a1a1a":"#3a2a10"}}>{m.n}</div></div>))}
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:10,color:"#4a3a1a"}}>Muy blando</span>
        <div style={{background:"rgba(200,169,110,0.1)",border:"1px solid rgba(200,169,110,0.3)",borderRadius:20,padding:"3px 12px",fontSize:12,fontWeight:800,color:"#c8a96e"}}>{MOHS_SCALE.find(m=>m.n===Math.round(v))?.name||"?"} — Mohs {value}</div>
        <span style={{fontSize:10,color:"#4a3a1a"}}>Diamante</span>
      </div>
      {MOHS_SCALE.find(m=>m.n===Math.round(v))&&<div style={{marginTop:8,color:"#9a8a6a",fontSize:11,textAlign:"center"}}>Referencia: <span style={{color:"#c8a96e"}}>{MOHS_SCALE.find(m=>m.n===Math.round(v))?.ref}</span></div>}
    </div>
  );
}

// ─── RARITY BADGE ────────────────────────────────────────────────────
function RarityBadge({ rarity, size="sm" }) {
  const r=RARITY[rarity]||RARITY.Común;
  return(<span style={{background:r.bg,border:`1px solid ${r.border}`,color:r.color,borderRadius:20,padding:size==="lg"?"4px 14px":"2px 9px",fontSize:size==="lg"?12:10,fontWeight:700,boxShadow:`0 0 8px ${r.glow}`,display:"inline-flex",alignItems:"center",gap:4}}><span style={{fontSize:size==="lg"?10:8}}>{"★".repeat(r.stars)+"☆".repeat(4-r.stars)}</span>{r.label}</span>);
}

// ─── PDF EXPORT ──────────────────────────────────────────────────────
function exportPDF(sp) {
  if (!window.jspdf) { const sc=document.createElement("script"); sc.src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"; sc.onload=()=>doExport(sp); document.head.appendChild(sc); } else { doExport(sp); }
}
function doExport(sp) {
  const {jsPDF}=window.jspdf; const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"}); const W=210,H=297; const r=RARITY[sp.rarity]||RARITY.Común;
  const hex2rgb=hex=>{const m=hex.replace("#","").match(/.{2}/g);return m?m.map(x=>parseInt(x,16)):[200,169,110];};
  const setFill=hex=>{const[r,g,b]=hex2rgb(hex);doc.setFillColor(r,g,b);};
  const setTextC=hex=>{const[r,g,b]=hex2rgb(hex);doc.setTextColor(r,g,b);};
  setFill("#0d0a05");doc.rect(0,0,W,H,"F");
  const[rc,gc,bc]=hex2rgb(r.color);doc.setFillColor(rc,gc,bc);doc.rect(0,0,W,6,"F");
  doc.setFillColor(20,16,8);doc.roundedRect(10,12,W-20,38,4,4,"F");
  doc.setFont("helvetica","bolditalic");doc.setFontSize(22);setTextC("#c8a96e");doc.text("Petrario",18,26);
  doc.setFont("helvetica","normal");doc.setFontSize(7);setTextC("#4a3a1a");doc.text("COLECCIÓN GEOLÓGICA PERSONAL",18,32);
  doc.setFont("helvetica","bold");doc.setFontSize(18);setTextC("#e8d9b8");doc.text(sp.name,18,44);
  doc.setFontSize(9);setTextC(r.color);doc.text("★".repeat(r.stars)+"☆".repeat(4-r.stars)+"  "+r.label.toUpperCase(),W-14,22,{align:"right"});
  doc.setFont("helvetica","normal");doc.setFontSize(8);setTextC("#9a8a6a");doc.text(sp.type?.toUpperCase()||"",W-14,30,{align:"right"});
  doc.setFontSize(48);doc.text(getEmoji(sp.type),W/2,75,{align:"center"});
  doc.setDrawColor(rc,gc,bc);doc.setLineWidth(0.3);doc.line(10,82,W-10,82);
  let y=90;
  if(sp.aiInfo?.identified){
    doc.setFillColor(25,20,10);doc.roundedRect(10,y-6,W-20,46,3,3,"F");doc.setDrawColor(rc,gc,bc);doc.setLineWidth(0.5);doc.roundedRect(10,y-6,W-20,46,3,3,"S");
    doc.setFont("helvetica","bold");doc.setFontSize(8);setTextC(r.color);doc.text("IDENTIFICACION CIENTIFICA",16,y);y+=7;
    const aiF=[["Nombre cientifico",sp.aiInfo.scientificName],["Formula",sp.aiInfo.formula?.replace(/[₀₁₂₃₄₅₆₇₈₉]/g,n=>"0123456789"["₀₁₂₃₄₅₆₇₈₉".indexOf(n)])],["Grupo",sp.aiInfo.group],["Formacion",sp.aiInfo.formation],["Confianza",sp.aiInfo.confidence]].filter(([,v])=>v);
    const half=Math.ceil(aiF.length/2);
    aiF.forEach(([l,v],i)=>{const col=i<half?0:1;const row=i<half?i:i-half;const x=col===0?16:W/2+4;doc.setFont("helvetica","normal");doc.setFontSize(7);setTextC("#4a3a1a");doc.text(l.toUpperCase(),x,y+row*10);doc.setFont("helvetica","bold");doc.setFontSize(9);setTextC("#e8d9b8");doc.text(String(v||""),x,y+row*10+5);});
    y+=half*10+6;
    if(sp.aiInfo.curiosity){doc.setFont("helvetica","italic");doc.setFontSize(8);setTextC("#6a5a3a");const lines=doc.splitTextToSize("Dato: "+sp.aiInfo.curiosity,W-32);doc.text(lines,16,y);y+=lines.length*5+4;}
  }
  y+=4;
  if(sp.aiInfo?.mohs){
    doc.setFillColor(20,16,8);doc.roundedRect(10,y,W-20,30,3,3,"F");
    doc.setFont("helvetica","bold");doc.setFontSize(7);setTextC("#4a3a1a");doc.text("ESCALA MOHS DE DUREZA",16,y+8);
    const v=parseFloat(sp.aiInfo.mohs)||0; const barW=(W-36)/10;
    MOHS_SCALE.forEach((m,i)=>{const bx=16+i*(barW+1);const by=y+12;const[mr,mg,mb]=hex2rgb(m.color);if(v>=m.n){doc.setFillColor(mr,mg,mb);}else{doc.setFillColor(30,24,12);}doc.roundedRect(bx,by,barW,8,1,1,"F");doc.setFont("helvetica","bold");doc.setFontSize(6);doc.setTextColor(v>=m.n?20:50,v>=m.n?16:40,v>=m.n?8:20);doc.text(String(m.n),bx+barW/2,by+5.5,{align:"center"});});
    doc.setFont("helvetica","bold");doc.setFontSize(9);setTextC("#c8a96e");doc.text(`Mohs ${sp.aiInfo.mohs}  —  ${MOHS_SCALE.find(m=>m.n===Math.round(v))?.name||""}`,W/2,y+26,{align:"center"});
    y+=34;
  }
  y+=4;
  const props=[["Color",sp.color],["Brillo",sp.luster],["Textura",sp.texture],["Tamano",sp.size?sp.size+" cm":null],["Peso",sp.weight?sp.weight+" g":null],["Fecha",sp.date]].filter(([,v])=>v);
  const cols=3; const cellW=(W-20)/cols;
  props.forEach(([l,v],i)=>{const col=i%cols;const row=Math.floor(i/cols);const cx=10+col*cellW;const cy=y+row*16;doc.setFillColor(18,14,7);doc.roundedRect(cx+1,cy,cellW-2,14,2,2,"F");doc.setFont("helvetica","normal");doc.setFontSize(6.5);setTextC("#4a3a1a");doc.text(l.toUpperCase(),cx+5,cy+5);doc.setFont("helvetica","bold");doc.setFontSize(8.5);setTextC("#e8d9b8");doc.text(String(v),cx+5,cy+11);});
  y+=Math.ceil(props.length/cols)*16+6;
  if(sp.location){doc.setFillColor(18,14,7);doc.roundedRect(10,y,W-20,14,2,2,"F");doc.setFont("helvetica","normal");doc.setFontSize(7);setTextC("#4a3a1a");doc.text("UBICACION",16,y+5);doc.setFont("helvetica","bold");doc.setFontSize(9);setTextC("#c8a96e");doc.text("* "+sp.location,16,y+11);y+=18;}
  if(sp.notes){doc.setFillColor(18,14,7);doc.roundedRect(10,y,W-20,22,2,2,"F");doc.setFont("helvetica","normal");doc.setFontSize(7);setTextC("#4a3a1a");doc.text("NOTAS",16,y+6);doc.setFont("helvetica","normal");doc.setFontSize(8);setTextC("#9a8a6a");const nl=doc.splitTextToSize(sp.notes,W-32);doc.text(nl.slice(0,2),16,y+13);}
  setFill("#0d0a05");doc.rect(0,H-14,W,14,"F");doc.setDrawColor(rc,gc,bc);doc.setLineWidth(0.2);doc.line(10,H-14,W-10,H-14);doc.setFont("helvetica","italic");doc.setFontSize(7);setTextC("#4a3a1a");doc.text("Petrario — Coleccion Geologica Personal",14,H-6);doc.text(`ID: ${sp.id}  Exportado: ${new Date().toLocaleDateString("es-AR")}`,W-14,H-6,{align:"right"});
  doc.save(`Petrario_${sp.name.replace(/\s+/g,"_")}.pdf`);
}

// ─── AI IDENTIFY ─────────────────────────────────────────────────────
async function identifySpecimen({ prompt, imageBase64, imageMimeType }) {
  const res = await fetch("/api/identify", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({prompt,imageBase64,imageMimeType}) });
  if (!res.ok) throw new Error("Error en identificación");
  return res.json();
}

// ─── SHARED UI ───────────────────────────────────────────────────────
const S = {
  inp: (ph,val,onChange,type="text") => (
    <input type={type} placeholder={ph} value={val} onChange={onChange}
      style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(200,169,110,0.15)",borderRadius:10,padding:"10px 13px",color:"#e8d9b8",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}
      onFocus={e=>e.target.style.borderColor="rgba(200,169,110,0.5)"} onBlur={e=>e.target.style.borderColor="rgba(200,169,110,0.15)"}/>
  ),
  sel: (val,opts,ph,onChange) => (
    <select value={val} onChange={onChange} style={{width:"100%",background:"#130f07",border:"1px solid rgba(200,169,110,0.15)",borderRadius:10,padding:"10px 13px",color:val?"#e8d9b8":"#4a3a1a",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}>
      <option value="" disabled>{ph}</option>{opts.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  ),
  lbl: t => <div style={{color:"#4a3a1a",fontSize:9,letterSpacing:1.2,marginBottom:5,marginTop:14}}>{t}</div>,
  backBtn: onClick => <button onClick={onClick} style={{background:"rgba(200,169,110,0.1)",border:"none",color:"#c8a96e",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:16,fontFamily:"inherit"}}>←</button>,
  card: (children, extra={}) => <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"10px 12px",...extra}}>{children}</div>,
};

// ─── SPECIMEN CARDS ───────────────────────────────────────────────────
function SpecimenCard({ sp, onClick }) {
  const r=RARITY[sp.rarity]||RARITY.Común;
  return(
    <div onClick={onClick} style={{background:"linear-gradient(135deg,rgba(20,16,8,0.98),rgba(15,12,5,0.98))",border:`1px solid ${r.border}`,borderRadius:16,padding:16,cursor:"pointer",transition:"all 0.25s",position:"relative",overflow:"hidden",boxShadow:`0 2px 16px ${r.glow}`}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 8px 24px ${r.glow}`;}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=`0 2px 16px ${r.glow}`;}}>
      <div style={{position:"absolute",top:-24,right:-24,fontSize:80,opacity:0.05}}>{getEmoji(sp.type)}</div>
      <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
        {sp.image?<img src={sp.image} alt={sp.name} style={{width:58,height:58,borderRadius:12,objectFit:"cover",flexShrink:0,border:`1px solid ${r.border}`}}/>
          :<div style={{width:58,height:58,borderRadius:12,background:r.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0,border:`1px solid ${r.border}`}}>{getEmoji(sp.type)}</div>}
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:4}}>
            <div style={{color:"#e8d9b8",fontWeight:800,fontSize:15,lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sp.name}</div>
            <RarityBadge rarity={sp.rarity}/>
          </div>
          <div style={{color:"#6a5a3a",fontSize:10,letterSpacing:1,marginBottom:6}}>{sp.type?.toUpperCase()}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {sp.color&&<span style={{background:"rgba(255,255,255,0.04)",color:"#7a6a4a",fontSize:10,padding:"2px 8px",borderRadius:20,border:"1px solid rgba(255,255,255,0.06)"}}>🎨 {sp.color}</span>}
            {sp.size&&<span style={{background:"rgba(255,255,255,0.04)",color:"#7a6a4a",fontSize:10,padding:"2px 8px",borderRadius:20,border:"1px solid rgba(255,255,255,0.06)"}}>📏 {sp.size}cm</span>}
            {sp.aiInfo?.mohs&&<span style={{background:"rgba(255,255,255,0.04)",color:"#7a6a4a",fontSize:10,padding:"2px 8px",borderRadius:20,border:"1px solid rgba(255,255,255,0.06)"}}>💪 {sp.aiInfo.mohs} Mohs</span>}
          </div>
        </div>
      </div>
      {sp.location&&<div style={{marginTop:10,display:"flex",alignItems:"center",gap:5,color:"#4a3a1a",fontSize:11}}><span>📍</span><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sp.location}</span></div>}
    </div>
  );
}

function GalleryCard({ sp, onClick }) {
  const r=RARITY[sp.rarity]||RARITY.Común;
  return(
    <div onClick={onClick} style={{aspectRatio:"1",borderRadius:16,overflow:"hidden",cursor:"pointer",border:`1px solid ${r.border}`,position:"relative",background:`linear-gradient(135deg,${r.bg},rgba(10,8,3,0.9))`,boxShadow:`0 2px 12px ${r.glow}`,transition:"all 0.2s"}}
      onMouseEnter={e=>e.currentTarget.style.transform="scale(1.04)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
      {sp.image?<img src={sp.image} alt={sp.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:42}}>{getEmoji(sp.type)}</div>}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(10,8,3,0.95) 0%,transparent 55%)"}}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"8px 10px"}}>
        <div style={{color:"#e8d9b8",fontWeight:800,fontSize:12,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sp.name}</div>
        <RarityBadge rarity={sp.rarity}/>
      </div>
    </div>
  );
}

// ─── STATS VIEW ───────────────────────────────────────────────────────
function StatsView({ specimens, onBack }) {
  const total = specimens.length;
  const withMohs = specimens.filter(s=>s.aiInfo?.mohs);
  const avgMohs = withMohs.length ? (withMohs.reduce((a,s)=>a+parseFloat(s.aiInfo.mohs),0)/withMohs.length).toFixed(1) : "—";
  const totalWeight = specimens.reduce((a,s)=>a+(parseFloat(s.weight)||0),0);

  const byType = ROCK_TYPES.map(t=>({label:t,count:specimens.filter(s=>s.type===t).length})).filter(x=>x.count>0).sort((a,b)=>b.count-a.count);
  const byRarity = Object.entries(RARITY).map(([k,r])=>({label:k,count:specimens.filter(s=>s.rarity===k).length,color:r.color,glow:r.glow}));
  const byMonth = specimens.reduce((acc,s)=>{if(!s.date)return acc;const m=s.date.slice(0,7);acc[m]=(acc[m]||0)+1;return acc;},{});
  const monthEntries = Object.entries(byMonth).sort().slice(-6);
  const maxMonth = Math.max(...monthEntries.map(([,v])=>v),1);

  const mohsDist = MOHS_SCALE.map(m=>({...m,count:withMohs.filter(s=>Math.round(parseFloat(s.aiInfo.mohs))===m.n).length}));

  const Section = ({title,children}) => (
    <div style={{marginBottom:20}}>
      <div style={{color:"#4a3a1a",fontSize:9,letterSpacing:2,marginBottom:12}}>{title}</div>
      {children}
    </div>
  );

  return(
    <div style={{height:"100%",overflowY:"auto",padding:"20px 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        {S.backBtn(onBack)}
        <h2 style={{margin:0,color:"#e8d9b8",fontSize:18,fontWeight:800}}>Estadísticas</h2>
      </div>

      {/* Top stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:24}}>
        {[{v:total,l:"Especímenes",i:"🪨"},{v:avgMohs,l:"Mohs prom.",i:"💪"},{v:totalWeight>0?`${(totalWeight/1000).toFixed(1)}kg`:"—",l:"Peso total",i:"⚖️"}].map(({v,l,i})=>(
          <div key={l} style={{background:"rgba(200,169,110,0.06)",border:"1px solid rgba(200,169,110,0.12)",borderRadius:14,padding:"14px 10px",textAlign:"center"}}>
            <div style={{fontSize:22,marginBottom:4}}>{i}</div>
            <div style={{fontSize:20,fontWeight:900,color:"#c8a96e",lineHeight:1}}>{v}</div>
            <div style={{fontSize:9,color:"#4a3a1a",letterSpacing:0.8,marginTop:3}}>{l.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <Section title="POR RAREZA">
        {byRarity.map(({label,count,color,glow})=>{
          const pct=total?Math.round(count/total*100):0;
          return(
            <div key={label} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{color,fontSize:12,fontWeight:700}}>{label}</span>
                <span style={{color:"#6a5a3a",fontSize:12}}>{count} <span style={{color:"#4a3a1a",fontSize:10}}>({pct}%)</span></span>
              </div>
              <div style={{height:8,background:"rgba(255,255,255,0.04)",borderRadius:4,overflow:"hidden"}}>
                <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${color}66,${color})`,borderRadius:4,boxShadow:`0 0 8px ${glow}`,transition:"width 0.8s"}}/>
              </div>
            </div>
          );
        })}
      </Section>

      <Section title="DISTRIBUCIÓN MOHS">
        <div style={{display:"flex",gap:3,alignItems:"flex-end",height:60,marginBottom:8}}>
          {mohsDist.map(m=>{
            const pct=m.count>0?(m.count/Math.max(...mohsDist.map(x=>x.count),1))*100:0;
            return(
              <div key={m.n} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{fontSize:9,color:m.count>0?m.color:"#3a2a10",fontWeight:700}}>{m.count||""}</div>
                <div style={{width:"100%",height:`${Math.max(pct,4)}%`,background:m.count>0?m.color:"rgba(255,255,255,0.04)",borderRadius:"3px 3px 0 0",minHeight:3,boxShadow:m.count>0?`0 0 8px ${m.color}55`:"none",transition:"height 0.6s"}}/>
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:3}}>
          {mohsDist.map(m=><div key={m.n} style={{flex:1,textAlign:"center",fontSize:8,color:"#4a3a1a"}}>{m.n}</div>)}
        </div>
      </Section>

      <Section title="TIPO DE ROCA (top)">
        {byType.slice(0,6).map(({label,count})=>{
          const pct=Math.round(count/total*100);
          return(
            <div key={label} style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{color:"#9a8a6a",fontSize:11}}>{label}</span>
                <span style={{color:"#6a5a3a",fontSize:11}}>{count}</span>
              </div>
              <div style={{height:5,background:"rgba(255,255,255,0.04)",borderRadius:3,overflow:"hidden"}}>
                <div style={{width:`${pct}%`,height:"100%",background:"linear-gradient(90deg,rgba(200,169,110,0.4),rgba(200,169,110,0.8))",borderRadius:3}}/>
              </div>
            </div>
          );
        })}
      </Section>

      {monthEntries.length>0&&(
        <Section title="HALLAZGOS POR MES (últimos 6)">
          <div style={{display:"flex",gap:6,alignItems:"flex-end",height:70}}>
            {monthEntries.map(([m,count])=>{
              const pct=(count/maxMonth)*100;
              const label=m.slice(5)+"/"+m.slice(2,4);
              return(
                <div key={m} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <div style={{fontSize:9,color:"#c8a96e",fontWeight:700}}>{count}</div>
                  <div style={{width:"100%",background:"linear-gradient(180deg,#c8a96e,#8b6914)",borderRadius:"3px 3px 0 0",height:`${Math.max(pct,8)}%`,minHeight:4,boxShadow:"0 0 8px rgba(200,169,110,0.3)"}}/>
                  <div style={{fontSize:8,color:"#4a3a1a",textAlign:"center"}}>{label}</div>
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}

// ─── EXPEDITIONS VIEW ────────────────────────────────────────────────
function ExpeditionsView({ expeditions, specimens, onBack, onSave, onDelete, onSelectExpedition }) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({name:"",date:new Date().toISOString().split("T")[0],location:"",notes:"",color:"#c8a96e"});
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const COLORS_EXP = ["#c8a96e","#6aa8c8","#c86aa0","#8a9a7a","#c8786a","#a06ac8"];

  const handleCreate = () => {
    if (!form.name) return;
    onSave({...form, id:"exp"+Date.now()});
    setForm({name:"",date:new Date().toISOString().split("T")[0],location:"",notes:"",color:"#c8a96e"});
    setCreating(false);
  };

  return(
    <div style={{height:"100%",overflowY:"auto",padding:"20px 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        {S.backBtn(onBack)}
        <h2 style={{margin:0,color:"#e8d9b8",fontSize:18,fontWeight:800}}>Expediciones</h2>
        <button onClick={()=>setCreating(!creating)} style={{marginLeft:"auto",background:"linear-gradient(135deg,#c8a96e,#8b6914)",border:"none",color:"#1a140a",borderRadius:10,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:800,fontFamily:"inherit"}}>
          {creating?"✕ Cancelar":"＋ Nueva"}
        </button>
      </div>

      {creating&&(
        <div style={{background:"rgba(200,169,110,0.06)",border:"1px solid rgba(200,169,110,0.2)",borderRadius:16,padding:16,marginBottom:20}}>
          <div style={{color:"#c8a96e",fontSize:10,fontWeight:700,letterSpacing:1,marginBottom:12}}>NUEVA EXPEDICIÓN</div>
          {S.lbl("NOMBRE *")}{S.inp("ej: Costa Patagónica 2026",form.name,e=>set("name",e.target.value))}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>{S.lbl("FECHA")}{S.inp("",form.date,e=>set("date",e.target.value),"date")}</div>
            <div>
              {S.lbl("COLOR")}
              <div style={{display:"flex",gap:6,paddingTop:6}}>
                {COLORS_EXP.map(c=>(
                  <div key={c} onClick={()=>set("color",c)} style={{width:24,height:24,borderRadius:"50%",background:c,cursor:"pointer",border:form.color===c?"3px solid #e8d9b8":"3px solid transparent",boxShadow:form.color===c?"0 0 8px "+c:"none"}}/>
                ))}
              </div>
            </div>
          </div>
          {S.lbl("LUGAR")}{S.inp("ej: Ushuaia, Tierra del Fuego",form.location,e=>set("location",e.target.value))}
          {S.lbl("NOTAS")}
          <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Descripción de la salida..." style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(200,169,110,0.15)",borderRadius:10,padding:"10px 13px",color:"#e8d9b8",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",minHeight:70,resize:"vertical"}}/>
          <button onClick={handleCreate} disabled={!form.name} style={{width:"100%",marginTop:12,background:form.name?"linear-gradient(135deg,#c8a96e,#8b6914)":"rgba(200,169,110,0.2)",color:"#1a140a",border:"none",borderRadius:10,padding:"11px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>✓ Crear Expedición</button>
        </div>
      )}

      {expeditions.length===0&&!creating&&(
        <div style={{textAlign:"center",padding:48,color:"#4a3a1a"}}>
          <div style={{fontSize:48,marginBottom:12}}>🧭</div>
          <div style={{fontSize:14,color:"#6a5a3a",marginBottom:6}}>Sin expediciones</div>
          <div style={{fontSize:12}}>Creá una salida de campo para agrupar hallazgos</div>
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {expeditions.map(exp=>{
          const count=specimens.filter(s=>s.expeditionId===exp.id).length;
          return(
            <div key={exp.id} style={{background:"rgba(15,12,5,0.98)",border:`1px solid ${exp.color}44`,borderRadius:16,overflow:"hidden",cursor:"pointer"}} onClick={()=>onSelectExpedition(exp)}>
              <div style={{height:4,background:exp.color}}/>
              <div style={{padding:16}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8}}>
                  <div>
                    <div style={{color:"#e8d9b8",fontWeight:800,fontSize:15,marginBottom:3}}>{exp.name}</div>
                    <div style={{color:"#4a3a1a",fontSize:11}}>📅 {exp.date}{exp.location&&` · 📍 ${exp.location}`}</div>
                  </div>
                  <div style={{background:`${exp.color}22`,border:`1px solid ${exp.color}55`,borderRadius:20,padding:"4px 12px",color:exp.color,fontSize:12,fontWeight:700,flexShrink:0}}>
                    {count} {count===1?"hallazgo":"hallazgos"}
                  </div>
                </div>
                {exp.notes&&<div style={{color:"#6a5a3a",fontSize:12,fontStyle:"italic",lineHeight:1.5}}>{exp.notes}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── EXPEDITION DETAIL ───────────────────────────────────────────────
function ExpeditionDetail({ expedition, specimens, onBack, onDelete, onSelectSpecimen }) {
  const related = specimens.filter(s=>s.expeditionId===expedition.id);
  return(
    <div style={{height:"100%",overflowY:"auto",padding:"20px 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        {S.backBtn(onBack)}
        <h2 style={{margin:0,color:"#e8d9b8",fontSize:17,fontWeight:800,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{expedition.name}</h2>
        <button onClick={()=>onDelete(expedition.id)} style={{background:"rgba(200,60,60,0.1)",border:"1px solid rgba(200,60,60,0.2)",color:"#c85a5a",borderRadius:10,padding:"6px 10px",cursor:"pointer",fontSize:12}}>✕</button>
      </div>
      <div style={{height:6,background:expedition.color,borderRadius:3,marginBottom:16}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        {[["📅","Fecha",expedition.date],["📍","Lugar",expedition.location],["🪨","Hallazgos",`${related.length} especímenes`]].filter(([,,v])=>v).map(([ic,l,v])=>(
          <div key={l} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"10px 12px"}}>
            <div style={{color:"#4a3a1a",fontSize:9,letterSpacing:1,marginBottom:3}}>{l.toUpperCase()}</div>
            <div style={{color:"#e8d9b8",fontSize:12,fontWeight:600}}>{ic} {v}</div>
          </div>
        ))}
      </div>
      {expedition.notes&&<div style={{background:"rgba(255,255,255,0.03)",borderRadius:12,padding:14,marginBottom:16}}><div style={{color:"#4a3a1a",fontSize:9,letterSpacing:1,marginBottom:6}}>NOTAS</div><div style={{color:"#9a8a6a",fontSize:13,lineHeight:1.6}}>{expedition.notes}</div></div>}
      <div style={{color:"#4a3a1a",fontSize:9,letterSpacing:2,marginBottom:12}}>ESPECÍMENES HALLADOS</div>
      {related.length===0
        ?<div style={{textAlign:"center",padding:32,color:"#4a3a1a"}}><div style={{fontSize:36,marginBottom:8}}>🪨</div><div>Sin especímenes asociados aún</div></div>
        :<div style={{display:"flex",flexDirection:"column",gap:10}}>{related.map(sp=><SpecimenCard key={sp.id} sp={sp} onClick={()=>onSelectSpecimen(sp)}/>)}</div>}
    </div>
  );
}

// ─── COMPARE VIEW ────────────────────────────────────────────────────
function CompareView({ specimens, onBack }) {
  const [a,setA]=useState(specimens[0]?.id||"");
  const [b,setB]=useState(specimens[1]?.id||"");
  const sa=specimens.find(s=>s.id===a), sb=specimens.find(s=>s.id===b);
  const Sel=(val,set)=>(<select value={val} onChange={e=>set(e.target.value)} style={{width:"100%",background:"#1a140a",border:"1px solid rgba(200,169,110,0.2)",borderRadius:10,padding:"9px 12px",color:"#e8d9b8",fontSize:12,fontFamily:"inherit",outline:"none"}}>{specimens.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>);
  const Row=({label,va,vb,highlight})=>{const win=highlight?(parseFloat(va)>parseFloat(vb)?'a':parseFloat(vb)>parseFloat(va)?'b':'tie'):null;return(<div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}><div style={{textAlign:"right",color:win==='a'?"#c8a96e":"#e8d9b8",fontWeight:win==='a'?700:400,fontSize:13}}>{va||"—"}{win==='a'&&" 🏆"}</div><div style={{textAlign:"center",color:"#4a3a1a",fontSize:9,letterSpacing:0.8,minWidth:70}}>{label}</div><div style={{textAlign:"left",color:win==='b'?"#c8a96e":"#e8d9b8",fontWeight:win==='b'?700:400,fontSize:13}}>{win==='b'&&"🏆 "}{vb||"—"}</div></div>);};
  return(
    <div style={{height:"100%",overflowY:"auto",padding:"20px 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>{S.backBtn(onBack)}<h2 style={{margin:0,color:"#e8d9b8",fontSize:18,fontWeight:800}}>Comparar</h2></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}><div>{Sel(a,setA)}</div><div>{Sel(b,setB)}</div></div>
      {sa&&sb&&(<>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>{[sa,sb].map(sp=>{const r=RARITY[sp.rarity]||RARITY.Común;return(<div key={sp.id} style={{background:r.bg,border:`1px solid ${r.border}`,borderRadius:14,padding:14,textAlign:"center"}}><div style={{fontSize:36,marginBottom:8}}>{getEmoji(sp.type)}</div><div style={{color:"#e8d9b8",fontWeight:800,fontSize:13,marginBottom:6}}>{sp.name}</div><RarityBadge rarity={sp.rarity}/></div>);})}</div>
        <div style={{background:"rgba(200,169,110,0.04)",border:"1px solid rgba(200,169,110,0.1)",borderRadius:14,padding:16}}>
          <Row label="TIPO" va={sa.type} vb={sb.type}/><Row label="MOHS" va={sa.aiInfo?.mohs} vb={sb.aiInfo?.mohs} highlight/><Row label="TAMAÑO cm" va={sa.size} vb={sb.size} highlight/><Row label="PESO g" va={sa.weight} vb={sb.weight} highlight/><Row label="COLOR" va={sa.color} vb={sb.color}/><Row label="BRILLO" va={sa.luster} vb={sb.luster}/><Row label="RAREZA" va={sa.rarity} vb={sb.rarity}/>
        </div>
        {(sa.aiInfo?.mohs&&sb.aiInfo?.mohs)&&(<div style={{marginTop:16}}>{[sa,sb].map(sp=>{const v=parseFloat(sp.aiInfo?.mohs)||0;const r=RARITY[sp.rarity]||RARITY.Común;return(<div key={sp.id} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{color:"#9a8a6a",fontSize:11}}>{sp.name}</span><span style={{color:r.color,fontSize:11,fontWeight:700}}>Mohs {sp.aiInfo.mohs}</span></div><div style={{height:8,background:"rgba(255,255,255,0.05)",borderRadius:4,overflow:"hidden"}}><div style={{width:`${v*10}%`,height:"100%",background:`linear-gradient(90deg,${r.color}88,${r.color})`,borderRadius:4}}/></div></div>);})}</div>)}
      </>)}
    </div>
  );
}

// ─── DETAIL VIEW ──────────────────────────────────────────────────────
function DetailView({ sp, onBack, onDelete, onUpdate, expeditions }) {
  const [showMap, setShowMap] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editForm, setEditForm] = useState({...sp});
  const r = RARITY[sp.rarity]||RARITY.Común;
  const setF = (k,v) => setEditForm(f=>({...f,[k]:v}));
  const expedition = expeditions.find(e=>e.id===sp.expeditionId);

  const handleUpdate = () => {
    const changed = [];
    const fields = {name:"Nombre",type:"Tipo",rarity:"Rareza",color:"Color",luster:"Brillo",texture:"Textura",size:"Tamaño",weight:"Peso",location:"Ubicación",notes:"Notas",expeditionId:"Expedición"};
    Object.entries(fields).forEach(([k,label])=>{ if(String(editForm[k]||"")!==String(sp[k]||"")) changed.push(label); });
    if (changed.length===0) { setEditing(false); return; }
    const entry = { date: new Date().toISOString(), changed, snapshot: {...sp} };
    onUpdate({...editForm, editHistory:[entry,...(sp.editHistory||[])]});
    setEditing(false);
  };

  const inp2=(ph,k,type="text")=>(<input type={type} placeholder={ph} value={editForm[k]||""} onChange={e=>setF(k,e.target.value)} style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(200,169,110,0.15)",borderRadius:10,padding:"9px 12px",color:"#e8d9b8",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>);
  const sel2=(k,opts,ph)=>(<select value={editForm[k]||""} onChange={e=>setF(k,e.target.value)} style={{width:"100%",background:"#130f07",border:"1px solid rgba(200,169,110,0.15)",borderRadius:10,padding:"9px 12px",color:editForm[k]?"#e8d9b8":"#4a3a1a",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}><option value="">{ph}</option>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select>);

  return(
    <div style={{height:"100%",overflowY:"auto",padding:"20px 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {S.backBtn(onBack)}
        <h2 style={{margin:0,color:"#e8d9b8",fontSize:17,fontWeight:900,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sp.name}</h2>
        <button onClick={()=>setEditing(!editing)} style={{background:editing?"rgba(200,169,110,0.2)":"rgba(200,169,110,0.1)",border:"1px solid rgba(200,169,110,0.25)",color:"#c8a96e",borderRadius:10,padding:"6px 11px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit"}}>{editing?"✕":"✏️ Editar"}</button>
        <button onClick={()=>{setExporting(true);setTimeout(()=>{exportPDF(sp);setExporting(false);},200);}} disabled={exporting} style={{background:"rgba(200,169,110,0.1)",border:"1px solid rgba(200,169,110,0.25)",color:"#c8a96e",borderRadius:10,padding:"6px 11px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit"}}>{exporting?"...":"📄"}</button>
        <button onClick={()=>onDelete(sp.id)} style={{background:"rgba(200,60,60,0.1)",border:"1px solid rgba(200,60,60,0.2)",color:"#c85a5a",borderRadius:10,padding:"6px 10px",cursor:"pointer",fontSize:12}}>✕</button>
      </div>

      {/* EDIT MODE */}
      {editing ? (
        <div style={{background:"rgba(200,169,110,0.06)",border:"1px solid rgba(200,169,110,0.2)",borderRadius:16,padding:16,marginBottom:16}}>
          <div style={{color:"#c8a96e",fontSize:10,fontWeight:700,letterSpacing:1,marginBottom:12}}>✏️ EDITANDO ESPÉCIMEN</div>
          {S.lbl("NOMBRE")}{inp2("Nombre","name")}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>{S.lbl("TIPO")}{sel2("type",ROCK_TYPES,"Tipo")}</div>
            <div>{S.lbl("RAREZA")}{sel2("rarity",Object.keys(RARITY),"Rareza")}</div>
            <div>{S.lbl("COLOR")}{sel2("color",COLORS,"Color")}</div>
            <div>{S.lbl("BRILLO")}{sel2("luster",LUSTER,"Brillo")}</div>
            <div>{S.lbl("TAMAÑO cm")}{inp2("cm","size","number")}</div>
            <div>{S.lbl("PESO g")}{inp2("g","weight","number")}</div>
          </div>
          {S.lbl("UBICACIÓN")}{inp2("Lugar","location")}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>{S.lbl("LATITUD")}{inp2("lat","lat","number")}</div>
            <div>{S.lbl("LONGITUD")}{inp2("lng","lng","number")}</div>
          </div>
          {S.lbl("EXPEDICIÓN")}
          <select value={editForm.expeditionId||""} onChange={e=>setF("expeditionId",e.target.value||null)} style={{width:"100%",background:"#130f07",border:"1px solid rgba(200,169,110,0.15)",borderRadius:10,padding:"9px 12px",color:"#e8d9b8",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}>
            <option value="">Sin expedición</option>
            {expeditions.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          {S.lbl("NOTAS")}
          <textarea value={editForm.notes||""} onChange={e=>setF("notes",e.target.value)} style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(200,169,110,0.15)",borderRadius:10,padding:"10px 13px",color:"#e8d9b8",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",minHeight:70,resize:"vertical"}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:12}}>
            <button onClick={()=>setEditing(false)} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"#9a8a6a",borderRadius:10,padding:"10px",cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>Cancelar</button>
            <button onClick={handleUpdate} style={{background:"linear-gradient(135deg,#c8a96e,#8b6914)",border:"none",color:"#1a140a",borderRadius:10,padding:"10px",cursor:"pointer",fontWeight:800,fontFamily:"inherit"}}>✓ Guardar</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{borderRadius:18,overflow:"hidden",marginBottom:16,height:200,background:r.bg,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${r.border}`,boxShadow:`0 0 30px ${r.glow}`}}>
            {sp.image?<img src={sp.image} alt={sp.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:86}}>{getEmoji(sp.type)}</span>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}><RarityBadge rarity={sp.rarity} size="lg"/><span style={{color:"#6a5a3a",fontSize:10,letterSpacing:1}}>{sp.type?.toUpperCase()}</span></div>

          {expedition&&(
            <div style={{background:`${expedition.color}15`,border:`1px solid ${expedition.color}44`,borderRadius:12,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:16}}>🧭</span>
              <div><div style={{color:expedition.color,fontWeight:700,fontSize:12}}>{expedition.name}</div><div style={{color:"#6a5a3a",fontSize:11}}>{expedition.date}</div></div>
            </div>
          )}

          {sp.aiInfo?.identified&&(
            <div style={{background:`linear-gradient(135deg,${r.bg},rgba(0,0,0,0.3))`,border:`1px solid ${r.border}`,borderRadius:16,padding:16,marginBottom:16}}>
              <div style={{color:r.color,fontWeight:700,fontSize:10,letterSpacing:1,marginBottom:12}}>✨ IDENTIFICACIÓN</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                {[["Nombre científico",sp.aiInfo.scientificName],["Fórmula",sp.aiInfo.formula],["Grupo",sp.aiInfo.group],["Formación",sp.aiInfo.formation],["Confianza",sp.aiInfo.confidence]].filter(([,v])=>v).map(([l,v])=>(<div key={l}><div style={{color:"#4a3a1a",fontSize:9,letterSpacing:1,marginBottom:2}}>{l.toUpperCase()}</div><div style={{color:"#e8d9b8",fontSize:12,fontWeight:600}}>{v}</div></div>))}
              </div>
              {sp.aiInfo.curiosity&&<div style={{padding:"10px 12px",background:"rgba(0,0,0,0.2)",borderRadius:10,color:"#9a8a6a",fontSize:12,fontStyle:"italic",lineHeight:1.5}}>💡 {sp.aiInfo.curiosity}</div>}
            </div>
          )}
          {sp.aiInfo?.mohs&&(<div style={{background:"rgba(200,169,110,0.04)",border:"1px solid rgba(200,169,110,0.1)",borderRadius:16,padding:16,marginBottom:16}}><MohsBar value={sp.aiInfo.mohs}/></div>)}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            {[["🎨","Color",sp.color],["✦","Brillo",sp.luster],["📏","Tamaño",sp.size?`${sp.size} cm`:null],["⚖️","Peso",sp.weight?`${sp.weight} g`:null],["◈","Textura",sp.texture],["📅","Fecha",sp.date]].filter(([,,v])=>v).map(([ic,l,v])=>(<div key={l} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"10px 12px"}}><div style={{color:"#4a3a1a",fontSize:9,letterSpacing:1,marginBottom:3}}>{l.toUpperCase()}</div><div style={{color:"#e8d9b8",fontSize:13,fontWeight:600}}>{ic} {v}</div></div>))}
          </div>
          {sp.location&&(
            <div style={{marginBottom:16}}>
              <div style={{color:"#4a3a1a",fontSize:9,letterSpacing:1,marginBottom:6}}>UBICACIÓN</div>
              <div style={{color:"#c8a96e",fontSize:13,marginBottom:8}}>📍 {sp.location}</div>
              {sp.lat&&sp.lng&&(<><button onClick={()=>setShowMap(!showMap)} style={{background:"rgba(200,169,110,0.1)",border:"1px solid rgba(200,169,110,0.2)",color:"#c8a96e",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:12,marginBottom:showMap?10:0,fontFamily:"inherit"}}>{showMap?"Ocultar mapa":"🗺️ Ver en mapa"}</button>{showMap&&<div style={{height:220,borderRadius:14,overflow:"hidden"}}><LeafletMap specimens={[]} singleLocation={sp}/></div>}</>)}
            </div>
          )}
          {sp.notes&&<div style={{background:"rgba(255,255,255,0.03)",borderRadius:12,padding:14,marginBottom:16}}><div style={{color:"#4a3a1a",fontSize:9,letterSpacing:1,marginBottom:6}}>NOTAS</div><div style={{color:"#9a8a6a",fontSize:13,lineHeight:1.6}}>{sp.notes}</div></div>}

          {/* Edit History */}
          {sp.editHistory?.length>0&&(
            <div style={{marginBottom:16}}>
              <button onClick={()=>setShowHistory(!showHistory)} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"8px 14px",cursor:"pointer",color:"#6a5a3a",fontSize:11,fontFamily:"inherit",width:"100%",textAlign:"left"}}>
                🕐 Historial de ediciones ({sp.editHistory.length}) {showHistory?"▲":"▼"}
              </button>
              {showHistory&&(
                <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:6}}>
                  {sp.editHistory.map((entry,i)=>(
                    <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,padding:"10px 12px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{color:"#c8a96e",fontSize:11,fontWeight:700}}>Edición #{sp.editHistory.length-i}</span>
                        <span style={{color:"#4a3a1a",fontSize:10}}>{new Date(entry.date).toLocaleString("es-AR",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"})}</span>
                      </div>
                      <div style={{color:"#6a5a3a",fontSize:11}}>Campos modificados: <span style={{color:"#9a8a6a"}}>{entry.changed.join(", ")}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── ADD FORM ─────────────────────────────────────────────────────────
function AddForm({ onSave, onBack, expeditions }) {
  const [form,setForm]=useState({name:"",type:"",rarity:"Común",color:"",luster:"",texture:"",size:"",weight:"",location:"",lat:"",lng:"",date:new Date().toISOString().split("T")[0],notes:"",expeditionId:""});
  const [imageFile,setImageFile]=useState(null);
  const [imagePreview,setImagePreview]=useState(null);
  const [aiInfo,setAiInfo]=useState(null);
  const [aiLoading,setAiLoading]=useState(false);
  const [aiPrompt,setAiPrompt]=useState("");
  const fileRef=useRef();
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const handleImage=e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=ev=>{setImagePreview(ev.target.result);setImageFile({type:file.type,base64:ev.target.result.split(",")[1]});};reader.readAsDataURL(file);};
  const identify=async()=>{
    setAiLoading(true);
    try{
      const result=await identifySpecimen(imageFile?{imageBase64:imageFile.base64,imageMimeType:imageFile.type}:{prompt:aiPrompt});
      setAiInfo(result);
      if(result.name&&!form.name)set("name",result.name);
      if(result.color&&!form.color)set("color",result.color);
      if(result.luster&&!form.luster)set("luster",result.luster);
    }catch{setAiInfo({identified:false});}
    setAiLoading(false);
  };
  const handleSave=()=>{if(!form.name||!form.type)return;onSave({...form,id:Date.now().toString(),lat:parseFloat(form.lat)||null,lng:parseFloat(form.lng)||null,image:imagePreview,aiInfo,editHistory:[],expeditionId:form.expeditionId||null});};

  return(
    <div style={{height:"100%",overflowY:"auto",padding:"20px 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>{S.backBtn(onBack)}<h2 style={{margin:0,color:"#e8d9b8",fontSize:18,fontWeight:800}}>Nuevo Espécimen</h2></div>
      <div onClick={()=>fileRef.current.click()} style={{height:150,borderRadius:16,border:"2px dashed rgba(200,169,110,0.2)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden"}}>
        {imagePreview?<img src={imagePreview} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{textAlign:"center",color:"#4a3a1a"}}><div style={{fontSize:32,marginBottom:8}}>📷</div><div style={{fontSize:12}}>Tocá para agregar foto</div></div>}
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{display:"none"}}/>
      <div style={{background:"rgba(200,169,110,0.06)",border:"1px solid rgba(200,169,110,0.2)",borderRadius:14,padding:14,marginTop:14}}>
        <div style={{color:"#c8a96e",fontSize:10,fontWeight:700,letterSpacing:1,marginBottom:10}}>✨ IDENTIFICAR CON IA</div>
        {!imageFile&&<input value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} placeholder="Describí la roca o mineral..." style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(200,169,110,0.15)",borderRadius:8,padding:"8px 12px",color:"#e8d9b8",fontSize:12,fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:8}}/>}
        <button onClick={identify} disabled={aiLoading||(!aiPrompt&&!imageFile)} style={{background:aiLoading?"rgba(200,169,110,0.2)":"linear-gradient(135deg,#c8a96e,#8b6914)",color:"#1a140a",border:"none",borderRadius:8,padding:"7px 16px",fontWeight:700,fontSize:11,cursor:"pointer",opacity:(!aiPrompt&&!imageFile)?0.4:1,fontFamily:"inherit"}}>{aiLoading?"Analizando...":"✨ Identificar"}</button>
        {aiInfo?.identified&&(<div style={{marginTop:10,padding:10,background:"rgba(200,169,110,0.08)",borderRadius:8}}><div style={{color:"#c8a96e",fontWeight:700,fontSize:12}}>{aiInfo.name}</div>{aiInfo.scientificName&&<div style={{color:"#9a8a6a",fontSize:11,marginBottom:6}}>{aiInfo.scientificName}</div>}<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{aiInfo.mohs&&<span style={{background:"rgba(200,169,110,0.1)",color:"#c8a96e",fontSize:10,padding:"2px 8px",borderRadius:20}}>Mohs {aiInfo.mohs}</span>}{aiInfo.formula&&<span style={{background:"rgba(200,169,110,0.1)",color:"#c8a96e",fontSize:10,padding:"2px 8px",borderRadius:20}}>{aiInfo.formula}</span>}</div>{aiInfo.curiosity&&<div style={{color:"#6a5a3a",fontSize:11,marginTop:6,fontStyle:"italic"}}>💡 {aiInfo.curiosity}</div>}</div>)}
      </div>
      {S.lbl("NOMBRE *")}{S.inp("ej: Cuarzo ahumado",form.name,e=>set("name",e.target.value))}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div>{S.lbl("TIPO *")}{S.sel(form.type,ROCK_TYPES,"Seleccioná",e=>set("type",e.target.value))}</div>
        <div>{S.lbl("RAREZA")}{S.sel(form.rarity,Object.keys(RARITY),"Rareza",e=>set("rarity",e.target.value))}</div>
        <div>{S.lbl("COLOR")}{S.sel(form.color,COLORS,"Color",e=>set("color",e.target.value))}</div>
        <div>{S.lbl("BRILLO")}{S.sel(form.luster,LUSTER,"Brillo",e=>set("luster",e.target.value))}</div>
        <div>{S.lbl("TEXTURA")}{S.sel(form.texture,TEXTURE,"Textura",e=>set("texture",e.target.value))}</div>
        <div>{S.lbl("FECHA")}{S.inp("",form.date,e=>set("date",e.target.value),"date")}</div>
        <div>{S.lbl("TAMAÑO cm")}{S.inp("ej: 7.5",form.size,e=>set("size",e.target.value),"number")}</div>
        <div>{S.lbl("PESO g")}{S.inp("ej: 420",form.weight,e=>set("weight",e.target.value),"number")}</div>
      </div>
      {S.lbl("LUGAR DE HALLAZGO")}{S.inp("ej: Canal Beagle, Ushuaia",form.location,e=>set("location",e.target.value))}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div>{S.lbl("LATITUD")}{S.inp("ej: -54.8",form.lat,e=>set("lat",e.target.value),"number")}</div>
        <div>{S.lbl("LONGITUD")}{S.inp("ej: -68.3",form.lng,e=>set("lng",e.target.value),"number")}</div>
      </div>
      {expeditions.length>0&&(<>{S.lbl("EXPEDICIÓN")}<select value={form.expeditionId} onChange={e=>set("expeditionId",e.target.value)} style={{width:"100%",background:"#130f07",border:"1px solid rgba(200,169,110,0.15)",borderRadius:10,padding:"10px 13px",color:"#e8d9b8",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}><option value="">Sin expedición</option>{expeditions.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></>)}
      {S.lbl("NOTAS")}<textarea value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Observaciones..." style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(200,169,110,0.15)",borderRadius:10,padding:"10px 13px",color:"#e8d9b8",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",minHeight:80,resize:"vertical"}}/>
      <button onClick={handleSave} disabled={!form.name||!form.type} style={{width:"100%",marginTop:20,background:(!form.name||!form.type)?"rgba(200,169,110,0.2)":"linear-gradient(135deg,#c8a96e,#8b6914)",color:"#1a140a",border:"none",borderRadius:12,padding:14,fontWeight:800,fontSize:14,cursor:"pointer",letterSpacing:1,fontFamily:"inherit"}}>✓ Guardar Espécimen</button>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────
export default function Petrario() {
  const [splash,setSplash]=useState(true);
  const [screen,setScreen]=useState("home");
  const [specimens,setSpecimens]=useState(()=>load("petrario_specimens",DEFAULT_SPECIMENS));
  const [expeditions,setExpeditions]=useState(()=>load("petrario_expeditions",DEFAULT_EXPEDITIONS));
  const [selected,setSelected]=useState(null);
  const [selectedExp,setSelectedExp]=useState(null);
  const [search,setSearch]=useState("");
  const [filterRarity,setFilterRarity]=useState("");
  const [viewMode,setViewMode]=useState("list");
  const [mohsMin,setMohsMin]=useState(1);
  const [mohsMax,setMohsMax]=useState(10);
  const [mohsActive,setMohsActive]=useState(false);

  const saveSpecimens = list => { save("petrario_specimens",list); setSpecimens(list); };
  const saveExpeditions = list => { save("petrario_expeditions",list); setExpeditions(list); };

  const handleSave = sp => { saveSpecimens([sp,...specimens]); setScreen("collection"); };
  const handleDelete = id => { saveSpecimens(specimens.filter(s=>s.id!==id)); setScreen("collection"); };
  const handleUpdate = sp => { saveSpecimens(specimens.map(s=>s.id===sp.id?sp:s)); setSelected(sp); };
  const handleSaveExp = exp => saveExpeditions([exp,...expeditions]);
  const handleDeleteExp = id => { saveExpeditions(expeditions.filter(e=>e.id!==id)); setScreen("expeditions"); };

  const filtered=specimens.filter(s=>{
    const ms=s.name.toLowerCase().includes(search.toLowerCase())||s.type.toLowerCase().includes(search.toLowerCase());
    const mr=!filterRarity||s.rarity===filterRarity;
    const mm=!mohsActive||(()=>{const m=parseFloat(s.aiInfo?.mohs);return !isNaN(m)&&m>=mohsMin&&m<=mohsMax;})();
    return ms&&mr&&mm;
  });

  const navItems=[{id:"home",icon:"⌂",label:"Inicio"},{id:"collection",icon:"🪨",label:"Colección"},{id:"expeditions",icon:"🧭",label:"Expeds."},{id:"stats",icon:"📊",label:"Stats"},{id:"add",icon:"＋",label:"Agregar"}];

  return(
    <div style={{width:"100%",height:"100vh",background:"#0d0a05",fontFamily:"'Nunito','Varela Round',system-ui,sans-serif",display:"flex",flexDirection:"column",overflow:"hidden",color:"#e8d9b8"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:rgba(200,169,110,0.2);border-radius:4px;}
        select option{background:#130f07;color:#e8d9b8;}
        input[type=number]::-webkit-inner-spin-button{opacity:0.3;}
        input[type=range]{-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;background:rgba(200,169,110,0.15);outline:none;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:linear-gradient(135deg,#c8a96e,#8b6914);cursor:pointer;box-shadow:0 0 6px rgba(200,169,110,0.4);}
      `}</style>
      {splash&&<SplashScreen onDone={()=>setSplash(false)}/>}

      {/* HEADER */}
      <div style={{padding:"14px 18px 12px",background:"rgba(13,10,5,0.98)",borderBottom:"1px solid rgba(200,169,110,0.12)",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <div style={{width:38,height:38,background:"linear-gradient(135deg,#c8a96e,#6b4f10)",borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:"0 0 16px rgba(200,169,110,0.3)"}}>🪨</div>
        <div><div style={{fontWeight:900,fontSize:22,letterSpacing:-1,lineHeight:1,color:"#e8d9b8",fontStyle:"italic"}}>Petrario</div><div style={{fontSize:8,color:"#4a3a1a",letterSpacing:3}}>COLECCIÓN GEOLÓGICA</div></div>
        <div style={{marginLeft:"auto",background:"rgba(200,169,110,0.08)",border:"1px solid rgba(200,169,110,0.15)",borderRadius:20,padding:"4px 12px",fontSize:11,color:"#c8a96e",fontWeight:700}}>{specimens.length} especímenes</div>
      </div>

      {/* CONTENT */}
      <div style={{flex:1,overflow:"hidden"}}>

        {/* HOME */}
        {screen==="home"&&(
          <div style={{height:"100%",overflowY:"auto",padding:"20px 16px"}}>
            <div style={{marginBottom:24}}><div style={{color:"#4a3a1a",fontSize:10,letterSpacing:3,marginBottom:6}}>BIENVENIDO A</div><h1 style={{margin:0,fontSize:28,fontWeight:900,color:"#e8d9b8",lineHeight:1.1,fontStyle:"italic"}}>Tu colección<br/><span style={{color:"#c8a96e"}}>geológica</span></h1></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:20}}>
              {[{val:specimens.length,label:"Total",icon:"🪨",c:"#c8a96e"},{val:specimens.filter(s=>s.rarity==="Extraordinario").length,label:"Extraord.",icon:"✨",c:"#c86aa0"},{val:expeditions.length,label:"Expeds.",icon:"🧭",c:"#6aa8c8"},{val:specimens.filter(s=>s.aiInfo?.identified).length,label:"Identif.",icon:"🔬",c:"#8a9a7a"}].map(({val,label,icon,c})=>(
                <div key={label} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"12px 8px",textAlign:"center"}}>
                  <div style={{fontSize:18,marginBottom:4}}>{icon}</div><div style={{fontSize:20,fontWeight:900,color:c,lineHeight:1}}>{val}</div><div style={{fontSize:9,color:"#4a3a1a",letterSpacing:0.8,marginTop:2}}>{label.toUpperCase()}</div>
                </div>
              ))}
            </div>
            <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,padding:16,marginBottom:20}}>
              <div style={{color:"#4a3a1a",fontSize:9,letterSpacing:2,marginBottom:12}}>DISTRIBUCIÓN POR RAREZA</div>
              {Object.entries(RARITY).map(([key,r])=>{const count=specimens.filter(s=>s.rarity===key).length;const pct=specimens.length?Math.round(count/specimens.length*100):0;return(<div key={key} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:r.color,fontSize:11,fontWeight:700}}>{"★".repeat(r.stars)} {r.label}</span><span style={{color:"#4a3a1a",fontSize:11}}>{count} ({pct}%)</span></div><div style={{height:6,background:"rgba(255,255,255,0.04)",borderRadius:3,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${r.color}66,${r.color})`,borderRadius:3}}/></div></div>);})}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
              {[{icon:"＋",title:"Agregar roca",sub:"Nuevo espécimen",s:"add",c:"200,169,110"},{icon:"🧭",title:"Expediciones",sub:`${expeditions.length} salidas`,s:"expeditions",c:"106,168,200"}].map(item=>(<button key={item.title} onClick={()=>setScreen(item.s)} style={{background:`rgba(${item.c},0.06)`,border:`1px solid rgba(${item.c},0.2)`,borderRadius:16,padding:16,cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}><div style={{fontSize:26,marginBottom:8}}>{item.icon}</div><div style={{color:"#e8d9b8",fontWeight:800,fontSize:13}}>{item.title}</div><div style={{color:"#4a3a1a",fontSize:11,marginTop:2}}>{item.sub}</div></button>))}
            </div>
            <div style={{color:"#4a3a1a",fontSize:9,letterSpacing:2,marginBottom:12}}>RECIENTES</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>{specimens.slice(0,3).map(sp=><SpecimenCard key={sp.id} sp={sp} onClick={()=>{setSelected(sp);setScreen("detail");}}/>)}</div>
          </div>
        )}

        {/* COLLECTION */}
        {screen==="collection"&&(
          <div style={{height:"100%",display:"flex",flexDirection:"column"}}>
            <div style={{padding:"14px 16px 8px",flexShrink:0}}>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <div style={{flex:1,display:"flex",alignItems:"center",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(200,169,110,0.12)",borderRadius:10,padding:"0 12px",gap:8}}>
                  <span style={{color:"#4a3a1a"}}>🔍</span>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." style={{background:"none",border:"none",color:"#e8d9b8",fontSize:13,fontFamily:"inherit",outline:"none",flex:1,padding:"10px 0"}}/>
                </div>
                <button onClick={()=>setViewMode(v=>v==="list"?"gallery":"list")} style={{background:"rgba(200,169,110,0.1)",border:"1px solid rgba(200,169,110,0.2)",color:"#c8a96e",borderRadius:10,padding:"0 14px",cursor:"pointer",fontSize:16}}>{viewMode==="list"?"⊞":"☰"}</button>
              </div>
              <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:6,marginBottom:8}}>
                {Object.entries(RARITY).map(([key,r])=>(<button key={key} onClick={()=>setFilterRarity(filterRarity===key?"":key)} style={{background:filterRarity===key?r.bg:"rgba(255,255,255,0.03)",border:`1px solid ${filterRarity===key?r.border:"rgba(255,255,255,0.06)"}`,borderRadius:20,padding:"4px 11px",color:filterRarity===key?r.color:"#4a3a1a",fontSize:10,cursor:"pointer",whiteSpace:"nowrap",fontWeight:700,fontFamily:"inherit",boxShadow:filterRarity===key?`0 0 8px ${r.glow}`:"none"}}>{"★".repeat(r.stars)} {key}</button>))}
              </div>
              <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:12,padding:"10px 14px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:mohsActive?8:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{color:"#4a3a1a",fontSize:9,letterSpacing:1}}>💪 FILTRO MOHS</span><button onClick={()=>setMohsActive(!mohsActive)} style={{background:mohsActive?"linear-gradient(135deg,#c8a96e,#8b6914)":"rgba(200,169,110,0.1)",border:"none",borderRadius:20,padding:"2px 10px",cursor:"pointer",fontSize:9,color:mohsActive?"#1a140a":"#c8a96e",fontWeight:700,fontFamily:"inherit"}}>{mohsActive?"ON":"OFF"}</button></div>
                  {mohsActive&&<span style={{color:"#c8a96e",fontSize:11,fontWeight:700}}>{mohsMin} – {mohsMax}</span>}
                </div>
                {mohsActive&&(<><div style={{display:"flex",gap:12,alignItems:"center"}}><span style={{color:"#4a3a1a",fontSize:10,minWidth:16,textAlign:"center"}}>{mohsMin}</span><input type="range" min={1} max={mohsMax} value={mohsMin} onChange={e=>setMohsMin(Number(e.target.value))} style={{flex:1}}/><span style={{color:"#4a3a1a",fontSize:10}}>–</span><input type="range" min={mohsMin} max={10} value={mohsMax} onChange={e=>setMohsMax(Number(e.target.value))} style={{flex:1}}/><span style={{color:"#4a3a1a",fontSize:10,minWidth:16,textAlign:"center"}}>{mohsMax}</span></div><div style={{display:"flex",gap:2,marginTop:8}}>{MOHS_SCALE.map(m=>{const inRange=m.n>=mohsMin&&m.n<=mohsMax;return(<div key={m.n} title={m.name} style={{flex:1,height:6,borderRadius:2,background:inRange?m.color:"rgba(255,255,255,0.05)",transition:"background 0.2s"}}/>);})}</div></>)}
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"8px 16px 16px"}}>
              {filtered.length===0?<div style={{textAlign:"center",padding:40,color:"#4a3a1a"}}><div style={{fontSize:48,marginBottom:12}}>🔍</div><div>Sin resultados</div></div>
                :viewMode==="list"?<div style={{display:"flex",flexDirection:"column",gap:10}}>{filtered.map(sp=><SpecimenCard key={sp.id} sp={sp} onClick={()=>{setSelected(sp);setScreen("detail");}}/>)}</div>
                :<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{filtered.map(sp=><GalleryCard key={sp.id} sp={sp} onClick={()=>{setSelected(sp);setScreen("detail");}}/>)}</div>}
            </div>
          </div>
        )}

        {screen==="map"&&(<div style={{height:"100%",display:"flex",flexDirection:"column"}}><div style={{padding:"12px 16px",color:"#4a3a1a",fontSize:10,letterSpacing:2,flexShrink:0}}>{specimens.filter(s=>s.lat).length} UBICACIONES</div><div style={{flex:1}}><LeafletMap specimens={specimens.filter(s=>s.lat)} onSelect={id=>{const sp=specimens.find(s=>s.id===id);if(sp){setSelected(sp);setScreen("detail");}}}/></div></div>)}

        {screen==="compare"&&<CompareView specimens={specimens} onBack={()=>setScreen("home")}/>}

        {screen==="stats"&&<StatsView specimens={specimens} onBack={()=>setScreen("home")}/>}

        {screen==="expeditions"&&!selectedExp&&(
          <ExpeditionsView expeditions={expeditions} specimens={specimens} onBack={()=>setScreen("home")}
            onSave={handleSaveExp} onDelete={handleDeleteExp}
            onSelectExpedition={exp=>{setSelectedExp(exp);setScreen("expedition-detail");}}/>
        )}

        {screen==="expedition-detail"&&selectedExp&&(
          <ExpeditionDetail expedition={selectedExp} specimens={specimens}
            onBack={()=>{setSelectedExp(null);setScreen("expeditions");}}
            onDelete={id=>{handleDeleteExp(id);setSelectedExp(null);}}
            onSelectSpecimen={sp=>{setSelected(sp);setScreen("detail");}}/>
        )}

        {screen==="add"&&<AddForm onSave={handleSave} onBack={()=>setScreen("collection")} expeditions={expeditions}/>}

        {screen==="detail"&&selected&&(
          <DetailView sp={selected} onBack={()=>setScreen("collection")} onDelete={handleDelete}
            onUpdate={handleUpdate} expeditions={expeditions}/>
        )}
      </div>

      {/* BOTTOM NAV */}
      {!["add"].includes(screen)&&(
        <div style={{display:"flex",background:"rgba(13,10,5,0.99)",borderTop:"1px solid rgba(200,169,110,0.1)",flexShrink:0}}>
          {navItems.map(({id,icon,label})=>{
            const active=screen===id||(screen==="detail"&&id==="collection")||(screen==="expedition-detail"&&id==="expeditions");
            return(<button key={id} onClick={()=>{if(id==="expeditions")setSelectedExp(null);setScreen(id);}} style={{flex:1,background:"none",border:"none",padding:id==="add"?"8px 0 6px":"10px 0 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer",fontFamily:"inherit",color:active?"#c8a96e":"#3a2a10"}}>
              <div style={{fontSize:id==="add"?20:15,background:id==="add"?"linear-gradient(135deg,#c8a96e,#8b6914)":"transparent",width:id==="add"?36:undefined,height:id==="add"?36:undefined,borderRadius:id==="add"?"50%":undefined,display:"flex",alignItems:"center",justifyContent:"center",color:id==="add"?"#1a140a":"inherit",boxShadow:id==="add"?"0 2px 12px rgba(200,169,110,0.4)":"none"}}>{icon}</div>
              <span style={{fontSize:7,letterSpacing:0.8,fontWeight:active?800:400}}>{label.toUpperCase()}</span>
            </button>);
          })}
        </div>
      )}
    </div>
  );
}
