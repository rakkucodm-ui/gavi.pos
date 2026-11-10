// Money uses integer centimos; quantity uses milli-presentations, compatible with stock.
import {lineCents,quantityMilli} from './shared-stock.mjs';
export function solesCents(value){
 const s=String(value).trim().replace(',','.');
 if(!/^\d{1,8}(?:\.\d{1,2})?$/.test(s))throw Error('Escribe soles con hasta dos decimales');
 const [a,b='']=s.split('.'),n=Number(a)*100+Number(b.padEnd(2,'0'));
 if(!Number.isSafeInteger(n)||n>1000000000)throw Error('Monto fuera de rango');return n;
}
export function quantityForAmount(product,amount,price=product.price){
 if(!Number.isSafeInteger(amount)||amount<=0||amount>1000000000)throw Error('Monto inválido');
 if(!Number.isSafeInteger(price)||price<=0||price>1000000000)throw Error('El precio debe ser mayor que cero');
 const quantity=amount/price;if(quantity>1000000)throw Error('Cantidad demasiado grande');
 let baseQuantity=null;
 if(product.pool_id){
  if(!Number.isSafeInteger(product.factor)||product.factor<=0)throw Error('Configura el contenido antes de vender por monto');
  if(product.base_unit==='g'){
   baseQuantity=Number((BigInt(amount)*BigInt(product.factor)*2n+BigInt(price))/(2n*BigInt(price)));
   if(baseQuantity<1)throw Error('El monto equivale a menos de un gramo');
  }else{
   if((BigInt(amount)*BigInt(product.factor))%BigInt(price)!==0n)throw Error('El monto no corresponde a unidades completas. Elige otra presentación o edita el precio autorizado');
   baseQuantity=Number(BigInt(amount)*BigInt(product.factor)/BigInt(price));
  }
 }else if(!Number.isInteger(quantity))throw Error('Configura una presentación por peso o unidades equivalentes para vender ese monto exacto');
 return {quantity,price,total:amount,requested:amount,difference:0,baseQuantity};
}
export function saleLineTotal(line){
 if(line.amount_cents!==undefined){if(!Number.isSafeInteger(line.amount_cents)||line.amount_cents<=0)throw Error('Monto inválido');return line.amount_cents;}
 return line.subtotal??lineCents(line.quantity,line.price);
}
export function takeAmountStock(products,line){
 const p=products.find(p=>p.id===line.product_id),r=quantityForAmount(p,line.amount_cents,line.price);
 if(Math.abs(line.quantity-r.quantity)>1e-9*Math.max(1,r.quantity))throw Error('La cantidad por monto cambió; vuelve a calcular');
 if(!p.pool_id){const taken=Math.min(p.stock,r.quantity);p.stock-=taken;return {deducted:taken,untracked:r.quantity-taken};}
 const taken=Math.min(p.stock_base,r.baseQuantity),remaining=p.stock_base-taken;for(const sibling of products)if(sibling.pool_id===p.pool_id){sibling.stock_base=remaining;sibling.stock=sibling.stock_base/(sibling.factor||1);}
 return {pool_id:p.pool_id,base_deducted:taken,deducted:taken/p.factor,untracked:(r.baseQuantity-taken)/p.factor};
}
export function amountQuantityLabel(product,result){
 if(product.base_unit==='g'&&result.baseQuantity!==null){
  const kg=Math.floor(result.baseQuantity/1000),grams=result.baseQuantity%1000;
  return [kg?kg+' kg':'',grams?grams+' g':''].filter(Boolean).join(' ')||'0 g';
 }
 return Number(result.quantity.toFixed(6))+' '+(product.label||product.unit||'unidad(es)');
}
