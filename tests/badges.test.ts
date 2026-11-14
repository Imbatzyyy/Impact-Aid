import {expect,it} from 'vitest';
import {getBadgeForScore} from '../src/app/models/badge.model';
it('awards every disaster at all three pass thresholds, including volcanic eruption',()=>{
 for(const name of ['Earthquake','Tsunami','Typhoon','Flood','Landslide','Volcanic Eruption']){
  expect(getBadgeForScore(name,59)).toBeNull();
  expect(getBadgeForScore(name,60)?.id).toMatch(/-bronze$/);
  expect(getBadgeForScore(name,80)?.id).toMatch(/-silver$/);
  expect(getBadgeForScore(name,90)?.id).toMatch(/-gold$/);
 }
});
