"use client";
import { useEffect, useState } from "react";
import Web3 from "web3";
import artifact from "../public/Poster.json";
import { walletRequest } from "../lib/wallet";

type Provider = {request: (args:{method:string;params?:unknown[]})=>Promise<unknown>;on?:(event:string,fn:()=>void)=>void;removeListener?:(event:string,fn:()=>void)=>void};
declare global {interface Window {ethereum?:Provider}}
type Post={content:string;tag:string;author:string;hash:string};
type Deployment={address:string;block:string;chain:string};
const networks={sepolia:{chain:"11155111",label:"Ethereum Sepolia",rpc:"https://ethereum-sepolia-rpc.publicnode.com",explorer:"https://eth-sepolia.blockscout.com"},local:{chain:"31337",label:"Локальная Hardhat",rpc:"http://127.0.0.1:8545",explorer:""}};
export default function Home(){
 const [mode,setMode]=useState<"sepolia"|"local">("sepolia");
 const [account,setAccount]=useState("");const [deployment,setDeployment]=useState<Deployment|null>(null);
 const [address,setAddress]=useState("");const [start,setStart]=useState("0");
 const [posts,setPosts]=useState<Post[]>([]);const [content,setContent]=useState("");const [tag,setTag]=useState("");const [filter,setFilter]=useState("");
 const [status,setStatus]=useState("Подключите MetaMask, чтобы оставить сообщение.");const [busy,setBusy]=useState(false);
 const net=networks[mode];
 useEffect(()=>{let active=true;const stored=localStorage.getItem(`poster-${net.chain}`);setPosts([]);setFilter("");setDeployment(null);setAddress("");setStart("0");if(stored){const d=JSON.parse(stored) as Deployment;setDeployment(d);setAddress(d.address);setStart(d.block);}else{fetch(`/deployment.${mode}.json`).then(r=>r.json()).then((d:Deployment)=>{if(active){setDeployment(d);setAddress(d.address);setStart(d.block);}}).catch(()=>{});}return()=>{active=false;};},[net.chain,mode]);
 useEffect(()=>{const changed=()=>{setAccount("");setStatus("Аккаунт или сеть изменены. Подключите MetaMask снова.");};window.ethereum?.on?.("accountsChanged",changed);window.ethereum?.on?.("chainChanged",changed);return()=>{window.ethereum?.removeListener?.("accountsChanged",changed);window.ethereum?.removeListener?.("chainChanged",changed);};},[]);
 function remember(d:Deployment){setDeployment(d);setAddress(d.address);setStart(d.block);localStorage.setItem(`poster-${net.chain}`,JSON.stringify(d));}
 async function run(fn:()=>Promise<void>){setBusy(true);try{await fn();}catch(e){setStatus(e instanceof Error?e.message:String(e));}finally{setBusy(false);}}
 async function wallet(){
  if(!window.ethereum)throw Error("MetaMask не найден. Откройте приложение в Chrome с расширением MetaMask.");
  setStatus("Ожидание MetaMask: нажмите значок лисы в Chrome и разрешите подключение.");
  const accounts=await walletRequest<string[]>(window.ethereum,{method:"eth_requestAccounts"});
  if(!accounts.length)throw Error("MetaMask не предоставил аккаунт. Повторите подключение.");
  const chain=await walletRequest<string>(window.ethereum,{method:"eth_chainId"},10000);
  if(BigInt(chain)!==BigInt(net.chain))throw Error(`Выберите в MetaMask сеть ${net.label}, затем подключитесь снова.`);
  setAccount(accounts[0]);return {web3:new Web3(window.ethereum as never),from:accounts[0]};
 }
 async function load(d=deployment){
  if(!d)throw Error("Сначала укажите адрес контракта.");
  const w=new Web3(net.rpc);if(!Web3.utils.isAddress(d.address))throw Error("Некорректный адрес контракта.");
  if(await w.eth.getCode(d.address)==="0x")throw Error("По этому адресу в выбранной сети нет контракта.");
  const c=new w.eth.Contract(artifact.abi,d.address);const latest=await w.eth.getBlockNumber();const events=[];
  const from=BigInt(d.block);if(from>latest)throw Error("Начальный блок ещё не существует.");
  if(latest-from>200000n)throw Error("Укажите блок развёртывания: диапазон поиска слишком большой.");
  for(let b=from;b<=latest;b+=5000n){events.push(...await c.getPastEvents("allEvents",{fromBlock:b,toBlock:b+4999n>latest?latest:b+4999n}));}
  const result:Post[]=[];
  for(const ev of events){if(typeof ev==="string"||ev.event!=="NewPost"||!ev.returnValues)continue;
   const tx=await w.eth.getTransaction(ev.transactionHash!);let readable="";
   try{const decoded=w.eth.abi.decodeParameters(["string","string"],"0x"+tx.input.slice(10));readable=String(decoded[1]);}catch{readable="[тег недоступен]";}
   result.push({content:String(ev.returnValues.content),tag:readable,author:String(ev.returnValues.user),hash:ev.transactionHash!});
  }
  setPosts(result.reverse());setStatus(`Загружено публикаций: ${result.length}.`);
 }
 async function deploy(){const {web3,from}=await wallet();setStatus("Подтвердите создание контракта в MetaMask.");
  const c=new web3.eth.Contract(artifact.abi);let block="0";
  const instance=await c.deploy({data:artifact.bytecode}).send({from}).on("receipt",r=>{block=String(r.blockNumber);});
  const d={address:instance.options.address!,block,chain:net.chain};remember(d);setStatus(`Контракт развёрнут: ${d.address}`);await load(d);
 }
 async function publish(){if(!deployment)throw Error("Контракт не выбран.");if(!content.trim()||!tag.trim())throw Error("Заполните текст и тег.");
  const {web3,from}=await wallet();const c=new web3.eth.Contract(artifact.abi,deployment.address);
  setStatus("Подтвердите публикацию в MetaMask.");await c.methods.post(content.trim(),tag.trim()).send({from});setContent("");setTag("");await load();
 }
 async function attach(){if(!Web3.utils.isAddress(address)||!/^\d+$/.test(start))throw Error("Проверьте адрес и начальный блок.");
  const d={address,block:start,chain:net.chain};await load(d);remember(d);
 }
 const shown=posts.filter(p=>!filter||p.tag===filter);
 return <main><header><a className="brand" href="/">P<span>◦</span>ster</a><span className="badge">ЛАБОРАТОРНАЯ РАБОТА 02</span><select aria-label="Сеть" value={mode} onChange={e=>{setMode(e.target.value as typeof mode);setAccount("");}}><option value="sepolia">Ethereum Sepolia</option><option value="local">Локальная Hardhat</option></select></header>
 <section className="intro"><p className="eyebrow">ГОСТЕВАЯ КНИГА В БЛОКЧЕЙНЕ</p><h1>Слова остаются.<br/><span>В блокчейне тоже.</span></h1><p>Подключите кошелёк, оставьте сообщение и найдите записи по тегу. Каждая публикация — событие смарт-контракта Poster.</p></section>
 <div className="grid"><aside><section className="card"><h2>Ваш кошелёк</h2><p className="muted">{account?"Подключённый аккаунт":"Для публикаций нужен MetaMask"}</p>{account&&<code>{account}</code>}<button disabled={busy} onClick={()=>run(async()=>{await wallet();setStatus("Кошелёк подключён.");})}>Подключить MetaMask ↗</button></section>
 <section className="card"><h2>Контракт</h2><label>Адрес контракта<input value={address} onChange={e=>setAddress(e.target.value)} placeholder="0x…"/></label><label>Блок развёртывания<input value={start} onChange={e=>setStart(e.target.value)} inputMode="numeric"/></label><button className="secondary" disabled={busy} onClick={()=>run(attach)}>Открыть контракт</button><details><summary>Создать новый контракт</summary><p className="muted">Создание оплачивается тестовыми ETH в выбранной сети.</p><button disabled={busy} onClick={()=>run(deploy)}>Развернуть Poster</button></details>{deployment&&<p className="muted">Блок {deployment.block}{net.explorer&&<> · <a target="_blank" rel="noreferrer" href={`${net.explorer}/address/${deployment.address}?tab=contract`}>Blockscout ↗</a></>}</p>}</section></aside>
 <div><section className="card composer"><h2>Оставить сообщение</h2><label>Текст<textarea rows={4} maxLength={2000} value={content} onChange={e=>setContent(e.target.value)} placeholder="Что вы хотите оставить в истории?"/></label><div className="compose-row"><label>Тег<input maxLength={64} value={tag} onChange={e=>setTag(e.target.value)} placeholder="например, учёба"/></label><button disabled={busy||!deployment} onClick={()=>run(publish)}>Опубликовать ↗</button></div></section>
 <section className="feed"><div className="feed-top"><h2>Публикации <span>{shown.length}</span></h2><select aria-label="Фильтр по тегу" value={filter} onChange={e=>setFilter(e.target.value)}><option value="">Все теги</option>{Array.from(new Set(posts.map(p=>p.tag))).map(t=><option key={t}>{t}</option>)}</select><button className="text-button" disabled={busy||!deployment} onClick={()=>run(()=>load())}>Обновить ↻</button></div>{shown.length===0?<div className="empty"><span>✳</span><h3>Здесь начинается история</h3><p>{deployment?"Публикаций с выбранным тегом пока нет.":"Откройте существующий контракт или разверните свой."}</p></div>:shown.map(p=><article className="post" key={p.hash}><span className="tag">#{p.tag}</span><p>{p.content}</p><code>{p.author}</code>{net.explorer&&<a target="_blank" rel="noreferrer" href={`${net.explorer}/tx/${p.hash}`}>Транзакция ↗</a>}</article>)}</section></div></div>
 <div role="status" aria-live="polite" className="status"><span className={busy?"pulse":""}>●</span> {status}</div><footer>Solidity · Hardhat · Next.js · Web3.js <span>Бессонов М. А. / ИВТ-463</span></footer></main>;
}
