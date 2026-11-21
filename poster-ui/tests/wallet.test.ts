import {test} from 'node:test';
import assert from 'node:assert/strict';
import {walletRequest} from '../lib/wallet.ts';

test('returns provider result and submits exactly one request',async()=>{
 let calls=0;
 const result=await walletRequest<string[]>({request:async args=>{calls++;assert.equal(args.method,'eth_requestAccounts');return ['0x123'];}},{method:'eth_requestAccounts'},100);
 assert.deepEqual(result,['0x123']);assert.equal(calls,1);
});
test('stalled extension request times out instead of locking UI forever',async()=>{
 await assert.rejects(walletRequest({request:()=>new Promise(()=>{})},{method:'eth_requestAccounts'},15),/MetaMask не ответил/);
});
test('existing pending request gives actionable error, without retrying',async()=>{
 let calls=0;
 await assert.rejects(walletRequest({request:async()=>{calls++;throw {code:-32002};}},{method:'eth_requestAccounts'},100),/уже ожидает запрос/);
 assert.equal(calls,1);
});
test('user rejection is distinguished from other wallet errors',async()=>{
 await assert.rejects(walletRequest({request:async()=>{throw {code:4001};}},{method:'eth_requestAccounts'},100),/отклонено/);
});
