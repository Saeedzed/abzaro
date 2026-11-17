import test from 'node:test';
import assert from 'node:assert/strict';
import { videoBitrateBudget } from './video-target';
test('calculates target and bitrate budget from video size and duration', () => {
 const x=videoBitrateBudget(100_000_000,100,50);
 assert.equal(x.targetBytes,50_000_000); assert.equal(x.totalKbps,3840);
 assert.equal(x.audioKbps,96); assert.equal(x.videoKbps,3744); assert.equal(x.belowMinimum,false);
});
test('flags impractically tiny budgets', () => {
 const x=videoBitrateBudget(100_000,3600,5); assert.equal(x.belowMinimum,true);assert.equal(x.videoKbps,40);assert.equal(x.audioKbps,16);
});
test('rejects unknown duration and invalid size / percentage', () => {
 for (const values of [[0,1,50],[1,0,50],[1,1,101],[1,1,NaN]]) assert.throws(()=>videoBitrateBudget(values[0]!,values[1]!,values[2]!));
});
