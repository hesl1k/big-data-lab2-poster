import {createPublicClient,createWalletClient,http,decodeFunctionData} from 'viem';
import {hardhat} from 'viem/chains';
import {readFileSync,writeFileSync} from 'node:fs';
const abi=JSON.parse(readFileSync(new URL('../artifacts/contracts/Poster.sol/Poster.json',import.meta.url))).abi;
const addresses=JSON.parse(readFileSync(new URL('../ignition/deployments/chain-31337/deployed_addresses.json',import.meta.url)));
const address=addresses['PosterModule#Poster'];
const client=createPublicClient({chain:hardhat,transport:http('http://127.0.0.1:8545')});
const wallet=createWalletClient({chain:hardhat,transport:http('http://127.0.0.1:8545')});
const accounts=await wallet.getAddresses();
for(const [i,[text,tag]] of [['Первая публикация в гостевой книге Poster.','учёба'],['Сообщение от второго участника.','тест'],['Фильтр по тегам работает через события контракта.','учёба']].entries()){
 const hash=await wallet.writeContract({address,abi,functionName:'post',args:[text,tag],account:accounts[i%2]});
 await client.waitForTransactionReceipt({hash});
 const tx=await client.getTransaction({hash});const decoded=decodeFunctionData({abi,data:tx.input});
 if(decoded.args[1]!==tag)throw Error('Calldata tag mismatch');
 console.log('Publication confirmed',hash,tag);
}
const events=await client.getContractEvents({address,abi,eventName:'NewPost',fromBlock:0n});
if(events.length!==3)throw Error('Expected 3 publications');
writeFileSync(new URL('../../poster-ui/public/deployment.local.json',import.meta.url),JSON.stringify({address,block:'1',chain:'31337'},null,2));
console.log('Local deployment',address,'events',events.length);
