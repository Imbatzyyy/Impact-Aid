import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cropRect,croppedPhoto,preparePhoto,photoMime,PHOTO_ERROR,MAX_PHOTO_BYTES} from '../src/app/models/profile-photo';

const jpeg=()=>new Blob([new Uint8Array([255,216,255,224,1,2])],{type:'application/octet-stream'});
let context:{drawImage:ReturnType<typeof vi.fn>;fillRect:ReturnType<typeof vi.fn>;fillStyle:string};
let output:HTMLCanvasElement;
beforeEach(()=>{
 context={drawImage:vi.fn(),fillRect:vi.fn(),fillStyle:''};
 output={width:0,height:0,getContext:()=>context,toBlob:(fn:(b:Blob)=>void)=>fn(new Blob(['encoded'],{type:'image/jpeg'}))} as unknown as HTMLCanvasElement;
 vi.stubGlobal('document',{createElement:()=>output});vi.stubGlobal('HTMLImageElement',class {});
 vi.stubGlobal('URL',{createObjectURL:vi.fn(()=> 'blob:local'),revokeObjectURL:vi.fn()});
});
afterEach(()=>vi.unstubAllGlobals());
it('keeps extreme crop movements inside landscape and portrait image edges',()=>{
 for(const [w,h] of [[1600,900],[900,1600]])for(const zoom of [0,1,2,4,100])for(const x of [-1000,3000])for(const y of [-1000,3000]){
  const r=cropRect(w,h,{x,y,zoom});expect(r.x).toBeGreaterThanOrEqual(0);expect(r.y).toBeGreaterThanOrEqual(0);expect(r.x+r.side).toBeLessThanOrEqual(w);expect(r.y+r.side).toBeLessThanOrEqual(h);expect(r.center.zoom).toBeGreaterThanOrEqual(1);expect(r.center.zoom).toBeLessThanOrEqual(4);
 }
});
it('uses source coordinates for an off-centre zoomed crop without changing the chosen region',()=>{
 expect(cropRect(1200,800,{x:900,y:350,zoom:2})).toMatchObject({x:700,y:150,side:400});
});
it('identifies actual image bytes even when a provider supplies an incorrect MIME type',()=>{
 expect(photoMime(new Uint8Array([255,216,255]))).toBe('image/jpeg');
 expect(photoMime(new TextEncoder().encode('RIFFxxxxWEBP'))).toBe('image/webp');
 expect(photoMime(new TextEncoder().encode('0000ftypheic0000mif1'))).toBe('image/heic');
 expect(()=>photoMime(new TextEncoder().encode('<svg onload=evil()>'))).toThrow('Choose a');
});
it('normalizes a large mislabeled camera photo and releases its decoded bitmap',async()=>{
 const close=vi.fn();vi.stubGlobal('createImageBitmap',vi.fn(async(blob:Blob)=>{expect(blob.type).toBe('image/jpeg');return{width:6000,height:4000,close};}));
 const result=await preparePhoto(jpeg());expect([result.width,result.height]).toEqual([2048,1365]);expect(close).toHaveBeenCalledOnce();
});
it('falls back to image load events when the bitmap decoder fails',async()=>{
 vi.stubGlobal('createImageBitmap',vi.fn().mockRejectedValue(Error('decode failure')));
 class FallbackImage {naturalWidth=600;naturalHeight=800;onload?:()=>void;onerror?:()=>void;set src(v:string){if(v)queueMicrotask(()=>this.onload?.());}}
 vi.stubGlobal('Image',FallbackImage);vi.stubGlobal('HTMLImageElement',FallbackImage);
 expect((await preparePhoto(jpeg())).height).toBe(800);expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:local');
});
it('does not expose raw decoding errors and revokes the URL for a corrupt image',async()=>{
 vi.stubGlobal('createImageBitmap',vi.fn().mockRejectedValue(Error('source image cannot be decoded')));
 class BadImage{onerror?:()=>void;set src(v:string){if(v)queueMicrotask(()=>this.onerror?.());}}
 vi.stubGlobal('Image',BadImage);
 await expect(preparePhoto(jpeg())).rejects.toThrow(PHOTO_ERROR);expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:local');
});
it('rejects empty and oversized input before allocating a decoder',async()=>{
 const decode=vi.fn();vi.stubGlobal('createImageBitmap',decode);
 await expect(preparePhoto(new Blob())).rejects.toThrow('empty');
 await expect(preparePhoto({size:MAX_PHOTO_BYTES+1} as Blob)).rejects.toThrow('20 MB');expect(decode).not.toHaveBeenCalled();
});
it('exports only the chosen square as a 512 pixel JPEG',async()=>{
 const source={width:1200,height:800} as HTMLCanvasElement;
 const result=await croppedPhoto(source,{x:900,y:350,zoom:2});expect(result.type).toBe('image/jpeg');expect([output.width,output.height]).toEqual([512,512]);expect(context.drawImage).toHaveBeenCalledWith(source,700,150,400,400,0,0,512,512);
});
