import{g as M,r as L,d as I,p as G,s as U,a as Y,b as z,c as J,o as w,e as j,i as K,f as Q,h as X,j as Z,k as ee,l as te,m as ne}from"./permission-service-DHxnA_q4.js";import{s as se,h as b}from"./helpers-F6ttY5H5.js";import{_ as A,g as k,s as ae,a as ie,b as de,c as le,d as oe,e as ce,f as re,r as me,h as ve}from"./project-service-BqVoItuz.js";let B=null,$=null,y=[],g=[],T=null;function ue(e){T=e}function P(){const e=[...y,...g];T&&T(e)}function pe(){const e=M();e&&(B=L(I,"events/shared"),w(B,t=>{const n=t.val();y=[],n&&(y=Object.entries(n).map(([s,a])=>({id:s,...a,isShared:!0}))),P()}),$=L(I,`events/personal/${e.uid}`),w($,t=>{const n=t.val();g=[],n&&(g=Object.entries(n).map(([s,a])=>({id:s,...a,isShared:!1}))),P()}))}function ye(){B&&(j(B),B=null),$&&(j($),$=null),y=[],g=[]}async function ge(e){const t=M();if(!t)return null;const n=e.isShared?"events/shared":`events/personal/${t.uid}`,s=L(I,n),a=G(s),l={title:e.title,date:e.date,time:e.time||null,description:e.description||"",createdBy:t.uid,createdByEmail:t.email,createdByName:t.displayName||t.email,createdAt:Date.now()};return await U(a,l),e.isShared&&Y(l),a.key}async function fe(e,t,n=null){const s=M();if(!s)return!1;const a=n||he().find(o=>o.id===e),l=t?"events/shared":`events/personal/${s.uid}`,m=L(I,`${l}/${e}`);return await z(m),t&&a&&J(a,s.displayName||s.email),!0}function _(e){return[...y,...g].filter(n=>n.date===e)}function Ee(e,t){const n=[...y,...g],s=`${e}-${String(t+1).padStart(2,"0")}`;return n.filter(a=>a.date.startsWith(s))}function he(){return[...y,...g]}let h=new Date,x=null,c=localStorage.getItem("selectedProjectId")||null;document.getElementById("loadingOverlay");const H=document.getElementById("authContainer"),O=document.getElementById("appContainer");function Be(){H.style.display="flex",O.classList.add("app-hidden")}function $e(e){H.style.display="none",O.classList.remove("app-hidden"),document.getElementById("userAvatar").src=e.photoURL||"",document.getElementById("userName").textContent=e.displayName||e.email;const t=document.getElementById("adminBtn");t&&(t.style.display=ne()?"inline-flex":"none")}function p(){const e=h.getFullYear(),t=h.getMonth();document.getElementById("calendarTitle").textContent=`${e}년 ${t+1}월`;const n=new Date(e,t,1),s=new Date(e,t+1,0),a=n.getDay(),l=s.getDate(),m=Ee(e,t),o=document.getElementById("calendarDays");o.innerHTML="";for(let d=0;d<a;d++){const r=document.createElement("div");r.className="calendar-day empty",o.appendChild(r)}const f=new Date().toISOString().split("T")[0];for(let d=1;d<=l;d++){const r=`${e}-${String(t+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`,D=m.filter(E=>E.date===r),u=document.createElement("div");u.className="calendar-day",u.dataset.date=r,r===f&&u.classList.add("today"),x===r&&u.classList.add("selected");const S=document.createElement("span");if(S.className="day-number",S.textContent=d,u.appendChild(S),D.length>0){const E=document.createElement("div");E.className="event-dots";const V=D.some(v=>v.isShared),F=D.some(v=>!v.isShared);if(V){const v=document.createElement("span");v.className="dot shared",E.appendChild(v)}if(F){const v=document.createElement("span");v.className="dot personal",E.appendChild(v)}u.appendChild(E)}u.addEventListener("click",()=>Le(r)),o.appendChild(u)}}function Le(e){x=e,p(),Ie(e)}function Ie(e){const t=_(e);if(t.length===0){q(e);return}R(t[0],e)}function R(e,t){const n=document.getElementById("eventDetailModal");document.getElementById("eventDetailTitle").textContent=e.title;const s=document.getElementById("eventDetailContent"),a=e.time?` ${e.time}`:"",l=e.isShared?"공유 일정":"개인 일정",m=_(t);s.innerHTML=`
        <div class="event-list-in-modal">
            ${m.map(i=>`
                <div class="event-item ${i.id===e.id?"active":""}" data-id="${i.id}" data-shared="${i.isShared}">
                    <div class="event-type ${i.isShared?"shared":"personal"}">${i.isShared?"공유":"개인"}</div>
                    <div class="event-info">
                        <div class="event-title">${i.title}</div>
                        <div class="event-time">${i.time||"종일"}</div>
                    </div>
                </div>
            `).join("")}
        </div>
        <div class="event-detail-info">
            <p><strong>날짜:</strong> ${t}${a}</p>
            <p><strong>유형:</strong> ${l}</p>
            ${e.description?`<p><strong>설명:</strong> ${e.description}</p>`:""}
            <p><strong>작성자:</strong> ${e.createdByName||e.createdByEmail}</p>
        </div>
    `,s.querySelectorAll(".event-item").forEach(i=>{i.addEventListener("click",()=>{const f=i.dataset.id,d=m.find(r=>r.id===f);d&&R(d,t)})});const o=document.getElementById("deleteEventBtn");o.onclick=async()=>{confirm("이 일정을 삭제하시겠습니까?")&&(await fe(e.id,e.isShared),n.style.display="none",p())},n.style.display="flex"}function q(e=null){const t=document.getElementById("eventModal"),n=document.getElementById("eventDate");document.getElementById("eventTitle").value="",document.getElementById("eventTime").value="",document.getElementById("eventDescription").value="",e?n.value=e:n.value=new Date().toISOString().split("T")[0],document.querySelectorAll("#eventTypeSelect .type-option").forEach(s=>{s.classList.toggle("selected",s.dataset.type==="shared")}),t.style.display="flex"}async function N(){const e=document.getElementById("myTasksList");try{const t=await ve();if(t.length===0){e.innerHTML='<div class="empty-tasks">할당된 일정이 없습니다</div>';return}e.innerHTML=t.map(n=>{const s=n.status==="completed"?"completed":n.status==="in_progress"?"in-progress":"pending",a=n.status==="completed"?"완료":n.status==="in_progress"?"진행중":"대기",l=n.priority||"medium";return`
                <div class="task-item ${s}">
                    <div class="task-status ${s}">${a}</div>
                    <div class="task-content">
                        <div class="task-title">${n.title}</div>
                        <div class="task-project">${n.projectTitle}</div>
                    </div>
                    <div class="task-meta">
                        <span class="task-priority ${l}">${n.priority==="high"?"높음":n.priority==="low"?"낮음":"보통"}</span>
                        <span class="task-date">${n.endDate||"-"}</span>
                    </div>
                </div>
            `}).join("")}catch(t){console.error("Failed to load tasks:",t),e.innerHTML='<div class="empty-tasks">태스크를 불러오는데 실패했습니다</div>'}}function De(e){const t=document.getElementById("projectSelect");t.innerHTML='<option value="">프로젝트 선택...</option>'+e.map(n=>`<option value="${n.id}" ${n.id===c?"selected":""}>${n.title}</option>`).join(""),c&&W(c)}function W(e){const t=document.getElementById("projectSummary"),n=k(e);if(!n){t.innerHTML=`
            <div class="empty-project">
                <div class="empty-icon">📁</div>
                <div class="empty-text">프로젝트를 선택하세요</div>
                <a href="./projects.html" class="btn btn-primary">프로젝트 관리 →</a>
            </div>
        `;return}ae(e),C(n)}function C(e){const t=document.getElementById("projectSummary"),n=de(),s=ie(),a=s.filter(i=>i.status==="completed").length,l=s.length,m=l>0?Math.round(a/l*100):0;let o="";if(e.endDate){const i=new Date(e.endDate),f=new Date;f.setHours(0,0,0,0),i.setHours(0,0,0,0);const d=Math.ceil((i-f)/(1e3*60*60*24));d<0?o=`D+${Math.abs(d)} (지남)`:d===0?o="D-Day":o=`D-${d}`}t.innerHTML=`
        <div class="project-summary-content">
            <div class="summary-header">
                <h3>${e.title}</h3>
                <span class="project-status ${e.status}">${e.status==="active"?"진행중":"완료"}</span>
            </div>

            <div class="summary-stats">
                <div class="stat-item">
                    <div class="stat-value">${m}%</div>
                    <div class="stat-label">진행률</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${m}%"></div>
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${a}/${l}</div>
                    <div class="stat-label">태스크</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${n.length}</div>
                    <div class="stat-label">마일스톤</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${o||"-"}</div>
                    <div class="stat-label">마감일</div>
                </div>
            </div>

            ${e.description?`<p class="project-desc">${e.description}</p>`:""}

            <div class="summary-actions">
                <a href="./projects.html?id=${e.id}" class="btn btn-primary">상세 보기 →</a>
            </div>
        </div>
    `}function Se(){document.getElementById("googleLoginBtn").addEventListener("click",async()=>{const{loginWithGoogle:e}=await A(async()=>{const{loginWithGoogle:t}=await import("./permission-service-DHxnA_q4.js").then(n=>n.W);return{loginWithGoogle:t}},[]);await e()}),document.getElementById("logoutBtn").addEventListener("click",async()=>{const{logout:e}=await A(async()=>{const{logout:t}=await import("./permission-service-DHxnA_q4.js").then(n=>n.W);return{logout:t}},[]);await e()}),document.getElementById("prevMonthBtn").addEventListener("click",()=>{h.setMonth(h.getMonth()-1),p()}),document.getElementById("nextMonthBtn").addEventListener("click",()=>{h.setMonth(h.getMonth()+1),p()}),document.getElementById("addEventBtn").addEventListener("click",()=>{q()}),document.querySelectorAll("#eventTypeSelect .type-option").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("#eventTypeSelect .type-option").forEach(t=>t.classList.remove("selected")),e.classList.add("selected")})}),document.getElementById("eventModalCloseBtn").addEventListener("click",()=>{document.getElementById("eventModal").style.display="none"}),document.getElementById("eventConfirmBtn").addEventListener("click",async()=>{const e=document.getElementById("eventTitle").value.trim(),t=document.getElementById("eventDate").value,n=document.getElementById("eventTime").value,s=document.getElementById("eventDescription").value.trim(),a=document.querySelector("#eventTypeSelect .type-option.selected").dataset.type==="shared";if(!e||!t){alert("제목과 날짜를 입력하세요.");return}await ge({title:e,date:t,time:n,description:s,isShared:a}),document.getElementById("eventModal").style.display="none",p()}),document.getElementById("eventDetailCloseBtn").addEventListener("click",()=>{document.getElementById("eventDetailModal").style.display="none"}),document.getElementById("projectSelect").addEventListener("change",e=>{c=e.target.value||null,localStorage.setItem("selectedProjectId",c||""),c?W(c):document.getElementById("projectSummary").innerHTML=`
                <div class="empty-project">
                    <div class="empty-icon">📁</div>
                    <div class="empty-text">프로젝트를 선택하세요</div>
                    <a href="./projects.html" class="btn btn-primary">프로젝트 관리 →</a>
                </div>
            `}),document.querySelectorAll(".modal-overlay").forEach(e=>{e.addEventListener("click",t=>{t.target===e&&(e.style.display="none")})})}function ke(){se(),Se(),ue(e=>{p(),b()}),le(e=>{De(e),N()}),oe(()=>{if(c){const e=k(c);e&&C(e)}}),ce(()=>{if(c){const e=k(c);e&&C(e)}N()}),Q(e=>{e?($e(e),pe(),re(),X(),Z(),p()):(ye(),me(),ee(),te(),Be(),b())}),K()}document.addEventListener("DOMContentLoaded",ke);
