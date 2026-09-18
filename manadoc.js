// ============================================================
// MANADOC — main app logic
// Data layer: currently uses localStorage via db.* helpers.
// TODO(Supabase): replace db.* internals with @supabase/supabase-js calls.
// See bottom of file for supabaseAdapter placeholder.
// ============================================================

const LS_KEY = 'manadoc:v1'
const COUNTRY_FLAG = { 'Brasil': '🇧🇷', 'Portugal': '🇵🇹', 'China': '🇨🇳', 'Outro': '🌐' }
const TYPE_ICON = {
  'CPF':'📇','RG':'🪪','Passaporte':'📘','RNE':'📋','NIF':'🧾',
  'Cartão de Residência':'🏠','Cartão de Saúde':'⚕️','ID China':'🆔',
  'Carteira de Motorista':'🚗','Outro':'📄'
}

// ---------- Seed data ----------
function seed() {
  const now = Date.now()
  const familyId = 'fam_silva'
  const walter = { id: 'u_walter', name: 'walter Fernandes', email: 'pai@manadoc.com', password: '123456', familyId, createdAt: now }
  const peng = { id: 'u_peng', name: 'Peng Ren', email: 'mae@manadoc.com', password: '123456', familyId, createdAt: now }
  const sofia = { id: 'u_sofia', name: 'Sofia Ren Fernandes', email: 'filha@manadoc.com', password: '123456', familyId, createdAt: now }
  const users = [walter, li, sofia]
  const families = [{ id: familyId, name: 'Família Silva', code: 'SILVA-2025', createdBy: walter.id }]

  const d = (y,m,day)=> new Date(y,m-1,day).toISOString().slice(0,10)
  const documents = [
    // walter
    { id:'d1', ownerId:walter.id, familyId, type:'CPF', country:'Brasil', name:'CPF walter', issueDate:d(2005,3,10), expiryDate:'', photo:'', sharedWith:[png.id, sofia.id] },
    { id:'d2', ownerId:walter.id, familyId, type:'RG', country:'Brasil', name:'RG walter', issueDate:d(2018,6,15), expiryDate:'', photo:'', sharedWith:[peng.id] },
    { id:'d3', ownerId:walter.id, familyId, type:'Passaporte', country:'Brasil', name:'Passaporte BR walter', issueDate:d(2020,2,4), expiryDate:d(2030,2,3), photo:'', sharedWith:[peng.id, sofia.id] },
    { id:'d4', ownerId:walter.id, familyId, type:'Cartão de Residência', country:'Portugal', name:'Título de Residência PT', issueDate:d(2023,9,10), expiryDate:d(2025,9,10), photo:'', sharedWith:[peng.id] },
    { id:'d5', ownerId:walter.id, familyId, type:'NIF', country:'Portugal', name:'NIF walter', issueDate:d(2023,8,1), expiryDate:'', photo:'', sharedWith:[peng.id] },
    // Peng
    { id:'d6', ownerId:peng.id, familyId, type:'RNE', country:'Brasil', name:'RNE Peng', issueDate:d(2019,4,20), expiryDate:d(2029,4,20), photo:'', sharedWith:[walter.id] },
    { id:'d7', ownerId:peng.id, familyId, type:'CPF', country:'Brasil', name:'CPF Peng', issueDate:d(2019,5,1), expiryDate:'', photo:'', sharedWith:[walter.id] },
    { id:'d8', ownerId:peng.id, familyId, type:'Passaporte', country:'China', name:'Passaporte CN Peng', issueDate:d(2019,1,15), expiryDate:d(2029,1,14), photo:'', sharedWith:[walter.id] },
    { id:'d9', ownerId:peng.id, familyId, type:'ID China', country:'China', name:'ID China Peng', issueDate:d(2015,7,7), expiryDate:d(2035,7,7), photo:'', sharedWith:[] },
    { id:'d10', ownerId:peng.id, familyId, type:'Cartão de Residência', country:'Portugal', name:'Título de Residência PT — Peng', issueDate:d(2023,9,10), expiryDate:d(2025,9,10), photo:'', sharedWith:[walter.id] },
    // Sofia
    { id:'d11', ownerId:sofia.id, familyId, type:'CPF', country:'Brasil', name:'CPF Sofia', issueDate:d(2020,3,1), expiryDate:'', photo:'', sharedWith:[walter.id, peng.id] },
    { id:'d12', ownerId:sofia.id, familyId, type:'Passaporte', country:'Brasil', name:'Passaporte BR Sofia', issueDate:d(2022,6,10), expiryDate:d(2027,6,9), photo:'', sharedWith:[walter.id, peng.id] },
    { id:'d13', ownerId:sofia.id, familyId, type:'Cartão de Residência', country:'Portugal', name:'Título de Residência PT — Sofia', issueDate:d(2023,9,10), expiryDate:d(2025,9,10), photo:'', sharedWith:[walter.id, peng.id] },
  ]
  return { users, families, documents, currentUserId: null }
}

// ---------- Storage layer (Supabase placeholder) ----------
const store = {
  get() {
    try { const raw = localStorage.getItem(LS_KEY); if(raw) return JSON.parse(raw) } catch(e){}
    const fresh = seed(); this.set(fresh); return fresh
  },
  set(data) { localStorage.setItem(LS_KEY, JSON.stringify(data)) }
}

const db = {
  // AUTH
  async login(email, password) {
    const s = store.get()
    const u = s.users.find(u=>u.email===email && u.password===password)
    if(!u) throw new Error('Email ou senha inválidos')
    s.currentUserId = u.id; store.set(s); return u
  },
  async register({name,email,password,familyCode}) {
    const s = store.get()
    if(s.users.some(u=>u.email===email)) throw new Error('Email já cadastrado')
    let familyId
    if(familyCode && familyCode.trim()) {
      const fam = s.families.find(f=>f.code.toLowerCase()===familyCode.trim().toLowerCase())
      if(!fam) throw new Error('Código de família inválido')
      familyId = fam.id
    } else {
      familyId = 'fam_'+Math.random().toString(36).slice(2,9)
      s.families.push({ id: familyId, name: `Família ${name.split(' ')[0]}`, code: (name.split(' ')[0].toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase()), createdBy:'' })
    }
    const user = { id:'u_'+Math.random().toString(36).slice(2,9), name, email, password, familyId, createdAt: Date.now() }
    s.users.push(user); s.currentUserId = user.id; store.set(s); return user
  },
  async logout(){ const s=store.get(); s.currentUserId=null; store.set(s) },
  async me() { const s=store.get(); return s.users.find(u=>u.id===s.currentUserId) || null },

  async familyMembers(familyId) {
    const s = store.get(); return s.users.filter(u=>u.familyId===familyId)
  },
  async family(familyId){ const s=store.get(); return s.families.find(f=>f.id===familyId) },

  async listDocs(userId) {
    const s = store.get(); const me = s.users.find(u=>u.id===userId); if(!me) return []
    return s.documents.filter(d=>d.familyId===me.familyId && (d.ownerId===userId || (d.sharedWith||[]).includes(userId)))
  },
  async saveDoc(doc) {
    const s = store.get()
    if(doc.id) {
      const i = s.documents.findIndex(d=>d.id===doc.id)
      if(i>=0) s.documents[i] = { ...s.documents[i], ...doc }
    } else {
      doc.id = 'd_'+Math.random().toString(36).slice(2,9)
      s.documents.push(doc)
    }
    store.set(s); return doc
  },
  async deleteDoc(id) {
    const s = store.get(); s.documents = s.documents.filter(d=>d.id!==id); store.set(s)
  },
  async docCountByUser(userId) {
    const s = store.get(); return s.documents.filter(d=>d.ownerId===userId).length
  }
}

// ---------- UI state ----------
let state = { user:null, family:null, members:[], docs:[], filter:'all', country:'all', editing:null, photoData:'' }

const $ = (sel, root=document) => root.querySelector(sel)
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)]

function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show')
  clearTimeout(toast._t); toast._t = setTimeout(()=>el.classList.remove('show'), 2500)
}
function initials(name){ return name.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase() }
function daysUntil(dateStr){ if(!dateStr) return null; return Math.ceil((new Date(dateStr) - new Date())/(1000*60*60*24)) }
function fmtDate(d){ if(!d) return '—'; const [y,m,day]=d.split('-'); return `${day}/${m}/${y}` }

// ---------- AUTH UI ----------
$$('.tab').forEach(t => t.addEventListener('click', () => {
  $$('.tab').forEach(x=>x.classList.remove('active'))
  $$('.tab-panel').forEach(x=>x.classList.remove('active'))
  t.classList.add('active')
  $('#form-'+t.dataset.tab).classList.add('active')
}))
$$('[data-fill]').forEach(b => b.addEventListener('click', () => {
  const [em,pw] = b.dataset.fill.split('|')
  $('#login-email').value = em; $('#login-pass').value = pw
}))
$('#form-login').addEventListener('submit', async e => {
  e.preventDefault()
  try {
    const u = await db.login($('#login-email').value.trim(), $('#login-pass').value)
    await enterApp(u)
  } catch(err) { toast(err.message) }
})
$('#form-register').addEventListener('submit', async e => {
  e.preventDefault()
  try {
    const u = await db.register({
      name: $('#reg-name').value.trim(),
      email: $('#reg-email').value.trim(),
      password: $('#reg-pass').value,
      familyCode: $('#reg-family').value.trim()
    })
    toast('Conta criada! Bem-vindo(a) '+u.name.split(' ')[0])
    await enterApp(u)
  } catch(err) { toast(err.message) }
})

// ---------- Enter app ----------
async function enterApp(user) {
  state.user = user
  state.family = await db.family(user.familyId)
  state.members = await db.familyMembers(user.familyId)
  state.docs = await db.listDocs(user.id)
  $('#screen-auth').classList.remove('active')
  $('#screen-app').classList.add('active')
  $('#user-avatar').textContent = initials(user.name)
  $('#greeting').textContent = `Olá, ${user.name.split(' ')[0]} 👋`
  const total = state.docs.length
  const expiring = state.docs.filter(d=>{ const dd=daysUntil(d.expiryDate); return dd!==null && dd<=90 && dd>=0 }).length
  $('#summary-line').textContent = `${total} documento${total!==1?'s':''} • ${expiring} próximo${expiring!==1?'s':''} do vencimento`
  $('#family-code').textContent = state.family.code
  renderDocs(); renderMembers()
}

$('#btn-logout').addEventListener('click', async ()=>{
  await db.logout(); state = { user:null, family:null, members:[], docs:[], filter:'all', country:'all', editing:null, photoData:'' }
  $('#screen-app').classList.remove('active'); $('#screen-auth').classList.add('active')
})

// Nav tabs
$$('.nav-tab').forEach(t => t.addEventListener('click', () => {
  $$('.nav-tab').forEach(x=>x.classList.remove('active'))
  $$('.view').forEach(x=>x.classList.remove('active'))
  t.classList.add('active')
  $('#view-'+t.dataset.view).classList.add('active')
}))

// Filters
$$('.filter-chip').forEach(c => c.addEventListener('click', () => {
  $$('.filter-chip').forEach(x=>x.classList.remove('active'))
  c.classList.add('active'); state.filter = c.dataset.filter; renderDocs()
}))
$('#filter-country').addEventListener('change', e => { state.country = e.target.value; renderDocs() })

// ---------- Render docs ----------
function renderDocs() {
  const grid = $('#docs-grid'); grid.innerHTML = ''
  let docs = [...state.docs]
  if(state.filter==='mine') docs = docs.filter(d=>d.ownerId===state.user.id)
  if(state.filter==='shared') docs = docs.filter(d=>d.ownerId!==state.user.id)
  if(state.filter==='expiring') docs = docs.filter(d=>{ const dd=daysUntil(d.expiryDate); return dd!==null && dd<=90 })
  if(state.country!=='all') docs = docs.filter(d=>d.country===state.country)
  docs.sort((a,b)=>{
    const da=daysUntil(a.expiryDate), db=daysUntil(b.expiryDate)
    if(da===null && db===null) return a.name.localeCompare(b.name)
    if(da===null) return 1; if(db===null) return -1; return da-db
  })
  $('#docs-empty').style.display = docs.length ? 'none' : 'block'
  docs.forEach(doc => {
    const owner = state.members.find(m=>m.id===doc.ownerId)
    const dd = daysUntil(doc.expiryDate)
    let expClass='', expText='Sem expiração'
    if(dd!==null){
      if(dd<0){ expClass='danger'; expText=`Vencido há ${-dd}d` }
      else if(dd<=30){ expClass='danger'; expText=`Vence em ${dd}d` }
      else if(dd<=90){ expClass='warn'; expText=`Vence em ${dd}d` }
      else { expText=`Vence em ${fmtDate(doc.expiryDate)}` }
    }
    const card = document.createElement('div')
    card.className = 'doc-card'
    card.innerHTML = `
      <div class="doc-photo">
        ${doc.photo ? `<img src="${doc.photo}" alt="">` : `<div class="placeholder">${TYPE_ICON[doc.type]||'📄'}</div>`}
        <div class="doc-badge">${COUNTRY_FLAG[doc.country]||''} ${doc.country}</div>
        ${doc.ownerId!==state.user.id ? `<div class="doc-shared">👁 compartilhado</div>` : ((doc.sharedWith||[]).length ? `<div class="doc-shared">↗ ${doc.sharedWith.length}</div>` : '')}
      </div>
      <div class="doc-body">
        <div class="doc-title">${doc.name}</div>
        <div class="muted small">${doc.type}</div>
        <div class="doc-meta">
          <span class="doc-expiry ${expClass}">${expText}</span>
          <div class="doc-owner-avatar" title="${owner?.name||''}">${initials(owner?.name||'?')}</div>
        </div>
      </div>
    `
    card.addEventListener('click', () => openView(doc))
    grid.appendChild(card)
  })
}

// ---------- Render members ----------
async function renderMembers() {
  const grid = $('#members-grid'); grid.innerHTML = ''
  for(const m of state.members){
    const count = await db.docCountByUser(m.id)
    const card = document.createElement('div')
    card.className = 'member-card'
    card.innerHTML = `
      <div class="member-avatar-lg">${initials(m.name)}</div>
      <div class="member-name">${m.name}${m.id===state.user.id?' <span class="muted small">(você)</span>':''}</div>
      <div class="member-email">${m.email}</div>
      <div class="member-count">${count} documento${count!==1?'s':''}</div>
    `
    grid.appendChild(card)
  }
}

$('#btn-copy-code').addEventListener('click', () => {
  navigator.clipboard.writeText(state.family.code); toast('Código copiado!')
})

// ---------- Doc modal ----------
const modalDoc = $('#modal-doc'), modalView = $('#modal-view')
function openModal(m){ m.hidden=false } function closeModal(m){ m.hidden=true }
$$('[data-close]').forEach(b => b.addEventListener('click', e => {
  closeModal(e.target.closest('.modal'))
}))

$('#btn-new-doc').addEventListener('click', () => openDocModal(null))

function openDocModal(doc){
  state.editing = doc; state.photoData = doc?.photo || ''
  $('#modal-title').textContent = doc ? 'Editar documento' : 'Novo documento'
  $('#doc-id').value = doc?.id || ''
  $('#doc-type').value = doc?.type || ''
  $('#doc-country').value = doc?.country || ''
  $('#doc-name').value = doc?.name || ''
  $('#doc-issue').value = doc?.issueDate || ''
  $('#doc-expiry').value = doc?.expiryDate || ''
  $('#btn-delete-doc').style.display = doc ? 'inline-block' : 'none'
  // photo preview
  const drop = $('#file-drop')
  if(state.photoData){ $('#file-preview').src = state.photoData; drop.classList.add('has-file'); $('#btn-remove-photo').style.display='block' }
  else { drop.classList.remove('has-file'); $('#btn-remove-photo').style.display='none'; $('#file-preview').src='' }
  // share list
  const list = $('#share-list'); list.innerHTML=''
  const shared = new Set(doc?.sharedWith || [])
  state.members.filter(m=>m.id!==state.user.id).forEach(m => {
    const el = document.createElement('div')
    el.className = 'share-item' + (shared.has(m.id)?' active':'')
    el.innerHTML = `<div class="mini-avatar">${initials(m.name)}</div><span>${m.name.split(' ')[0]}</span>`
    el.addEventListener('click', () => { el.classList.toggle('active') })
    el.dataset.memberId = m.id
    list.appendChild(el)
  })
  openModal(modalDoc)
}

// File upload
const fileDrop = $('#file-drop'), fileInput = $('#doc-photo')
fileDrop.addEventListener('click', e => { if(e.target.tagName!=='BUTTON') fileInput.click() })
fileInput.addEventListener('change', e => handleFile(e.target.files[0]))
fileDrop.addEventListener('dragover', e => { e.preventDefault(); fileDrop.style.borderColor='#ffa6fd' })
fileDrop.addEventListener('dragleave', () => { fileDrop.style.borderColor='' })
fileDrop.addEventListener('drop', e => { e.preventDefault(); fileDrop.style.borderColor=''; handleFile(e.dataTransfer.files[0]) })
$('#btn-remove-photo').addEventListener('click', e => { e.stopPropagation(); state.photoData=''; fileDrop.classList.remove('has-file'); $('#btn-remove-photo').style.display='none'; fileInput.value='' })

function handleFile(file){
  if(!file || !file.type.startsWith('image/')) return
  const reader = new FileReader()
  reader.onload = ev => {
    // Compress to keep localStorage happy
    const img = new Image()
    img.onload = () => {
      const max = 1200, scale = Math.min(1, max/Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = img.width*scale; canvas.height = img.height*scale
      const ctx = canvas.getContext('2d'); ctx.drawImage(img,0,0,canvas.width,canvas.height)
      state.photoData = canvas.toDataURL('image/jpeg', 0.82)
      $('#file-preview').src = state.photoData
      fileDrop.classList.add('has-file')
      $('#btn-remove-photo').style.display='block'
    }
    img.src = ev.target.result
  }
  reader.readAsDataURL(file)
}

$('#form-doc').addEventListener('submit', async e => {
  e.preventDefault()
  const sharedWith = $$('#share-list .share-item.active').map(el=>el.dataset.memberId)
  const doc = {
    id: $('#doc-id').value || undefined,
    ownerId: state.editing?.ownerId || state.user.id,
    familyId: state.user.familyId,
    type: $('#doc-type').value,
    country: $('#doc-country').value,
    name: $('#doc-name').value.trim(),
    issueDate: $('#doc-issue').value,
    expiryDate: $('#doc-expiry').value,
    photo: state.photoData,
    sharedWith
  }
  try {
    await db.saveDoc(doc)
    state.docs = await db.listDocs(state.user.id)
    renderDocs(); closeModal(modalDoc)
    toast(state.editing ? 'Documento atualizado' : 'Documento adicionado')
  } catch(err) { toast(err.message || 'Erro ao salvar (talvez a foto seja muito grande)') }
})

$('#btn-delete-doc').addEventListener('click', async () => {
  if(!state.editing) return
  if(!confirm('Tem certeza que deseja deletar este documento?')) return
  await db.deleteDoc(state.editing.id)
  state.docs = await db.listDocs(state.user.id)
  renderDocs(); closeModal(modalDoc); toast('Documento deletado')
})

// ---------- View modal ----------
function openView(doc){
  const owner = state.members.find(m=>m.id===doc.ownerId)
  const isOwner = doc.ownerId === state.user.id
  const dd = daysUntil(doc.expiryDate)
  let expClass='', expText=fmtDate(doc.expiryDate)
  if(dd!==null){
    if(dd<0){ expClass='danger'; expText=`${fmtDate(doc.expiryDate)} — vencido há ${-dd}d` }
    else if(dd<=30){ expClass='danger'; expText=`${fmtDate(doc.expiryDate)} — em ${dd}d` }
    else if(dd<=90){ expClass='warn'; expText=`${fmtDate(doc.expiryDate)} — em ${dd}d` }
  }
  $('#view-title').textContent = doc.name
  const sharedNames = (doc.sharedWith||[]).map(id => state.members.find(m=>m.id===id)?.name.split(' ')[0]).filter(Boolean)
  $('#view-body').innerHTML = `
    <div class="view-doc-photo">
      ${doc.photo ? `<img src="${doc.photo}" alt="">` : `<div class="placeholder">${TYPE_ICON[doc.type]||'📄'}</div>`}
    </div>
    <div class="info-grid">
      <div class="info-item"><div class="info-label">Tipo</div><div class="info-value">${doc.type}</div></div>
      <div class="info-item"><div class="info-label">País</div><div class="info-value">${COUNTRY_FLAG[doc.country]||''} ${doc.country}</div></div>
      <div class="info-item"><div class="info-label">Emissão / Renovação</div><div class="info-value">${fmtDate(doc.issueDate)}</div></div>
      <div class="info-item"><div class="info-label">Expiração</div><div class="info-value ${expClass}">${expText}</div></div>
      <div class="info-item" style="grid-column:1/-1"><div class="info-label">Proprietário</div><div class="info-value">${owner?.name || '—'}${isOwner?' (você)':''}</div></div>
      ${sharedNames.length ? `<div class="info-item" style="grid-column:1/-1"><div class="info-label">Compartilhado com</div><div class="shared-badges">${sharedNames.map(n=>`<span class="shared-badge">${n}</span>`).join('')}</div></div>` : ''}
    </div>
    <div class="modal-actions">
      <div class="spacer"></div>
      ${isOwner ? `<button class="btn-ghost" id="vw-edit">Editar</button>` : ''}
    </div>
  `
  openModal(modalView)
  if(isOwner) $('#vw-edit').addEventListener('click', () => { closeModal(modalView); openDocModal(doc) })
}

// ---------- Auto-login if session ----------
(async () => {
  const me = await db.me()
  if(me) enterApp(me)
})()

// ============================================================
// SUPABASE PLACEHOLDER — replace db.* internals with these when ready
// ============================================================
// import { createClient } from '@supabase/supabase-js'
// const supabase = createClient(
//   'YOUR_SUPABASE_URL',       // process.env.NEXT_PUBLIC_SUPABASE_URL
//   'YOUR_SUPABASE_ANON_KEY'   // process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
// )
//
// // Tables expected:
// //   profiles(id uuid pk, name text, email text, family_id uuid)
// //   families(id uuid pk, name text, code text unique)
// //   documents(id uuid pk, owner_id uuid, family_id uuid, type text,
// //             country text, name text, issue_date date, expiry_date date,
// //             photo_url text, shared_with uuid[])
// //
// // Example login:
// //   const { data, error } = await supabase.auth.signInWithPassword({ email, password })
// //
// // Example list docs (RLS enforces family + share visibility):
// //   const { data } = await supabase.from('documents').select('*')
//                        .or(`owner_id.eq.${uid},shared_with.cs.{${uid}}`)
