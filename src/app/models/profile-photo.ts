/** Decode and re-encode a square thumbnail. The original file and its EXIF are never uploaded. */
export async function profilePhoto(file:File):Promise<Blob>{
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose a JPG, PNG or WebP photo.');
 if(file.size>10*1024*1024)throw Error('Choose a photo smaller than 10 MB.');
 const url=URL.createObjectURL(file);
 try{
  const image=new Image();image.src=url;await image.decode();
  if(!image.naturalWidth||!image.naturalHeight)throw Error('This photo could not be read.');
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const context=canvas.getContext('2d');if(!context)throw Error('Photo processing is unavailable.');
  context.fillStyle='#f5f7f8';context.fillRect(0,0,512,512);
  const side=Math.min(image.naturalWidth,image.naturalHeight);
  context.drawImage(image,(image.naturalWidth-side)/2,(image.naturalHeight-side)/2,side,side,0,0,512,512);
  return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Please choose another photo.')),'image/jpeg',.86));
 }finally{URL.revokeObjectURL(url);}
}
