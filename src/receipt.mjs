// Original minimal ESC/POS formatter. Deliberate ASCII transliteration avoids
// printer-specific code pages; user text can never inject printer commands.
export function safeText(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7e]/g,' ').replace(/\s+/g,' ').trim()}
export function wrap(value,width,clean=safeText){const text=clean(value);if(!text)return [''];let lines=[],line='';for(let word of text.split(' ')){if(line&&line.length+1+word.length>width){lines.push(line);line=''}while(word.length>width){if(line){lines.push(line);line=''}lines.push(word.slice(0,width));word=word.slice(width)}if(word)line+=(line?' ':'')+word}if(line)lines.push(line);return lines}
export function receiptText(receipt,width=58,copy=false,unicode=false){
 const clean=unicode?(s=>String(s??'').replace(/[^\x20-\x7e\xa0-\xff]/g,' ').replace(/\s+/g,' ').trim()):safeText;
 const columns=Number(width)===80?48:32,lines=[],amount=n=>'S/ '+(Number(n)/100).toFixed(2);
 const add=s=>lines.push(...wrap(s,columns,clean));const pair=(a,b)=>{a=clean(a);b=clean(b);if(a.length+b.length+1>columns){add(a);add(b)}else lines.push(a+' '.repeat(columns-a.length-b.length)+b)};
 const center=s=>{for(const line of wrap(s,columns,clean))lines.push(' '.repeat(Math.max(0,Math.floor((columns-line.length)/2)))+line)};
 const row=(a,b,c)=>{const values=[a,b,c].map(clean),sizes=[Math.floor(columns/3),Math.floor(columns/3),columns-2*Math.floor(columns/3)];if(values.some((v,i)=>v.length>sizes[i]-1)){pair('Cantidad',a);pair('Precio',b);pair('Subtotal',c);return}lines.push(values[0].padEnd(sizes[0])+values[1].padStart(sizes[1])+values[2].padStart(sizes[2]))};
 for(const line of (receipt.business_header||'INVERSIONES GAVI').split('\n'))center(line);
 lines.push('-'.repeat(columns));add('Cliente');add(receipt.customer_name||'Cliente momentaneo');if(receipt.customer_document)add('Documento: '+receipt.customer_document);if(receipt.customer_address)add(receipt.customer_address);lines.push('-'.repeat(columns));
 if(receipt.offline_pending)add('*** PENDIENTE DE SINCRONIZAR ***');if(copy)add('*** REIMPRESION ***');if(receipt.voided)add('*** VENTA ANULADA ***');add('Venta: '+receipt.id);
 if(receipt.created)add('Fecha: '+new Date(receipt.created*1000).toLocaleString('es-PE',{timeZone:'America/Lima',hour12:false}));
 add('Estado: '+(receipt.voided?'Anulada':receipt.offline_pending?'Pendiente de sincronizar':'Pagado'));add('Pago: '+({cash:'Efectivo',transfer:'Transferencia',card:'Tarjeta'}[receipt.method]||receipt.method||''));lines.push('-'.repeat(columns));
 for(const item of receipt.items){if(item.presentation)pair('',item.presentation);add(item.name);row('Cantidad','Precio','Subtotal');row(Number(Number(item.quantity).toFixed(6)).toString(),(Number(item.price)/100).toFixed(2),(Number(item.subtotal??Math.floor((Math.round(item.quantity*1000)*item.price+500)/1000))/100).toFixed(2));lines.push('')}
 lines.push('-'.repeat(columns));pair('TOTAL',amount(receipt.total));if(receipt.paid!=null)pair('Recibido',amount(receipt.paid));if(receipt.change!=null)pair('Vuelto',amount(receipt.change));lines.push('');if(receipt.seller_name)add('Vendedor: '+receipt.seller_name);add('No es comprobante SUNAT');for(const line of (receipt.footer_message??'Gracias por tu compra').split('\n'))center(line);return lines.join('\n')+'\n';
}
export function escposBytes(receipt,width=58,copy=false){const text=receiptText(receipt,width,copy);return Uint8Array.from([27,64,27,77,0,27,50,27,97,0,...Array.from(text,c=>c.charCodeAt(0)),10,10,10])}
