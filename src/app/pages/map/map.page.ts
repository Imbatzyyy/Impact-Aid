import { NgZone } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Geolocation, Position, PositionOptions } from '@capacitor/geolocation';
import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';

import {
  IonContent,
  IonIcon,
  IonSpinner,
  ToastController,
} from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

import { EmergencyPlace, PlaceResult, PlaceDirectory, PlaceType, PLACE_CATEGORIES, findPlaces, escapeMapText, dialablePhone, distanceKm } from '../../models/emergency-places';
import { showToast, Tone } from '../../ui/feedback';

const FRESH_FIX_MS = 30_000;
const QC_CENTER = { lat: 14.641, lng: 121.042 };
/** Quezon City's own guides are only useful while browsing in or near the city. */
const QC_LINKS_KM = 15;
const DISTANCE_PHRASES: Record<string, string> = {
  'Your location': 'your location', 'Selected map area': 'the selected map area', 'Last location search': 'your last location',
};
const LOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true, maximumAge: 0, timeout: 20_000,
};

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, IonSpinner, CommonModule, FormsModule, RouterLink],
})
export class MapPage implements AfterViewInit, OnDestroy {
  @ViewChild('mapElement', { static: false }) mapElement!: ElementRef;

  selectedType: PlaceType | 'all' = 'all';
  searchQuery = '';
  selectedPlace: PlaceResult | null = null;
  userCoords: { lat: number; lng: number } | null = null;
  map: L.Map | null = null;
  markers: L.Marker[] = [];
  private markerById=new Map<string,L.Marker>();
  mapLoading = true;
  mapError: string | null = null;
  locationBusy = false;
  locationError: string | null = null;
  locationStatus = 'Use your location to see nearby places. Location is optional.';
  locationAccuracy: number | null = null;
  locationUpdatedAt: number | null = null;
  approximatePermission = false;
  private pageVisible = false;
  private destroyed = false;
  private locationRun = 0;
  private requestedAt = 0;
  private centerOnNextFix = false;
  private watchIds = new Set<string>();
  private staleTimer?: ReturnType<typeof setTimeout>;
  private accuracyCircle: L.Circle | null = null;
  private userDot: L.CircleMarker | null = null;
  private readonly visibilityChanged = () => {
    if (document.hidden) this.zone.run(() => this.pauseLocation('Location paused. Tap Use my location when you return.'));
  };

  get accuracyMeters() { return this.locationAccuracy === null ? null : Math.ceil(this.locationAccuracy); }
  get locationIsApproximate() { return this.approximatePermission || (this.locationAccuracy ?? 0) > 100; }

  readonly placeCategories = PLACE_CATEGORIES;
  locations: EmergencyPlace[] = [];
  filteredLocations: PlaceResult[] = [];
  directoryLoading = true;
  directoryError = '';
  directoryUpdatedAt = '';
  radiusKm = 10;
  browseCenter = {lat:14.641,lng:121.042};
  browseLabel = 'Quezon City';
  listLimit = 30;
  markersInView = 0;
  matchingInView = 0;
  private directoryController?:AbortController;
  private mapResizeObserver?:ResizeObserver;
  private mapViewCenter={lat:14.641,lng:121.042};
  private mapViewZoom=12;
  visiblePlaces:PlaceResult[]=[];
  morePlaces(){this.listLimit+=30;this.visiblePlaces=this.filteredLocations.slice(0,this.listLimit);}
  private iconCache=new Map<string,L.DivIcon>();
  private searchTimer?:ReturnType<typeof setTimeout>;
  /** "Quezon City", "your location"…, ready to follow "from". */
  get distancePhrase(){return DISTANCE_PHRASES[this.browseLabel] ?? this.browseLabel;}
  get distanceLabel(){return 'Straight-line distance from ' + this.distancePhrase;}
  get nearQuezonCity(){return distanceKm(this.browseCenter,QC_CENTER)<=QC_LINKS_KM;}
  get publicMode(){return typeof window !== 'undefined' && window.location.pathname==='/places';}

  async loadDirectory(){
    this.directoryController?.abort();
    const controller=new AbortController();this.directoryController=controller;
    this.directoryLoading=true;this.directoryError='';
    try{
      const response=await fetch('assets/data/emergency-places.json',{signal:controller.signal});
      if(!response.ok)throw Error('directory unavailable');
      const data:PlaceDirectory=await response.json();
      if(!Array.isArray(data.places)||!data.places.length)throw Error('empty directory');
      if(this.destroyed||controller.signal.aborted)return;
      this.locations=data.places;this.directoryUpdatedAt=data.updatedAt;this.refreshResults();
    }catch{
      if(!this.destroyed&&!controller.signal.aborted)this.directoryError='The saved directory could not be opened. Please retry.';
    }finally{if(this.directoryController===controller)this.directoryLoading=false;}
  }

  refreshResults(reset=true){
    if(reset){this.listLimit=30;this.selectedPlace=null;}
    this.filteredLocations=findPlaces(this.locations,this.browseCenter,this.radiusKm,this.selectedType,this.searchQuery);
    this.visiblePlaces=this.filteredLocations.slice(0,this.listLimit);
    this.updateMarkers();
  }

  searchMapArea(){
    if(!this.map)return;
    this.zone.runOutsideAngular(()=>{const center=this.map!.getCenter();this.browseCenter={lat:center.lat,lng:center.lng};});
    this.browseLabel='Selected map area';if(this.radiusKm===0)this.radiusKm=10;
    this.refreshResults();
  }

  showOnMap(place:PlaceResult){
    this.selectedPlace=place;
    const reduceMotion=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.mapElement.nativeElement.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'center'});
    this.zone.runOutsideAngular(()=>{
      const map=this.map;if(!map)return;
      const reveal=()=>{if(this.selectedPlace?.id!==place.id)return;this.updateMarkers();this.markerById.get(place.id)?.openPopup();};
      if(reduceMotion||typeof map.flyTo!=='function'){map.setView([place.lat,place.lng],16,{animate:false});reveal();return;}
      // Glide to the place, then open its card once the map settles.
      map.once('moveend',reveal);
      map.flyTo([place.lat,place.lng],16,{duration:0.9,easeLinearity:0.3});
    });
  }

  category(type:string){return this.placeCategories.find(c=>c.id===type)??this.placeCategories[0];}
  phoneFor(place:EmergencyPlace){return dialablePhone(place.phone);}
  placeNote(place:EmergencyPlace){
    if(place.type==='evacuation')return 'Mapped evacuation facility. Confirm activation, capacity and safe access with your LGU before travelling.';
    if(place.type==='government')return 'Local coordination and assistance office. This listing does not confirm a dispatch team or 24-hour service.';
    if(place.type==='hospital')return 'Confirm emergency department services and availability with the facility.';
    return 'Contact the facility to confirm current response services and availability.';
  }
  constructor(private toastController: ToastController, private zone:NgZone) {}

  ngAfterViewInit(){
    document.addEventListener('visibilitychange', this.visibilityChanged);
    void this.loadDirectory();
  }
  ionViewDidEnter(){
    this.pageVisible=true;
    this.zone.runOutsideAngular(()=>{if(!this.map)this.initializeMap();else this.resizeMap();});
  }
  ionViewWillLeave(){
    this.pageVisible=false;
    this.pauseLocation('Location paused. Tap Use my location to start again.');
  }
  /** Says "paused" only when location was actually on; otherwise the current message stays. */
  private pauseLocation(message:string){
    const wasActive=this.locationBusy||this.watchIds.size>0||this.userCoords!==null;
    void this.stopLocation(wasActive?message:this.locationStatus);
  }

  ngOnDestroy() {
    clearTimeout(this.searchTimer);this.destroyed=true;
    this.directoryController?.abort();
    this.mapResizeObserver?.disconnect();
    this.pageVisible=false;
    document.removeEventListener('visibilitychange', this.visibilityChanged);
    void this.stopLocation('Location stopped.');
    this.zone.runOutsideAngular(()=>{this.map?.remove();this.map=null;});
  }

  async getUserLocation(){
    if(this.destroyed || !this.pageVisible || document.hidden || this.locationBusy)return;
    const cleanup=this.stopLocation('Getting a fresh location…');
    const run=this.locationRun;
    this.locationBusy=true;this.locationError=null;this.centerOnNextFix=true;
    try{
      if(!await cleanup || !this.isLocationActive(run))return;
      this.approximatePermission=false;
      if(Capacitor.isNativePlatform()){
        let permission=await Geolocation.checkPermissions();
        if(!this.isLocationActive(run))return;
        if(permission.location!=='granted'){
          permission=await Geolocation.requestPermissions({permissions:['location']});
          if(!this.isLocationActive(run))return;
        }
        if(permission.location!=='granted' && permission.coarseLocation!=='granted'){
          this.locationFailed(run,{code:'OS-PLUG-GLOC-0003'});return;
        }
        this.approximatePermission=permission.location!=='granted';
      }
      this.requestedAt=Date.now();
      const position=await Geolocation.getCurrentPosition({...LOCATION_OPTIONS});
      if(!this.isLocationActive(run))return;
      if(!this.acceptPosition(position,run)){this.locationStatus='No current location is shown.';return;}
      const id=await this.zone.runOutsideAngular(()=>Geolocation.watchPosition(
        {...LOCATION_OPTIONS,interval:5_000,minimumUpdateInterval:5_000},
        (next,error)=>{
          if(!this.isLocationActive(run))return;
          this.zone.run(()=>{
            if(error)this.locationFailed(run,error);
            else this.acceptPosition(next,run);
          });
        }
      ));
      this.watchIds.add(id);
      // Native watch creation may finish after the user has left or retried.
      if(!this.isLocationActive(run))await this.releaseWatch(id);
    }catch(error){this.locationFailed(run,error);}
    finally{if(run===this.locationRun)this.locationBusy=false;}
  }

  private isLocationActive(run:number){
    return run===this.locationRun && this.pageVisible && !this.destroyed && !document.hidden;
  }

  private acceptPosition(position:Position|null,run:number):boolean{
    if(!this.isLocationActive(run))return false;
    const coords=position?.coords,now=Date.now(),timestamp=position?.timestamp;
    if(!coords || !Number.isFinite(coords.latitude) || Math.abs(coords.latitude)>90 ||
      !Number.isFinite(coords.longitude) || Math.abs(coords.longitude)>180 ||
      !Number.isFinite(coords.accuracy) || coords.accuracy<0){
      this.locationError='The device returned an invalid location. Retry location.';return false;
    }
    if(typeof timestamp!=='number' || !Number.isFinite(timestamp) ||
      timestamp<Math.max(now-FRESH_FIX_MS,this.requestedAt-1_000) || timestamp>now+5_000 ||
      (this.locationUpdatedAt!==null && timestamp<this.locationUpdatedAt)){
      this.locationError='An outdated location was ignored. Waiting for a fresh fix; you can retry.';return false;
    }
    this.userCoords={lat:coords.latitude,lng:coords.longitude};
    this.locationAccuracy=coords.accuracy;this.locationUpdatedAt=timestamp;
    this.locationError=null;
    this.locationStatus=this.locationIsApproximate
      ? 'Approximate location. The circle shows the reported uncertainty.'
      : 'Location updated. The circle shows the reported uncertainty.';
    if(this.centerOnNextFix||(this.browseLabel==='Your location'&&(this.browseCenter.lat!==coords.latitude||this.browseCenter.lng!==coords.longitude))){this.browseCenter={...this.userCoords};this.browseLabel='Your location';this.refreshResults(false);}
    this.renderUserLocation();
    clearTimeout(this.staleTimer);
    this.zone.runOutsideAngular(()=>{
      this.staleTimer=setTimeout(()=>{
        if(!this.isLocationActive(run))return;
        this.zone.run(()=>{
          this.clearUserLocation();
          this.locationError='Location is out of date. Waiting for a fresh fix; tap Retry location if needed.';
          this.locationStatus='No current location is shown.';
        });
      },Math.max(1,timestamp+FRESH_FIX_MS-now));
    });
    return true;
  }

  private locationFailed(run:number,error:unknown){
    if(!this.isLocationActive(run))return;
    const code=String((error as {code?:unknown})?.code ?? '');
    void this.stopLocation('No current location is shown. The facility directory is still available.');
    this.locationError=code==='1' || code==='OS-PLUG-GLOC-0003'
      ? 'Location permission was denied. Allow location in device or browser settings, then retry.'
      : ['OS-PLUG-GLOC-0007','OS-PLUG-GLOC-0009','OS-PLUG-GLOC-0017'].includes(code)
        ? 'Location services are off. Turn on device location, then retry.'
        : code==='3' || code==='OS-PLUG-GLOC-0010'
          ? 'A fresh location was not available in time. Move to a clearer view of the sky and retry.'
          : 'Could not get location updates. Check location settings and retry.';
  }

  private stopLocation(status:string):Promise<boolean>{
    this.locationRun++;
    this.locationBusy=false;this.locationStatus=status;this.locationError=null;
    this.centerOnNextFix=false;
    this.clearUserLocation();
    return Promise.all([...this.watchIds].map(id=>this.releaseWatch(id))).then(results=>results.every(Boolean));
  }

  private async releaseWatch(id:string):Promise<boolean>{
    try{
      await Geolocation.clearWatch({id});this.watchIds.delete(id);return true;
    }catch(error){
      if((error as {code?:string})?.code==='OS-PLUG-GLOC-0012'){
        this.watchIds.delete(id);return true;
      }
      // Retain the ID for another cleanup attempt on leave/destroy/retry.
      if(!this.destroyed)this.zone.run(()=>{this.locationError='Could not stop location updates. Close the app to stop tracking, then reopen it.';});
      return false;
    }
  }

  private clearUserLocation(){
    clearTimeout(this.staleTimer);this.staleTimer=undefined;
    this.userCoords=null;this.locationAccuracy=null;this.locationUpdatedAt=null;
    if(this.browseLabel==='Your location')this.browseLabel='Last location search';
    this.zone.runOutsideAngular(()=>{
      this.accuracyCircle?.remove();this.accuracyCircle=null;
      this.userDot?.remove();this.userDot=null;
    });
  }

  private renderUserLocation(){
    this.zone.runOutsideAngular(()=>{
      if(!this.map || !this.userCoords || this.locationAccuracy===null)return;
      const point:L.LatLngTuple=[this.userCoords.lat,this.userCoords.lng];
      if(this.accuracyCircle){this.accuracyCircle.setLatLng(point);this.accuracyCircle.setRadius(this.locationAccuracy);}
      else this.accuracyCircle=L.circle(point,{radius:this.locationAccuracy,color:'#2563eb',weight:1,fillColor:'#2563eb',fillOpacity:0.14,interactive:false}).addTo(this.map);
      if(this.userDot)this.userDot.setLatLng(point);
      else this.userDot=L.circleMarker(point,{pane:'impactUserLocation',radius:7,color:'#ffffff',weight:3,fillColor:'#1769e0',fillOpacity:1,interactive:false}).addTo(this.map);
      if(this.centerOnNextFix){
        const zoom=Math.max(2,Math.min(17,this.map.getBoundsZoom(this.accuracyCircle.getBounds(),false,L.point(48,48))));
        this.map.setView(point,zoom,{animate:false});
        this.centerOnNextFix=false;
      }
    });
  }
  private resizeMap(){
    if(!this.map)return;
    const center={...this.mapViewCenter},zoom=this.mapViewZoom;
    this.map.invalidateSize({pan:false});this.map.setView(center,zoom,{animate:false});
  }
  initializeMap() {
    this.zone.runOutsideAngular(()=>{
    if (!this.mapElement) return;

    try {
      // Create Leaflet map with OpenStreetMap tiles (FREE!)
      this.map = L.map(this.mapElement.nativeElement, {
        zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false,
        center: [14.641,121.042],
        zoom: 12,
        zoomControl: true,trackResize:false,
      });

      // Keep the user's fix visible even when it coincides with a facility marker.
      const userPane=this.map.createPane('impactUserLocation');
      userPane.style.zIndex='650';
      userPane.style.pointerEvents='none';

      // Add OpenStreetMap tile layer
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(this.map);

      this.map.on('moveend',()=>{
        if(!this.map)return;const center=this.map.getCenter();
        this.mapViewCenter={lat:center.lat,lng:center.lng};this.mapViewZoom=this.map.getZoom();
        this.zone.run(()=>this.updateMarkers());
      });
      if(typeof ResizeObserver!=='undefined'){
        this.mapResizeObserver=new ResizeObserver(()=>{
          if(!this.map||!this.pageVisible)return;
          this.resizeMap();
          this.zone.run(()=>this.updateMarkers());
        });
        this.mapResizeObserver.observe(this.mapElement.nativeElement);
      }
      this.updateMarkers();
      this.renderUserLocation();
      this.zone.run(()=>{this.mapLoading=false;});
      
    } catch (error) {
      this.zone.run(()=>{this.mapError='Failed to initialize map';this.mapLoading=false;});
      console.error('Map error:', error);
    }
    });
  }

  updateMarkers() {
    this.zone.runOutsideAngular(()=>{
    if (!this.map) return;



    const bounds=this.map.getBounds();
    const visible:PlaceResult[]=[];let count=0;
    const limit=this.mapElement.nativeElement.clientWidth<600?72:120;
    for(const loc of this.filteredLocations){if(!bounds.contains([loc.lat,loc.lng]))continue;count++;if(visible.length<limit)visible.push(loc);}
    const selected=this.selectedPlace;
    if(selected&&bounds.contains([selected.lat,selected.lng])&&!visible.some(p=>p.id===selected.id)&&this.filteredLocations.some(p=>p.id===selected.id)){
      if(visible.length===limit)visible.pop();
      visible.push(selected);
    }
    this.matchingInView=count;this.markersInView=visible.length;
    const ids=new Set(visible.map(p=>p.id));
    for(const [id,marker] of this.markerById){if(!ids.has(id)){marker.remove();this.markerById.delete(id);}}
    visible.forEach((loc) => {
      if(this.markerById.has(loc.id))return;
      const marker=L.marker([loc.lat,loc.lng],{icon:this.getLeafletIcon(loc.type),title:loc.name,alt:loc.name})
        .addTo(this.map!)
        .bindPopup(()=>this.createPlacePopup(loc),{className:'impact-place-popup',minWidth:210,maxWidth:280,maxHeight:Math.min(300,this.mapElement.nativeElement.clientHeight-100),autoPanPadding:L.point(18,18)});
      marker.getElement()?.setAttribute('aria-label',loc.name);
      marker.on('click',()=>this.zone.run(()=>this.onMarkerClick(loc)));
      marker.on('popupclose',()=>this.zone.run(()=>{if(this.selectedPlace?.id===loc.id)this.selectedPlace=null;}));
      this.markerById.set(loc.id,marker);
    });
    this.markers=[...this.markerById.values()];
    });
  }

  private createPlacePopup(place:EmergencyPlace):HTMLElement{
    const category=this.category(place.type),phone=this.phoneFor(place);
    const root=document.createElement('section');root.className='facility-popup';
    root.setAttribute('aria-label',place.name);
    root.innerHTML=`<div class="popup-category" style="color:${category.color}"><span style="background:${category.color}">${category.mark}</span>${escapeMapText(category.name)}</div>
      <h2>${escapeMapText(place.name)}</h2><p class="popup-contact">${phone ? escapeMapText(phone) : 'Contact number not supplied'}</p>
      <div class="popup-actions">${phone ? '<button type="button" class="popup-call">Call facility</button>' : ''}<button type="button" class="popup-directions">Directions</button></div>
      <p class="popup-address">${escapeMapText(place.address)}</p><p class="popup-note">${escapeMapText(this.placeNote(place))}</p>
      <a class="popup-source" href="${escapeMapText(place.source)}" target="_blank" rel="noopener">Map source ↗</a>
      ${place.phoneSource ? `<a class="popup-source" href="${escapeMapText(place.phoneSource)}" target="_blank" rel="noopener">Official contact ↗</a>` : ''}
      <p class="popup-footnote">${place.coordinateKind==='site' ? 'Site center; entrance may differ.' : 'Community-mapped location.'}${phone ? (place.phoneSource ? ' Official directory contact.' : ' Number supplied by map contributor.') : ''}</p>`;
    root.querySelector('.popup-call')?.addEventListener('click',()=>this.zone.run(()=>this.handleCall(phone)));
    root.querySelector('.popup-directions')?.addEventListener('click',()=>this.zone.run(()=>this.handleGetDirections(place)));
    return root;
  }

  getLeafletIcon(type: string): L.DivIcon {
    const category=this.category(type);
    const cached=this.iconCache.get(type);if(cached)return cached;
    const icon=L.divIcon({className:'custom-marker',
      html:`<div style="width:28px;height:28px;display:grid;place-items:center;background:${category.color};color:white;font:bold 14px system-ui;border:2px solid white;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);box-shadow:0 2px 5px #0005"><span style="transform:rotate(45deg)">${category.mark}</span></div>`,
      iconSize:[28,28],iconAnchor:[14,28],popupAnchor:[0,-28]});
    this.iconCache.set(type,icon);return icon;
  }

  onMarkerClick(loc:PlaceResult){this.selectedPlace=loc;}
  trackPlace(_index:number,place:PlaceResult){return place.id;}
  onSearchChange(){clearTimeout(this.searchTimer);this.searchTimer=setTimeout(()=>this.refreshResults(),130);}
  onFilterChange(type:PlaceType|'all'){this.selectedType=type;this.refreshResults();}

  handleGetDirections(p: EmergencyPlace) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`, '_blank');
    void this.showToast('Opening directions in Google Maps', 'success');
  }

  handleCall(phone: string) {
    window.location.href='tel:'+phone.replace(/[^0-9+]/g,'');
  }

  showToast(message: string, color: Tone = 'primary') { return showToast(this.toastController, message, color, 2000); }
}
