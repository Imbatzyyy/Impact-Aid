import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Position } from '@capacitor/geolocation';

const mocks=vi.hoisted(()=>({
  native:vi.fn(),check:vi.fn(),request:vi.fn(),current:vi.fn(),watch:vi.fn(),clear:vi.fn(),
  map:vi.fn(),tile:vi.fn(),marker:vi.fn(),icon:vi.fn(),circle:vi.fn(),dot:vi.fn(),
  setView:vi.fn(),boundsZoom:vi.fn(),invalidate:vi.fn(),remove:vi.fn(),
  outside:0,hidden:false,visibility:new Set<()=>void>(),
  callbacks:[] as Array<(position:Position|null,error?:unknown)=>void>,
}));
vi.mock('@angular/core',()=>({Component:()=> (value:unknown)=>value,ViewChild:()=>()=>{},ChangeDetectionStrategy:{Eager:0},NgZone:class{},ElementRef:class{}}));
vi.mock('@angular/common',()=>({CommonModule:class{}}));
vi.mock('@angular/router',()=>({RouterLink:class{}}));
vi.mock('@angular/forms',()=>({FormsModule:class{}}));
vi.mock('@ionic/angular',()=>({IonContent:class{},IonIcon:class{},IonSpinner:class{},ToastController:class{}}));
vi.mock('@capacitor/core',()=>({Capacitor:{isNativePlatform:mocks.native}}));
vi.mock('@capacitor/geolocation',()=>({Geolocation:{checkPermissions:mocks.check,requestPermissions:mocks.request,getCurrentPosition:mocks.current,watchPosition:mocks.watch,clearWatch:mocks.clear}}));
vi.mock('leaflet',()=>({map:mocks.map,tileLayer:mocks.tile,marker:mocks.marker,divIcon:mocks.icon,circle:mocks.circle,circleMarker:mocks.dot,point:(x:number,y:number)=>({x,y})}));

import { MapPage } from '../src/app/pages/map/map.page';

const NOW=1_800_000_000_000;
function fix(latitude=14.641234567,longitude=121.042345678,accuracy=12.75,timestamp=Date.now()):Position{
  return {timestamp,coords:{latitude,longitude,accuracy,altitude:null,altitudeAccuracy:null,speed:null,heading:null,magneticHeading:null,trueHeading:null,headingAccuracy:null,course:null}};
}
function deferred<T>(){
  let resolve!:(value:T)=>void;
  const promise=new Promise<T>(done=>{resolve=done;});
  return {promise,resolve};
}
function outside<T>(fn:()=>T):T{
  mocks.outside++;
  try{return fn();}finally{mocks.outside--;}
}
function requireOutside(){if(!mocks.outside)throw new Error('Leaflet operation ran inside Angular');}
function layer(radius=0){
  const value={
    radius,
    addTo:vi.fn(()=>{requireOutside();return value;}),
    bindPopup:vi.fn(()=>{requireOutside();return value;}),
    on:vi.fn(()=>{requireOutside();return value;}),
    remove:vi.fn(requireOutside),
    setLatLng:vi.fn(()=>{requireOutside();return value;}),
    setRadius:vi.fn((r:number)=>{requireOutside();value.radius=r;return value;}),
    getBounds:vi.fn(()=>{requireOutside();return {radius:value.radius};}),
  };
  return value;
}
let pages:MapPage[]=[];
function page(){
  const value=new MapPage({create:vi.fn()} as never,{run:(fn:()=>unknown)=>fn(),runOutsideAngular:outside} as never);
  value.mapElement={nativeElement:{}} as never;
  value.ngAfterViewInit();value.ionViewDidEnter();pages.push(value);return value;
}
beforeEach(()=>{
  vi.resetAllMocks();vi.useFakeTimers();vi.setSystemTime(NOW);
  mocks.outside=0;mocks.hidden=false;mocks.visibility.clear();mocks.callbacks=[];pages=[];
  vi.stubGlobal('document',{
    get hidden(){return mocks.hidden;},
    addEventListener:(_name:string,callback:()=>void)=>mocks.visibility.add(callback),
    removeEventListener:(_name:string,callback:()=>void)=>mocks.visibility.delete(callback),
  });
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({updatedAt:'2026-11-13',places:[]})}));
  mocks.native.mockReturnValue(true);
  mocks.check.mockResolvedValue({location:'granted',coarseLocation:'granted'});
  mocks.request.mockResolvedValue({location:'granted',coarseLocation:'granted'});
  mocks.current.mockImplementation(async()=>fix());
  mocks.watch.mockImplementation(async(_options,callback)=>{mocks.callbacks.push(callback);return 'synthetic-watch-'+mocks.callbacks.length;});
  mocks.clear.mockResolvedValue(undefined);
  mocks.map.mockImplementation(()=>{requireOutside();return {on:()=>{},getBounds:()=>({contains:()=>true}),createPane:()=>({style:{}}),setView:mocks.setView,getBoundsZoom:mocks.boundsZoom,invalidateSize:mocks.invalidate,remove:mocks.remove};});
  mocks.setView.mockImplementation(requireOutside);mocks.invalidate.mockImplementation(requireOutside);mocks.remove.mockImplementation(requireOutside);
  mocks.boundsZoom.mockImplementation(bounds=>{requireOutside();return bounds.radius>1_000?11:19;});
  for(const factory of [mocks.tile,mocks.marker,mocks.icon])factory.mockImplementation(()=>{requireOutside();return layer();});
  mocks.circle.mockImplementation((_point,options)=>{requireOutside();return layer(options.radius);});
  mocks.dot.mockImplementation(()=>{requireOutside();return layer();});
});
afterEach(async()=>{
  pages.forEach(value=>value.ngOnDestroy());
  await Promise.resolve();
  vi.clearAllTimers();vi.useRealTimers();vi.unstubAllGlobals();
});

describe('foreground GPS and map placement',()=>{
  it('waits for a tap, requests precise native permission, and renders exact coordinates and accuracy outside Angular',async()=>{
    const value=page();
    expect(mocks.current).not.toHaveBeenCalled();expect(mocks.watch).not.toHaveBeenCalled();
    mocks.check.mockResolvedValue({location:'prompt',coarseLocation:'prompt'});
    await value.getUserLocation();
    expect(mocks.request).toHaveBeenCalledWith({permissions:['location']});
    expect(mocks.current).toHaveBeenCalledWith({enableHighAccuracy:true,maximumAge:0,timeout:20_000});
    expect(mocks.watch).toHaveBeenCalledWith(expect.objectContaining({enableHighAccuracy:true,maximumAge:0,interval:5_000,minimumUpdateInterval:5_000}),expect.any(Function));
    expect(value.userCoords).toEqual({lat:14.641234567,lng:121.042345678});
    expect(value.locationAccuracy).toBe(12.75);expect(value.accuracyMeters).toBe(13);expect(value.locationUpdatedAt).toBe(NOW);
    expect(mocks.circle).toHaveBeenCalledWith([14.641234567,121.042345678],expect.objectContaining({radius:12.75}));
    expect(mocks.dot).toHaveBeenCalledWith([14.641234567,121.042345678],expect.objectContaining({radius:7}));
    expect(mocks.setView).toHaveBeenCalledWith([14.641234567,121.042345678],17,{animate:false});
  });

  it('accepts approximate-only permission and fits the wider accuracy circle',async()=>{
    const value=page();
    mocks.check.mockResolvedValue({location:'denied',coarseLocation:'granted'});
    mocks.request.mockResolvedValue({location:'denied',coarseLocation:'granted'});
    mocks.current.mockResolvedValue(fix(14.64,121.04,2_500));
    await value.getUserLocation();
    expect(value.locationIsApproximate).toBe(true);expect(value.locationStatus).toContain('Approximate');
    expect(value.locationAccuracy).toBe(2_500);
    expect(mocks.setView).toHaveBeenCalledWith([14.64,121.04],11,{animate:false});
  });

  it('uses browser geolocation without unsupported permission APIs, including valid zero coordinates',async()=>{
    const value=page();mocks.native.mockReturnValue(false);mocks.current.mockResolvedValue(fix(0,0,4));
    await value.getUserLocation();
    expect(mocks.check).not.toHaveBeenCalled();expect(mocks.request).not.toHaveBeenCalled();
    expect(value.userCoords).toEqual({lat:0,lng:0});
  });

  it('moves the dot and accuracy circle without recentering until explicit refresh',async()=>{
    const value=page();await value.getUserLocation();
    vi.setSystemTime(NOW+1_000);
    mocks.callbacks[0](fix(14.642345678,121.043456789,8.25));
    expect(mocks.circle.mock.results[0].value.setLatLng).toHaveBeenCalledWith([14.642345678,121.043456789]);
    expect(mocks.circle.mock.results[0].value.setRadius).toHaveBeenCalledWith(8.25);
    expect(mocks.dot.mock.results[0].value.setLatLng).toHaveBeenCalledWith([14.642345678,121.043456789]);
    expect(mocks.setView).toHaveBeenCalledTimes(1);
    await value.getUserLocation();
    expect(mocks.clear).toHaveBeenCalledWith({id:'synthetic-watch-1'});
    expect(mocks.setView).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['latitude',()=>fix(91)],['longitude',()=>fix(14,181)],['NaN',()=>fix(NaN)],
    ['negative accuracy',()=>fix(14,121,-1)],['infinite accuracy',()=>fix(14,121,Infinity)],
    ['stale timestamp',()=>fix(14,121,10,NOW-31_000)],['cached before request',()=>fix(14,121,10,NOW-2_000)],
    ['future timestamp',()=>fix(14,121,10,NOW+6_000)],['missing timestamp',()=>({...fix(),timestamp:NaN})],
  ])('rejects %s without substituting directory coordinates',async(_name,makeFix)=>{
    const value=page();mocks.current.mockResolvedValue(makeFix());await value.getUserLocation();
    expect(value.userCoords).toBeNull();expect(value.locationError).toBeTruthy();
    expect(mocks.circle).not.toHaveBeenCalled();expect(mocks.setView).not.toHaveBeenCalled();expect(mocks.watch).not.toHaveBeenCalled();
    expect(value.locationBusy).toBe(false);
  });

  it('rejects older watch samples and removes fixes that age out without an update',async()=>{
    const value=page();await value.getUserLocation();
    vi.setSystemTime(NOW+1_000);mocks.callbacks[0](fix(14.65,121.05,10));
    mocks.callbacks[0](fix(14.60,121.00,10,NOW+500));
    expect(value.userCoords).toEqual({lat:14.65,lng:121.05});
    await vi.advanceTimersByTimeAsync(30_000);
    expect(value.userCoords).toBeNull();expect(value.locationError).toContain('out of date');
    expect(mocks.circle.mock.results[0].value.remove).toHaveBeenCalled();
    mocks.callbacks[0](fix());expect(value.userCoords).not.toBeNull();expect(value.locationError).toBeNull();
  });

  it.each([1,'OS-PLUG-GLOC-0003'])('removes an old position on permission denial %s and offers retry',async code=>{
    const value=page();await value.getUserLocation();mocks.callbacks[0](null,{code});
    expect(value.userCoords).toBeNull();expect(value.locationError).toContain('permission was denied');
    expect(mocks.clear).toHaveBeenCalledWith({id:'synthetic-watch-1'});
    mocks.callbacks[0](fix());expect(value.userCoords).toBeNull();
    await value.getUserLocation();expect(value.userCoords).not.toBeNull();
  });

  it('does not start location after native permission is refused',async()=>{
    const value=page();mocks.check.mockResolvedValue({location:'prompt',coarseLocation:'prompt'});
    mocks.request.mockResolvedValue({location:'denied',coarseLocation:'denied'});
    await value.getUserLocation();
    expect(mocks.current).not.toHaveBeenCalled();expect(mocks.watch).not.toHaveBeenCalled();expect(value.locationError).toContain('permission was denied');
  });

  it('shows a retryable timeout without inventing a user location',async()=>{
    const value=page();mocks.current.mockRejectedValue({code:'OS-PLUG-GLOC-0010'});
    await value.getUserLocation();expect(value.locationError).toContain('not available in time');expect(value.userCoords).toBeNull();
    mocks.current.mockResolvedValue(fix());await value.getUserLocation();expect(value.locationError).toBeNull();
  });

  it.each(['leave','hidden','destroy'])('clears a running watch on %s and ignores late callbacks',async action=>{
    const value=page();await value.getUserLocation();
    if(action==='leave')value.ionViewWillLeave();
    else if(action==='hidden'){mocks.hidden=true;mocks.visibility.forEach(callback=>callback());}
    else value.ngOnDestroy();
    expect(mocks.clear).toHaveBeenCalledWith({id:'synthetic-watch-1'});
    mocks.callbacks[0](fix());expect(value.userCoords).toBeNull();
    if(action==='hidden'){mocks.hidden=false;mocks.visibility.forEach(callback=>callback());}
    if(action==='leave')value.ionViewDidEnter();
    expect(mocks.watch).toHaveBeenCalledTimes(1);
  });

  it('cleans a watch whose ID arrives after leaving and cannot overwrite a newer watch',async()=>{
    const value=page();const pending=deferred<string>(),created=deferred<void>();
    mocks.watch.mockImplementationOnce((_options,callback)=>{mocks.callbacks.push(callback);created.resolve();return pending.promise;});
    const first=value.getUserLocation();await created.promise;
    value.ionViewWillLeave();value.ionViewDidEnter();await value.getUserLocation();
    pending.resolve('synthetic-old-watch');await first;
    expect(mocks.clear).toHaveBeenCalledWith({id:'synthetic-old-watch'});
    const before=value.userCoords;mocks.callbacks[0](fix(14.7,121.1));expect(value.userCoords).toEqual(before);
    value.ionViewWillLeave();expect(mocks.clear).toHaveBeenCalledWith({id:'synthetic-watch-2'});
  });

  it('ignores a current-position request that finishes after leaving',async()=>{
    const value=page();const pending=deferred<Position>(),started=deferred<void>();
    mocks.current.mockImplementation(()=>{started.resolve();return pending.promise;});
    const request=value.getUserLocation();await started.promise;value.ionViewWillLeave();pending.resolve(fix());await request;
    expect(value.userCoords).toBeNull();expect(mocks.watch).not.toHaveBeenCalled();
  });

  it('cleans a late watch ID even if a permission error callback arrives before creation resolves',async()=>{
    const value=page();mocks.watch.mockImplementation(async(_options,callback)=>{callback(null,{code:1});return 'synthetic-denied-watch';});
    await value.getUserLocation();expect(value.userCoords).toBeNull();expect(mocks.clear).toHaveBeenCalledWith({id:'synthetic-denied-watch'});
  });
});
