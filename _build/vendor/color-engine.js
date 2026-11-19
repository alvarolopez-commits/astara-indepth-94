
/*
 Color Intelligence Engine v0.1 — architectural layer by ALVAARO Y DISEÑOS.
 Scientific palettes: Fabio Crameri, Scientific Colour Maps 9.0 (MIT © 2026).
 Research-informed heuristic engine, NOT an accessibility certificate or an AI model.
 Can run in browser via <script> or Node require(). No dependencies, no network.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object' && module.exports) module.exports=api;
 if(root) root.ColorIntelligence=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const DEFAULTS={
  theme:'light',surface:'#FFFFFF',form:'heatmap',sensitivity:'normal',bins:7,
  role:'data',intent:'auto',style:'quiet',period:null,center:null,forcePalette:null
};
const STYLE={quiet:{light:'#3157D5',dark:'#91ACFF'},depth:{light:'#7650D8',dark:'#C7B3FF'},signal:{light:'#577324',dark:'#D5F875'}};
const STATUS={
 light:{success:'#167044',warning:'#895000',danger:'#B42318',info:'#2859BC',neutral:'#505D6D'},
 dark:{success:'#6DE3B0',warning:'#FFD488',danger:'#FFA29B',info:'#A9C1FF',neutral:'#BFC7D7'}
};
const PREFER={
 sequential:{light:['batlow','navia','lapaz','davos','devon','imola'],dark:['batlowW','hawaii','glasgow','lapaz','batlow']},
 diverging:{light:['vik','cork','broc','roma','delphi','ston'],dark:['berlin','vanimo','managua','tofino','lisbon']},
 cyclic:{light:['romaO','batlowO','vikO','corkO'],dark:['batlowO','vikO','romaO','brocO']},
 'multi-sequential':{light:['oleron','fes','bukavu'],dark:['bukavu','fes','oleron']},
 categorical:{light:['batlowS','naviaS','lapazS','actonS','glasgowS'],dark:['batlowS','hawaiiS','glasgowS','naviaS','lapazS']}
};
function rgb(hex){const m=/^#?([0-9a-fA-F]{6})$/.exec(hex||'');if(!m) throw Error('HEX inválido: '+hex);return [0,2,4].map(i=>parseInt(m[1].slice(i,i+2),16)/255)}
function srgb(v){return v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4)}
function luminance(hex){const [r,g,b]=rgb(hex).map(srgb);return .2126*r+.7152*g+.0722*b}
function contrast(a,b){let x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
function oklab(hex){
 const [r,g,b]=rgb(hex).map(srgb),l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
 return [.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s]
}
function dist(a,b){let x=oklab(a),y=oklab(b);return Math.hypot(...x.map((v,i)=>v-y[i]))}
function clamp(x,min,max){return Math.max(min,Math.min(max,x))}
function med(a){return a.length?a.reduce((p,c)=>p+c,0)/a.length:0}
function candidates(family,catalog){if(family==='categorical')return Object.keys(catalog.categorical);return catalog.types[family]||[]}
function quality(name,family,theme,form,bg,catalog,n){
 const col=family==='categorical'?catalog.categorical[name].slice(0,n):catalog.palettes[name];
 const pref=(PREFER[family]?.[theme]||[]).indexOf(name); const bonus=pref<0?0:Math.max(0,.12-.012*pref);
 if(family==='categorical'){
   let min=10,sum=0,c=0,lum=10;
   for(let i=0;i<col.length;i++)for(let j=i+1;j<col.length;j++){
    let d=dist(col[i],col[j]);min=Math.min(min,d);sum+=d;c++;lum=Math.min(lum,Math.abs(oklab(col[i])[0]-oklab(col[j])[0]));
   }
   if(col.length===1)min=1;
   const meanContrast=med(col.map(x=>contrast(x,bg)));
   return {score:Math.min(1,min/.15)*.55+Math.min(1,meanContrast/5)*.25+Math.min(1,lum/.15)*.2+bonus,minDist:min,meanContrast};
 }
 const light=col.map(x=>oklab(x)[0]), diff=light.slice(1).map((v,i)=>v-light[i]);
 let score=0;
 if(family==='sequential'){
   // Count tiny round-off as acceptable; prefer broadly monotone lightness.
   const good=Math.max(diff.filter(x=>x>=-.002).length,diff.filter(x=>x<=.002).length)/diff.length;
   const range=Math.abs(light[255]-light[0]);
   score=.60*good+.26*Math.min(1,range/.75)+.14*Math.min(1,med(col.filter((_,i)=>i%24===0).map(x=>contrast(x,bg)))/5);
 } else if(family==='diverging'){
   const mid=col[128]; const c=contrast(mid,bg);
   const endpoint=Math.min(contrast(col[0],bg),contrast(col[255],bg));
   const balance=1-Math.abs(light[0]-light[255]);
   score=.5*(1/clamp(c,1,7))+.36*Math.min(1,endpoint/4)+.14*clamp(balance,0,1);
 } else if(family==='cyclic'){
   score=.60*(1-Math.min(1,dist(col[0],col[255])/.20))+.40*Math.min(1,(Math.max(...light)-Math.min(...light))/.62);
 } else if(family==='multi-sequential'){
   score=.48+.3*Math.min(1,Math.abs(light[0]-light[255])/.75)+.22*Math.min(1,med(col.filter((_,i)=>i%24===0).map(x=>contrast(x,bg)))/5);
 }
 return {score:score+bonus,centerContrast:contrast(col[128],bg)};
}
function classify(o,vals,warnings,reasons){
 if(o.role!=='data')return o.role;
 if(o.intent && o.intent!=='auto'){
  if(o.intent==='categorical' && !o.categories?.length)warnings.push('Paleta categórica sin nombres de categorías: proporciona etiquetas para garantizar correspondencia estable.');
  reasons.push('Familia cromática indicada explícitamente por el responsable de los datos.');return o.intent;
 }
 if(o.categories && o.categories.length){reasons.push('Variables nominales sin orden natural → colores cualitativos, no un gradiente.');return 'categorical'}
 if(o.periodic || o.period){reasons.push('Variable con continuidad circular/periodicidad → mapa cíclico.');return 'cyclic'}
 if(o.multiDomain){reasons.push('Dos dominios físicos contiguos y con significado diferente → escala multisecuencial.');return 'multi-sequential'}
 if(o.center!==null && o.center!==undefined && Number.isFinite(+o.center)){
  reasons.push('Referencia central semántica conocida → escala divergente.');return 'diverging';
 }
 if(vals.length)reasons.push('Magnitud cuantitativa ordenada, sin centro semántico → escala secuencial.');
 else {warnings.push('Faltan valores o metadatos: sugerencia provisional, requiere revisión.');reasons.push('Sin información suficiente para inferir la naturaleza de los datos.');}
 return 'sequential';
}
function chooseCategorical(family,n,palette){return palette.slice(0,clamp(n,1,100))}
function colorscale(result,v){
 if(v===null||v===undefined||v===''||!Number.isFinite(Number(v)))return result.noData;
 if(result.family==='categorical'){
  const key=String(v);let i=result.categories.findIndex(x=>String(x)===key);return i<0?result.noData:result.colors[i%result.colors.length];
 }
 const [min,max]=result.domain;let t;
 if(result.family==='cyclic'){
  const p=result.period||((max-min)||1);t=((Number(v)-min)%p+p)%p/p;
 }else if(result.family==='diverging'){
  const c=result.center; t=Number(v)<=c? .5*(Number(v)-min)/Math.max(1e-12,c-min):.5+.5*(Number(v)-c)/Math.max(1e-12,max-c);
 } else t=(Number(v)-min)/Math.max(1e-12,max-min);
 t=clamp(t,0,1);
 if(result.scaleMode==='discrete')return result.colors[Math.min(result.colors.length-1,Math.floor(t*result.colors.length))];
 return result.gradient[Math.round(t*(result.gradient.length-1))];
}
function recommend(input,catalog){
 if(!catalog?.palettes || !catalog.categorical)throw Error('Falta catálogo SCM9 (data/scm9-catalog.js).');
 const o={...DEFAULTS,...input};if(!['light','dark'].includes(o.theme))throw Error('Tema no admitido');
 const bg=o.surface || (o.theme==='dark'?'#141924':'#FFFFFF');rgb(bg);
 const warnings=[],reasons=[],trace=[];
 const vals=(o.values||[]).filter(x=>x!==null&&x!==undefined&&x!==''&&Number.isFinite(Number(x))).map(Number);
 const categories=Array.from(new Set((o.categoryDomain||o.categories||[]).map(String)));
 if(!o.categoryDomain)categories.sort((a,b)=>a.localeCompare(b,'es')); // stable mapping independent of input order; explicit categoryDomain preserves business-defined order.
 let role=o.role||'data',family=classify(o,vals,warnings,reasons);
 if(role!=='data'){
  if(role==='semantic'){
   const colors=STATUS[o.theme];reasons.push('Color reservado a estados de interfaz y siempre acompañado de texto/icono; el dato cuantitativo no determina el tono.');
   for(const [key,c] of Object.entries(colors))if(contrast(c,bg)<4.5)warnings.push('Revisar contraste de '+key+' ('+contrast(c,bg).toFixed(2)+':1) frente al fondo actual.');
   return {role,family:'semantic',paletteId:'semantic-'+o.theme,colors,theme:o.theme,background:bg,reasons,warnings,source:{type:'design-system',name:'Color Intelligence Engine'},validators:{textContrast:'Comprobación relativa solo al fondo indicado; pendiente en componentes reales.'},status:warnings.length?'review':'proposed'};
  }
  if(role==='neutral'){
   const color=o.theme==='dark'?'#B8C4D7':'#657187';
   reasons.push('Un único tono neutro basta: el color no necesita codificar categorías ni magnitudes.');
   return {role,family:'neutral',paletteId:'neutral-'+o.theme,colors:[color],theme:o.theme,background:bg,reasons,warnings,status:'proposed',source:{type:'design-system',name:'Design System v1.1'}};
  }
  if(role==='brand'){
   let color=(STYLE[o.style]||STYLE.quiet)[o.theme];const val=contrast(color,bg);
   if(val<3)warnings.push('Acento de marca insuficiente sobre este fondo: '+val.toFixed(2)+':1. No utilizar como único indicador sin revisar.');
   reasons.push('Identidad del producto: el color de marca no representa diferencias cuantitativas.');
   return {role,family:'brand',paletteId:'brand-'+o.style,colors:[color],theme:o.theme,background:bg,reasons,warnings,status:warnings.length?'review':'proposed',source:{type:'design-system',name:'Design System v1.1'}};
  }
  throw Error('Rol de color no reconocido');
 }
 if(!catalog.types[family]&&family!=='categorical')throw Error('Familia no admitida: '+family);
 if(!vals.length&&!categories.length)warnings.push('La recomendación no debe publicarse sin un dataset y dominio verificados.');
 const n=Number.isFinite(+o.categoryCount)&&+o.categoryCount>0?Math.floor(+o.categoryCount):categories.length||6;
 if(family==='categorical'&&n>10)warnings.push('Más de 10 categorías: reducir, agrupar o permitir resaltado y etiquetas directas; discriminación no garantizada en tamaños pequeños.');
 let min=vals.length?Math.min(...vals):0,max=vals.length?Math.max(...vals):100;
 if(Array.isArray(o.domain)&&o.domain.length===2&&o.domain.every(x=>Number.isFinite(+x))){min=Number(o.domain[0]);max=Number(o.domain[1]);}
 if(min>max)throw Error('Dominio invertido');
 if(min===max){warnings.push('Dominio constante: no hay gradiente informativo.');max=min+1;}
 let center=(o.center!==null&&o.center!==undefined&&Number.isFinite(+o.center))?Number(o.center):null;
 if(family==='diverging'){
  if(center===null){center=(min+max)/2;warnings.push('Centro ausente: se usa punto medio provisional, validar su significado.');}
  if(center<=min||center>=max){
   if(!Number.isFinite(center))throw Error('Centro divergente inválido');
   min=Math.min(min,center-1e-6);max=Math.max(max,center+1e-6);
   warnings.push('Centro fuera de la distribución: el dominio se amplía; comprobar si conviene una escala secuencial.');
  }
 }
 if(family==='cyclic'&&!Number.isFinite(Number(o.period))){warnings.push('No se indicó período: se utiliza el rango completo como ciclo, validar unidad.');}
 if(family==='multi-sequential'&&!o.multiDomain){warnings.push('Las escalas multisecuenciales requieren justificar la frontera entre dominios (p. ej. tierra/mar).');}
 if(o.form==='wheel'&&family!=='cyclic')warnings.push('Un gráfico circular periódico requiere una variable cíclica; la vista previa usa una matriz alternativa.');
 const names=candidates(family,catalog);
 const scored=names.map(name=>({name,...quality(name,family,o.theme,o.form,bg,catalog,n)})).sort((a,b)=>b.score-a.score);
 let choice=scored[0]?.name;
 if(family==='multi-sequential'){
  const tag=String(o.multiDomain||'').toLowerCase();
  choice=tag.includes('mar')||tag.includes('sea')||tag.includes('océan')?'oleron':tag.includes('tierra')?'fes':scored[0].name;
 }
 if(o.forcePalette){
  if(names.includes(o.forcePalette)){choice=o.forcePalette;reasons.push('Selección manual explícita: '+o.forcePalette+'.');}
  else warnings.push('La paleta solicitada no pertenece a la familia '+family+'; se mantiene una alternativa compatible.');
 }
 let gradient=catalog.palettes[choice]||[];
 let discrete=family==='categorical'?false:((o.sensitivity!=='high') && (o.form==='choropleth'||o.form==='bar-bins'||o.form==='discrete'));
 if(o.sensitivity==='high')reasons.push('Variaciones pequeñas relevantes → escala continua para preservar detalle.');
 else if(discrete)reasons.push('Lectura por intervalos prioritaria → paleta discreta y leyenda de rangos.');
 else reasons.push('Campo continuo o densidad variable → paleta continua.');
 let bins=clamp(Math.round(+o.bins||7),3,12);
 let colors=family==='categorical'?chooseCategorical(family,n,catalog.categorical[choice]):discrete?Array.from({length:bins},(_,i)=>gradient[Math.round((i+.5)/bins*255)]):gradient;
 if(family==='categorical'&&n>colors.length)warnings.push('No se pueden asignar categorías sin repetir colores; revisar.');
 if(family==='categorical'&&n<=10){let minPair=10;for(let i=0;i<colors.length;i++)for(let j=i+1;j<colors.length;j++)minPair=Math.min(minPair,dist(colors[i],colors[j]));if(minPair<.065)warnings.push('Algunos colores categóricos próximos: reforzar con etiquetas o patrones.');}
 const noData=o.theme==='dark'?'#666F7D':'#D9DDE3';
 reasons.push('Se preservan los colores de SCM9; se extraen muestras sin modificar sus tonos originales.');
 trace.push({step:'interpretation',result:family},{step:'data-domain',result:[min,max],center},{step:'ranking',result:scored.slice(0,4).map(x=>({id:x.name,heuristicScore:+x.score.toFixed(3)}))},{step:'output',result:choice,mode:discrete?'discrete':'continuous'});
 warnings.push('No transmitir información exclusivamente mediante color: incluir ejes, leyenda, etiquetas o patrones accesibles.');
 const result={role,family,paletteId:choice,scaleMode:family==='categorical'?'categorical':discrete?'discrete':'continuous',colors,gradient,theme:o.theme,style:o.style,background:bg,domain:[min,max],center,period:Number(o.period)||null,categories,noData,reasons,warnings,status:warnings.length?'review':'proposed',candidates:scored.slice(0,4).map(x=>({id:x.name,score:+x.score.toFixed(3)})),trace,source:{name:'Scientific Colour Maps',author:'Fabio Crameri',version:catalog.version,license:catalog.license,citation:catalog.citation},validators:{contrast:'Pendiente de validación visual del gráfico final; el catálogo científico NO implica certificación WCAG.',cvd:'Preselección científica; validar con etiquetas, tamaños reales y pruebas de usuarios.'}};
 result.legend=family==='categorical'?colors.map((c,i)=>({label:categories[i]||('Categoría '+(i+1)),color:c})):null;
 return result;
}
function cssTokens(r,prefix='--ci'){
 if(r.role==='semantic')return Object.entries(r.colors).map(([k,v])=>`${prefix}-${k}: ${v};`).join('\n');
 if(r.role==='brand')return `${prefix}-accent: ${r.colors[0]};`;
 if(r.role==='neutral')return `${prefix}-neutral: ${r.colors[0]};`;
 if(r.family==='categorical')return r.colors.map((v,i)=>`${prefix}-series-${i+1}: ${v};`).join('\n')+`\n${prefix}-missing: ${r.noData};`;
 return `${prefix}-gradient: linear-gradient(90deg, ${[0,.25,.5,.75,1].map(t=>{let x=r.gradient[Math.round(t*255)];return x+' '+Math.round(t*100)+'%'}).join(', ')});\n${prefix}-missing: ${r.noData};`;
}
return {recommend,colorFor:colorscale,contrast,oklab,quality,cssTokens,version:'0.1.0'};
});

