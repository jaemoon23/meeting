import{i as me,D as ue,g as ge,f as pe,h as ve,j as ye,k as Ee,l as fe,m as he,L as Be}from"./permission-service-DHxnA_q4.js";import{s as ke,h as U}from"./helpers-F6ttY5H5.js";import{_ as Y,i as De,j as Ie,k as Le,g as h,l as we,m as $e,n as J,b as C,a as T,u as K,o as Me,s as be,p as Se,q as je,t as xe,v as Ce,w as Te,f as Ae,r as Pe,c as qe,d as _e,e as He}from"./project-service-BqVoItuz.js";let g=null,f="overview",R="all",N=null,z=null,O=null,B="month";document.getElementById("loadingOverlay");const Q=document.getElementById("authContainer"),X=document.getElementById("appContainer");function Re(){Q.style.display="flex",X.classList.add("app-hidden")}function Ne(e){Q.style.display="none",X.classList.remove("app-hidden"),document.getElementById("userAvatar").src=e.photoURL||"",document.getElementById("userName").textContent=e.displayName||e.email;const n=document.getElementById("adminBtn");n&&(n.style.display=he()?"inline-flex":"none")}function ee(e){const n=document.getElementById("projectsGrid");let a=e;if(R==="active"?a=e.filter(o=>o.status==="active"):R==="completed"&&(a=e.filter(o=>o.status==="completed")),a.length===0){n.innerHTML=`
            <div class="empty-projects">
                <div class="empty-icon">📁</div>
                <div class="empty-text">프로젝트가 없습니다</div>
            </div>
        `;return}n.innerHTML=a.map(o=>{var t;const s=((t=o.members)==null?void 0:t.length)||0,l=0;return`
            <div class="project-card" data-id="${o.id}">
                <div class="project-card-header">
                    <h3>${o.title}</h3>
                    <span class="project-status ${o.status}">${o.status==="active"?"진행중":"완료"}</span>
                </div>
                <p class="project-card-desc">${o.description||"설명 없음"}</p>
                <div class="project-card-meta">
                    <span class="meta-item">👥 ${s}명</span>
                    <span class="meta-item">📅 ${o.endDate||"-"}</span>
                </div>
                <div class="project-card-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${l}%"></div>
                    </div>
                    <span class="progress-text">${l}%</span>
                </div>
            </div>
        `}).join(""),n.querySelectorAll(".project-card").forEach(o=>{o.addEventListener("click",()=>{j(o.dataset.id)})})}function j(e){g=e;const n=h(e);n&&(history.pushState({projectId:e},"",`?id=${e}`),document.getElementById("projectListView").style.display="none",document.getElementById("projectDetailView").style.display="block",document.getElementById("projectDetailTitle").textContent=n.title,be(e),te("overview"))}function H(){g=null,J(),history.pushState({},"","/projects.html"),document.getElementById("projectDetailView").style.display="none",document.getElementById("projectListView").style.display="block"}function te(e){f=e,document.querySelectorAll(".detail-tab").forEach(n=>{n.classList.toggle("active",n.dataset.tab===e)}),document.getElementById("overviewPane").style.display=e==="overview"?"block":"none",document.getElementById("ganttPane").style.display=e==="gantt"?"block":"none",document.getElementById("tasksPane").style.display=e==="tasks"?"block":"none",document.getElementById("membersPane").style.display=e==="members"?"block":"none",e==="overview"&&S(),e==="gantt"&&$(),e==="tasks"&&x(),e==="members"&&ne()}function S(){const e=h(g);if(!e)return;const n=T(),a=n.filter(u=>u.status==="completed").length,o=n.filter(u=>u.status==="in_progress").length,s=n.length,l=s>0?Math.round(a/s*100):0;document.querySelector("#projectProgress .progress-value").textContent=`${l}%`;const t=document.getElementById("projectDateRange");t.querySelector(".start-date").textContent=e.startDate||"-",t.querySelector(".end-date").textContent=e.endDate||"-";const c=document.getElementById("daysRemaining");if(e.endDate){const u=new Date(e.endDate),d=new Date;d.setHours(0,0,0,0),u.setHours(0,0,0,0);const r=Math.ceil((u-d)/(1e3*60*60*24));r<0?(c.textContent=`D+${Math.abs(r)} (마감일 지남)`,c.className="days-remaining overdue"):r===0?(c.textContent="D-Day",c.className="days-remaining today"):(c.textContent=`D-${r}`,c.className="days-remaining")}else c.textContent="-";const m=document.getElementById("taskStats");m.innerHTML=`
        <div class="stat"><span class="count">${s}</span><span class="label">전체</span></div>
        <div class="stat"><span class="count">${a}</span><span class="label">완료</span></div>
        <div class="stat"><span class="count">${o}</span><span class="label">진행중</span></div>
    `,document.getElementById("projectDescription").textContent=e.description||"설명이 없습니다."}function $(){const e=h(g);if(!e)return;const n=C(),a=T(),o=document.getElementById("ganttChart"),s=["blue","purple","green","orange","pink","cyan"];if(n.length===0&&a.length===0){o.innerHTML=`
            <div class="gantt-card">
                <div class="gantt-empty">
                    <div class="gantt-empty-icon">📊</div>
                    <div class="gantt-empty-text">마일스톤이나 태스크가 없습니다</div>
                    <button class="btn btn-primary" onclick="document.getElementById('addMilestoneBtn').click()">+ 마일스톤 추가</button>
                </div>
            </div>
        `;return}const l=[];if(e.startDate&&l.push(new Date(e.startDate)),e.endDate&&l.push(new Date(e.endDate)),n.forEach(i=>{i.startDate&&l.push(new Date(i.startDate)),i.endDate&&l.push(new Date(i.endDate))}),a.forEach(i=>{i.startDate&&l.push(new Date(i.startDate)),i.endDate&&l.push(new Date(i.endDate))}),l.length===0){o.innerHTML=`
            <div class="gantt-card">
                <div class="gantt-empty">
                    <div class="gantt-empty-icon">📅</div>
                    <div class="gantt-empty-text">날짜 정보가 없습니다</div>
                </div>
            </div>
        `;return}const t=new Date(Math.min(...l)),c=new Date(Math.max(...l));t.setDate(1),c.setMonth(c.getMonth()+1,0);const m=[],u=new Date(t);for(;u<=c;)m.push({year:u.getFullYear(),month:u.getMonth(),name:`${u.getMonth()+1}월`}),u.setMonth(u.getMonth()+1);const d=Math.ceil((c-t)/(1e3*60*60*24))+1,r=B==="week"?200:B==="month"?120:80;let y=`
        <div class="gantt-task-list">
            <div class="gantt-task-header">태스크</div>
    `,k="";n.forEach((i,p)=>{const E=a.filter(v=>v.milestoneId===i.id),I=s[p%s.length],A=E.filter(v=>v.status==="completed").length,P=E.length>0?Math.round(A/E.length*100):0;y+=`
            <div class="gantt-task-group expanded" data-milestone="${i.id}">
                <div class="gantt-group-title">
                    <span class="gantt-group-icon ${I}"></span>
                    ${i.title}
                    <span class="gantt-expand-icon">▶</span>
                </div>
        `,E.forEach(v=>{const w=v.status==="completed"?"done":v.status==="in_progress"?"progress":"pending";y+=`
                <div class="gantt-task-item" data-task="${v.id}">
                    <span class="gantt-task-status ${w}"></span>
                    ${v.title}
                </div>
            `}),y+="</div>";const L=i.startDate?new Date(i.startDate):t,q=i.endDate?new Date(i.endDate):c,_=Math.max(0,(L-t)/(1e3*60*60*24)),ae=Math.max(1,(q-L)/(1e3*60*60*24)+1),F=_/d*(m.length*r),G=ae/d*(m.length*r);k+=`
            <div class="gantt-timeline-row group-row">
                ${m.map(()=>'<div class="gantt-timeline-cell"></div>').join("")}
                <div class="gantt-bar ${I}" style="left: ${F}px; width: ${Math.max(80,G)}px;">
                    ${i.title}
                    <div class="gantt-progress-track">
                        <div class="gantt-progress-fill" style="width: ${P}%;"></div>
                    </div>
                </div>
                ${i.endDate?`<div class="gantt-milestone-marker" style="left: ${F+G+8}px;" title="${i.title} 완료"></div>`:""}
            </div>
        `,E.forEach(v=>{const w=v.startDate?new Date(v.startDate):L,oe=v.endDate?new Date(v.endDate):w,le=Math.max(0,(w-t)/(1e3*60*60*24)),ie=Math.max(1,(oe-w)/(1e3*60*60*24)+1),de=le/d*(m.length*r),ce=ie/d*(m.length*r),re=v.status==="completed"?100:v.status==="in_progress"?50:0;k+=`
                <div class="gantt-timeline-row" data-task="${v.id}">
                    ${m.map(()=>'<div class="gantt-timeline-cell"></div>').join("")}
                    <div class="gantt-bar ${I} task-bar" style="left: ${de}px; width: ${Math.max(60,ce)}px;">
                        <div class="gantt-progress-track">
                            <div class="gantt-progress-fill" style="width: ${re}%;"></div>
                        </div>
                    </div>
                </div>
            `})});const D=a.filter(i=>!i.milestoneId);if(D.length>0){const i="orange";y+=`
            <div class="gantt-task-group expanded" data-milestone="orphan">
                <div class="gantt-group-title">
                    <span class="gantt-group-icon ${i}"></span>
                    미분류
                    <span class="gantt-expand-icon">▶</span>
                </div>
        `,D.forEach(p=>{const E=p.status==="completed"?"done":p.status==="in_progress"?"progress":"pending";y+=`
                <div class="gantt-task-item" data-task="${p.id}">
                    <span class="gantt-task-status ${E}"></span>
                    ${p.title}
                </div>
            `}),y+="</div>",k+=`
            <div class="gantt-timeline-row group-row">
                ${m.map(()=>'<div class="gantt-timeline-cell"></div>').join("")}
                <div class="gantt-bar ${i}" style="left: 20px; width: 80px;">
                    미분류
                </div>
            </div>
        `,D.forEach(p=>{const E=p.startDate?new Date(p.startDate):t,I=p.endDate?new Date(p.endDate):E,A=Math.max(0,(E-t)/(1e3*60*60*24)),P=Math.max(1,(I-E)/(1e3*60*60*24)+1),L=A/d*(m.length*r),q=P/d*(m.length*r),_=p.status==="completed"?100:p.status==="in_progress"?50:0;k+=`
                <div class="gantt-timeline-row" data-task="${p.id}">
                    ${m.map(()=>'<div class="gantt-timeline-cell"></div>').join("")}
                    <div class="gantt-bar ${i} task-bar" style="left: ${L}px; width: ${Math.max(60,q)}px;">
                        <div class="gantt-progress-track">
                            <div class="gantt-progress-fill" style="width: ${_}%;"></div>
                        </div>
                    </div>
                </div>
            `})}y+="</div>";const M=new Date;M.setHours(0,0,0,0);let W="";M>=t&&M<=c&&(W=`<div class="gantt-today-line" style="left: ${(M-t)/864e5/d*(m.length*r)}px;"></div>`);const V=new Set;n.forEach((i,p)=>V.add(s[p%s.length])),D.length>0&&V.add("orange");let b='<div class="gantt-legend">';n.forEach((i,p)=>{const E=s[p%s.length];b+=`
            <div class="gantt-legend-item">
                <span class="gantt-legend-color ${E}"></span>
                ${i.title}
            </div>
        `}),D.length>0&&(b+=`
            <div class="gantt-legend-item">
                <span class="gantt-legend-color orange"></span>
                미분류
            </div>
        `),b+=`
        <div class="gantt-legend-item">
            <span class="gantt-legend-milestone"></span>
            마일스톤
        </div>
        <div class="gantt-legend-item">
            <span class="gantt-legend-today"></span>
            오늘
        </div>
    </div>`,o.innerHTML=`
        <div class="gantt-card">
            <div class="gantt-toolbar">
                <button class="btn" onclick="document.getElementById('addMilestoneBtn').click()">
                    <span>+</span> 마일스톤 추가
                </button>
                <div class="gantt-zoom">
                    <button class="zoom-btn ${B==="week"?"active":""}" data-zoom="week">주</button>
                    <button class="zoom-btn ${B==="month"?"active":""}" data-zoom="month">월</button>
                    <button class="zoom-btn ${B==="quarter"?"active":""}" data-zoom="quarter">분기</button>
                </div>
            </div>
            <div class="gantt-wrapper">
                ${y}
                <div class="gantt-timeline">
                    <div class="gantt-timeline-header">
                        ${m.map(i=>`
                            <div class="gantt-month-column">
                                <div class="gantt-month-year">${i.year}</div>
                                <div class="gantt-month-name">${i.name}</div>
                            </div>
                        `).join("")}
                    </div>
                    <div class="gantt-timeline-body">
                        ${W}
                        ${k}
                    </div>
                </div>
            </div>
            ${b}
        </div>
    `,o.querySelectorAll(".zoom-btn").forEach(i=>{i.addEventListener("click",()=>{B=i.dataset.zoom,$()})}),o.querySelectorAll(".gantt-group-title").forEach(i=>{i.addEventListener("click",()=>{i.closest(".gantt-task-group").classList.toggle("expanded")})})}function x(){const e=T(),n=C(),a=document.getElementById("tasksBody"),o=document.getElementById("taskMilestoneFilter");o.innerHTML=`
        <option value="all">모든 마일스톤</option>
        ${n.map(t=>`<option value="${t.id}">${t.title}</option>`).join("")}
        <option value="none">미분류</option>
    `;const s=o.value;let l=e;if(s==="none"?l=e.filter(t=>!t.milestoneId):s!=="all"&&(l=e.filter(t=>t.milestoneId===s)),l.length===0){a.innerHTML='<div class="tasks-empty">태스크가 없습니다.</div>';return}a.innerHTML=l.map(t=>{var d,r;const c=t.status==="completed"?"completed":t.status==="in_progress"?"in-progress":"pending";t.status==="completed"||t.status;const m=t.priority||"medium",u=t.priority==="high"?"높음":t.priority==="low"?"낮음":"보통";return`
            <div class="task-row" data-id="${t.id}">
                <span class="col-status">
                    <select class="status-select ${c}" data-id="${t.id}">
                        <option value="pending" ${t.status==="pending"?"selected":""}>대기</option>
                        <option value="in_progress" ${t.status==="in_progress"?"selected":""}>진행중</option>
                        <option value="completed" ${t.status==="completed"?"selected":""}>완료</option>
                    </select>
                </span>
                <span class="col-title">${t.title}</span>
                <span class="col-assignee">${((d=t.assignee)==null?void 0:d.name)||((r=t.assignee)==null?void 0:r.email)||"-"}</span>
                <span class="col-date">${t.startDate||"-"} ~ ${t.endDate||"-"}</span>
                <span class="col-priority"><span class="priority-badge ${m}">${u}</span></span>
                <span class="col-actions">
                    <button class="btn-icon edit-task-btn" data-id="${t.id}" title="수정">✏️</button>
                    <button class="btn-icon delete-task-btn" data-id="${t.id}" title="삭제">🗑️</button>
                </span>
            </div>
        `}).join(""),a.querySelectorAll(".status-select").forEach(t=>{t.addEventListener("change",async c=>{const m=c.target.dataset.id;await K(g,m,{status:c.target.value})})}),a.querySelectorAll(".edit-task-btn").forEach(t=>{t.addEventListener("click",()=>se(t.dataset.id))}),a.querySelectorAll(".delete-task-btn").forEach(t=>{t.addEventListener("click",async()=>{confirm("태스크를 삭제하시겠습니까?")&&await Me(g,t.dataset.id)})})}function ne(){const e=h(g);if(!e)return;const n=e.members||[],a=ge(),o=document.getElementById("membersList");if(n.length===0){o.innerHTML='<div class="members-empty">팀원이 없습니다.</div>';return}o.innerHTML=n.map(s=>{const l=s.role==="owner",t=s.uid===(a==null?void 0:a.uid)||s.email===(a==null?void 0:a.email),c=s.role==="owner"?"소유자":s.role==="member"?"멤버":"뷰어";return`
            <div class="member-item">
                <div class="member-info">
                    <div class="member-name">${s.name||s.email}</div>
                    <div class="member-email">${s.email}</div>
                </div>
                <div class="member-role">
                    <span class="role-badge ${s.role}">${c}</span>
                </div>
                <div class="member-actions">
                    ${!l&&!t?`
                        <select class="role-change-select" data-email="${s.email}">
                            <option value="member" ${s.role==="member"?"selected":""}>멤버</option>
                            <option value="viewer" ${s.role==="viewer"?"selected":""}>뷰어</option>
                        </select>
                        <button class="btn-icon remove-member-btn" data-email="${s.email}" title="제거">❌</button>
                    `:t?"(나)":""}
                </div>
            </div>
        `}).join(""),o.querySelectorAll(".role-change-select").forEach(s=>{s.addEventListener("change",async l=>{await Se(g,l.target.dataset.email,l.target.value)})}),o.querySelectorAll(".remove-member-btn").forEach(s=>{s.addEventListener("click",async()=>{confirm("이 팀원을 제거하시겠습니까?")&&await je(g,s.dataset.email)})})}function Z(e=null){N=e;const n=document.getElementById("projectModal"),a=document.getElementById("projectModalTitle"),o=document.getElementById("projectConfirmBtn");if(e){const s=h(e);if(!s)return;a.textContent="프로젝트 수정",o.textContent="수정",document.getElementById("projectName").value=s.title,document.getElementById("projectDesc").value=s.description||"",document.getElementById("projectStartDate").value=s.startDate||"",document.getElementById("projectEndDate").value=s.endDate||""}else a.textContent="새 프로젝트",o.textContent="만들기",document.getElementById("projectName").value="",document.getElementById("projectDesc").value="",document.getElementById("projectStartDate").value="",document.getElementById("projectEndDate").value="";n.style.display="flex"}function ze(e=null){z=e;const n=document.getElementById("milestoneModal"),a=document.getElementById("milestoneModalTitle"),o=document.getElementById("milestoneConfirmBtn");if(e){const l=C().find(t=>t.id===e);if(!l)return;a.textContent="마일스톤 수정",o.textContent="수정",document.getElementById("milestoneName").value=l.title,document.getElementById("milestoneStartDate").value=l.startDate||"",document.getElementById("milestoneEndDate").value=l.endDate||"",document.querySelectorAll("#milestoneColorSelect .color-option").forEach(t=>{t.classList.toggle("selected",t.dataset.color===l.color)})}else a.textContent="마일스톤 추가",o.textContent="추가",document.getElementById("milestoneName").value="",document.getElementById("milestoneStartDate").value="",document.getElementById("milestoneEndDate").value="",document.querySelectorAll("#milestoneColorSelect .color-option").forEach((s,l)=>{s.classList.toggle("selected",l===0)});n.style.display="flex"}function se(e=null){var u;O=e;const n=document.getElementById("taskModal"),a=document.getElementById("taskModalTitle"),o=document.getElementById("taskConfirmBtn"),s=C(),l=h(g),t=document.getElementById("taskMilestone");t.innerHTML=`
        <option value="">없음</option>
        ${s.map(d=>`<option value="${d.id}">${d.title}</option>`).join("")}
    `;const c=document.getElementById("taskAssignee"),m=(l==null?void 0:l.members)||[];if(c.innerHTML=`
        <option value="">미지정</option>
        ${m.map(d=>`<option value="${d.email}">${d.name||d.email}</option>`).join("")}
    `,e){const r=T().find(y=>y.id===e);if(!r)return;a.textContent="태스크 수정",o.textContent="수정",document.getElementById("taskName").value=r.title,document.getElementById("taskMilestone").value=r.milestoneId||"",document.getElementById("taskAssignee").value=((u=r.assignee)==null?void 0:u.email)||"",document.getElementById("taskStartDate").value=r.startDate||"",document.getElementById("taskEndDate").value=r.endDate||"",document.querySelectorAll("#taskPrioritySelect .priority-option").forEach(y=>{y.classList.toggle("selected",y.dataset.priority===r.priority)})}else a.textContent="태스크 추가",o.textContent="추가",document.getElementById("taskName").value="",document.getElementById("taskMilestone").value="",document.getElementById("taskAssignee").value="",document.getElementById("taskStartDate").value="",document.getElementById("taskEndDate").value="",document.querySelectorAll("#taskPrioritySelect .priority-option").forEach(d=>{d.classList.toggle("selected",d.dataset.priority==="medium")});n.style.display="flex"}function Oe(){const e=document.getElementById("memberModal"),n=h(g),a=((n==null?void 0:n.members)||[]).map(t=>t.email),s=ue().filter(t=>!a.includes(t)),l=document.getElementById("memberEmail");l.innerHTML=`
        <option value="">이메일 선택...</option>
        ${s.map(t=>`<option value="${t}">${t}</option>`).join("")}
    `,document.querySelectorAll("#memberRoleSelect .role-option").forEach(t=>{t.classList.toggle("selected",t.dataset.role==="member")}),e.style.display="flex"}function We(){document.getElementById("googleLoginBtn").addEventListener("click",async()=>{const{loginWithGoogle:e}=await Y(async()=>{const{loginWithGoogle:n}=await import("./permission-service-DHxnA_q4.js").then(a=>a.W);return{loginWithGoogle:n}},[]);await e()}),document.getElementById("logoutBtn").addEventListener("click",async()=>{const{logout:e}=await Y(async()=>{const{logout:n}=await import("./permission-service-DHxnA_q4.js").then(a=>a.W);return{logout:n}},[]);await e()}),document.getElementById("newProjectBtn").addEventListener("click",()=>Z()),document.getElementById("backToListBtn").addEventListener("click",H),document.getElementById("editProjectBtn").addEventListener("click",()=>Z(g)),document.getElementById("deleteProjectBtn").addEventListener("click",async()=>{confirm("프로젝트를 삭제하시겠습니까? 모든 마일스톤과 태스크도 삭제됩니다.")&&(await De(g),H())}),document.querySelectorAll(".detail-tab").forEach(e=>{e.addEventListener("click",()=>te(e.dataset.tab))}),document.querySelectorAll(".filter-btn").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll(".filter-btn").forEach(n=>n.classList.remove("active")),e.classList.add("active"),R=e.dataset.filter,ee(xe())})}),document.getElementById("addMilestoneBtn").addEventListener("click",()=>ze()),document.querySelectorAll(".zoom-btn").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll(".zoom-btn").forEach(n=>n.classList.remove("active")),e.classList.add("active"),B=e.dataset.zoom,$()})}),document.getElementById("addTaskBtn").addEventListener("click",()=>se()),document.getElementById("taskMilestoneFilter").addEventListener("change",x),document.getElementById("addMemberBtn").addEventListener("click",Oe),document.getElementById("projectModalCloseBtn").addEventListener("click",()=>{document.getElementById("projectModal").style.display="none"}),document.getElementById("projectConfirmBtn").addEventListener("click",async()=>{const e=document.getElementById("projectName").value.trim(),n=document.getElementById("projectDesc").value.trim(),a=document.getElementById("projectStartDate").value,o=document.getElementById("projectEndDate").value;if(!e){alert("프로젝트 이름을 입력하세요.");return}if(N)await Ce(N,{title:e,description:n,startDate:a,endDate:o});else{const s=await Ie({title:e,description:n,startDate:a,endDate:o});s&&j(s)}document.getElementById("projectModal").style.display="none"}),document.querySelectorAll("#milestoneColorSelect .color-option").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("#milestoneColorSelect .color-option").forEach(n=>n.classList.remove("selected")),e.classList.add("selected")})}),document.getElementById("milestoneModalCloseBtn").addEventListener("click",()=>{document.getElementById("milestoneModal").style.display="none"}),document.getElementById("milestoneConfirmBtn").addEventListener("click",async()=>{var s;const e=document.getElementById("milestoneName").value.trim(),n=document.getElementById("milestoneStartDate").value,a=document.getElementById("milestoneEndDate").value,o=((s=document.querySelector("#milestoneColorSelect .color-option.selected"))==null?void 0:s.dataset.color)||"#238636";if(!e){alert("마일스톤 이름을 입력하세요.");return}z?await Te(g,z,{title:e,startDate:n,endDate:a,color:o}):await Le(g,{title:e,startDate:n,endDate:a,color:o}),document.getElementById("milestoneModal").style.display="none"}),document.querySelectorAll("#taskPrioritySelect .priority-option").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("#taskPrioritySelect .priority-option").forEach(n=>n.classList.remove("selected")),e.classList.add("selected")})}),document.getElementById("taskModalCloseBtn").addEventListener("click",()=>{document.getElementById("taskModal").style.display="none"}),document.getElementById("taskConfirmBtn").addEventListener("click",async()=>{var c,m;const e=document.getElementById("taskName").value.trim(),n=document.getElementById("taskMilestone").value||null,a=document.getElementById("taskAssignee").value,o=document.getElementById("taskStartDate").value,s=document.getElementById("taskEndDate").value,l=((c=document.querySelector("#taskPrioritySelect .priority-option.selected"))==null?void 0:c.dataset.priority)||"medium";if(!e){alert("태스크 이름을 입력하세요.");return}let t=null;if(a){const u=h(g),d=(m=u==null?void 0:u.members)==null?void 0:m.find(r=>r.email===a);t=d?{uid:d.uid,email:d.email,name:d.name}:{email:a}}O?await K(g,O,{title:e,milestoneId:n,assignee:t,startDate:o,endDate:s,priority:l}):await we(g,{title:e,milestoneId:n,assignee:t,startDate:o,endDate:s,priority:l}),document.getElementById("taskModal").style.display="none"}),document.querySelectorAll("#memberRoleSelect .role-option").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("#memberRoleSelect .role-option").forEach(n=>n.classList.remove("selected")),e.classList.add("selected")})}),document.getElementById("memberModalCloseBtn").addEventListener("click",()=>{document.getElementById("memberModal").style.display="none"}),document.getElementById("memberConfirmBtn").addEventListener("click",async()=>{var a;const e=document.getElementById("memberEmail").value,n=((a=document.querySelector("#memberRoleSelect .role-option.selected"))==null?void 0:a.dataset.role)||"member";if(!e){alert("이메일을 선택하세요.");return}await $e(g,{email:e,role:n}),document.getElementById("memberModal").style.display="none"}),document.querySelectorAll(".modal-overlay").forEach(e=>{e.addEventListener("click",n=>{n.target===e&&(e.style.display="none")})}),window.addEventListener("popstate",()=>{const n=new URLSearchParams(window.location.search).get("id");n?j(n):H()})}function Ve(){ke(),We(),qe(e=>{if(ee(e),g){const n=h(g);n&&(document.getElementById("projectDetailTitle").textContent=n.title,f==="members"&&ne(),f==="overview"&&S())}U()}),_e(()=>{f==="overview"&&S(),f==="gantt"&&$(),f==="tasks"&&x()}),He(()=>{f==="overview"&&S(),f==="gantt"&&$(),f==="tasks"&&x()}),Be(()=>{}),pe(e=>{if(e){Ne(e),Ae(),ve(),ye();const a=new URLSearchParams(window.location.search).get("id");a&&setTimeout(()=>j(a),500)}else Pe(),J(),Ee(),fe(),Re(),U()}),me()}document.addEventListener("DOMContentLoaded",Ve);
