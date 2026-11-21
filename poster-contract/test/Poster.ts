import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { keccak256, toHex, decodeFunctionData } from "viem";

describe("Poster", async () => {
 const { viem } = await network.connect();
 const client = await viem.getPublicClient();
 const wallets = await viem.getWalletClients();
 it("starts without publications", async () => {
  const c = await viem.deployContract("Poster");
  const logs = await client.getContractEvents({address:c.address,abi:c.abi,eventName:"NewPost",fromBlock:0n});
  assert.equal(logs.length,0);
 });
 it("emits author, content and indexed tag; recovers text from calldata", async () => {
  const c = await viem.deployContract("Poster");
  const hash = await c.write.post(["Привет, блокчейн!","учёба"]);
  await client.waitForTransactionReceipt({hash});
  const logs = await client.getContractEvents({address:c.address,abi:c.abi,eventName:"NewPost",fromBlock:0n,strict:true});
  assert.equal(logs.length,1);
  assert.equal(logs[0].args.user.toLowerCase(),wallets[0].account.address.toLowerCase());
  assert.equal(logs[0].args.content,"Привет, блокчейн!");
  assert.equal(logs[0].args.tag,keccak256(toHex("учёба")));
  const tx=await client.getTransaction({hash});
  const decoded=decodeFunctionData({abi:c.abi,data:tx.input});
  assert.deepEqual(decoded.args,["Привет, блокчейн!","учёба"]);
 });
 it("accepts different authors and filters indexed tags", async () => {
  const c=await viem.deployContract("Poster");
  for(const [i,tag] of ["lab","other","lab"].entries()) {
   const hash=await c.write.post([`Message ${i}`,tag],{account:wallets[i%2].account});
   await client.waitForTransactionReceipt({hash});
  }
  const all=await client.getContractEvents({address:c.address,abi:c.abi,eventName:"NewPost",fromBlock:0n,strict:true});
  assert.equal(all.length,3);
  assert.equal(all[1].args.user.toLowerCase(),wallets[1].account.address.toLowerCase());
  const filtered=await client.getContractEvents({address:c.address,abi:c.abi,eventName:"NewPost",args:{tag:"lab"},fromBlock:0n,strict:true});
  assert.equal(filtered.length,2);
 });
 it("preserves empty strings and special characters", async()=>{
  const c=await viem.deployContract("Poster");
  const hash=await c.write.post(["",""]);
  await client.waitForTransactionReceipt({hash});
  const logs=await client.getContractEvents({address:c.address,abi:c.abi,eventName:"NewPost",fromBlock:0n,strict:true});
  assert.equal(logs[0].args.content,"");
  assert.equal(logs[0].args.tag,keccak256(toHex("")));
 });
});
