const http=require('http'),fs=require('fs'),path=require('path');
const root=process.argv[2]||'.';
const MIME={'.html':'text/html;charset=utf-8','.css':'text/css;charset=utf-8','.js':'text/javascript;charset=utf-8','.json':'application/json;charset=utf-8','.csv':'text/csv;charset=utf-8','.svg':'image/svg+xml','.ics':'text/calendar'};
http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]);
  if(p==='/')p='/index.html';
  const f=path.join(root,p);
  fs.readFile(f,(e,d)=>{
    if(e){res.writeHead(404,{'Content-Type':'text/plain'});return res.end('404 '+p);}
    res.writeHead(200,{'Content-Type':MIME[path.extname(f).toLowerCase()]||'application/octet-stream'});
    res.end(d);
  });
}).listen(4173,()=>console.log('serving '+root+' on http://localhost:4173'));
