import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
const folder=new URL('../artifacts/build-info/',import.meta.url);
const name=readdirSync(folder).find(n=>n.endsWith('.json')&&!n.endsWith('.output.json'));
if(!name)throw Error('Compile the contract first');
const info=JSON.parse(readFileSync(new URL(name,folder)));
const target=new URL('../../verification/',import.meta.url);mkdirSync(target,{recursive:true});
writeFileSync(new URL('standard-input.json',target),JSON.stringify(info.input,null,2));
writeFileSync(new URL('compiler.txt',target),'Compiler: '+info.solcLongVersion+'\nContract: contracts/Poster.sol:Poster\nConstructor arguments: none\n');
console.log('Verification input exported for',info.solcLongVersion);
