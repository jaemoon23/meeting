import{i as U,J as M,k as q,x as R,P as D,r as u,d as p,s as f,D as g,Q as O,m as h,F as W,R as $,S as L,G as N,H as T,T as P,g as j,f as H,j as V,I as _,h as z,l as F,o as Z,e as G,U as J,L as K,V as Q,K as X}from"./permission-service-DHxnA_q4.js";import{i as Y}from"./admin-CsbdPve9.js";let r="discord",m=null,v={};function ee(){m=u(p,"adminConfig"),Z(m,t=>{v=t.val()||{},y()})}function se(){m&&(G(m),m=null)}function te(){document.getElementById("loadingOverlay").style.display="flex"}function B(){document.getElementById("loadingOverlay").style.display="none"}function ae(){B(),document.getElementById("accessDenied").style.display="flex",document.getElementById("adminContainer").style.display="none"}function ne(t){B(),document.getElementById("accessDenied").style.display="none",document.getElementById("adminContainer").style.display="block",document.getElementById("userAvatar").src=t.photoURL||"",document.getElementById("userName").textContent=t.displayName||t.email,C()}function C(){document.querySelectorAll(".admin-nav-item").forEach(s=>{switch(s.dataset.section){case"users":s.style.display=J()?"flex":"none";break;case"permissions":s.style.display=h()?"flex":"none";break;case"discord":s.style.display="flex";break;case"settings":s.style.display=h()?"flex":"none";break}});const a=document.querySelector(`.admin-nav-item[data-section="${r}"]`);a&&a.style.display==="none"&&S("discord")}function S(t){r=t,document.querySelectorAll(".admin-nav-item").forEach(a=>{a.classList.toggle("active",a.dataset.section===t)}),document.querySelectorAll(".admin-section").forEach(a=>{a.style.display=a.id===`section-${t}`?"block":"none"}),y()}function y(){switch(r){case"users":ie();break;case"permissions":oe();break;case"discord":x();break}}function ie(){const t=document.getElementById("userList"),a=j(),s=g();let c='<div class="list-header">등록된 사용자 ('+s.length+"명)</div>";s.forEach(i=>{var n;const o=i==="990914s@gmail.com",e=i===((n=a==null?void 0:a.email)==null?void 0:n.toLowerCase());c+=`
            <div class="user-item">
                <div class="user-item-info">
                    <span class="user-email">${i}</span>
                    ${o?'<span class="badge badge-owner">Owner</span>':""}
                    ${e?'<span class="badge badge-self">나</span>':""}
                </div>
                <div class="user-item-actions">
                    ${o?"":`<button class="btn btn-small btn-danger remove-user-btn" data-email="${i}" ${e?"disabled":""}>삭제</button>`}
                </div>
            </div>
        `}),t.innerHTML=c,t.querySelectorAll(".remove-user-btn").forEach(i=>{i.addEventListener("click",async()=>{const o=i.dataset.email;if(confirm(`정말 ${o} 사용자를 삭제하시겠습니까?`))try{await P(o),alert("삭제되었습니다.")}catch{alert("삭제에 실패했습니다.")}})})}function oe(){const t=document.getElementById("permissionList"),a=v.admins||{},s=g();let c='<div class="list-header">권한 설정</div>';s.forEach(i=>{const o=i==="990914s@gmail.com",e=Object.values(a).find(l=>l.email===i),n=(e==null?void 0:e.permissions)||[];c+=`
            <div class="permission-item" data-email="${i}">
                <div class="permission-user">
                    <span class="user-email">${i}</span>
                    ${o?'<span class="badge badge-owner">Owner (모든 권한)</span>':""}
                </div>
                ${o?"":`
                    <div class="permission-checkboxes">
                        <label class="checkbox-label">
                            <input type="checkbox" class="permission-checkbox" data-permission="canManageUsers" ${n.includes("canManageUsers")?"checked":""}>
                            사용자 관리
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="permission-checkbox" data-permission="canManageDiscord" ${n.includes("canManageDiscord")?"checked":""}>
                            Discord 관리
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="permission-checkbox" data-permission="canManageTemplates" ${n.includes("canManageTemplates")?"checked":""}>
                            템플릿 관리
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="permission-checkbox" data-permission="canDeleteMeetings" ${n.includes("canDeleteMeetings")?"checked":""}>
                            회의록 삭제
                        </label>
                    </div>
                    <button class="btn btn-primary btn-small save-permission-btn" data-email="${i}">저장</button>
                `}
            </div>
        `}),t.innerHTML=c,t.querySelectorAll(".save-permission-btn").forEach(i=>{i.addEventListener("click",async()=>{const o=i.dataset.email,n=i.closest(".permission-item").querySelectorAll(".permission-checkbox:checked"),l=Array.from(n).map(d=>d.dataset.permission);try{const d=u(p,`adminConfig/admins/${o.replace(/[^a-zA-Z0-9]/g,"_")}`);await f(d,{email:o,permissions:l,updatedAt:Date.now()}),alert("권한이 저장되었습니다.")}catch{alert("저장에 실패했습니다.")}})})}function ce(){const t=v.webhooks||{};["meeting","calendar","project"].forEach(s=>{const c=document.getElementById(`webhook${s.charAt(0).toUpperCase()+s.slice(1)}`),i=t[s]||{};c&&(c.value=i.url||"");const o=i.options||{};document.querySelectorAll(`.webhook-option[data-webhook="${s}"]`).forEach(e=>{const n=e.dataset.option;e.checked=o[n]===!0})})}async function le(){const t=["meeting","calendar","project"],a={};t.forEach(s=>{const c=document.getElementById(`webhook${s.charAt(0).toUpperCase()+s.slice(1)}`),i=(c==null?void 0:c.value.trim())||"",o={};document.querySelectorAll(`.webhook-option[data-webhook="${s}"]`).forEach(e=>{o[e.dataset.option]=e.checked}),a[s]={url:i,options:o}});try{const s=u(p,"adminConfig/webhooks");await f(s,a),alert("웹훅 설정이 저장되었습니다.")}catch(s){console.error("웹훅 저장 실패:",s),alert("저장에 실패했습니다.")}}async function de(t,a,s){try{const c=u(p,`adminConfig/webhooks/${t}/options/${a}`);await f(c,s)}catch(c){console.error("웹훅 옵션 저장 실패:",c)}}async function I(t,a){try{const s=u(p,`adminConfig/webhooks/${t}/url`);await f(s,a)}catch(s){console.error("웹훅 URL 저장 실패:",s)}}async function re(t){const a=document.getElementById(`webhook${t.charAt(0).toUpperCase()+t.slice(1)}`),s=a==null?void 0:a.value.trim();if(!s){alert("웹훅 URL을 먼저 입력해주세요.");return}const c=document.querySelector(`button[data-webhook="${t}"]`),i=c.textContent;c.disabled=!0,c.textContent="전송 중...";try{const e=await D(s,`${{meeting:"회의록",calendar:"캘린더",project:"프로젝트"}[t]} 웹훅 테스트`);alert(e?"테스트 메시지가 전송되었습니다!":"전송에 실패했습니다. 웹훅 URL을 확인해주세요.")}catch{alert("전송 중 오류가 발생했습니다.")}finally{c.disabled=!1,c.textContent=i}}function x(){const t=document.getElementById("discordMappingList"),a=document.getElementById("webhookSection");a&&(a.style.display=h()?"block":"none",h()&&ce());const s=W(),c=$();let i='<div class="list-header">Discord ID 설정</div>';const o=s.find(n=>L(n.email)),e=s.filter(n=>!L(n.email));o&&(i+=`
            <div class="discord-item my-discord-item" data-email="${o.email}">
                <div class="discord-user-info">
                    <span class="user-email">${o.email}</span>
                    <span class="badge badge-self">나</span>
                    ${o.discordId?'<span class="badge badge-success">등록됨</span>':'<span class="badge badge-warning">미등록</span>'}
                </div>
                <div class="discord-inputs">
                    <input type="text" class="admin-input discord-id-input" value="${o.discordId||""}" placeholder="Discord ID">
                    <input type="text" class="admin-input discord-name-input" value="${o.discordName||""}" placeholder="닉네임">
                    <button class="btn btn-primary btn-small save-discord-btn"
                            data-uid="${o.uid||""}"
                            data-email="${o.email}"
                            data-is-self="true">저장</button>
                </div>
            </div>
        `),c&&e.length>0&&(i+='<div class="list-header" style="margin-top: 20px;">다른 사용자 Discord ID 관리</div>',e.forEach(n=>{i+=`
                <div class="discord-item" data-email="${n.email}">
                    <div class="discord-user-info">
                        <span class="user-email">${n.email}</span>
                        ${n.discordId?'<span class="badge badge-success">등록됨</span>':'<span class="badge badge-warning">미등록</span>'}
                    </div>
                    <div class="discord-inputs">
                        <input type="text" class="admin-input discord-id-input" value="${n.discordId||""}" placeholder="Discord ID">
                        <input type="text" class="admin-input discord-name-input" value="${n.discordName||""}" placeholder="닉네임">
                        <button class="btn btn-primary btn-small save-discord-btn"
                                data-uid="${n.uid||""}"
                                data-email="${n.email}"
                                data-is-self="false">저장</button>
                    </div>
                </div>
            `})),t.innerHTML=i,t.querySelectorAll(".save-discord-btn").forEach(n=>{n.addEventListener("click",async()=>{const l=n.dataset.email,d=n.dataset.uid||`pending_${l.replace(/[^a-zA-Z0-9]/g,"_")}`,k=n.dataset.isSelf==="true",w=n.closest(".discord-item"),b=w.querySelector(".discord-id-input").value.trim(),E=w.querySelector(".discord-name-input").value.trim();if(!k&&!$()){alert("다른 사용자의 Discord ID를 수정할 권한이 없습니다.");return}if(b&&!/^\d{17,19}$/.test(b)){alert("Discord ID는 17-19자리 숫자입니다.");return}try{k?await N(b,E):await T(d,l,"",b,E),alert("저장되었습니다.")}catch{alert("저장에 실패했습니다.")}})})}async function A(){const t=document.getElementById("newUserEmail"),a=t.value.trim().toLowerCase();if(!a){alert("이메일을 입력해주세요.");return}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a)){alert("올바른 이메일 형식이 아닙니다.");return}if(g().includes(a)){alert("이미 등록된 이메일입니다.");return}try{await O(a),t.value="",alert("사용자가 추가되었습니다.")}catch{alert("추가에 실패했습니다.")}}function me(){var t,a,s,c,i,o;te(),H(e=>{e?Y(e.email)?(ne(e),ee(),V(),_(),z(),K(()=>{(r==="users"||r==="permissions")&&y()}),Q(()=>{r==="discord"&&x()}),X(()=>{C(),y()})):ae():window.location.href="/meeting/"}),U(),document.querySelectorAll(".admin-nav-item").forEach(e=>{e.addEventListener("click",()=>{S(e.dataset.section)})}),(t=document.getElementById("logoutBtn"))==null||t.addEventListener("click",async()=>{se(),F(),M(),q(),await R()}),(a=document.getElementById("saveWebhookBtn"))==null||a.addEventListener("click",I),(s=document.getElementById("testWebhookBtn"))==null||s.addEventListener("click",async()=>{const e=document.getElementById("discordWebhookUrl").value.trim();if(!e){alert("웹훅 URL을 먼저 입력해주세요.");return}const n=document.getElementById("testWebhookBtn");n.disabled=!0,n.textContent="전송 중...";try{const l=await D(e);alert(l?"테스트 메시지가 전송되었습니다! Discord 채널을 확인하세요.":"전송에 실패했습니다. 웹훅 URL을 확인해주세요.")}catch{alert("전송 중 오류가 발생했습니다.")}finally{n.disabled=!1,n.textContent="테스트 전송"}}),(c=document.getElementById("addUserBtn"))==null||c.addEventListener("click",A),(i=document.getElementById("newUserEmail"))==null||i.addEventListener("keypress",e=>{e.key==="Enter"&&A()}),(o=document.getElementById("saveAllWebhooksBtn"))==null||o.addEventListener("click",le),document.querySelectorAll(".webhook-url-row button[data-webhook]").forEach(e=>{e.addEventListener("click",()=>{re(e.dataset.webhook)})}),document.querySelectorAll(".webhook-option").forEach(e=>{e.addEventListener("change",()=>{de(e.dataset.webhook,e.dataset.option,e.checked)})}),document.querySelectorAll(".webhook-url-input").forEach(e=>{const n=e.id.replace("webhook","").toLowerCase();e.addEventListener("blur",()=>{I(n,e.value.trim())})})}document.addEventListener("DOMContentLoaded",me);
