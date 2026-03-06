import { useState, useEffect } from "react";

const GF = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Fraunces:ital,wght@0,300;0,700;0,900;1,300&display=swap');`;

// ── State ────────────────────────────────────────────────────────────────────
const BLANK = {
  name:"",email:"",phone:"",location:"",linkedin:"",website:"",summary:"",
  experience:[{company:"",role:"",duration:"",description:""}],
  education:[{school:"",degree:"",year:""}],
  skills:[],template:"modern",
};
const STEPS=["Profile","Experience","Skills","AI Tools","Preview & Export","🎯 Find Jobs","📋 Job Tracker","📓 Interview Journal"];
const TEMPLATES=[
  {id:"modern",label:"Modern",accent:"#2563eb"},
  {id:"classic",label:"Classic",accent:"#1a1a1a"},
  {id:"minimal",label:"Minimal",accent:"#16a34a"},
];

// ── In-memory store (replaces broken localStorage in sandbox) ─────────────
let _memStore = null;
const store = { save:(d)=>{ _memStore=d; }, load:()=>_memStore };

// ── Claude API ───────────────────────────────────────────────────────────────
const claude = async (prompt, sys="You are an expert resume writer and career coach.") => {
  const r = await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      model:"claude-sonnet-4-20250514", max_tokens:1000,
      system:sys, messages:[{role:"user",content:prompt}]
    })
  });
  const d = await r.json();
  return d.content?.map(b=>b.text||"").join("")||"";
};

// ── Resume text ───────────────────────────────────────────────────────────────
const buildText = f => `Name: ${f.name}
Contact: ${f.email} | ${f.phone} | ${f.location}
${f.linkedin?`LinkedIn: ${f.linkedin}`:""}
Summary: ${f.summary}
Experience:
${f.experience.map(e=>`  - ${e.role} at ${e.company} (${e.duration})\n    ${e.description}`).join("\n")}
Education:
${f.education.map(e=>`  - ${e.degree}, ${e.school} (${e.year})`).join("\n")}
Skills: ${f.skills.join(", ")}`.trim();

// ── Resume Preview ────────────────────────────────────────────────────────────
function Preview({form,id="rpa"}){
  const t=form.template||"modern";
  const acc=TEMPLATES.find(x=>x.id===t)?.accent||"#2563eb";
  const ff=t==="classic"?"'Fraunces',serif":"'Sora',sans-serif";
  const hdr={modern:{borderBottom:`4px solid ${acc}`,paddingBottom:16,marginBottom:24},classic:{borderBottom:"2px solid #111",paddingBottom:12,marginBottom:20,textAlign:"center"},minimal:{marginBottom:28}}[t];
  const nm={modern:{fontSize:32,fontWeight:700,letterSpacing:"-0.5px"},classic:{fontSize:30,fontWeight:700,fontFamily:"'Fraunces',serif"},minimal:{fontSize:26,fontWeight:300,letterSpacing:"3px",textTransform:"uppercase"}}[t];
  const st={modern:{fontSize:10,fontWeight:700,color:acc,letterSpacing:"2px",textTransform:"uppercase",borderBottom:`1px solid ${acc}20`,paddingBottom:4,marginBottom:12,marginTop:20},classic:{fontSize:14,fontWeight:700,borderBottom:"1px solid #ccc",paddingBottom:4,marginBottom:12,marginTop:18},minimal:{fontSize:9,fontWeight:700,color:acc,letterSpacing:"3px",textTransform:"uppercase",marginBottom:10,marginTop:22}}[t];
  return (
    <div id={id} style={{fontFamily:ff,color:"#111",background:"#fff",padding:"44px 52px",maxWidth:760,margin:"0 auto",lineHeight:1.65}}>
      <div style={hdr}>
        <div style={nm}>{form.name||"Your Name"}</div>
        <div style={{fontSize:13,color:"#555",marginTop:6,display:"flex",gap:14,flexWrap:"wrap",justifyContent:t==="classic"?"center":"flex-start"}}>
          {form.email&&<span>✉ {form.email}</span>}
          {form.phone&&<span>📱 {form.phone}</span>}
          {form.location&&<span>📍 {form.location}</span>}
          {form.linkedin&&<span>🔗 {form.linkedin}</span>}
        </div>
      </div>
      {form.summary&&<div><div style={st}>Summary</div><p style={{fontSize:13,color:"#444",margin:0}}>{form.summary}</p></div>}
      {form.experience.some(e=>e.company)&&<div><div style={st}>Experience</div>{form.experience.filter(e=>e.company).map((e,i)=>(
        <div key={i} style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
            <span style={{fontWeight:700,fontSize:14}}>{e.role}</span>
            <span style={{fontSize:12,color:"#777"}}>{e.duration}</span>
          </div>
          <div style={{fontSize:13,color:acc,marginBottom:3}}>{e.company}</div>
          <div style={{fontSize:13,color:"#555",lineHeight:1.6}}>{e.description}</div>
        </div>
      ))}</div>}
      {form.education.some(e=>e.school)&&<div><div style={st}>Education</div>{form.education.filter(e=>e.school).map((e,i)=>(
        <div key={i} style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <span style={{fontWeight:700,fontSize:14}}>{e.degree}</span>
            <span style={{fontSize:12,color:"#777"}}>{e.year}</span>
          </div>
          <div style={{fontSize:13,color:"#666"}}>{e.school}</div>
        </div>
      ))}</div>}
      {form.skills.length>0&&<div><div style={st}>Skills</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{form.skills.map((s,i)=>(
        <span key={i} style={{background:t==="minimal"?"transparent":`${acc}12`,color:t==="minimal"?"#555":acc,border:t==="minimal"?"1px solid #ddd":`1px solid ${acc}30`,borderRadius:t==="classic"?2:20,padding:"3px 12px",fontSize:12,fontWeight:500}}>{s}</span>
      ))}</div></div>}
    </div>
  );
}

// ── Gauge Component ───────────────────────────────────────────────────────────
function Gauge({label,score,color}){
  const r=28,circ=2*Math.PI*r,fill=circ*(score/100);
  return (
    <div style={{textAlign:"center",flex:1,minWidth:90}}>
      <svg width={70} height={70} style={{transform:"rotate(-90deg)"}}>
        <circle cx={35} cy={35} r={r} fill="none" stroke="#1e1c2e" strokeWidth={6}/>
        <circle cx={35} cy={35} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{transition:"stroke-dasharray 1s ease"}}/>
      </svg>
      <div style={{fontSize:15,fontWeight:700,color,marginTop:-8}}>{score}</div>
      <div style={{fontSize:10,color:"#9ca3af",letterSpacing:"0.5px",marginTop:2}}>{label}</div>
    </div>
  );
}

// ── Weakness Item ─────────────────────────────────────────────────────────────
function WeaknessItem({item}){
  const [open,setOpen]=useState(false);
  const sev={high:"#ef4444",medium:"#f59e0b",low:"#6366f1"}[item.severity]||"#6366f1";
  return (
    <div style={{background:"#0d0b18",border:`1px solid ${sev}30`,borderLeft:`3px solid ${sev}`,borderRadius:8,padding:"12px 14px",marginBottom:8,cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:13,color:"#e8e6f0",fontWeight:500}}>{item.issue}</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:10,color:sev,background:`${sev}18`,border:`1px solid ${sev}40`,borderRadius:20,padding:"2px 8px",fontWeight:700,textTransform:"uppercase"}}>{item.severity}</span>
          <span style={{color:"#6b7280",fontSize:12}}>{open?"▲":"▼"}</span>
        </div>
      </div>
      {open&&<div style={{marginTop:10,padding:"10px 12px",background:"#13111e",borderRadius:6,fontSize:13,color:"#a5b4fc",lineHeight:1.7}}>💡 {item.fix}</div>}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function ResumeAI(){
  const saved=store.load();
  const [form,setForm]=useState(saved?.form||BLANK);
  const [step,setStep]=useState(0);
  const [jobDesc,setJobDesc]=useState(saved?.jobDesc||"");
  const [skillInput,setSkillInput]=useState("");
  const [errors,setErrors]=useState({});
  const [saveMsg,setSaveMsg]=useState("");

  // AI state
  const [ai,setAi]=useState({rewrite:"",ats:"",interview:"",cover:"",summary:""});
  const [scorecard,setScorecard]=useState(null);    // {impact,clarity,keywords,format,length,relevance,feedback}
  const [weaknesses,setWeaknesses]=useState(null);  // [{issue,severity,fix}]
  const [salary,setSalary]=useState(null);          // {min,mid,max,currency,notes}
  const [jobMatch,setJobMatch]=useState(null);      // {matched:[],missing:[],score,tips}
  const [loading,setLoading]=useState({});
  const [aiTab,setAiTab]=useState("rewrite");

  // Auto-save
  useEffect(()=>{
    store.save({form,step,jobDesc});
    setSaveMsg("Saved ✓");
    const t=setTimeout(()=>setSaveMsg(""),1400);
    return()=>clearTimeout(t);
  },[form,jobDesc,step]);

  // ── Form helpers
  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));
  const updExp=(i,k,v)=>setForm(f=>{const e=[...f.experience];e[i]={...e[i],[k]:v};return{...f,experience:e};});
  const addExp=()=>setForm(f=>({...f,experience:[...f.experience,{company:"",role:"",duration:"",description:""}]}));
  const remExp=(i)=>setForm(f=>({...f,experience:f.experience.filter((_,j)=>j!==i)}));
  const updEdu=(i,k,v)=>setForm(f=>{const e=[...f.education];e[i]={...e[i],[k]:v};return{...f,education:e};});
  const addEdu=()=>setForm(f=>({...f,education:[...f.education,{school:"",degree:"",year:""}]}));
  const remEdu=(i)=>setForm(f=>({...f,education:f.education.filter((_,j)=>j!==i)}));
  const addSkill=()=>{const s=skillInput.trim();if(s&&!form.skills.includes(s)){upd("skills",[...form.skills,s]);setSkillInput("");}};
  const remSkill=(i)=>upd("skills",form.skills.filter((_,j)=>j!==i));

  // ── AI helpers
  const load=(k,v)=>setLoading(l=>({...l,[k]:v}));
  const aiCall=async(key,prompt,sys,parser)=>{
    load(key,true);
    try{const r=await claude(prompt,sys);parser?parser(r):setAi(a=>({...a,[key]:r}));}
    catch{setAi(a=>({...a,[key]:"Error — please try again."}));}
    load(key,false);
  };

  // ── AI features
  const handleRewrite=()=>aiCall("rewrite",`Rewrite this resume to match the job description with strong action verbs, quantified achievements, and ATS keywords.\n\nRESUME:\n${buildText(form)}\n\nJOB DESCRIPTION:\n${jobDesc||"General professional role"}`,
    "You are an elite resume writer. Be concise and impactful.");

  const handleATS=()=>aiCall("ats",`Analyze for ATS compatibility. Format EXACTLY:\nATS SCORE: XX/100\nMATCHED KEYWORDS: ...\nMISSING KEYWORDS: ...\nTOP 3 IMPROVEMENTS:\n1. ...\n2. ...\n3. ...\n\nRESUME:\n${buildText(form)}\n\nJOB DESCRIPTION:\n${jobDesc||"General professional role"}`,
    "You are an ATS expert.");

  const handleInterview=()=>aiCall("interview",`Generate 7 interview questions: 2 behavioral, 2 technical, 2 situational, 1 curveball. Include a 1-line prep tip per question.\n\nRESUME:\n${buildText(form)}\n\nJOB DESCRIPTION:\n${jobDesc||"General professional role"}`,
    "You are an expert career coach.");

  const handleCover=()=>aiCall("cover",`Write a 3-paragraph cover letter: hook+value, specific achievements, closing CTA. Max 250 words. Confident but not arrogant.\n\nRESUME:\n${buildText(form)}\n\nJOB DESCRIPTION:\n${jobDesc||"General professional role"}`,
    "You are an expert cover letter writer.");

  const handleSummary=()=>aiCall("summary",`Write 3 professional summary options. Label exactly "Option 1:", "Option 2:", "Option 3:". One achievement-focused, one skill-focused, one aspiration-focused. Max 2 sentences each.\n\nPROFILE:\n${buildText(form)}`,
    "You are a resume writing expert.");

  // ── Scorecard
  const handleScorecard=()=>{
    load("scorecard",true);
    claude(`Score this resume across 6 dimensions, each 0-100. Return ONLY valid JSON (no markdown):
{"impact":85,"clarity":70,"keywords":60,"format":80,"length":75,"relevance":90,"feedback":"One sentence of overall feedback."}

RESUME:\n${buildText(form)}\nJOB DESCRIPTION:\n${jobDesc||"General professional role"}`,
    "Return only valid JSON. No markdown. No explanation.")
    .then(r=>{
      try{const c=r.replace(/```json|```/g,"").trim();setScorecard(JSON.parse(c));}
      catch{setScorecard({impact:70,clarity:65,keywords:60,format:75,length:70,relevance:65,feedback:"Could not parse — try again."});}
      load("scorecard",false);
    });
  };

  // ── Weakness scanner
  const handleWeakness=()=>{
    load("weakness",true);
    claude(`Scan this resume for weaknesses. Return ONLY a JSON array (no markdown) of up to 6 items:
[{"issue":"Uses vague phrase 'responsible for'","severity":"high","fix":"Replace with action verb: 'Led', 'Owned', 'Drove'"},...]
Severity must be: high, medium, or low.

RESUME:\n${buildText(form)}`,
    "Return only a JSON array. No markdown. No explanation.")
    .then(r=>{
      try{const c=r.replace(/```json|```/g,"").trim();setWeaknesses(JSON.parse(c));}
      catch{setWeaknesses([{issue:"Could not parse weaknesses — try again.",severity:"low",fix:"Please retry."}]);}
      load("weakness",false);
    });
  };

  // ── Salary intelligence
  const handleSalary=()=>{
    load("salary",true);
    claude(`Based on this resume (role, experience level, skills, location), estimate a realistic salary range.
Return ONLY valid JSON (no markdown):
{"min":80000,"mid":95000,"max":115000,"currency":"USD","level":"Senior","market":"US","notes":"Brief 1-sentence context about the estimate."}

RESUME:\n${buildText(form)}\nJOB DESCRIPTION:\n${jobDesc||""}`,
    "Return only valid JSON. No markdown.")
    .then(r=>{
      try{const c=r.replace(/```json|```/g,"").trim();setSalary(JSON.parse(c));}
      catch{setSalary({min:0,mid:0,max:0,currency:"USD",level:"N/A",market:"N/A",notes:"Could not estimate — try again."});}
      load("salary",false);
    });
  };

  // ── Job match
  const handleJobMatch=()=>{
    load("jobmatch",true);
    claude(`Compare this resume to the job description. Return ONLY valid JSON (no markdown):
{"matched":["Python","Leadership","5+ years experience"],"missing":["Kubernetes","Budget management"],"score":72,"tips":["Add a project demonstrating Kubernetes","Mention any budget ownership"]}

RESUME:\n${buildText(form)}\nJOB DESCRIPTION:\n${jobDesc||"General professional role"}`,
    "Return only valid JSON. No markdown.")
    .then(r=>{
      try{const c=r.replace(/```json|```/g,"").trim();setJobMatch(JSON.parse(c));}
      catch{setJobMatch({matched:[],missing:[],score:0,tips:["Could not parse — try again."]});}
      load("jobmatch",false);
    });
  };

  // ── Resume Roast
  const [roast, setRoast] = useState(null);
  const [roastIntro, setRoastIntro] = useState("");

  // Jobs state
  const [jobSuggestions, setJobSuggestions] = useState(null);
  const [jobLoading, setJobLoading] = useState(false);

  // ── Job Tracker state
  const STATUSES=["Applied","Phone Screen","Interview","Final Round","Offer","Rejected","Ghosted"];
  const STATUS_COLORS={"Applied":"#6366f1","Phone Screen":"#0891b2","Interview":"#d97706","Final Round":"#7c3aed","Offer":"#16a34a","Rejected":"#dc2626","Ghosted":"#6b7280"};
  const BLANK_JOB={id:null,company:"",role:"",location:"",salary:"",url:"",status:"Applied",date:new Date().toISOString().slice(0,10),notes:"",aiTips:""};
  const [jobs, setJobs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [newJob, setNewJob] = useState(BLANK_JOB);
  const [filterStatus, setFilterStatus] = useState("All");
  const [tipsLoading, setTipsLoading] = useState(false);
  const [activeJobId, setActiveJobId] = useState(null);

  // ── Interview Journal state
  const BLANK_ENTRY={id:null,company:"",role:"",date:new Date().toISOString().slice(0,10),round:"HR Screen",mood:"😐",questions:[{q:"",myAnswer:"",betterAnswer:""}],overallNotes:"",aiFeedback:"",aiScore:null};
  const ROUNDS=["HR Screen","Technical Round 1","Technical Round 2","Managerial","Final Round","Group Discussion","Case Study"];
  const MOODS=[["😰","Nervous"],["😐","Okay"],["🙂","Good"],["😄","Great"],["🔥","Crushed it"]];
  const [journal, setJournal] = useState([]);
  const [jForm, setJForm] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [entry, setEntry] = useState(BLANK_ENTRY);
  const [jFeedbackLoading, setJFeedbackLoading] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState(null);
  const [viewEntry, setViewEntry] = useState(null);
  const handleRoast=()=>{
    load("roast",true);
    claude(`You are a brutally honest, witty, savage-but-constructive resume roaster. Think Gordon Ramsay meets career coach.
Roast this resume hard but fairly. Be specific, funny, and ruthless — but every burn must have a real point.

Return ONLY valid JSON (no markdown):
{
  "intro": "One savage opening line summarizing the resume overall",
  "burns": [
    {"emoji":"🔥","line":"Exact quote or issue from resume","burn":"The savage roast comment with actual advice hidden in it"},
    ...
  ],
  "verdict": "One final brutal-but-honest verdict sentence",
  "rating": "X/10 — with a funny label like 'Participation Trophy' or 'Almost Employable'"
}
Give 5-7 burns. Be specific to THEIR resume content, not generic.

RESUME:\n${buildText(form)}`,
    "Return only valid JSON. No markdown. Be savage but constructive.")
    .then(r=>{
      try{
        const c=r.replace(/```json|```/g,"").trim();
        const parsed=JSON.parse(c);
        setRoastIntro(parsed);
        setRoast(parsed.burns||[]);
      }catch{
        setRoast([{emoji:"🔥",line:"Your resume",burn:"Could not roast — try again. Even the AI gave up."}]);
      }
      load("roast",false);
    });
  };

  // ── Job Finder
  const handleFindJobs=async()=>{
    setJobLoading(true);
    try{
      const r=await claude(`Analyze this resume and return ONLY valid JSON (no markdown):
{
  "title": "Best matching job title for this person",
  "level": "Junior / Mid / Senior / Lead",
  "roles": [
    {"title":"Exact Job Title","match":95,"reason":"One line why this fits","query":"search query for job boards"},
    ...
  ],
  "topSkills": ["skill1","skill2","skill3","skill4","skill5"],
  "location": "extracted location or empty string",
  "industries": ["Industry 1","Industry 2","Industry 3"]
}
Give 6 role suggestions ranked by match %. Make search queries specific and realistic for job boards.

RESUME:\n${buildText(form)}`,
      "Return only valid JSON. No markdown. No explanation.");
      const c=r.replace(/```json|```/g,"").trim();
      setJobSuggestions(JSON.parse(c));
    }catch(e){
      setJobSuggestions({title:"Professional",level:"Mid",roles:[],topSkills:[],location:"",industries:[]});
    }
    setJobLoading(false);
  };

  const openJobs=(query,location,platform)=>{
    const loc=location||"";
    const q=encodeURIComponent(query);
    const l=encodeURIComponent(loc);
    const urls={
      linkedin:`https://www.linkedin.com/jobs/search/?keywords=${q}&location=${l}`,
      indeed:`https://www.indeed.com/jobs?q=${q}&l=${l}`,
      naukri:`https://www.naukri.com/${query.toLowerCase().replace(/\s+/g,"-")}-jobs`,
      google:`https://www.google.com/search?q=${q}+jobs+${l}+site:linkedin.com+OR+site:indeed.com`,
      internshala:`https://internshala.com/jobs/${query.toLowerCase().replace(/\s+/g,"-")}-jobs`,
    };
    window.open(urls[platform],"_blank");
  };

  // ── Job Tracker handlers
  const saveJob=()=>{
    if(!newJob.company.trim()||!newJob.role.trim())return;
    if(editJob!==null){
      setJobs(j=>j.map((x,i)=>i===editJob?{...newJob,id:x.id}:x));
      setEditJob(null);
    } else {
      setJobs(j=>[...j,{...newJob,id:Date.now()}]);
    }
    setNewJob(BLANK_JOB);setShowForm(false);
  };
  const deleteJob=(id)=>setJobs(j=>j.filter(x=>x.id!==id));
  const updateStatus=(id,status)=>setJobs(j=>j.map(x=>x.id===id?{...x,status}:x));
  const startEdit=(job,idx)=>{setNewJob(job);setEditJob(idx);setShowForm(true);};

  const getAITips=async(job)=>{
    setTipsLoading(true);setActiveJobId(job.id);
    const tips=await claude(`Give 3 specific, actionable tips for this job application in progress.
Company: ${job.company}, Role: ${job.role}, Status: ${job.status}, Notes: ${job.notes||"none"}
Resume skills: ${form.skills.join(", ")}
Format: numbered list, each tip max 1 sentence. Be specific and practical.`,
    "You are a career coach. Be concise and actionable.");
    setJobs(j=>j.map(x=>x.id===job.id?{...x,aiTips:tips}:x));
    setTipsLoading(false);setActiveJobId(null);
  };

  // stats
  const stats={
    total:jobs.length,
    active:jobs.filter(j=>!["Rejected","Ghosted"].includes(j.status)).length,
    interviews:jobs.filter(j=>["Interview","Final Round"].includes(j.status)).length,
    offers:jobs.filter(j=>j.status==="Offer").length,
    rate:jobs.length?Math.round((jobs.filter(j=>j.status!=="Applied").length/jobs.length)*100):0,
  };

  // ── Interview Journal handlers
  const saveEntry=()=>{
    if(!entry.company.trim()||!entry.role.trim())return;
    if(editEntry!==null){
      setJournal(j=>j.map((x,i)=>i===editEntry?{...entry,id:x.id}:x));
      setEditEntry(null);
    } else {
      setJournal(j=>[...j,{...entry,id:Date.now()}]);
    }
    setEntry(BLANK_ENTRY);setJForm(false);
  };
  const deleteEntry=(id)=>setJournal(j=>j.filter(x=>x.id!==id));
  const addQuestion=()=>setEntry(e=>({...e,questions:[...e.questions,{q:"",myAnswer:"",betterAnswer:""}]}));
  const removeQuestion=(i)=>setEntry(e=>({...e,questions:e.questions.filter((_,j)=>j!==i)}));
  const updQuestion=(i,field,val)=>setEntry(e=>{const qs=[...e.questions];qs[i]={...qs[i],[field]:val};return{...e,questions:qs};});

  const getJFeedback=async(ent)=>{
    setJFeedbackLoading(true);setActiveEntryId(ent.id);
    try{
      const r=await claude(`Analyze this interview performance and return ONLY valid JSON (no markdown):
{"score":75,"strengths":["strength 1","strength 2"],"improvements":["area 1","area 2"],"questionFeedback":[{"q":"question text","rating":"Good/Okay/Needs Work","tip":"specific tip"}],"overallAdvice":"One powerful sentence of advice for next time."}

Interview: ${ent.role} at ${ent.company} — ${ent.round}
Mood: ${ent.mood}
Questions & Answers:
${ent.questions.map((q,i)=>`Q${i+1}: ${q.q}\nMy Answer: ${q.myAnswer}`).join("\n\n")}
Overall Notes: ${ent.overallNotes}
Candidate Skills: ${form.skills.join(", ")}`,
      "Return only valid JSON. No markdown. Be constructive and specific.");
      const c=r.replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(c);
      setJournal(j=>j.map(x=>x.id===ent.id?{...x,aiFeedback:parsed}:x));
    }catch{
      setJournal(j=>j.map(x=>x.id===ent.id?{...x,aiFeedback:{score:0,strengths:[],improvements:[],questionFeedback:[],overallAdvice:"Could not analyze — try again."}}:x));
    }
    setJFeedbackLoading(false);setActiveEntryId(null);
  };

  // ── Print
  const handlePrint=()=>{
    const el=document.getElementById("rpa");
    if(!el)return;
    const w=window.open("","_blank","width=900,height=700");
    if(!w){alert("Please allow popups for this site to export PDF.");return;}
    w.document.write(`<!DOCTYPE html><html><head><title>${form.name} — Resume</title>
    <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Fraunces:ital,wght@0,300;0,700;0,900;1,300&display=swap" rel="stylesheet">
    <style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#fff;}</style>
    </head><body>${el.outerHTML}</body></html>`);
    w.document.close();
    setTimeout(()=>w.print(),600);
  };

  // ── Validate
  const validate=()=>{
    if(step===0){
      const e={};
      if(!form.name.trim())e.name="Name is required";
      if(!form.email.trim())e.email="Email is required";
      if(Object.keys(e).length){setErrors(e);return false;}
    }
    setErrors({});return true;
  };

  const atsScore=(()=>{const m=ai.ats?.match(/(\d{1,3})\/100/);return m?parseInt(m[1]):null;})();
  const atsColor=atsScore>=75?"#16a34a":atsScore>=50?"#d97706":"#dc2626";

  // ── Styles
  const C={
    app:{minHeight:"100vh",background:"#080710",fontFamily:"'Sora',sans-serif",color:"#e8e6f0"},
    hdr:{background:"#080710",borderBottom:"1px solid #161428",padding:"16px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,backdropFilter:"blur(12px)"},
    logo:{fontFamily:"'Fraunces',serif",fontSize:"22px",fontWeight:900,color:"#e8e6f0"},
    acc:{color:"#818cf8"},
    main:{maxWidth:1180,margin:"0 auto",padding:"32px 20px"},
    steps:{display:"flex",gap:6,marginBottom:32},
    step:(a,d)=>({flex:1,padding:"9px 4px",textAlign:"center",fontSize:11,fontWeight:600,borderRadius:8,cursor:"pointer",letterSpacing:"0.4px",transition:"all 0.2s",background:a?"#6366f1":d?"#161428":"#0e0c1a",color:a?"#fff":d?"#818cf8":"#4b5563",border:a?"none":`1px solid ${d?"#2d2b50":"#161428"}`}),
    card:{background:"#0e0c1a",border:"1px solid #161428",borderRadius:14,padding:26,marginBottom:18},
    sTitle:{fontFamily:"'Fraunces',serif",fontSize:19,fontWeight:700,marginBottom:18,color:"#e8e6f0"},
    lbl:{display:"block",fontSize:10,fontWeight:600,color:"#9ca3af",marginBottom:5,letterSpacing:"0.8px",textTransform:"uppercase"},
    inp:(err)=>({width:"100%",background:"#080710",border:`1px solid ${err?"#dc2626":"#161428"}`,borderRadius:8,padding:"11px 13px",color:"#e8e6f0",fontSize:13,fontFamily:"'Sora',sans-serif",outline:"none",boxSizing:"border-box",transition:"border-color 0.2s"}),
    ta:{width:"100%",background:"#080710",border:"1px solid #161428",borderRadius:8,padding:"11px 13px",color:"#e8e6f0",fontSize:13,fontFamily:"'Sora',sans-serif",outline:"none",resize:"vertical",minHeight:90,boxSizing:"border-box"},
    g2:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13},
    g3:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:13},
    btn:(v="p")=>({padding:"10px 22px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:12,fontFamily:"'Sora',sans-serif",transition:"all 0.18s",letterSpacing:"0.3px",...({p:{background:"#6366f1",color:"#fff"},o:{background:"transparent",color:"#818cf8",border:"1px solid #2d2b50"},g:{background:"#161428",color:"#9ca3af"},success:{background:"#16a34a",color:"#fff"},warn:{background:"#d97706",color:"#fff"},danger:{background:"#9f1239",color:"#fff"}}[v])}),
    tab:(a)=>({padding:"9px 16px",border:"none",cursor:"pointer",fontWeight:600,fontSize:11,fontFamily:"'Sora',sans-serif",letterSpacing:"0.4px",background:a?"#161428":"transparent",color:a?"#818cf8":"#4b5563",borderBottom:a?"2px solid #6366f1":"2px solid transparent",transition:"all 0.15s"}),
    box:{background:"#080710",border:"1px solid #161428",borderRadius:10,padding:16,fontSize:13,lineHeight:1.8,color:"#cbd5e1",whiteSpace:"pre-wrap",maxHeight:280,overflowY:"auto",marginTop:14},
    chip:{display:"inline-flex",alignItems:"center",background:"#161428",color:"#818cf8",border:"1px solid #2d2b50",borderRadius:20,padding:"4px 12px",fontSize:12,gap:6},
    chipX:{background:"none",border:"none",color:"#6b7280",cursor:"pointer",padding:0,fontSize:13,lineHeight:1},
    blk:{padding:18,background:"#080710",borderRadius:10,marginBottom:12,border:"1px solid #161428"},
    navRow:{display:"flex",justifyContent:"space-between",marginTop:24,alignItems:"center"},
    tCard:(a)=>({flex:1,padding:14,borderRadius:10,cursor:"pointer",textAlign:"center",border:a?"2px solid #6366f1":"1px solid #161428",background:a?"#161428":"#0e0c1a",transition:"all 0.15s"}),
    errTxt:{color:"#f87171",fontSize:11,marginTop:4},
  };

  const renderStep=()=>{
    switch(step){

      // ── STEP 0: Profile ────────────────────────────────────────────────────
      case 0: return (<div>
        <div style={C.card}>
          <div style={C.sTitle}>Personal Information</div>
          <div style={{marginBottom:13}}>
            <label style={C.lbl}>Full Name *</label>
            <input style={C.inp(errors.name)} value={form.name} onChange={e=>upd("name",e.target.value)} placeholder="Jane Smith"/>
            {errors.name&&<div style={C.errTxt}>{errors.name}</div>}
          </div>
          <div style={{...C.g2,marginBottom:13}}>
            <div><label style={C.lbl}>Email *</label><input style={C.inp(errors.email)} value={form.email} onChange={e=>upd("email",e.target.value)} placeholder="jane@email.com"/>{errors.email&&<div style={C.errTxt}>{errors.email}</div>}</div>
            <div><label style={C.lbl}>Phone</label><input style={C.inp(false)} value={form.phone} onChange={e=>upd("phone",e.target.value)} placeholder="+1 555 000 1234"/></div>
          </div>
          <div style={{...C.g3,marginBottom:13}}>
            <div><label style={C.lbl}>Location</label><input style={C.inp(false)} value={form.location} onChange={e=>upd("location",e.target.value)} placeholder="New York, USA"/></div>
            <div><label style={C.lbl}>LinkedIn</label><input style={C.inp(false)} value={form.linkedin} onChange={e=>upd("linkedin",e.target.value)} placeholder="linkedin.com/in/jane"/></div>
            <div><label style={C.lbl}>Website</label><input style={C.inp(false)} value={form.website} onChange={e=>upd("website",e.target.value)} placeholder="janesmith.dev"/></div>
          </div>
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
              <label style={{...C.lbl,marginBottom:0}}>Professional Summary</label>
              <button style={{...C.btn("o"),padding:"5px 12px",fontSize:10}} onClick={handleSummary} disabled={loading.summary}>{loading.summary?"Writing...":"✨ AI Write Summary"}</button>
            </div>
            <textarea style={C.ta} value={form.summary} onChange={e=>upd("summary",e.target.value)} placeholder="Brief overview of your background and strengths..." rows={4}/>
            {ai.summary&&(
              <div style={C.box}>
                <div style={{fontSize:10,color:"#6366f1",marginBottom:8,fontWeight:700}}>CLICK AN OPTION TO USE IT:</div>
                {ai.summary.split(/Option\s*\d+\s*[:\.]/i).filter(s=>s.trim()).map((opt,i)=>(
                  <div key={i} onClick={()=>{upd("summary",opt.trim());setAi(a=>({...a,summary:""}));}}
                    style={{padding:"10px 12px",borderRadius:6,cursor:"pointer",marginBottom:8,background:"#0e0c1a",border:"1px solid #161428",fontSize:13,lineHeight:1.7,color:"#cbd5e1",transition:"border-color 0.15s"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor="#6366f1"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor="#161428"}>
                    <div style={{fontSize:9,color:"#6366f1",fontWeight:700,marginBottom:4}}>OPTION {i+1} — CLICK TO USE</div>
                    {opt.trim()}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>);

      // ── STEP 1: Experience ─────────────────────────────────────────────────
      case 1: return (<div>
        <div style={C.card}>
          <div style={C.sTitle}>Work Experience</div>
          {form.experience.map((ex,i)=>(
            <div key={i} style={C.blk}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                <span style={{fontSize:11,fontWeight:700,color:"#818cf8",letterSpacing:"0.5px"}}>POSITION {i+1}</span>
                {form.experience.length>1&&<button style={{...C.btn("danger"),padding:"3px 10px",fontSize:10}} onClick={()=>remExp(i)}>Remove</button>}
              </div>
              <div style={{...C.g2,marginBottom:11}}><div><label style={C.lbl}>Company</label><input style={C.inp(false)} value={ex.company} onChange={e=>updExp(i,"company",e.target.value)} placeholder="Acme Corp"/></div><div><label style={C.lbl}>Role / Title</label><input style={C.inp(false)} value={ex.role} onChange={e=>updExp(i,"role",e.target.value)} placeholder="Senior Engineer"/></div></div>
              <div style={{marginBottom:11}}><label style={C.lbl}>Duration</label><input style={C.inp(false)} value={ex.duration} onChange={e=>updExp(i,"duration",e.target.value)} placeholder="Jan 2022 – Present"/></div>
              <div><label style={C.lbl}>Description</label><textarea style={C.ta} value={ex.description} onChange={e=>updExp(i,"description",e.target.value)} placeholder="Key responsibilities and achievements..."/></div>
            </div>
          ))}
          <button style={C.btn("o")} onClick={addExp}>+ Add Experience</button>
        </div>
        <div style={C.card}>
          <div style={C.sTitle}>Education</div>
          {form.education.map((ed,i)=>(
            <div key={i} style={C.blk}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                <span style={{fontSize:11,fontWeight:700,color:"#818cf8",letterSpacing:"0.5px"}}>EDUCATION {i+1}</span>
                {form.education.length>1&&<button style={{...C.btn("danger"),padding:"3px 10px",fontSize:10}} onClick={()=>remEdu(i)}>Remove</button>}
              </div>
              <div style={C.g3}><div><label style={C.lbl}>School</label><input style={C.inp(false)} value={ed.school} onChange={e=>updEdu(i,"school",e.target.value)} placeholder="MIT"/></div><div><label style={C.lbl}>Degree</label><input style={C.inp(false)} value={ed.degree} onChange={e=>updEdu(i,"degree",e.target.value)} placeholder="B.Sc Computer Science"/></div><div><label style={C.lbl}>Year</label><input style={C.inp(false)} value={ed.year} onChange={e=>updEdu(i,"year",e.target.value)} placeholder="2022"/></div></div>
            </div>
          ))}
          <button style={C.btn("o")} onClick={addEdu}>+ Add Education</button>
        </div>
      </div>);

      // ── STEP 2: Skills ─────────────────────────────────────────────────────
      case 2: return (<div style={C.card}>
        <div style={C.sTitle}>Skills</div>
        <label style={C.lbl}>Add skills — press Enter or click Add</label>
        <div style={{display:"flex",gap:10,marginBottom:14}}>
          <input style={{...C.inp(false),flex:1}} value={skillInput} onChange={e=>setSkillInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addSkill()} placeholder="e.g. React, Python, Leadership..."/>
          <button style={C.btn()} onClick={addSkill}>Add</button>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,minHeight:52,background:"#080710",borderRadius:10,padding:14,border:"1px solid #161428"}}>
          {form.skills.length===0&&<span style={{color:"#374151",fontSize:12}}>Your skill tags will appear here...</span>}
          {form.skills.map((s,i)=><span key={i} style={C.chip}>{s}<button style={C.chipX} onClick={()=>remSkill(i)}>✕</button></span>)}
        </div>
        <p style={{color:"#6b7280",fontSize:11,marginTop:10}}>💡 Include both technical skills and soft skills for the best ATS results.</p>
      </div>);

      // ── STEP 3: AI Tools ───────────────────────────────────────────────────
      case 3: return (<div>
        <div style={C.card}>
          <div style={C.sTitle}>Target Job Description</div>
          <label style={C.lbl}>Paste job description (powers all AI features)</label>
          <textarea style={{...C.ta,minHeight:120}} value={jobDesc} onChange={e=>setJobDesc(e.target.value)} placeholder="Paste the full job description here for best results..."/>
        </div>
        <div style={C.card}>
          <div style={{display:"flex",gap:0,marginBottom:22,borderBottom:"1px solid #161428",overflowX:"auto",flexWrap:"nowrap"}}>
            {[["rewrite","✍️ Rewrite"],["ats","📊 ATS Score"],["scorecard","🎯 Scorecard"],["weakness","🔍 Weaknesses"],["salary","💰 Salary"],["jobmatch","🔗 Job Match"],["interview","🎤 Interview"],["cover","📝 Cover Letter"],["roast","🔥 Roast Me"]].map(([k,lbl])=>(
              <button key={k} style={C.tab(aiTab===k)} onClick={()=>setAiTab(k)}>{lbl}</button>
            ))}
          </div>

          {/* Rewrite */}
          {aiTab==="rewrite"&&<div>
            <p style={{color:"#9ca3af",fontSize:12,marginBottom:14,lineHeight:1.8}}>Rewrites your resume with stronger language, matched keywords and quantified achievements.</p>
            <button style={C.btn()} onClick={handleRewrite} disabled={loading.rewrite}>{loading.rewrite?"✨ Rewriting...":"✨ Rewrite My Resume"}</button>
            {ai.rewrite&&<div style={C.box}>{ai.rewrite}</div>}
          </div>}

          {/* ATS */}
          {aiTab==="ats"&&<div>
            <p style={{color:"#9ca3af",fontSize:12,marginBottom:14,lineHeight:1.8}}>Check how your resume performs against Applicant Tracking Systems used by 90% of companies.</p>
            <button style={C.btn("success")} onClick={handleATS} disabled={loading.ats}>{loading.ats?"Analyzing...":"📊 Check ATS Score"}</button>
            {ai.ats&&<div style={{marginTop:14}}>
              {atsScore!==null&&<div style={{display:"flex",alignItems:"center",gap:14,background:"#080710",borderRadius:10,padding:14,marginBottom:12,border:"1px solid #161428"}}>
                <div style={{width:64,height:64,borderRadius:"50%",border:`4px solid ${atsColor}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{fontSize:18,fontWeight:700,color:atsColor,lineHeight:1}}>{atsScore}</span>
                  <span style={{fontSize:9,color:"#6b7280"}}>/100</span>
                </div>
                <div><div style={{fontWeight:700,color:atsColor}}>{atsScore>=75?"Strong Match 🎉":atsScore>=50?"Decent Match 👍":"Needs Work ⚠️"}</div><div style={{fontSize:11,color:"#9ca3af"}}>ATS Compatibility</div></div>
              </div>}
              <div style={C.box}>{ai.ats}</div>
            </div>}
          </div>}

          {/* Scorecard */}
          {aiTab==="scorecard"&&<div>
            <p style={{color:"#9ca3af",fontSize:12,marginBottom:14,lineHeight:1.8}}>Get a visual breakdown of your resume across 6 key dimensions: Impact, Clarity, Keywords, Format, Length, and Relevance.</p>
            <button style={{...C.btn(),background:"#7c3aed"}} onClick={handleScorecard} disabled={loading.scorecard}>{loading.scorecard?"Scoring...":"🎯 Generate Scorecard"}</button>
            {scorecard&&<div style={{marginTop:18}}>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"space-around",background:"#080710",borderRadius:12,padding:"20px 10px",border:"1px solid #161428",marginBottom:12}}>
                {[["Impact",scorecard.impact,"#f59e0b"],["Clarity",scorecard.clarity,"#06b6d4"],["Keywords",scorecard.keywords,"#8b5cf6"],["Format",scorecard.format,"#10b981"],["Length",scorecard.length,"#f43f5e"],["Relevance",scorecard.relevance,"#6366f1"]].map(([l,s,c])=>(
                  <Gauge key={l} label={l} score={s} color={c}/>
                ))}
              </div>
              {scorecard.feedback&&<div style={{background:"#080710",border:"1px solid #161428",borderRadius:8,padding:"12px 14px",fontSize:13,color:"#cbd5e1",lineHeight:1.7}}>💬 {scorecard.feedback}</div>}
            </div>}
          </div>}

          {/* Weaknesses */}
          {aiTab==="weakness"&&<div>
            <p style={{color:"#9ca3af",fontSize:12,marginBottom:14,lineHeight:1.8}}>AI scans your resume line by line for weak verbs, vague phrases, missing quantification and career gaps — with specific fixes for each.</p>
            <button style={C.btn("warn")} onClick={handleWeakness} disabled={loading.weakness}>{loading.weakness?"Scanning...":"🔍 Scan for Weaknesses"}</button>
            {weaknesses&&<div style={{marginTop:14}}>
              <div style={{fontSize:11,color:"#9ca3af",marginBottom:10}}>{weaknesses.length} issue{weaknesses.length!==1?"s":""} found — click each to see the fix</div>
              {weaknesses.map((w,i)=><WeaknessItem key={i} item={w}/>)}
            </div>}
          </div>}

          {/* Salary */}
          {aiTab==="salary"&&<div>
            <p style={{color:"#9ca3af",fontSize:12,marginBottom:14,lineHeight:1.8}}>AI estimates your market salary range based on your role, experience level, skills, and location. Know your worth before you negotiate.</p>
            <button style={{...C.btn(),background:"#059669"}} onClick={handleSalary} disabled={loading.salary}>{loading.salary?"Estimating...":"💰 Estimate My Salary"}</button>
            {salary&&<div style={{marginTop:14}}>
              <div style={{background:"#080710",border:"1px solid #161428",borderRadius:12,padding:20}}>
                <div style={{fontSize:11,color:"#9ca3af",letterSpacing:"1px",textTransform:"uppercase",marginBottom:14}}>Estimated Salary Range · {salary.market} Market · {salary.level}</div>
                <div style={{display:"flex",alignItems:"flex-end",gap:0,marginBottom:16}}>
                  {[["Min",salary.min,"#6b7280",60],["Mid",salary.mid,"#6366f1",80],["Max",salary.max,"#10b981",60]].map(([l,v,c,h])=>(
                    <div key={l} style={{flex:1,textAlign:"center"}}>
                      <div style={{height:h,background:`${c}22`,border:`1px solid ${c}44`,borderRadius:"6px 6px 0 0",marginBottom:6}}/>
                      <div style={{fontSize:18,fontWeight:700,color:c}}>{salary.currency}{v?.toLocaleString()||"—"}</div>
                      <div style={{fontSize:10,color:"#6b7280",marginTop:2}}>{l}</div>
                    </div>
                  ))}
                </div>
                {salary.notes&&<div style={{fontSize:12,color:"#9ca3af",borderTop:"1px solid #161428",paddingTop:12,lineHeight:1.7}}>📌 {salary.notes}</div>}
              </div>
            </div>}
          </div>}

          {/* Job Match */}
          {aiTab==="jobmatch"&&<div>
            <p style={{color:"#9ca3af",fontSize:12,marginBottom:14,lineHeight:1.8}}>Side-by-side comparison of your resume vs the job description with color-coded matches and gaps.</p>
            <button style={{...C.btn(),background:"#0891b2"}} onClick={handleJobMatch} disabled={loading.jobmatch}>{loading.jobmatch?"Comparing...":"🔗 Run Job Match"}</button>
            {jobMatch&&<div style={{marginTop:14}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                <div style={{background:"#052e16",border:"1px solid #166534",borderRadius:10,padding:14}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#4ade80",letterSpacing:"1px",marginBottom:10}}>✓ MATCHED ({jobMatch.matched?.length||0})</div>
                  {(jobMatch.matched||[]).map((m,i)=><div key={i} style={{fontSize:12,color:"#86efac",marginBottom:4,display:"flex",gap:6}}>✓ {m}</div>)}
                </div>
                <div style={{background:"#450a0a",border:"1px solid #991b1b",borderRadius:10,padding:14}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#f87171",letterSpacing:"1px",marginBottom:10}}>✗ MISSING ({jobMatch.missing?.length||0})</div>
                  {(jobMatch.missing||[]).map((m,i)=><div key={i} style={{fontSize:12,color:"#fca5a5",marginBottom:4,display:"flex",gap:6}}>✗ {m}</div>)}
                </div>
              </div>
              <div style={{background:"#080710",border:"1px solid #161428",borderRadius:10,padding:14}}>
                <div style={{fontSize:12,fontWeight:700,color:"#818cf8",marginBottom:8}}>Match Score: {jobMatch.score}% — Tips to improve:</div>
                {(jobMatch.tips||[]).map((t,i)=><div key={i} style={{fontSize:12,color:"#9ca3af",marginBottom:6,paddingLeft:14,borderLeft:"2px solid #6366f1"}}>→ {t}</div>)}
              </div>
            </div>}
          </div>}

          {/* Interview */}
          {aiTab==="interview"&&<div>
            <p style={{color:"#9ca3af",fontSize:12,marginBottom:14,lineHeight:1.8}}>7 personalized interview questions: behavioral, technical, situational, and a curveball — with prep tips.</p>
            <button style={{...C.btn(),background:"#7c3aed"}} onClick={handleInterview} disabled={loading.interview}>{loading.interview?"Generating...":"🎤 Generate Questions"}</button>
            {ai.interview&&<div style={C.box}>{ai.interview}</div>}
          </div>}

          {/* Cover Letter */}
          {aiTab==="cover"&&<div>
            <p style={{color:"#9ca3af",fontSize:12,marginBottom:14,lineHeight:1.8}}>A tailored, 3-paragraph cover letter ready to send. Hook + value proposition, achievements, and a strong closing.</p>
            <button style={{...C.btn(),background:"#0e7490"}} onClick={handleCover} disabled={loading.cover}>{loading.cover?"Writing...":"📝 Generate Cover Letter"}</button>
            {ai.cover&&<div>
              <div style={C.box}>{ai.cover}</div>
              <button style={{...C.btn("o"),marginTop:10,fontSize:11}} onClick={()=>navigator.clipboard?.writeText(ai.cover)}>📋 Copy to Clipboard</button>
            </div>}
          </div>}

          {/* Roast */}
          {aiTab==="roast"&&<div>
            <div style={{background:"linear-gradient(135deg,#1a0a0a,#2d0f0f)",border:"1px solid #7f1d1d",borderRadius:12,padding:16,marginBottom:16,display:"flex",gap:12,alignItems:"center"}}>
              <span style={{fontSize:32}}>🔥</span>
              <div>
                <div style={{fontWeight:700,color:"#fca5a5",fontSize:14,marginBottom:3}}>Resume Roast Mode</div>
                <div style={{fontSize:12,color:"#9ca3af",lineHeight:1.7}}>Brutally honest AI feedback. Gordon Ramsay meets career coach. <span style={{color:"#f87171"}}>Not for the faint-hearted.</span></div>
              </div>
            </div>
            <button style={{...C.btn(),background:"linear-gradient(135deg,#dc2626,#b45309)",fontSize:13,padding:"12px 28px"}} onClick={handleRoast} disabled={loading.roast}>
              {loading.roast?"🔥 Roasting your resume...":"🔥 Roast My Resume"}
            </button>
            {roastIntro&&roast&&<div style={{marginTop:18}}>
              {/* Intro line */}
              <div style={{background:"#1a0a0a",border:"1px solid #7f1d1d",borderRadius:10,padding:"14px 18px",marginBottom:14,fontSize:14,color:"#fca5a5",fontStyle:"italic",lineHeight:1.7}}>
                💬 "{roastIntro.intro}"
              </div>
              {/* Individual burns */}
              {roast.map((b,i)=>(
                <div key={i} style={{background:"#0d0b18",borderLeft:"3px solid #dc2626",borderRadius:"0 8px 8px 0",padding:"12px 16px",marginBottom:10,border:"1px solid #1e1c2e",borderLeftColor:"#dc2626"}}>
                  <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:6}}>
                    <span style={{fontSize:18,flexShrink:0}}>{b.emoji}</span>
                    <div style={{fontSize:12,color:"#6b7280",fontStyle:"italic",lineHeight:1.6}}>"{b.line}"</div>
                  </div>
                  <div style={{fontSize:13,color:"#fbbf24",lineHeight:1.7,paddingLeft:28}}>{b.burn}</div>
                </div>
              ))}
              {/* Verdict */}
              {roastIntro.verdict&&<div style={{background:"linear-gradient(135deg,#1a0a0a,#0f0a1a)",border:"1px solid #7f1d1d",borderRadius:10,padding:"16px 18px",marginTop:6}}>
                <div style={{fontSize:10,color:"#f87171",fontWeight:700,letterSpacing:"1px",marginBottom:8}}>FINAL VERDICT</div>
                <div style={{fontSize:13,color:"#fca5a5",lineHeight:1.7,marginBottom:10}}>⚖️ {roastIntro.verdict}</div>
                {roastIntro.rating&&<div style={{display:"inline-block",background:"#dc262620",border:"1px solid #dc2626",borderRadius:20,padding:"4px 16px",fontSize:12,fontWeight:700,color:"#f87171"}}>
                  🏆 {roastIntro.rating}
                </div>}
              </div>}
              {/* Share nudge */}
              <div style={{marginTop:14,display:"flex",gap:10,alignItems:"center"}}>
                <button style={{...C.btn("o"),fontSize:11,borderColor:"#7f1d1d",color:"#f87171"}} onClick={()=>{
                  const txt=`My resume just got roasted 🔥\n\n"${roastIntro.intro}"\n\nRating: ${roastIntro.rating}\n\nBuilt with ResumeAI`;
                  navigator.clipboard?.writeText(txt);
                }}>📋 Copy to Share</button>
                <span style={{fontSize:11,color:"#4b5563"}}>Share your roast on LinkedIn or Twitter 😂</span>
              </div>
            </div>}
          </div>}
        </div>
      </div>);

      // ── STEP 4: Preview & Export ───────────────────────────────────────────
      case 4: return (<div>
        <div style={C.card}>
          <div style={C.sTitle}>Choose Template</div>
          <div style={{display:"flex",gap:12}}>
            {TEMPLATES.map(t=>(
              <div key={t.id} style={C.tCard(form.template===t.id)} onClick={()=>upd("template",t.id)}>
                <div style={{width:36,height:4,background:t.accent,borderRadius:2,margin:"0 auto 8px"}}/>
                <div style={{fontSize:12,fontWeight:600,color:form.template===t.id?"#e8e6f0":"#6b7280"}}>{t.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{background:"#e8e8f0",borderRadius:14,padding:24,marginBottom:18,overflowX:"auto"}}>
          <Preview form={form}/>
        </div>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <button style={{...C.btn("success"),fontSize:14,padding:"12px 30px"}} onClick={handlePrint}>🖨️ Save as PDF</button>
          <button style={{...C.btn("o"),fontSize:14,padding:"12px 30px"}} onClick={()=>setStep(0)}>✏️ Edit Resume</button>
        </div>
        <p style={{textAlign:"center",color:"#4b5563",fontSize:11,marginTop:12}}>In the print dialog → set destination to "Save as PDF" → Save</p>
      </div>);

      // ── STEP 5: Find Jobs ──────────────────────────────────────────────────
      case 5: return (<div>
        {/* Hero */}
        <div style={{background:"linear-gradient(135deg,#0e0c1a,#0f1a2e)",border:"1px solid #1e3a5f",borderRadius:14,padding:24,marginBottom:18,textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:8}}>🎯</div>
          <div style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:700,color:"#e8e6f0",marginBottom:8}}>Find Jobs Matching Your Resume</div>
          <div style={{fontSize:13,color:"#9ca3af",lineHeight:1.8,maxWidth:500,margin:"0 auto 18px"}}>AI reads your resume, extracts your best-fit roles and skills, then opens real job searches on LinkedIn, Indeed, Naukri and more — pre-filled for you.</div>
          <button style={{...C.btn(),background:"linear-gradient(135deg,#2563eb,#7c3aed)",fontSize:14,padding:"13px 36px"}} onClick={handleFindJobs} disabled={jobLoading}>
            {jobLoading?"🔍 Analyzing your resume...":"🚀 Find My Jobs"}
          </button>
          {jobLoading&&<div style={{marginTop:14,fontSize:12,color:"#6366f1"}}>Reading your experience, skills and location to find the best matches...</div>}
        </div>

        {jobSuggestions&&<div>
          {/* Profile summary bar */}
          <div style={{...C.card,background:"linear-gradient(135deg,#0a0f1a,#0e1220)",border:"1px solid #1e3a5f",marginBottom:18}}>
            <div style={{display:"flex",flexWrap:"wrap",gap:20,alignItems:"center"}}>
              <div>
                <div style={{fontSize:10,color:"#6b7280",letterSpacing:"1px",textTransform:"uppercase",marginBottom:4}}>Best Match Title</div>
                <div style={{fontSize:18,fontWeight:700,color:"#60a5fa"}}>{jobSuggestions.title}</div>
                <div style={{fontSize:12,color:"#9ca3af",marginTop:2}}>{jobSuggestions.level} Level</div>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:10,color:"#6b7280",letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Top Skills Detected</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {(jobSuggestions.topSkills||[]).map((s,i)=>(
                    <span key={i} style={{background:"#1e3a5f",color:"#93c5fd",border:"1px solid #2563eb40",borderRadius:20,padding:"3px 12px",fontSize:12,fontWeight:500}}>{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{fontSize:10,color:"#6b7280",letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Industries</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {(jobSuggestions.industries||[]).map((ind,i)=>(
                    <span key={i} style={{background:"#1a1a2e",color:"#a78bfa",border:"1px solid #4c1d9540",borderRadius:20,padding:"3px 12px",fontSize:12}}>{ind}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Job role cards */}
          <div style={{marginBottom:18}}>
            <div style={{fontSize:12,fontWeight:700,color:"#9ca3af",letterSpacing:"1px",textTransform:"uppercase",marginBottom:14}}>🎯 AI-Matched Roles — Click a platform to open real jobs</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {(jobSuggestions.roles||[]).map((role,i)=>(
                <div key={i} style={{background:"#0e0c1a",border:"1px solid #161428",borderRadius:12,padding:16,transition:"border-color 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="#6366f1"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="#161428"}>
                  {/* Match bar */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{fontWeight:700,fontSize:14,color:"#e8e6f0"}}>{role.title}</div>
                    <div style={{fontSize:12,fontWeight:700,color:role.match>=80?"#4ade80":role.match>=60?"#fbbf24":"#f87171",background:role.match>=80?"#052e1640":role.match>=60?"#78350f40":"#450a0a40",border:`1px solid ${role.match>=80?"#16a34a":role.match>=60?"#d97706":"#dc2626"}40`,borderRadius:20,padding:"2px 10px"}}>
                      {role.match}% match
                    </div>
                  </div>
                  <div style={{height:4,background:"#161428",borderRadius:2,marginBottom:10,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${role.match}%`,background:role.match>=80?"linear-gradient(90deg,#16a34a,#4ade80)":role.match>=60?"linear-gradient(90deg,#d97706,#fbbf24)":"linear-gradient(90deg,#dc2626,#f87171)",borderRadius:2,transition:"width 1s ease"}}/>
                  </div>
                  <div style={{fontSize:12,color:"#9ca3af",lineHeight:1.6,marginBottom:12}}>💡 {role.reason}</div>
                  {/* Platform buttons */}
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {[
                      ["LinkedIn","#0a66c2","💼"],
                      ["Indeed","#003A9B","🔍"],
                      ["Naukri","#ff7555","🇮🇳"],
                      ["Google","#4285f4","🌐"],
                    ].map(([platform,color,icon])=>(
                      <button key={platform} onClick={()=>openJobs(role.query||role.title,jobSuggestions.location,platform.toLowerCase())}
                        style={{padding:"5px 12px",borderRadius:6,border:`1px solid ${color}40`,background:`${color}15`,color,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"all 0.15s"}}
                        onMouseEnter={e=>{e.currentTarget.style.background=`${color}30`;}}
                        onMouseLeave={e=>{e.currentTarget.style.background=`${color}15`;}}>
                        {icon} {platform}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick search bar */}
          <div style={C.card}>
            <div style={{fontSize:12,fontWeight:700,color:"#9ca3af",letterSpacing:"1px",textTransform:"uppercase",marginBottom:14}}>⚡ Quick Search — Open All Platforms At Once</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[
                ["💼 Search LinkedIn Jobs","#0a66c2",jobSuggestions.title,"linkedin"],
                ["🔍 Search Indeed","#003A9B",jobSuggestions.title,"indeed"],
                ["🇮🇳 Search Naukri","#ff7555",jobSuggestions.title,"naukri"],
                ["🎓 Search Internshala","#00aaff",jobSuggestions.title,"internshala"],
              ].map(([label,color,query,platform])=>(
                <button key={platform} onClick={()=>openJobs(query,jobSuggestions.location,platform)}
                  style={{padding:"12px 16px",borderRadius:10,border:`1px solid ${color}40`,background:`${color}12`,color,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Sora',sans-serif",textAlign:"left",transition:"all 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=`${color}25`}
                  onMouseLeave={e=>e.currentTarget.style.background=`${color}12`}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{marginTop:12,fontSize:11,color:"#4b5563",textAlign:"center"}}>
              📌 All searches open in a new tab with your resume keywords pre-filled
            </div>
          </div>
        </div>}
      </div>);

      // ── STEP 6: Job Tracker ────────────────────────────────────────────────
      case 6: return (<div>
        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:18}}>
          {[["Total Applied",stats.total,"#6366f1","📋"],["Active",stats.active,"#0891b2","🔥"],["Interviews",stats.interviews,"#d97706","🎤"],["Offers",stats.offers,"#16a34a","🎉"],["Response Rate",`${stats.rate}%`,"#7c3aed","📊"]].map(([label,val,color,icon])=>(
            <div key={label} style={{background:"#0e0c1a",border:`1px solid ${color}30`,borderRadius:12,padding:"14px 12px",textAlign:"center"}}>
              <div style={{fontSize:22,marginBottom:4}}>{icon}</div>
              <div style={{fontSize:22,fontWeight:700,color,lineHeight:1}}>{val}</div>
              <div style={{fontSize:10,color:"#6b7280",marginTop:4,letterSpacing:"0.3px"}}>{label}</div>
            </div>
          ))}
        </div>

        {/* Pipeline */}
        <div style={{...C.card,marginBottom:18}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:16,fontWeight:700,color:"#e8e6f0"}}>Application Pipeline</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {["All",...STATUSES].map(s=>(
                <button key={s} onClick={()=>setFilterStatus(s)}
                  style={{padding:"4px 11px",borderRadius:20,border:`1px solid ${s==="All"?"#6366f1":STATUS_COLORS[s]||"#6366f1"}40`,background:filterStatus===s?(s==="All"?"#6366f120":`${STATUS_COLORS[s]}20`):"transparent",color:filterStatus===s?(s==="All"?"#818cf8":STATUS_COLORS[s]):"#6b7280",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"'Sora',sans-serif"}}>
                  {s}{s!=="All"?` (${jobs.filter(j=>j.status===s).length})`:""}
                </button>
              ))}
            </div>
          </div>

          {jobs.filter(j=>filterStatus==="All"||j.status===filterStatus).length===0?(
            <div style={{textAlign:"center",padding:"36px 0",color:"#4b5563",fontSize:13}}>
              {jobs.length===0?"No applications yet — add your first one below 👇":"No applications match this filter."}
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {jobs.filter(j=>filterStatus==="All"||j.status===filterStatus).map((job)=>{
                const sc=STATUS_COLORS[job.status]||"#6b7280";
                const realIdx=jobs.findIndex(j=>j.id===job.id);
                return (
                  <div key={job.id} style={{background:"#080710",border:`1px solid ${sc}25`,borderLeft:`3px solid ${sc}`,borderRadius:10,padding:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:13,color:"#e8e6f0",marginBottom:2}}>{job.role}</div>
                        <div style={{fontSize:12,color:"#9ca3af"}}>{job.company}</div>
                      </div>
                      <span style={{fontSize:10,fontWeight:700,color:sc,background:`${sc}18`,border:`1px solid ${sc}40`,borderRadius:20,padding:"2px 8px",whiteSpace:"nowrap",flexShrink:0}}>{job.status}</span>
                    </div>
                    <div style={{display:"flex",gap:12,marginBottom:10,flexWrap:"wrap"}}>
                      {job.location&&<span style={{fontSize:11,color:"#6b7280"}}>📍 {job.location}</span>}
                      {job.salary&&<span style={{fontSize:11,color:"#6b7280"}}>💰 {job.salary}</span>}
                      {job.date&&<span style={{fontSize:11,color:"#6b7280"}}>📅 {job.date}</span>}
                    </div>
                    <select value={job.status} onChange={e=>updateStatus(job.id,e.target.value)}
                      style={{width:"100%",background:"#0e0c1a",border:"1px solid #161428",borderRadius:6,padding:"6px 8px",color:"#e8e6f0",fontSize:11,fontFamily:"'Sora',sans-serif",marginBottom:8,cursor:"pointer",outline:"none"}}>
                      {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                    {job.notes&&<div style={{fontSize:11,color:"#6b7280",marginBottom:8,lineHeight:1.6,borderLeft:"2px solid #161428",paddingLeft:8,fontStyle:"italic"}}>"{job.notes}"</div>}
                    {job.aiTips&&<div style={{background:"#0f1a2e",border:"1px solid #1e3a5f",borderRadius:6,padding:"8px 10px",marginBottom:8,fontSize:11,color:"#93c5fd",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{job.aiTips}</div>}
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      <button onClick={()=>getAITips(job)} disabled={tipsLoading&&activeJobId===job.id}
                        style={{...C.btn("o"),padding:"4px 10px",fontSize:10,borderColor:"#2563eb40",color:"#60a5fa"}}>
                        {tipsLoading&&activeJobId===job.id?"✨ Loading...":"✨ AI Tips"}
                      </button>
                      <button onClick={()=>startEdit(job,realIdx)} style={{...C.btn("g"),padding:"4px 10px",fontSize:10}}>✏️ Edit</button>
                      {job.url&&<button onClick={()=>window.open(job.url,"_blank")} style={{...C.btn("g"),padding:"4px 10px",fontSize:10}}>🔗 Link</button>}
                      <button onClick={()=>deleteJob(job.id)} style={{...C.btn("danger"),padding:"4px 10px",fontSize:10}}>🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add/Edit form */}
        <div style={C.card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:16,fontWeight:700,color:"#e8e6f0"}}>{editJob!==null?"✏️ Edit Application":"➕ Add New Application"}</div>
            {!showForm
              ?<button style={C.btn()} onClick={()=>{setShowForm(true);setEditJob(null);setNewJob(BLANK_JOB);}}>+ Add Job</button>
              :<button style={C.btn("g")} onClick={()=>{setShowForm(false);setEditJob(null);setNewJob(BLANK_JOB);}}>Cancel</button>
            }
          </div>
          {showForm&&<div>
            <div style={{...C.g2,marginBottom:12}}>
              <div><label style={C.lbl}>Company *</label><input style={C.inp(false)} value={newJob.company} onChange={e=>setNewJob(j=>({...j,company:e.target.value}))} placeholder="Google"/></div>
              <div><label style={C.lbl}>Role / Title *</label><input style={C.inp(false)} value={newJob.role} onChange={e=>setNewJob(j=>({...j,role:e.target.value}))} placeholder="Software Engineer"/></div>
            </div>
            <div style={{...C.g3,marginBottom:12}}>
              <div><label style={C.lbl}>Location</label><input style={C.inp(false)} value={newJob.location} onChange={e=>setNewJob(j=>({...j,location:e.target.value}))} placeholder="Bangalore / Remote"/></div>
              <div><label style={C.lbl}>Salary / CTC</label><input style={C.inp(false)} value={newJob.salary} onChange={e=>setNewJob(j=>({...j,salary:e.target.value}))} placeholder="₹12 LPA"/></div>
              <div><label style={C.lbl}>Applied Date</label><input type="date" style={C.inp(false)} value={newJob.date} onChange={e=>setNewJob(j=>({...j,date:e.target.value}))}/></div>
            </div>
            <div style={{marginBottom:12}}><label style={C.lbl}>Job URL</label><input style={C.inp(false)} value={newJob.url} onChange={e=>setNewJob(j=>({...j,url:e.target.value}))} placeholder="https://linkedin.com/jobs/..."/></div>
            <div style={{marginBottom:12}}>
              <label style={C.lbl}>Status</label>
              <select value={newJob.status} onChange={e=>setNewJob(j=>({...j,status:e.target.value}))} style={{...C.inp(false),cursor:"pointer"}}>
                {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{marginBottom:16}}><label style={C.lbl}>Notes</label><textarea style={{...C.ta,minHeight:70}} value={newJob.notes} onChange={e=>setNewJob(j=>({...j,notes:e.target.value}))} placeholder="Referral contact, follow-up date, key requirements to mention..."/></div>
            <button style={{...C.btn(),padding:"12px 28px"}} onClick={saveJob} disabled={!newJob.company.trim()||!newJob.role.trim()}>
              {editJob!==null?"💾 Update Application":"➕ Add Application"}
            </button>
          </div>}
        </div>
      </div>);

      // ── STEP 7: Interview Journal ──────────────────────────────────────────
      case 7: return (<div>

        {/* Header */}
        <div style={{background:"linear-gradient(135deg,#0e0c1a,#0f1a0e)",border:"1px solid #166534",borderRadius:14,padding:22,marginBottom:18,display:"flex",gap:16,alignItems:"center"}}>
          <div style={{fontSize:36}}>📓</div>
          <div>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:700,color:"#e8e6f0",marginBottom:4}}>Interview Journal</div>
            <div style={{fontSize:13,color:"#9ca3af",lineHeight:1.7}}>Log every interview, track your answers, get AI feedback on your performance. Learn and improve with every round.</div>
          </div>
          <button style={{...C.btn("success"),marginLeft:"auto",flexShrink:0,whiteSpace:"nowrap"}} onClick={()=>{setJForm(true);setEditEntry(null);setEntry(BLANK_ENTRY);setViewEntry(null);}}>+ Log Interview</button>
        </div>

        {/* Stats */}
        {journal.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:18}}>
          {[
            ["Total Interviews",journal.length,"#6366f1","🎤"],
            ["This Month",journal.filter(e=>e.date?.slice(0,7)===new Date().toISOString().slice(0,7)).length,"#0891b2","📅"],
            ["Avg Score",journal.filter(e=>e.aiFeedback?.score).length?Math.round(journal.filter(e=>e.aiFeedback?.score).reduce((a,e)=>a+e.aiFeedback.score,0)/journal.filter(e=>e.aiFeedback?.score).length):"-","#d97706","📊"],
            ["Great Rounds",journal.filter(e=>["😄","🔥"].includes(e.mood)).length,"#16a34a","🔥"],
          ].map(([label,val,color,icon])=>(
            <div key={label} style={{background:"#0e0c1a",border:`1px solid ${color}30`,borderRadius:12,padding:"14px 12px",textAlign:"center"}}>
              <div style={{fontSize:20,marginBottom:4}}>{icon}</div>
              <div style={{fontSize:22,fontWeight:700,color,lineHeight:1}}>{val}</div>
              <div style={{fontSize:10,color:"#6b7280",marginTop:4}}>{label}</div>
            </div>
          ))}
        </div>}

        {/* View single entry detail */}
        {viewEntry&&(()=>{
          const ent=journal.find(x=>x.id===viewEntry);
          if(!ent)return null;
          const fb=ent.aiFeedback;
          return (
            <div style={C.card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <div>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:18,fontWeight:700,color:"#e8e6f0"}}>{ent.role} @ {ent.company}</div>
                  <div style={{fontSize:12,color:"#9ca3af",marginTop:3}}>{ent.round} · {ent.date} · {ent.mood}</div>
                </div>
                <button style={C.btn("g")} onClick={()=>setViewEntry(null)}>← Back</button>
              </div>

              {/* Q&A */}
              <div style={{marginBottom:18}}>
                <div style={{fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:"1px",textTransform:"uppercase",marginBottom:12}}>Questions & Answers</div>
                {ent.questions.filter(q=>q.q).map((q,i)=>(
                  <div key={i} style={{background:"#080710",border:"1px solid #161428",borderRadius:10,padding:14,marginBottom:10}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#818cf8",marginBottom:6}}>Q{i+1}: {q.q}</div>
                    {q.myAnswer&&<div style={{fontSize:12,color:"#9ca3af",marginBottom:6,lineHeight:1.7}}><span style={{color:"#6366f1",fontWeight:600}}>My answer: </span>{q.myAnswer}</div>}
                    {q.betterAnswer&&<div style={{fontSize:12,color:"#4ade80",lineHeight:1.7}}><span style={{fontWeight:600}}>Better answer: </span>{q.betterAnswer}</div>}
                    {/* Per-question AI feedback */}
                    {fb?.questionFeedback?.[i]&&<div style={{marginTop:8,background:"#0f1a2e",border:"1px solid #1e3a5f",borderRadius:6,padding:"8px 10px",fontSize:11,color:"#93c5fd",lineHeight:1.7}}>
                      <span style={{fontWeight:700}}>AI: </span>{fb.questionFeedback[i].tip} <span style={{color:fb.questionFeedback[i].rating==="Good"?"#4ade80":fb.questionFeedback[i].rating==="Okay"?"#fbbf24":"#f87171",marginLeft:6}}>({fb.questionFeedback[i].rating})</span>
                    </div>}
                  </div>
                ))}
              </div>

              {ent.overallNotes&&<div style={{marginBottom:18,background:"#080710",border:"1px solid #161428",borderRadius:10,padding:14}}>
                <div style={{fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Overall Notes</div>
                <div style={{fontSize:13,color:"#cbd5e1",lineHeight:1.7}}>{ent.overallNotes}</div>
              </div>}

              {/* AI Feedback panel */}
              {!fb?(
                <button style={{...C.btn("success"),width:"100%",padding:"12px"}} onClick={()=>getJFeedback(ent)} disabled={jFeedbackLoading&&activeEntryId===ent.id}>
                  {jFeedbackLoading&&activeEntryId===ent.id?"✨ Analyzing your performance...":"✨ Get AI Performance Feedback"}
                </button>
              ):(
                <div style={{background:"linear-gradient(135deg,#0a1628,#0f2010)",border:"1px solid #166534",borderRadius:12,padding:18}}>
                  <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
                    <div style={{width:64,height:64,borderRadius:"50%",border:`4px solid ${fb.score>=75?"#16a34a":fb.score>=50?"#d97706":"#dc2626"}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <span style={{fontSize:18,fontWeight:700,color:fb.score>=75?"#4ade80":fb.score>=50?"#fbbf24":"#f87171",lineHeight:1}}>{fb.score}</span>
                      <span style={{fontSize:9,color:"#6b7280"}}>/100</span>
                    </div>
                    <div>
                      <div style={{fontWeight:700,color:"#e8e6f0",fontSize:15}}>Interview Performance Score</div>
                      {fb.overallAdvice&&<div style={{fontSize:12,color:"#9ca3af",marginTop:4,lineHeight:1.6,fontStyle:"italic"}}>"{fb.overallAdvice}"</div>}
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <div style={{background:"#052e16",border:"1px solid #166534",borderRadius:8,padding:12}}>
                      <div style={{fontSize:10,fontWeight:700,color:"#4ade80",letterSpacing:"1px",marginBottom:8}}>✓ STRENGTHS</div>
                      {(fb.strengths||[]).map((s,i)=><div key={i} style={{fontSize:12,color:"#86efac",marginBottom:4}}>✓ {s}</div>)}
                    </div>
                    <div style={{background:"#1c0a0a",border:"1px solid #7f1d1d",borderRadius:8,padding:12}}>
                      <div style={{fontSize:10,fontWeight:700,color:"#f87171",letterSpacing:"1px",marginBottom:8}}>↑ IMPROVE</div>
                      {(fb.improvements||[]).map((s,i)=><div key={i} style={{fontSize:12,color:"#fca5a5",marginBottom:4}}>→ {s}</div>)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Journal list */}
        {!viewEntry&&!jForm&&<div>
          {journal.length===0?(
            <div style={{...C.card,textAlign:"center",padding:"44px 0",color:"#4b5563",fontSize:13}}>
              No interviews logged yet. Click "+ Log Interview" to start tracking your journey 🚀
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
              {journal.map((ent,idx)=>{
                const fb=ent.aiFeedback;
                return (
                  <div key={ent.id} style={{background:"#0e0c1a",border:"1px solid #161428",borderRadius:12,padding:16,cursor:"pointer",transition:"border-color 0.2s"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor="#6366f1"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor="#161428"}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:13,color:"#e8e6f0",marginBottom:2}}>{ent.role}</div>
                        <div style={{fontSize:12,color:"#9ca3af"}}>{ent.company}</div>
                      </div>
                      <span style={{fontSize:20}}>{ent.mood}</span>
                    </div>
                    <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap"}}>
                      <span style={{fontSize:11,color:"#6b7280",background:"#161428",borderRadius:20,padding:"2px 10px"}}>{ent.round}</span>
                      <span style={{fontSize:11,color:"#6b7280"}}>📅 {ent.date}</span>
                      <span style={{fontSize:11,color:"#6b7280"}}>❓ {ent.questions.filter(q=>q.q).length} questions</span>
                    </div>
                    {fb&&<div style={{background:"#080710",borderRadius:8,padding:"8px 12px",marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
                      <div style={{fontWeight:700,color:fb.score>=75?"#4ade80":fb.score>=50?"#fbbf24":"#f87171",fontSize:16}}>{fb.score}<span style={{fontSize:10,color:"#6b7280"}}>/100</span></div>
                      <div style={{fontSize:11,color:"#9ca3af",fontStyle:"italic",lineHeight:1.5}}>"{fb.overallAdvice?.slice(0,60)}..."</div>
                    </div>}
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>setViewEntry(ent.id)} style={{...C.btn("p"),padding:"5px 12px",fontSize:11,flex:1}}>📖 View Details</button>
                      <button onClick={(e)=>{e.stopPropagation();setEntry(ent);setEditEntry(idx);setJForm(true);setViewEntry(null);}} style={{...C.btn("g"),padding:"5px 10px",fontSize:11}}>✏️</button>
                      <button onClick={(e)=>{e.stopPropagation();deleteEntry(ent.id);}} style={{...C.btn("danger"),padding:"5px 10px",fontSize:11}}>🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>}

        {/* Add / Edit form */}
        {jForm&&<div style={C.card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:17,fontWeight:700,color:"#e8e6f0"}}>{editEntry!==null?"✏️ Edit Interview Entry":"📝 Log New Interview"}</div>
            <button style={C.btn("g")} onClick={()=>{setJForm(false);setEditEntry(null);setEntry(BLANK_ENTRY);}}>Cancel</button>
          </div>

          <div style={{...C.g2,marginBottom:12}}>
            <div><label style={C.lbl}>Company *</label><input style={C.inp(false)} value={entry.company} onChange={e=>setEntry(j=>({...j,company:e.target.value}))} placeholder="Google"/></div>
            <div><label style={C.lbl}>Role *</label><input style={C.inp(false)} value={entry.role} onChange={e=>setEntry(j=>({...j,role:e.target.value}))} placeholder="Software Engineer"/></div>
          </div>
          <div style={{...C.g3,marginBottom:16}}>
            <div><label style={C.lbl}>Date</label><input type="date" style={C.inp(false)} value={entry.date} onChange={e=>setEntry(j=>({...j,date:e.target.value}))}/></div>
            <div>
              <label style={C.lbl}>Round</label>
              <select value={entry.round} onChange={e=>setEntry(j=>({...j,round:e.target.value}))} style={{...C.inp(false),cursor:"pointer"}}>
                {ROUNDS.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={C.lbl}>How did it go?</label>
              <div style={{display:"flex",gap:6,marginTop:2}}>
                {MOODS.map(([emoji,label])=>(
                  <button key={emoji} onClick={()=>setEntry(j=>({...j,mood:emoji}))}
                    style={{flex:1,padding:"7px 4px",borderRadius:8,border:`1px solid ${entry.mood===emoji?"#6366f1":"#161428"}`,background:entry.mood===emoji?"#1a1836":"#080710",cursor:"pointer",fontSize:16,textAlign:"center",transition:"all 0.15s"}} title={label}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Questions */}
          <div style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <label style={{...C.lbl,marginBottom:0}}>Interview Questions</label>
              <button style={{...C.btn("o"),padding:"4px 12px",fontSize:11}} onClick={addQuestion}>+ Add Question</button>
            </div>
            {entry.questions.map((q,i)=>(
              <div key={i} style={{background:"#080710",border:"1px solid #161428",borderRadius:10,padding:14,marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontSize:11,fontWeight:700,color:"#818cf8"}}>Question {i+1}</span>
                  {entry.questions.length>1&&<button style={{...C.btn("danger"),padding:"2px 8px",fontSize:10}} onClick={()=>removeQuestion(i)}>Remove</button>}
                </div>
                <div style={{marginBottom:8}}><label style={C.lbl}>Question asked</label><input style={C.inp(false)} value={q.q} onChange={e=>updQuestion(i,"q",e.target.value)} placeholder="Tell me about yourself..."/></div>
                <div style={{marginBottom:8}}><label style={C.lbl}>Your answer</label><textarea style={{...C.ta,minHeight:60}} value={q.myAnswer} onChange={e=>updQuestion(i,"myAnswer",e.target.value)} placeholder="What you actually said..."/></div>
                <div><label style={C.lbl}>Better answer (reflection)</label><textarea style={{...C.ta,minHeight:60}} value={q.betterAnswer} onChange={e=>updQuestion(i,"betterAnswer",e.target.value)} placeholder="What you wish you had said..."/></div>
              </div>
            ))}
          </div>

          <div style={{marginBottom:16}}>
            <label style={C.lbl}>Overall Notes</label>
            <textarea style={{...C.ta,minHeight:80}} value={entry.overallNotes} onChange={e=>setEntry(j=>({...j,overallNotes:e.target.value}))} placeholder="General vibe, interviewer's tone, things to improve, follow-up needed..."/>
          </div>

          <button style={{...C.btn("success"),padding:"12px 28px"}} onClick={saveEntry} disabled={!entry.company.trim()||!entry.role.trim()}>
            {editEntry!==null?"💾 Update Entry":"📓 Save Interview Entry"}
          </button>
        </div>}
      </div>);
    }
  };

  return (
    <div style={C.app}>
      <style>{GF}</style>
      <style>{`
        input:focus,textarea:focus{border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,0.12);}
        button:not(:disabled):hover{opacity:0.82;transform:translateY(-1px);}
        button:disabled{opacity:0.4;cursor:not-allowed;transform:none!important;}
        ::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:#080710;}::-webkit-scrollbar-thumb{background:#161428;border-radius:3px;}
      `}</style>
      <div style={C.hdr}>
        <div style={C.logo}>Resume<span style={C.acc}>AI</span><span style={{fontSize:10,color:"#4b5563",marginLeft:8,fontFamily:"'Sora',sans-serif",fontWeight:400}}>v3</span></div>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <span style={{fontSize:11,color:"#6366f1",background:"#161428",border:"1px solid #2d2b50",borderRadius:20,padding:"3px 10px",opacity:saveMsg?1:0,transition:"opacity 0.4s"}}>{saveMsg}</span>
          <span style={{fontSize:11,color:"#374151"}}>Progress auto-saved</span>
        </div>
      </div>
      <div style={C.main}>
        <div style={C.steps}>{STEPS.map((s,i)=><div key={i} style={C.step(step===i,step>i)} onClick={()=>setStep(i)}>{step>i?"✓ ":""}{s}</div>)}</div>
        {renderStep()}
        <div style={C.navRow}>
          {step>0?<button style={C.btn("g")} onClick={()=>setStep(s=>s-1)}>← Back</button>:<div/>}
          <span style={{fontSize:11,color:"#374151"}}>{step+1} / {STEPS.length}</span>
          {step<STEPS.length-1&&<button style={C.btn()} onClick={()=>{if(validate())setStep(s=>s+1);}}>Continue →</button>}
        </div>
      </div>
    </div>
  );
}
