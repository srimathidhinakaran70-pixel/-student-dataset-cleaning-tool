/* ClearData — client-side CSV inspection and cleaning. No server/database connection. */
const $ = (id) => document.getElementById(id);
const state = { original: [], working: [], headers: [], fileName: "sample-data.csv", page: 1, pageSize: 8, sortKey: null, sortDir: 1, hasChanges: false, numericIssues: 0 };
const sampleFallback = `Student ID,Name,Age,Department,Attendance %,Marks,Email
STU001,Aarav Kumar,19,Computer Science,92,88,aarav@example.com
STU002,Diya Sharma,20,Information Technology,85,91,diya@example.com
STU003,Arjun Patel,19,Electronics,78,76,arjun@example.com
STU004,Meera Iyer,20,Computer Science,96,94,meera@example.com
STU005,Kabir Singh,21,Mechanical,72,68,kabir@example.com
STU006,Ananya Rao,19,Information Technology,89,87,ananya@example.com
STU007,Rohan Das,20,Civil,81,73,rohan@example.com
STU008,Ishita Nair,19,Computer Science,94,90,ishita@example.com
STU009,Vihaan Gupta,21,Electronics,67,62,vihaan@example.com
STU010,Sara Khan,20,Information Technology,88,85,sara@example.com
STU011,Aditya Menon,19,Mechanical,91,79,aditya@example.com
STU012,Kiara Joshi,20,Civil,76,81,kiara@example.com
STU013,Neil Thomas,21,Computer Science,84,77,neil@example.com
STU014,Tara Reddy,19,Electronics,97,96,tara@example.com
STU015,Dev Shah,20,Information Technology,69,71,dev@example.com
STU016,Myra Bose,19,Mechanical,87,89,myra@example.com
STU017,Reyansh Roy,21,Civil,80,74,reynash@example.com
STU018,Avni Kulkarni,20,Computer Science,93,92,avni@example.com
STU019,Krish Verma,19,Electronics,75,66,krish@example.com
STU020,Anika Paul,20,Information Technology,90,86,anika@example.com
STU021,Parth Jain,21,Computer Science,82,80,parth@example.com
STU022,Navya Pillai,19,Civil,95,93,navya@example.com
STU023,Omkar Sethi,20,Mechanical, ,78,omkar@example.com
STU024,Leela George,19,Information Technology,86, ,leela@example.com
STU025, Kabir Singh ,21,Mechanical,72,68,kabir@example.com`;
function parseCSV(text) {
  const rows=[]; let row=[], cell="", quoted=false;
  for(let i=0;i<text.length;i++){const ch=text[i], next=text[i+1];
    if(quoted){if(ch==='"'&&next==='"'){cell+='"';i++;}else if(ch==='"')quoted=false;else cell+=ch;}
    else if(ch==='"'){quoted=true;}
    else if(ch===","){row.push(cell);cell="";}
    else if(ch==="\n"){row.push(cell);if(row.some(v=>v.trim()!==""))rows.push(row);row=[];cell="";}
    else if(ch!=="\r")cell+=ch;
  }
  if(quoted) throw new Error("The CSV contains an unclosed quoted field.");
  if(cell.length||row.length){row.push(cell);if(row.some(v=>v.trim()!==""))rows.push(row);}
  if(!rows.length) throw new Error("This CSV is empty. Please choose a file with a header row and records.");
  const headers=rows.shift().map(h=>h.trim());
  if(!headers.length||headers.some(h=>!h)) throw new Error("Every column must have a header name.");
  if(new Set(headers).size!==headers.length) throw new Error("Duplicate column names were found. Please make the headers unique.");
  if(!rows.length) throw new Error("No data records were found below the header row.");
  const records=rows.map((r,i)=>{if(r.length>headers.length) throw new Error(`Record ${i+2} has more values than the header row.`);while(r.length<headers.length)r.push("");return Object.fromEntries(headers.map((h,j)=>[h,r[j]??""]));});
  return {headers,records};
}
function csvEscape(value){const s=String(value??"");return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
function serializeCSV(headers,rows){return [headers.map(csvEscape).join(","),...rows.map(r=>headers.map(h=>csvEscape(r[h])).join(","))].join("\r\n");}
function countMissing(rows,headers){return rows.reduce((n,r)=>n+headers.filter(h=>String(r[h]??"").trim()==="").length,0);}
function countDuplicates(rows,headers){const seen=new Set();let count=0;rows.forEach(r=>{const key=JSON.stringify(headers.map(h=>String(r[h]??"")));if(seen.has(key))count++;else seen.add(key);});return count;}
function numericIssues(rows,headers){let issues=0;headers.forEach(h=>{const vals=rows.map(r=>String(r[h]??"").trim()).filter(Boolean);if(vals.length&&vals.filter(v=>Number.isNaN(Number(v))).length/vals.length>=.5)return;issues+=vals.filter(v=>Number.isNaN(Number(v))).length;});return issues;}
function quality(rows,headers){if(!rows.length||!headers.length)return 0;const total=rows.length*headers.length;const missing=countMissing(rows,headers),dupes=countDuplicates(rows,headers),invalid=numericIssues(rows,headers);return Math.max(0,Math.round(100*(1-(missing+dupes*headers.length+invalid)/Math.max(total,1))));}
function updateStats(){const rows=state.working, h=state.headers;$("rowCount").textContent=rows.length.toLocaleString();$("colCount").textContent=h.length;$("missingCount").textContent=countMissing(rows,h).toLocaleString();$("duplicateCount").textContent=countDuplicates(rows,h).toLocaleString();$("missingHint").textContent=countMissing(rows,h)?"Blank or empty cells detected":"No blank cells detected";$("beforeRows").textContent=state.original.length;$("beforeMissing").textContent=countMissing(state.original,h);$("beforeDuplicates").textContent=countDuplicates(state.original,h);$("afterRows").textContent=rows.length;$("afterMissing").textContent=countMissing(rows,h);$("afterDuplicates").textContent=countDuplicates(rows,h);const score=quality(rows,h);$("qualityScore").textContent=score+"%";$("qualityRing").style.background=`conic-gradient(#1ba394 ${score*3.6}deg,#e8edf2 0deg)`;$("qualityMessage").textContent=state.hasChanges?`Your working dataset has been updated. ${state.original.length-rows.length} row(s) removed.`:"Apply a cleaning operation to see your results.";$("reportStatus").textContent=state.hasChanges?"Cleaning applied":"Waiting for changes";$("downloadBtn").disabled=!rows.length;$("applyBtn").disabled=!state.original.length;$("resetBtn").disabled=!state.original.length||!state.hasChanges;}
function renderTable(){const h=state.headers,search=$("searchInput").value.toLowerCase();let rows=state.working.filter(r=>h.some(k=>String(r[k]??"").toLowerCase().includes(search)));if(state.sortKey){const k=state.sortKey;rows.sort((a,b)=>String(a[k]??"").localeCompare(String(b[k]??""),undefined,{numeric:true,sensitivity:"base"})*state.sortDir);}
const total=rows.length,pages=Math.max(1,Math.ceil(total/state.pageSize));state.page=Math.min(state.page,pages);const shown=rows.slice((state.page-1)*state.pageSize,state.page*state.pageSize);$("dataTable").querySelector("thead").innerHTML=`<tr>${h.map(k=>`<th data-key="${escapeHTML(k)}" title="Sort by ${escapeHTML(k)}">${escapeHTML(k)} ${state.sortKey===k?(state.sortDir===1?"↑":"↓"):"↕"}</th>`).join("")}</tr>`;$("dataTable").querySelector("tbody").innerHTML=shown.length?shown.map(r=>`<tr>${h.map(k=>{const v=String(r[k]??"");return `<td class="${v.trim()===""?"missing-cell":""}">${v.trim()===""?"Missing":escapeHTML(v)}</td>`;}).join("")}</tr>`).join(""):`<tr><td colspan="${Math.max(h.length,1)}" class="empty-state">No matching records found.</td></tr>`;$("tableMeta").textContent=`${total} record${total===1?"":"s"} found`;$("tableFooterText").textContent=`Showing ${shown.length?((state.page-1)*state.pageSize+1):0}–${Math.min(state.page*state.pageSize,total)} of ${total} records`;$("pageLabel").textContent=`${state.page} / ${pages}`;$("prevPage").disabled=state.page<=1;$("nextPage").disabled=state.page>=pages;}
function escapeHTML(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function refresh(){updateStats();renderTable();}
function loadDataset(headers,rows,name){state.headers=headers;state.original=rows.map(r=>({...r}));state.working=rows.map(r=>({...r}));state.fileName=name;state.page=1;state.sortKey=null;state.hasChanges=false;$("fileName").textContent=name;$("datasetSubtitle").textContent=`${rows.length} records · ${headers.length} columns`;$("searchInput").value="";refresh();toast(`Loaded ${rows.length} records successfully.`);}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2800);}
function applyCleaning(){if(!state.original.length)return;let rows=state.working.map(r=>({...r})),h=state.headers;let changes=[];
if($("trimSpaces").checked){rows=rows.map(r=>Object.fromEntries(h.map(k=>[k,String(r[k]??"").trim()])));changes.push("trimmed spaces");}
if($("standardizeText").checked){rows=rows.map(r=>Object.fromEntries(h.map(k=>{const v=String(r[k]??"");return [k,v.trim()&&!/^[-+]?\d+(\.\d+)?%?$/.test(v.trim())?v.trim().toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()):v];})));changes.push("standardized text");}
if($("handleMissing").checked){rows=rows.map(r=>Object.fromEntries(h.map(k=>[k,String(r[k]??"").trim()===""?"Not provided":r[k]])));changes.push("filled missing values");}
if($("validateNumbers").checked){let invalid=[];h.forEach(k=>{const vals=rows.map(r=>String(r[k]??"").trim()).filter(v=>v&&v!=="Not provided");if(vals.length&&vals.filter(v=>Number.isNaN(Number(v.replace(/%$/,"")))).length/vals.length>=.5)return;rows.forEach((r,i)=>{const v=String(r[k]??"").trim();if(v&&v!=="Not provided"&&Number.isNaN(Number(v.replace(/%$/,""))))invalid.push(`${k} (record ${i+1}: ${v})`);});});state.numericIssues=invalid.length;changes.push(`checked numeric values (${invalid.length} invalid)`);}
if($("removeDuplicates").checked){const before=rows.length,seen=new Set();rows=rows.filter(r=>{const key=JSON.stringify(h.map(k=>String(r[k]??"")));if(seen.has(key))return false;seen.add(key);return true;});changes.push(`removed ${before-rows.length} duplicate row(s)`);}
state.working=rows;state.hasChanges=true;state.page=1;refresh();toast(changes.length?`Cleaning complete: ${changes.join(", ")}.`:"No operations selected. Choose at least one operation.");}
function resetData(){if(!state.original.length)return;state.working=state.original.map(r=>({...r}));state.hasChanges=false;state.numericIssues=0;state.page=1;refresh();toast("Working data restored to the original upload.");}
$("fileInput").addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;if(!file.name.toLowerCase().endsWith(".csv")&&file.type!=="text/csv"){toast("Please select a CSV file.");e.target.value="";return;}try{const parsed=parseCSV(await file.text());loadDataset(parsed.headers,parsed.records,file.name);}catch(err){toast(err.message||"Unable to read this CSV file.");}e.target.value="";});
$("applyBtn").addEventListener("click",applyCleaning);$("resetBtn").addEventListener("click",resetData);$("resetTop").addEventListener("click",resetData);$("searchInput").addEventListener("input",()=>{state.page=1;renderTable();});
$("dataTable").querySelector("thead").addEventListener("click",e=>{const th=e.target.closest("th");if(!th)return;const key=th.dataset.key;if(state.sortKey===key)state.sortDir*=-1;else{state.sortKey=key;state.sortDir=1;}renderTable();});
$("prevPage").addEventListener("click",()=>{state.page--;renderTable();});$("nextPage").addEventListener("click",()=>{state.page++;renderTable();});
$("downloadBtn").addEventListener("click",()=>{if(!state.working.length)return;const blob=new Blob(["\ufeff"+serializeCSV(state.headers,state.working)],{type:"text/csv;charset=utf-8;"});const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=(state.fileName.replace(/\.csv$/i,"")||"dataset")+"-cleaned.csv";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);toast("Your cleaned CSV download has started.");});
$("menuBtn").addEventListener("click",()=>$("sidebar").classList.toggle("open"));document.querySelectorAll(".nav-link").forEach(a=>a.addEventListener("click",()=>$("sidebar").classList.remove("open")));
async function init(){try{const response=await fetch("sample-data.csv");if(!response.ok)throw new Error("Sample file not found");const parsed=parseCSV(await response.text());loadDataset(parsed.headers,parsed.records,"sample-data.csv");}catch(e){const parsed=parseCSV(sampleFallback);loadDataset(parsed.headers,parsed.records,"sample-data.csv");}}
init();