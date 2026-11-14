import {AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild} from '@angular/core';
import {Crop,cropRect,croppedPhoto,rotatePhoto} from '../models/profile-photo';

@Component({selector:'app-photo-crop',standalone:true,changeDetection:ChangeDetectionStrategy.Eager,
 templateUrl:'./photo-crop.component.html',styleUrls:['./photo-crop.component.scss']})
export class PhotoCropComponent implements AfterViewInit,OnDestroy{
 @Input({required:true}) source!:HTMLCanvasElement;
 @Output() chosen=new EventEmitter<Blob>();
 @Output() cancelled=new EventEmitter<void>();
 @ViewChild('preview',{static:true}) preview!:ElementRef<HTMLCanvasElement>;
 image!:HTMLCanvasElement;crop:Crop={x:0,y:0,zoom:1};busy=false;message='';
 private pointers=new Map<number,{x:number;y:number}>();private frame=0;private alive=true;
 ngAfterViewInit(){this.image=this.source;this.reset();}
 reset(){this.crop={x:this.image.width/2,y:this.image.height/2,zoom:1};this.draw();}
 private draw(){
  const rect=cropRect(this.image.width,this.image.height,this.crop);this.crop=rect.center;
  cancelAnimationFrame(this.frame);this.frame=requestAnimationFrame(()=>{
   const ctx=this.preview.nativeElement.getContext('2d');if(!ctx)return;
   ctx.drawImage(this.image,rect.x,rect.y,rect.side,rect.side,0,0,640,640);
  });
 }
 zoom(value:number){if(this.busy)return;this.crop.zoom=value;this.draw();}
 zoomInput(event:Event){this.zoom(Number((event.target as HTMLInputElement).value));}
 move(x:number,y:number){if(this.busy)return;const step=Math.min(this.image.width,this.image.height)/this.crop.zoom*.07;this.crop.x-=x*step;this.crop.y-=y*step;this.draw();}
 rotate(){if(this.busy)return;const old=this.image;this.image=rotatePhoto(old);if(old!==this.source){old.width=old.height=0;}this.reset();}
 pointerDown(event:PointerEvent){
  if(this.busy||event.button>0)return;event.preventDefault();
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  this.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
 }
 pointerMove(event:PointerEvent){
  const old=this.pointers.get(event.pointerId);if(!old||this.busy)return;
  const before=[...this.pointers.values()];
  this.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
  const after=[...this.pointers.values()];
  if(after.length===2){
   const distance=(p:{x:number;y:number}[])=>Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
   const previous=distance(before);if(previous>0)this.crop.zoom*=distance(after)/previous;
  }else{
   const rect=(event.currentTarget as HTMLElement).getBoundingClientRect();
   const ratio=cropRect(this.image.width,this.image.height,this.crop).side/rect.width;
   this.crop.x-=(event.clientX-old.x)*ratio;this.crop.y-=(event.clientY-old.y)*ratio;
  }
  this.draw();
 }
 pointerUp(event:PointerEvent){this.pointers.delete(event.pointerId);}
 key(event:KeyboardEvent){
  const moves:Record<string,[number,number]>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
  if(moves[event.key]){event.preventDefault();this.move(...moves[event.key]);}
 }
 async usePhoto(){
  if(this.busy)return;this.busy=true;this.message='';
  try{const blob=await croppedPhoto(this.image,this.crop);if(this.alive)this.chosen.emit(blob);}
  catch{if(this.alive)this.message='Your crop could not be prepared. Try again or choose another photo.';}
  finally{if(this.alive)this.busy=false;}
 }
 ngOnDestroy(){this.alive=false;cancelAnimationFrame(this.frame);this.pointers.clear();if(this.image&&this.image!==this.source)this.image.width=this.image.height=0;}
}
