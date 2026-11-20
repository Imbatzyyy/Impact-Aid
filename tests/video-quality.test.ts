import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
vi.mock('@angular/core',()=>({Component:()=>()=>{},ViewChild:()=>()=>{},ChangeDetectionStrategy:{Eager:0}}));
vi.mock('@angular/router',()=>({RouterLink:class{}}));
vi.mock('@ionic/angular',()=>({IonContent:class{},IonIcon:class{}}));
vi.mock('@capacitor/core',()=>({Capacitor:{isNativePlatform:()=>false}}));
vi.mock('../src/app/services/backend',()=>({db:{},progressData:vi.fn()}));
import {COURSE} from '../src/app/models/course';
import {OFFLINE_QUALITY,QUALITIES,STREAM_MB,VIDEO_HOST,rememberQuality,savedQuality,startingQuality,streamMegabytes,videoSrc} from '../src/app/models/video-quality';
import {LessonsPage} from '../src/app/pages/lessons/lessons.page';

const store=new Map<string,string>();
const storage={getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>{store.set(k,v);}};
beforeEach(()=>{store.clear();vi.stubGlobal('localStorage',storage);vi.stubGlobal('navigator',{onLine:true});});
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});

describe('video sources',()=>{
  it('plays 480p from the app and streams every other quality from the site',()=>{
    expect(OFFLINE_QUALITY).toBe('480p');
    expect(videoSrc('flood/floods','480p')).toBe('assets/lessons/flood/floods.mp4');
    expect(videoSrc('flood/floods','144p')).toBe(`${VIDEO_HOST}144p/flood/floods.mp4`);
    expect(videoSrc('flood/floods','1080p')).toBe(`${VIDEO_HOST}1080p/flood/floods.mp4`);
  });
  it('knows the data cost of every streamed quality for every lesson',()=>{
    for(const {video} of COURSE)for(const q of QUALITIES.filter(q=>!q.offline)){
      expect(STREAM_MB[video]?.[q.id],`${video} ${q.id}`).toBeGreaterThan(0);
    }
    expect(streamMegabytes('flood/floods','480p')).toBeNull();
  });
});

describe('remembered quality',()=>{
  it('starts on the offline copy and remembers a streamed choice',()=>{
    expect(savedQuality()).toBe('480p');
    rememberQuality('720p');
    expect(savedQuality()).toBe('720p');
    expect(startingQuality(true)).toBe('720p');
  });
  it('ignores unknown values and storage errors',()=>{
    store.set('ia.videoQuality','4k');
    expect(savedQuality()).toBe('480p');
    vi.stubGlobal('localStorage',{getItem:()=>{throw new Error('blocked');},setItem:()=>{throw new Error('blocked');}});
    expect(()=>rememberQuality('240p')).not.toThrow();
    expect(savedQuality()).toBe('480p');
  });
  it('uses the offline copy when the phone has no connection',()=>{
    rememberQuality('1080p');
    expect(startingQuality(false)).toBe('480p');
  });
});

describe('lesson video player',()=>{
  const player=(time=0,paused=true)=>({currentTime:time,paused,ended:false,duration:227,isConnected:true,play:vi.fn().mockResolvedValue(undefined)});
  const openFlood=()=>{const page=new LessonsPage();page.open(3);return page;};

  it('switches quality and keeps the viewer’s place',()=>{
    vi.useFakeTimers();
    const page=openFlood(),video=player(61.5,false);
    page.setQuality('720p',video as never);
    expect(page.quality).toBe('720p');
    expect(page.videoSrc('flood/floods')).toBe(`${VIDEO_HOST}720p/flood/floods.mp4`);
    expect(store.get('ia.videoQuality')).toBe('720p');
    vi.runAllTimers();
    expect(video.play).toHaveBeenCalled();
    video.currentTime=0;video.play.mockClear();
    page.restore(video as never);
    expect(video.currentTime).toBe(61.5);
    expect(video.play).toHaveBeenCalled();
    expect(page.qualityNote).toBe('HD · Streams over the internet, about 20 MB for this video.');
  });

  it('falls back to the saved copy when a stream cannot load',()=>{
    vi.useFakeTimers();
    store.set('ia.videoQuality','1080p');
    const page=openFlood(),video=player(30);
    expect(page.quality).toBe('1080p');
    page.fallBack(video as never);
    expect(page.quality).toBe('480p');
    expect(page.failedQuality).toBe('1080p');
    expect(page.qualityNote).toBe('1080p stopped, so the 480p copy saved on your phone took over. Choose 1080p again to stream it.');
    expect(store.get('ia.videoQuality')).toBe('1080p');
    vi.runAllTimers();
    expect(video.play).toHaveBeenCalled();
    page.fallBack(video as never);
    expect(page.quality).toBe('480p');
  });

  it('keeps the place when a stream fails before it ever loads',()=>{
    vi.useFakeTimers();
    const page=openFlood(),video=player(49,false);
    page.setQuality('720p',video as never);
    video.currentTime=0;// the new file reset the player, then failed
    page.fallBack(video as never);
    page.restore(video as never);
    expect(page.quality).toBe('480p');
    expect(video.currentTime).toBe(49);
  });

  it('keeps streamed choices off while offline',()=>{
    vi.stubGlobal('navigator',{onLine:false});
    store.set('ia.videoQuality','720p');
    const page=openFlood();
    expect(page.quality).toBe('480p');
    page.setQuality('240p',player() as never);
    expect(page.quality).toBe('480p');
    expect(page.qualityNote).toBe('You’re offline. The 480p copy saved on your phone still plays.');
  });

  it('hands a streaming video to the saved copy when the phone goes offline',()=>{
    vi.useFakeTimers();
    const listeners:Record<string,()=>void>={};
    vi.stubGlobal('addEventListener',(type:string,fn:()=>void)=>{listeners[type]=fn;});
    vi.stubGlobal('removeEventListener',()=>{});
    const page=new LessonsPage();
    void page.ionViewWillEnter().catch(()=>{});
    page.open(3);
    const paused=player(80);
    page.setQuality('720p',paused as never);
    page.player={nativeElement:paused as never};
    vi.stubGlobal('navigator',{onLine:false});
    listeners['offline']();
    expect(page.quality).toBe('480p');
    expect(page.online).toBe(false);
    expect(page.qualityNote).toBe('You’re offline, so the 480p copy saved on your phone took over. Choose 720p again when you’re back online.');
    vi.runAllTimers();
    expect(paused.play).not.toHaveBeenCalled();
  });
});
