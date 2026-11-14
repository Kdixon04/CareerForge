import { createServer } from 'node:http';import { readFile } from 'node:fs/promises';
import { createElement } from 'react';import { renderToString } from 'react-dom/server';
import { AdapterLab } from './AdapterLab';import { createMemoryHarness } from './memory-double';import { labMode } from '../readiness';
import { createProfileHandlers } from '../../../../app/api/profile/adapter-handlers';import { createApplicationHandlers } from '../../../../app/api/applications/adapter-handlers';
import { AdapterError } from '../adapter-contract';import { THEME_INIT_SCRIPT } from '../../../theme/theme';
if(labMode(process.env)!=='test-double')throw new Error('Explicit STEVE_ADAPTER_LAB=test-double required');
const harness=createMemoryHarness();
const resolve=async(request:Request)=>{const user=request.headers.get('x-lab-user');if(user==='employer')throw new AdapterError('FORBIDDEN');if(!['a','b'].includes(user??''))throw new AdapterError('UNAUTHENTICATED');return user==='b'?harness.b:harness.a;};
const profiles=createProfileHandlers(resolve),applications=createApplicationHandlers(resolve);
const assets:Record<string,[string,string]>={'/lab.js':['test-results/adapter-lab-assets/client.js','text/javascript'],'/tokens.css':['src/styles/tokens.css','text/css'],'/components.css':['src/styles/components.css','text/css'],'/profile.css':['src/app/(student)/profile/profile.css','text/css']};
const server=createServer(async(req,res)=>{
  try{
    if(req.headers.host!=='127.0.0.1:4318'){res.writeHead(403);return res.end();}const url=new URL(req.url!,'http://127.0.0.1:4318');
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    if(url.pathname==='/health'){res.writeHead(200);return res.end('test-double-only');}
    if(url.pathname==='/favicon.ico'){res.writeHead(204);return res.end();}
    if(assets[url.pathname]){const [file,type]=assets[url.pathname];res.writeHead(200,{'Content-Type':type});return res.end(await readFile(file));}
    if(url.pathname==='/'){const student=url.searchParams.get('student')==='b'?'b':'a';const html=renderToString(createElement(AdapterLab,{initialStudent:student}));res.writeHead(200,{'Content-Type':'text/html'});return res.end(`<!doctype html><html lang="en" data-lab-student="${student}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Career Forge test-double lab</title><script>${THEME_INIT_SCRIPT}</script><link rel="stylesheet" href="/tokens.css"><link rel="stylesheet" href="/components.css"><link rel="stylesheet" href="/profile.css"><style>body{margin:0}main>section{margin-block:2rem}section form{display:grid;gap:1rem}select{margin-bottom:1rem}</style></head><body><div id="root">${html}</div><script type="module" src="/lab.js"></script></body></html>`);}
    if(!url.pathname.startsWith('/lab/')){res.writeHead(404);return res.end();}
    let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>196608){res.writeHead(400);return res.end();}}
    const headers=new Headers();for(const [key,value] of Object.entries(req.headers))if(value)headers.set(key,Array.isArray(value)?value.join(','):value);
    const request=new Request(url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method!)?{body:raw}:{})});const fault=req.headers['x-lab-fault'];const write=!['GET','HEAD'].includes(req.method!);
    let response:Response;
    if(fault==='save-network'&&write){req.socket.destroy();return;}
    if(fault==='slow-save'&&write)await new Promise(resolve=>setTimeout(resolve,750));
    const failures:Record<string,[number,string]>={'load-error':[503,'UNAVAILABLE'],'load-auth':[401,'UNAUTHENTICATED'],'load-forbidden':[403,'FORBIDDEN'],'save-validation':[400,'INVALID_INPUT'],'save-auth':[401,'UNAUTHENTICATED'],'save-forbidden':[403,'FORBIDDEN'],'save-conflict':[409,'CONFLICT']};
    if(typeof fault==='string'&&Object.hasOwn(failures,fault)&&((fault.startsWith('load-')&&!write)||(write&&fault.startsWith('save-')))){const [status,code]=failures[fault as string];response=Response.json({error:{code,message:'Test-double fault'}},{status});}
    else if(fault==='corrupt-load'&&!write&&url.pathname==='/lab/profile')response=Response.json({data:await harness.b.getProfile()});
    else if(url.pathname==='/lab/profile')response=await (req.method==='PUT'?profiles.PUT(request):profiles.GET(request));
    else if(url.pathname==='/lab/applications')response=await(req.method==='POST'?applications.POST(request):applications.GET(request));
    else{const id=url.pathname.slice('/lab/applications/'.length);response=await(req.method==='DELETE'?applications.DELETE(request,id):applications.PATCH(request,id));}
    res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());
  }catch{res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{code:'UNAVAILABLE',message:'Test-double request failed'}}));}
});
server.listen(4318,'127.0.0.1',()=>console.log('TEST DOUBLE lab ready on loopback:4318; memory only, no hosted verification'));
process.on('SIGTERM',()=>server.close());process.on('SIGINT',()=>server.close(()=>process.exit()));
