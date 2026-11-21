import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const artifact=JSON.parse(readFileSync(new URL('../artifacts/contracts/Poster.sol/Poster.json',import.meta.url)));
const target=new URL('../../poster-ui/public/',import.meta.url);mkdirSync(target,{recursive:true});
writeFileSync(new URL('Poster.json',target),JSON.stringify({abi:artifact.abi,bytecode:artifact.bytecode},null,2));
console.log('ABI and bytecode synchronized');
