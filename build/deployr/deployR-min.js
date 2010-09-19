R.util.DeployR=function(){var a={session:{create:"/r/session/create",close:"/r/session/close",ping:"/r/session/ping",code:"/r/session/execute/code",script:"/r/session/execute/script",output:"/r/session/output",history:"/r/session/history",saveWorkspace:"/r/session/workspace/save",saveProject:"/r/session/project/save",object:{list:"/r/session/object/list",get:"/r/session/object/get",push:"/r/session/object/push",upload:"/r/session/object/upload",remove:"/r/session/object/delete",save:"/r/session/object/save",load:"/r/session/object/load"},file:{list:"/r/session/file/list",upload:"/r/session/file/upload",download:"/r/session/file/download",remove:"/r/session/file/delete",save:"/r/session/file/save",load:"/r/session/file/load"}},repository:{object:{list:"/r/repository/object/list",upload:"/r/repository/object/upload",download:"/r/repository/object/download",remove:"/r/repository/object/delete"},file:{list:"/r/repository/file/list",upload:"/r/repository/file/upload",download:"/r/repository/file/download",remove:"/r/repository/file/delete"}},project:{list:"/r/project/list",load:"/r/project/load",artifacts:"/r/project/artifacts",remove:"/r/project/delete"},user:{login:"/r/user/login",logout:"/r/user/logout",whoami:"/r/user/whoami",autosave:"/r/user/autosave",live:"/r/user/live"},script:{list:"/r/script/list",execute:"/r/script/execute"}};var d=function(f,g,i){if(i){var h=(i.scope||this);if(f&&i.success){i.success.call(h,g)}else{if(!f&&i.failure){i.failure.call(h,g)}}i=null;h=null}};var e=function(h,f){try{for(var i in f.deployr.response){if(h[i]!=="undefined"){h[i]=f.deployr.response[i]}}}catch(g){}return h};var c=function(g,i,f){var h=i;try{for(var l in f.deployr.response){if(l===g){return(f.deployr.response[l])}}}catch(j){h=i}return h};var b=function(f){return(f&&f.verbose||false)};R.session.Session=function(f){};R.session.Session.prototype={session:"",isAlive:false,create:function(h){var f=function(j){this.session=j.deployr.response.session;var i=(h&&h.verbose||false);j=(i?j:this.session);d(true,j,h)};var g=function(i){d(false,i,h)};R.util.DeployRTransaction.sendRequest({url:a.session.create,method:"POST",params:{format:"json"},silent:true,callback:{success:f,failure:g,scope:this,notify:h.notify}})},close:function(h,i){var f=function(l){this.session="";var j=b(i);l=(j?l:this.session);d(true,l,i)};var g=function(j){d(false,j,i)};R.util.DeployRTransaction.sendRequest({url:a.session.close,method:"POST",params:{session:h,format:"json"},silent:true,callback:{success:f,failure:g,scope:this,notify:i.notify}})},ping:function(h,i){var f=function(j){var l=true;j=(b(i)?j:l);d(true,j,i)};var g=function(j){d(false,j,i)};R.util.DeployRTransaction.sendRequest({url:a.session.ping,method:"GET",params:{session:h,format:"json"},silent:true,callback:{success:f,failure:g,scope:this,notify:i.notify}})},code:function(m,g,o,n){var i=function(p){d(true,p,n)};var l=function(p){d(false,p,n)};var h=(o||{});var j=(h.robjects instanceof Array?h.robjects.join(","):"");var f=(h.files instanceof Array?h.files.join(","):"");R.util.DeployRTransaction.sendRequest({url:a.session.code,method:"POST",params:{session:m,code:encodeURIComponent(g),robjects:j,files:f,format:"json"},silent:true,callback:{success:i,failure:l,scope:this,notify:n.notify}})},script:function(g,q,l,s){var h=function(t){d(true,t,s)};var n=function(t){d(false,t,s)};var j=R.util.DeployR;var p=(l||{});var r=(p.preload||"");var m=j.encode({inputs:j.js2deployr(p.inputs||{})});var i=(p.robjects instanceof Array?p.robjects.join(","):"");var f=(p.files instanceof Array?p.files.join(","):"");var o=(p.saveworkspace||false);R.util.DeployRTransaction.sendRequest({url:a.session.script,method:"POST",params:{session:q,rscript:g,preload:r,inputs:m,robjects:i,files:f,saveworkspace:o,format:"json"},silent:true,callback:{success:h,failure:n,scope:this,notify:s.notify}})},output:function(h,i){var f=function(l){var j=c("console",{},l);l=(b(i)?l:j);d(true,l,i)};var g=function(j){d(false,j,i)};R.util.DeployRTransaction.sendRequest({url:a.session.output,method:"GET",params:{session:h,format:"json"},silent:true,callback:{success:f,failure:g,scope:this,notify:i.notify}})},history:function(h,i){var f=function(j){j=(b(i)?j:c("history",[],j));d(true,j,i)};var g=function(j){d(false,j,i)};R.util.DeployRTransaction.sendRequest({url:a.session.history,method:"GET",params:{session:h,format:"json"},silent:true,callback:{success:f,failure:g,scope:this,notify:i.notify}})},saveWorkspace:function(i,h,j){var f=function(l){var m=c("objects",{},l);l=(b(j)?l:m);d(true,l,j)};var g=function(l){d(false,l,j)};R.util.DeployRTransaction.sendRequest({url:a.session.saveWorkspace,method:"POST",params:{session:i,format:"json",descr:h},silent:true,callback:{success:f,failure:g,scope:this,notify:j.notify}})},saveProject:function(i,h,j){var f=function(l){var m=c("projects",{},l);l=(b(j)?l:m);d(true,l,j)};var g=function(l){d(false,l,j)};R.util.DeployRTransaction.sendRequest({url:a.session.saveProject,method:"POST",params:{session:i,format:"json",descr:h},silent:true,callback:{success:f,failure:g,scope:this,notify:j.notify}})}};R.session.SessionObject=function(){};R.session.SessionObject.prototype={session:"",list:function(i,h,j){var f=function(l){d(true,l,j)};var g=function(l){d(false,l,j)};R.util.DeployRTransaction.sendRequest({url:a.session.object.list,method:"GET",params:{session:i,filter:h||false,format:"json"},silent:true,callback:{success:f,failure:g,scope:this,notify:j.notify}})},get:function(j,g,m,i,l){var f=function(n){d(true,n,l)};var h=function(n){d(false,n,l)};R.util.DeployRTransaction.sendRequest({url:a.session.object.get,method:"GET",params:{session:j,name:g||"",start:m||"",length:i||"",format:"json"},silent:true,callback:{success:f,failure:h,scope:this,notify:l.notify}})},push:function(j,h,l){var f=function(n){this.session=n.deployr.response.session;var m=(l&&l.verbose||false);n=(m?n:this.session);d(true,n,l)};var i=function(m){d(false,m,l)};var g=R.util.DeployR.encode({inputs:R.util.DeployR.js2deployr(h)});R.util.DeployRTransaction.sendRequest({url:a.session.object.push,method:"POST",params:{session:j,format:"json",inputs:g},silent:true,callback:{success:f,failure:i,scope:this,notify:l.notify}})},upload:function(l,j,h,i){var f=function(n){var m=(i&&i.verbose||false);d(true,n,i)};var g=function(m){d(false,m,i)};R.util.DeployRTransaction.sendRequest({url:a.session.object.upload,method:"POST",isUpload:true,formId:l,params:{name:j,session:h,format:"text"},silent:true,callback:{success:f,failure:g,scope:this,notify:i.notify}})},remove:function(i,g,j){var f=function(l){d(true,l,j)};var h=function(l){d(false,l,j)};R.util.DeployRTransaction.sendRequest({url:a.session.object.remove,method:"POST",params:{session:i,name:g,format:"json"},silent:true,callback:{success:f,failure:h,scope:this,notify:j.notify}})},save:function(j,g,i,l){var f=function(m){d(true,m,l)};var h=function(m){d(false,m,l)};R.util.DeployRTransaction.sendRequest({url:a.session.object.save,method:"POST",params:{session:j,name:g||"",descr:i||"",format:"json"},silent:true,callback:{success:f,failure:h,scope:this,notify:l.notify}})},load:function(h,j,i){var f=function(l){d(true,l,i)};var g=function(l){d(false,l,i)};R.util.DeployRTransaction.sendRequest({url:a.session.object.load,method:"POST",params:{session:h,id:j,format:"json"},silent:true,callback:{success:f,failure:g,scope:this,notify:i.notify}})}};R.session.File=function(){};R.session.File.prototype={session:"",files:[],_loadFiles:function(i){var g=[];for(var f in i.deployr.response.files){if(!f){continue}var h=i.deployr.response.files[f];g.push({name:f,file:h.value})}return g},list:function(h,i){var f=function(l){this.session=(l.deployr.response.session||"");this.files=this._loadFiles(l);var j=(i&&i.verbose||false);l=(j?l:this.files);d(true,l,i)};var g=function(j){d(false,j,i)};R.util.DeployRTransaction.sendRequest({url:a.session.file.list,method:"GET",params:{session:h,format:"json"},silent:true,callback:{success:f,failure:g,scope:this,notify:i.notify}})},upload:function(l,j,h,i){var f=function(n){this.session=n.deployr.response.session;var o=this._loadFiles(n);var m=(i&&i.verbose||false);n=(m?n:o);d(true,n,i)};var g=function(m){d(false,m,i)};R.util.DeployRTransaction.sendRequest({url:a.session.file.upload,method:"POST",isUpload:true,formId:l,params:{name:j,session:h,format:"text"},silent:true,callback:{success:f,failure:g,scope:this,notify:i.notify}})},download:function(i,g,j){var f=function(l){d(true,l,j)};var h=function(l){d(false,l,j)};R.util.DeployRTransaction.sendRequest({url:a.session.file.download,method:"GET",params:{name:g,session:i,format:"text"},silent:true,callback:{success:f,failure:h,scope:this,notify:j.notify}})},remove:function(i,g,j){var f=function(l){d(true,l,j)};var h=function(l){d(false,l,j)};R.util.DeployRTransaction.sendRequest({url:a.session.file.remove,method:"POST",params:{name:g,session:i,format:"json"},silent:true,callback:{success:f,failure:h,scope:this,notify:j.notify}})},save:function(j,g,i,l){var f=function(m){d(true,m,l)};var h=function(m){d(false,m,l)};R.util.DeployRTransaction.sendRequest({url:a.session.file.save,method:"POST",params:{session:j,name:g,descr:i,format:"json"},silent:true,callback:{success:f,failure:h,scope:this,notify:l.notify}})},load:function(h,j,i){var f=function(l){d(true,l,i)};var g=function(l){d(false,l,i)};R.util.DeployRTransaction.sendRequest({url:a.session.file.load,method:"POST",params:{session:h,id:j,format:"json"},silent:true,callback:{success:f,failure:g,scope:this,notify:i.notify}})}};R.repository.ObjectRepository=function(){};R.repository.ObjectRepository.prototype={list:function(h){var f=function(i){d(true,i,h)};var g=function(i){d(false,i,h)};R.util.DeployRTransaction.sendRequest({url:a.repository.object.list,method:"GET",params:{format:"json"},silent:true,callback:{success:f,failure:g,scope:this,notify:h.notify}})},upload:function(j,g,i){var f=function(l){d(true,l,i)};var h=function(l){d(false,l,i)};R.util.DeployRTransaction.sendRequest({url:a.repository.object.upload,method:"POST",isUpload:true,formId:j,params:{name:g,format:"text"},silent:true,callback:{success:f,failure:h,scope:this,notify:i.notify}})},download:function(g,j,i){var f=function(l){d(true,l,i)};var h=function(l){d(false,l,i)};R.util.DeployRTransaction.sendRequest({url:a.repository.object.download,method:"GET",params:{name:g,id:j,format:"text"},silent:true,callback:{success:f,failure:h,scope:this,notify:i.notify}})},remove:function(i,h){var f=function(j){d(true,j,h)};var g=function(j){d(false,j,h)};R.util.DeployRTransaction.sendRequest({url:a.repository.object.remove,method:"POST",params:{id:i,format:"json"},silent:true,callback:{success:f,failure:g,scope:this,notify:h.notify}})}};R.repository.File=function(){};R.repository.File.prototype={list:function(h){var f=function(i){d(true,i,h)};var g=function(i){d(false,i,h)};R.util.DeployRTransaction.sendRequest({url:a.repository.file.list,method:"GET",params:{format:"json"},silent:true,callback:{success:f,failure:g,scope:this,notify:h.notify}})},upload:function(l,g,i,j){var f=function(m){d(true,m,j)};var h=function(m){d(false,m,j)};R.util.DeployRTransaction.sendRequest({url:a.repository.file.upload,method:"POST",isUpload:true,formId:l,params:{name:g,session:i,format:"text"},silent:true,callback:{success:f,failure:h,scope:this,notify:j.notify}})},download:function(g,j,i){var f=function(l){d(true,l,i)};var h=function(l){d(false,l,i)};R.util.DeployRTransaction.sendRequest({url:a.repository.file.download,method:"GET",params:{name:g,id:j,format:"text"},silent:true,callback:{success:f,failure:h,scope:this,notify:i.notify}})},remove:function(i,h){var f=function(j){d(true,j,h)};var g=function(j){d(false,j,h)};R.util.DeployRTransaction.sendRequest({url:a.repository.file.remove,method:"POST",params:{id:i,format:"json"},silent:true,callback:{success:f,failure:g,scope:this,notify:h.notify}})}};R.Project=function(){};R.Project.prototype={list:function(h){var f=function(i){d(true,i,h)};var g=function(i){d(false,i,h)};R.util.DeployRTransaction.sendRequest({url:a.project.list,method:"GET",params:{format:"json"},silent:true,callback:{success:f,failure:g,scope:this,notify:h.notify}})},load:function(i,h){var f=function(j){d(true,j,h)};var g=function(j){d(false,j,h)};R.util.DeployRTransaction.sendRequest({url:a.project.load,method:"POST",params:{id:i,format:"json"},silent:true,callback:{success:f,failure:g,scope:this,notify:h.notify}})},artifacts:function(i,h){var f=function(j){d(true,j,h)};var g=function(j){d(false,j,h)};R.util.DeployRTransaction.sendRequest({url:a.project.artifacts,method:"POST",params:{id:i,format:"json"},silent:true,callback:{success:f,failure:g,scope:this,notify:h.notify}})},remove:function(i,h){var f=function(j){d(true,j,h)};var g=function(j){d(false,j,h)};R.util.DeployRTransaction.sendRequest({url:a.project.remove,method:"POST",params:{id:i,format:"json"},silent:true,callback:{success:f,failure:g,scope:this,notify:h.notify}})}};R.User=function(h,g,f){this.username=(h||"");this.password=(g?SHA1(g):"");this.autoSave=(f||false)};R.User.prototype={username:"",password:"",cookie:"",live:[],displayname:"",autoSave:false,loggedIn:false,login:function(l,h,g,j){this.username=l;this.password=SHA1(h);this.autoSave=g;var f=function(m){for(var n in m.deployr.response){this[n]=m.deployr.response[n]}d(true,m,j)};var i=function(m){d(false,m,j)};R.util.DeployRTransaction.sendRequest({url:a.user.login,method:"POST",params:{autosave:(this.autoSave||false),username:this.username,password:this.password,format:"json"},silent:true,callback:{success:f,failure:i,scope:this,notify:j.notify}})},logout:function(h){var f=function(j){this.loggedIn=j.deployr.response.success;var i=(h&&h.verbose||false);j=(i?j:this.loggedIn);d(true,j,h)};var g=function(i){d(false,i,h)};R.util.DeployRTransaction.sendRequest({url:a.user.logout,method:"POST",params:{format:"json"},silent:true,callback:{success:f,failure:g,scope:this,notify:h.notify}})},whoami:function(h){var f=function(j){var i=(h&&h.verbose||false);d(true,j,h)};var g=function(i){d(false,i,h)};R.util.DeployRTransaction.sendRequest({url:a.user.whoami,method:"GET",params:{format:"json"},silent:true,callback:{success:f,failure:g,scope:this,notify:h.notify}})},autosave:function(h,i){var f=function(l){var j=(i&&i.verbose||false);d(true,l,i)};var g=function(j){d(false,j,i)};R.util.DeployRTransaction.sendRequest({url:a.user.autosave,method:"POST",params:{save:h||false,format:"json"},silent:true,callback:{success:f,failure:g,scope:this,notify:i.notify}})},live:function(h){var f=function(j){this.live=(j.deployr.response.live||[]);var i=(h&&h.verbose||false);j=(i?j:this.live);d(true,j,h)};var g=function(i){d(false,i,h)};R.util.DeployRTransaction.sendRequest({url:a.user.live,method:"GET",params:{format:"json"},silent:true,callback:{success:f,failure:g,scope:this,notify:h.notify}})}};R.Script=function(f){};R.Script.prototype={console:{},objects:{},robjects:{},scripts:{},list:function(h){var f=function(i){this.scripts=c("scripts",{},i);i=(b(h)?i:this.scripts);d(true,i,h)};var g=function(i){d(false,i,h)};R.util.DeployRTransaction.sendRequest({url:a.script.list,method:"GET",params:{format:"json"},silent:true,callback:{success:f,failure:g,scope:this,notify:h.notify}})},execute:function(g,l,r){var h=function(s){d(true,s,r)};var n=function(s){d(false,s,r)};var j=R.util.DeployR;var p=(l||{});var q=(p.preload||"");var m=j.encode({inputs:j.js2deployr(p.inputs||{})});var i=(p.robjects instanceof Array?p.robjects.join(","):"");var f=(p.files instanceof Array?p.files.join(","):"");var o=(p.saveworkspace||false);R.util.DeployRTransaction.sendRequest({url:a.script.execute,method:"POST",params:{rscript:g,preload:q,inputs:m,robjects:i,files:f,saveworkspace:o,format:"json"},silent:true,callback:{success:h,failure:n,scope:this,notify:r.notify}})}};return{createSession:function(f){return((new R.session.Session()).create(f))},closeSession:function(f,g){return((new R.session.Session()).close(f,g))},pingSession:function(f,g){return((new R.session.Session()).ping(f,g))},executeSessionCode:function(h,g,f,i){return((new R.session.Session()).code(h,g,f,i))},executeSessionScript:function(g,i,f,h){return((new R.session.Session()).script(i,g,f,h))},getSessionOutput:function(f,g){return((new R.session.Session()).output(f,g))},getSessionHistory:function(f,g){return((new R.session.Session()).history(f,g))},saveSessionWorkspace:function(g,f,h){return((new R.session.Session()).saveWorkspace(g,f,h))},saveSessionProject:function(g,f,h){return((new R.session.Session()).saveProject(g,f,h))},loginCreateSession:function(m,g,i,l){var f=function(n){this.createSession(l)};var h=function(n){d(false,n,l)};var j={success:f,failure:h,scope:this};this.login(m,g,i,j)},listLiveSessionObjects:function(g,f,h){return((new R.session.SessionObject()).list(g,f,h))},getLiveSessionObject:function(h,f,j,g,i){return((new R.session.SessionObject()).get(h,f,j,g,i))},pushSessionObject:function(g,f,h){return((new R.session.SessionObject()).push(g,f,h))},uploadSessionObject:function(h,f,g,i){return((new R.session.SessionObject()).upload(h,f,g,i))},deleteSessionObject:function(g,f,h){return((new R.session.SessionObject()).remove(g,f,h))},saveSessionObject:function(h,f,g,i){return((new R.session.SessionObject()).save(h,f,g,i))},loadSessionObject:function(f,h,g){return((new R.session.SessionObject()).load(f,h,g))},listSessionFiles:function(f,g){return((new R.session.File()).list(f,g))},uploadSessionFile:function(h,f,g,i){return((new R.session.File()).upload(h,f,g,i))},downloadSessionFile:function(g,f,h){return((new R.session.File()).download(g,f,h))},deleteSessionFile:function(g,f,h){return((new R.session.File()).remove(g,f,h))},saveSessionFile:function(h,f,g,i){return((new R.session.File()).save(h,f,g,i))},loadSessionFile:function(f,h,g){return((new R.session.File()).load(f,h,g))},listRepoObjects:function(f){return((new R.repository.ObjectRepository()).list(f))},uploadRepoObject:function(g,f,h){return((new R.repository.ObjectRepository()).upload(g,f,h))},downloadRepoObject:function(g,f){return((new R.repository.ObjectRepository()).download(name,g,f))},deleteRepoObject:function(g,f){return((new R.repository.ObjectRepository()).remove(g,f))},listRepoFiles:function(f){return((new R.repository.File()).list(f))},uploadRepoFile:function(h,f,g,i){return((new R.repository.File()).upload(h,f,g,i))},downloadRepoFile:function(f,h,g){return((new R.repository.File()).download(f,h,g))},deleteRepoFile:function(g,f){return((new R.repository.File()).remove(g,f))},listProjects:function(f){return((new R.Project()).list(f))},loadProject:function(g,f){return((new R.Project()).load(g,f))},listArtifacts:function(g,f){return((new R.Project()).artifacts(g,f))},deleteProject:function(g,f){return((new R.Project()).remove(g,f))},login:function(i,f,g,h){return((new R.User()).login(i,f,g,h))},logout:function(f){return((new R.User()).logout(f))},whoami:function(f){return((new R.User()).whoami(f))},autosave:function(f,g){return((new R.User()).autosave(f,g))},live:function(f){return((new R.User()).live(f))},listScripts:function(f){return((new R.Script()).list(f))},executeScript:function(h,f,g){return((new R.Script()).execute(h,f,g))},encode:function(f){return(encodeURIComponent(YAHOO.lang.JSON.stringify(f)))},decode:function(f){return(YAHOO.lang.JSON.parse(f))},deployr2js:function(g){if(!g.type){return g}switch(g.type){case"primitive":return g.value;case"vector":return g.value;case"date":return g.value;case"factor":return g.value;case"matrix":return g.value;case"dataframe":var f=new Object();for(k in g.value){f[k]=R.util.DeployR.deployr2js(g.value[k])}return f;case"list":var f=new Object();for(k in g.value){f[k]=R.util.DeployR.deployr2js(g.value[k])}return f;default:return g.value}},js2deployr:function(l){var h=typeof l;if(h==="function"||h==="undefined"){return}if(h==="object"){if(!l){return{type:"primitive",value:null}}if(l instanceof Array){return{type:"vector",value:l}}var j={type:"list",value:{}};var g=false;for(var f in l){j.value[f]=R.util.DeployR.js2deployr(l[f]);g=true}if(!g){return}return j}return({type:"primitive",value:l})}}}();