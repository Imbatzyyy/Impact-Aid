export const PHOTO_ERROR = 'This photo could not be opened. Try another photo, or save a copy as JPG or PNG and choose it again.';
export const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
export interface Crop { x:number; y:number; zoom:number }
const clamp=(n:number,min:number,max:number)=>Math.min(max,Math.max(min,n));

/** Source-pixel coordinates keep the crop identical at every screen size. */
export function cropRect(width:number,height:number,crop:Crop){
 const zoom=clamp(Number.isFinite(crop.zoom)?crop.zoom:1,1,4);
 const side=Math.min(width,height)/zoom;
 const x=clamp(crop.x,side/2,width-side/2),y=clamp(crop.y,side/2,height-side/2);
 return {x:x-side/2,y:y-side/2,side,center:{x,y,zoom}};
}

/** Check bytes instead of trusting missing/incorrect MIME labels from file providers. */
export function photoMime(bytes:Uint8Array):string {
 const ascii=(start:number,end:number)=>String.fromCharCode(...bytes.slice(start,end));
 if(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return 'image/jpeg';
 if(bytes[0]===137&&ascii(1,4)==='PNG')return 'image/png';
 if(ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP')return 'image/webp';
 if(ascii(4,8)==='ftyp'){
  const brands=ascii(8,64);
  if(/avif|avis/.test(brands))return 'image/avif';
  if(/heic|heix|hevc|hevx|mif1/.test(brands))return 'image/heic';
 }
 throw Error('Choose a JPG, PNG, WebP, HEIC or AVIF photo.');
}

function canvas(width:number,height:number){
 const output=document.createElement('canvas');output.width=width;output.height=height;
 const context=output.getContext('2d');if(!context)throw Error('Photo processing is unavailable. Please restart the app.');
 return {output,context};
}

async function loadImage(blob:Blob):Promise<HTMLImageElement>{
 const url=URL.createObjectURL(blob);
 try{return await new Promise((resolve,reject)=>{
  const image=new Image();
  const timer=setTimeout(()=>{image.onload=image.onerror=null;image.src='';reject(Error(PHOTO_ERROR));},20000);
  image.onload=()=>{clearTimeout(timer);image.onload=image.onerror=null;image.naturalWidth?resolve(image):reject(Error(PHOTO_ERROR));};
  image.onerror=()=>{clearTimeout(timer);image.onload=image.onerror=null;reject(Error(PHOTO_ERROR));};
  image.src=url;
 });}finally{URL.revokeObjectURL(url);}
}

/** Copy file-provider bytes before releasing the picker, orient, then bound editor memory. */
export async function preparePhoto(file:Blob):Promise<HTMLCanvasElement>{
 if(!file.size)throw Error('This photo is empty. Choose another photo.');
 if(file.size>MAX_PHOTO_BYTES)throw Error('Choose a photo smaller than 20 MB.');
 let bitmap:ImageBitmap|undefined;
 try{
  const bytes=await file.arrayBuffer();
  const blob=new Blob([bytes],{type:photoMime(new Uint8Array(bytes,0,Math.min(64,bytes.byteLength)))});
  let source:ImageBitmap|HTMLImageElement;
  try{bitmap=await createImageBitmap(blob,{imageOrientation:'from-image'});source=bitmap;}
  catch{source=await loadImage(blob);}
  const width=source instanceof HTMLImageElement?source.naturalWidth:source.width;
  const height=source instanceof HTMLImageElement?source.naturalHeight:source.height;
  if(!width||!height)throw Error(PHOTO_ERROR);
  const scale=Math.min(1,2048/Math.max(width,height));
  const {output,context}=canvas(Math.max(1,Math.round(width*scale)),Math.max(1,Math.round(height*scale)));
  context.fillStyle='#f5f7f8';context.fillRect(0,0,output.width,output.height);
  context.drawImage(source,0,0,output.width,output.height);
  return output;
 }catch(error){
  if(error instanceof Error&&error.message.startsWith('Choose a'))throw error;
  throw Error(PHOTO_ERROR);
 }finally{bitmap?.close();}
}

export function rotatePhoto(source:HTMLCanvasElement):HTMLCanvasElement{
 const {output,context}=canvas(source.height,source.width);
 context.translate(output.width,0);context.rotate(Math.PI/2);context.drawImage(source,0,0);return output;
}

/** Only this 512px JPEG goes to private storage; original pixels and EXIF stay local. */
export async function croppedPhoto(source:HTMLCanvasElement,crop:Crop):Promise<Blob>{
 const {output,context}=canvas(512,512),rect=cropRect(source.width,source.height,crop);
 context.fillStyle='#f5f7f8';context.fillRect(0,0,512,512);
 context.drawImage(source,rect.x,rect.y,rect.side,rect.side,0,0,512,512);
 return new Promise((resolve,reject)=>output.toBlob(blob=>blob?resolve(blob):reject(Error(PHOTO_ERROR)),'image/jpeg',.9));
}
