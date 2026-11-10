export function normalizeSearch(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/([0-9])([a-z])/g,'$1 $2').replace(/([a-z])([0-9])/g,'$1 $2').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ')}
const stop=new Set(['de','del','la','el','las','los','por','para','y','x']);
function tokens(s){return [...new Set(s.split(' ').filter(t=>t&&!stop.has(t)))]}
// Bounded optimal-string-alignment distance: insertion, omission, substitution
// and adjacent swapped letters. Numeric tokens are never corrected.
export function typoDistance(a,b,limit=2){
 if(Math.abs(a.length-b.length)>limit)return limit+1;
 let previous=Array.from({length:b.length+1},(_,i)=>i),before=previous;
 for(let i=1;i<=a.length;i++){const row=[i];let minimum=i;
  for(let j=1;j<=b.length;j++){row[j]=Math.min(row[j-1]+1,previous[j]+1,previous[j-1]+(a[i-1]===b[j-1]?0:1));if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])row[j]=Math.min(row[j],before[j-2]+1);minimum=Math.min(minimum,row[j]);}
  if(minimum>limit)return limit+1;before=previous;previous=row;
 }return previous[b.length];
}
export function buildSearchIndex(products){return products.map(p=>{const name=normalizeSearch(p.name),sku=normalizeSearch(p.sku);return {product:p,name,sku,code:sku.replaceAll(' ',''),words:tokens(name+' '+normalizeSearch(p.unit)+' '+normalizeSearch(p.pool_name)+' '+normalizeSearch(p.label)),category:tokens(normalizeSearch(p.category))}})}
function wordMatch(query,words){
 let best=0,approximate=false;
 for(const word of words){if(query===word)return {score:100,approximate:false};if(!/^\d+$/.test(query)&&word.startsWith(query)){if(best<90){best=90;approximate=false}continue}
  if(query.length<3||/\d/.test(query)||/\d/.test(word))continue;
  const limit=query.length>=6?2:1,distance=typoDistance(query,word,limit);
  if(distance<=limit){const score=74-distance*9;if(score>best){best=score;approximate=true}}
 }return {score:best,approximate};
}
export function searchProducts(index,text,popularity={}){
 const query=normalizeSearch(text).slice(0,120),terms=tokens(query),code=query.replaceAll(' ','');const results=[];
 for(const item of index){const sold=Number(popularity[item.product.id]??item.product.sold_units??0)||0;
  if(!query||!terms.length){results.push({product:item.product,score:0,approximate:false,sold});continue}
  if(code&&code===item.code){results.push({product:item.product,score:1000,approximate:false,sold});continue}
  if(code.length>=3&&item.code.startsWith(code)){results.push({product:item.product,score:750,approximate:false,sold});continue}
  if(code.length>=6&&terms.length===1&&item.name.replaceAll(' ','').includes(code)){results.push({product:item.product,score:130,approximate:false,sold});continue}
  let sum=0,approximate=false,matched=true;
  for(const term of terms){let match=wordMatch(term,item.words);const category=wordMatch(term,item.category);if(category.score-12>match.score)match={...category,score:category.score-12};if(!match.score){matched=false;break}sum+=match.score;approximate||=match.approximate;}
  if(!matched)continue;
  let score=sum/terms.length+(item.name===query?100:item.name.includes(query)?35:0);if(approximate)score-=100;results.push({product:item.product,score,approximate,sold});
 }
 return results.sort((a,b)=>b.score-a.score||b.sold-a.sold||a.product.name.localeCompare(b.product.name,'es',{sensitivity:'base'})||String(a.product.id).localeCompare(String(b.product.id)));
}
