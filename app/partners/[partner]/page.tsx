'use client'

import React, { useEffect, useState, useRef } from 'react'

import JSZip from 'jszip'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import {
  Upload, Download, FolderPlus, Search, LayoutGrid, List, Loader,
  File, FileVideo, FileText, FileImage, Archive, MoreHorizontal,
  Folder, ChevronRight, Trash2, X, Check, Star, HardDrive,
  Share2, Menu, Home, Calendar, ChevronLeft, Plus, Clock, MapPin, AlignLeft, Users, Bell
} from 'lucide-react'

interface FileItem {
  key: string
  name: string
  isFolder: boolean
  size: number
  lastModified: string | null
  uploadedBy: string | null
}

interface CalEvent {
  id: string; title: string; date: string; endDate?: string
  time?: string; endTime?: string; color: string
  type: 'perso' | 'partage'; location?: string
  description?: string; allDay?: boolean; reminder?: string
}

type MainTab = 'skillz' | 'calendrier'
type Section = 'accueil' | 'mes-skillz' | 'partages' | 'favoris' | 'corbeille'
type CalView = 'mois' | 'semaine'

function formatSize(bytes: number) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function getFileType(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (['mp4', 'mov', 'avi', 'mkv', 'prproj'].includes(ext || '')) return { Icon: FileVideo, bg: '#fff3e0', color: '#f97316' }
  if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) return { Icon: FileText, bg: '#f0fdf4', color: '#22c55e' }
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return { Icon: FileImage, bg: '#faf5ff', color: '#a855f7' }
  if (['zip', 'rar', '7z'].includes(ext || '')) return { Icon: Archive, bg: '#eff6ff', color: '#3b82f6' }
  return { Icon: File, bg: '#f8fafc', color: '#94a3b8' }
}

const font = { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const navy = '#122e53'
const gold = '#d4af37'

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const EVENT_COLORS = [
  { v:'#0078d4', l:'Bleu' },{ v:'#d4af37', l:'Or' },
  { v:'#107c10', l:'Vert' },{ v:'#d83b01', l:'Orange' },
  { v:'#744da9', l:'Violet' },{ v:'#a80000', l:'Rouge' },
  { v:'#122e53', l:'Marine' },{ v:'#00b7c3', l:'Cyan' },
]
const REMINDERS = ['Aucun rappel','5 minutes avant','15 minutes avant','30 minutes avant','1 heure avant','2 heures avant','1 jour avant','1 semaine avant']

export default function PartnerPage() {
  const { partner } = useParams()
  const router = useRouter()
  const partnerStr = String(partner)

  // Fichiers
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadName, setUploadName] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [currentPrefix, setCurrentPrefix] = useState('')
  const [breadcrumbs, setBreadcrumbs] = useState<{ name: string, prefix: string }[]>([])
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ url: string, key: string, name: string, type: string } | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selecting, setSelecting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [showAdminModal, setShowAdminModal] = useState(false)
const [adminUsers, setAdminUsers] = useState<{id:string,name:string,email:string,role:string,prefix:string}[]>([])
const [newUser, setNewUser] = useState({name:'',email:'',password:'',role:'prestataire'})
const [showShareModal, setShowShareModal] = useState(false)
const [shareFile, setShareFile] = useState<{key:string,name:string,size?:number,lastModified?:string|null}|null>(null)

const [shareWithIds, setShareWithIds] = useState<string[]>([])
const [userRole, setUserRole] = useState<string>('')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Navigation
  const [mainTab, setMainTab] = useState<MainTab>('skillz')
  const [section, setSection] = useState<Section>('accueil')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Calendrier
  const [calView, setCalView] = useState<CalView>('mois')
  const [calDate, setCalDate] = useState(new Date())
  const [events, setEvents] = useState<CalEvent[]>([])
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null)
  const [newEvent, setNewEvent] = useState<Partial<CalEvent>>({ color: '#0078d4', type: 'perso', allDay: false, reminder: '15 minutes avant' })
  const [dragStartCell, setDragStartCell] = useState<{date:string,hour?:number}|null>(null)
const [dragEndCell, setDragEndCell] = useState<{date:string,hour?:number}|null>(null)
const [isCalDragging, setIsCalDragging] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const totalSize = files.filter(f => !f.isFolder).reduce((acc, f) => acc + (f.size || 0), 0)
  const totalGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2)
  const storagePercent = Math.min((totalSize / (300 * 1024 * 1024 * 1024)) * 100, 100)
  const filtered = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
  const [sharedFiles, setSharedFiles] = useState<{id:string,fileKey:string,fileName:string,sharedBy:string,publicUrl?:string}[]>([])


  useEffect(() => {
    const saved = localStorage.getItem(`favorites_${partnerStr}`)
    if (saved) setFavorites(new Set(JSON.parse(saved)))
    const savedEvents = localStorage.getItem(`events_${partnerStr}`)
    if (savedEvents) setEvents(JSON.parse(savedEvents))
  
    // Charge la liste des utilisateurs (tout le monde)
    fetch('/api/partners/users').then(r => {
      if (r.ok) r.json().then(data => setAdminUsers(data))
    })
  
    // Vérifie si admin
    fetch('/api/partners/admin').then(r => {
      if (r.ok) setUserRole('admin')
    })
  }, [partnerStr])

  async function loadFiles(prefix?: string) {
    setLoading(true)
    const p = prefix !== undefined ? prefix : currentPrefix
    const res = await fetch(`/api/partners/files${p ? `?prefix=${encodeURIComponent(p)}` : ''}`)
    if (res.status === 401) { router.push('/partners/login'); return }
    const data = await res.json()
    setFiles(data.files || [])
    setLoading(false)
  }

  useEffect(() => {
    if (section !== 'accueil') loadFiles()
  }, [section])

  useEffect(() => {
    if (section === 'accueil') loadFiles()
  }, [])

  function navigateTo(prefix: string, name: string) {
    setCurrentPrefix(prefix)
    setBreadcrumbs(prev => [...prev, { name, prefix }])
    loadFiles(prefix)
    setSearch('')
  }

  function navigateToBreadcrumb(index: number) {
    if (index === -1) { setCurrentPrefix(''); setBreadcrumbs([]); loadFiles('') }
    else {
      const crumb = breadcrumbs[index]
      setBreadcrumbs(prev => prev.slice(0, index + 1))
      setCurrentPrefix(crumb.prefix); loadFiles(crumb.prefix)
    }
    setSearch('')
  }

  function toggleFavorite(key: string) {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      localStorage.setItem(`favorites_${partnerStr}`, JSON.stringify([...next]))
      return next
    })
  }

  async function handleDownload(key: string, name: string, forceDownload = false) {
    const res = await fetch('/api/partners/download-url', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, forceDownload }),
    })
    const { url } = await res.json()
    const ext = name.split('.').pop()?.toLowerCase() || ''
    const previewable = ['mp4', 'mov', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf']
    if (!forceDownload && previewable.includes(ext)) setPreview({ url, key, name, type: ext })
    else { const a = document.createElement('a'); a.href = url; a.download = name; a.click() }
  }

  async function handleDelete(key: string) {
    if (!confirm('Supprimer ce fichier ?')) return
    await fetch('/api/partners/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) })
    setMenuOpen(null); loadFiles()
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setUploadProgress(0); setUploadName(file.name)
    const res = await fetch('/api/partners/upload-url', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type || 'application/octet-stream', metadata: { 'uploaded-by': partnerStr } }),
    })
    const { url } = await res.json()
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100)) }
      xhr.onload = () => resolve(); xhr.onerror = () => reject()
      xhr.open('PUT', url); xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream'); xhr.send(file)
    })
    setUploadProgress(100)
    setTimeout(() => { setUploading(false); setUploadProgress(0); setUploadName(''); loadFiles() }, 1000)
    e.target.value = ''
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return
    setCreatingFolder(true)
    await fetch('/api/partners/create-folder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folderName: newFolderName.trim(), currentPrefix }) })
    setCreatingFolder(false); setShowNewFolder(false); setNewFolderName(''); loadFiles()
  }

  async function loadSharedWithMe() {
    const res = await fetch('/api/partners/share')
    if (res.ok) {
      const data = await res.json()
      setSharedFiles(data.filter((s: any) => s.sharedWith.includes(partnerStr)))
    }
  }

  async function handleLogout() {
    await fetch('/api/partners/logout', { method: 'POST' }); router.push('/partners/login')
  }

  function toggleSelect(key: string) {
    setSelected(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next })
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(f => f.key)))
  }

  async function handleDownloadSelected() {
    const selectedItems = filtered.filter(f => selected.has(f.key))
    if (selectedItems.length === 0) return
    const allFiles: { key: string, name: string, zipPath: string }[] = []
    async function collectFiles(items: FileItem[], basePath = '') {
      for (const item of items) {
        if (!item.isFolder) allFiles.push({ key: item.key, name: item.name, zipPath: basePath + item.name })
        else {
          const res = await fetch(`/api/partners/files?prefix=${encodeURIComponent(item.key)}`)
          const data = await res.json()
          await collectFiles(data.files || [], basePath + item.name + '/')
        }
      }
    }
    await collectFiles(selectedItems)
    if (allFiles.length === 0) return
    if (allFiles.length === 1) { await handleDownload(allFiles[0].key, allFiles[0].name, true); return }
    const zip = new JSZip()
    for (const file of allFiles) {
      const res = await fetch('/api/partners/download-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: file.key, forceDownload: true }) })
      const { url } = await res.json()
      zip.file(file.zipPath, await fetch(url).then(r => r.blob()))
    }
    const content = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(content); a.download = 'upskillz-fichiers.zip'; a.click()
  }

  async function handleDeleteSelected() {
    if (!confirm(`Supprimer ${selected.size} élément(s) ?`)) return
    for (const key of selected) await fetch('/api/partners/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) })
    setSelected(new Set()); loadFiles()
  }

  // ── CALENDRIER ──
  function saveEvents(evts: CalEvent[]) {
    setEvents(evts)
    localStorage.setItem(`events_${partnerStr}`, JSON.stringify(evts))
  }

  function openModal(date: string, startTime?: string, endTime?: string, endDate?: string) {
    setEditingEvent(null)
    setNewEvent({
      color: '#0078d4', type: 'perso', allDay: !startTime,
      date, endDate: endDate || date, time: startTime,
      endTime: endTime || (startTime ? `${String(parseInt(startTime.split(':')[0]) + 1).padStart(2, '0')}:00` : undefined),
      reminder: '15 minutes avant'
    })
    setShowEventModal(true)
  }

  function saveEvent() {
    if (!newEvent.title || !newEvent.date) return
    const evt: CalEvent = {
      id: editingEvent?.id || Date.now().toString(),
      title: newEvent.title!, date: newEvent.date!, endDate: newEvent.endDate || newEvent.date,
      time: newEvent.allDay ? undefined : newEvent.time,
      endTime: newEvent.allDay ? undefined : newEvent.endTime,
      color: newEvent.color || '#0078d4', type: newEvent.type || 'perso',
      location: newEvent.location, description: newEvent.description,
      allDay: newEvent.allDay, reminder: newEvent.reminder,
    }
    if (editingEvent) saveEvents(events.map(e => e.id === editingEvent.id ? evt : e))
    else saveEvents([...events, evt])
    closeModal()
  }

  function closeModal() {
    setShowEventModal(false); setEditingEvent(null)
    setNewEvent({ color: '#0078d4', type: 'perso', allDay: false, reminder: '15 minutes avant' })
  }

  function deleteEvent(id: string) {
    saveEvents(events.filter(e => e.id !== id))
    closeModal()
  }

  function getMonthDays(date: Date) {
    const year = date.getFullYear(), month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    let startDow = firstDay.getDay() - 1; if (startDow < 0) startDow = 6
    const days: (Date | null)[] = []
    for (let i = 0; i < startDow; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
    return days
  }

  function getWeekDays(date: Date) {
    const day = date.getDay()
    const monday = new Date(date)
    monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1))
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d })
  }

  function formatDateKey(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  function getEventsForDay(dk: string) {
    return events.filter(e => { const s = e.date, en = e.endDate || e.date; return dk >= s && dk <= en }).sort((a, b) => (a.time || '').localeCompare(b.time || ''))
  }

  // Drag-to-create
  function getDragRange() {
    if (!dragStartCell || !dragEndCell) return null
    if (dragStartCell.hour !== undefined && dragEndCell.hour !== undefined && dragStartCell.date === dragEndCell.date) {
      const sh = Math.min(dragStartCell.hour, dragEndCell.hour)
      const eh = Math.max(dragStartCell.hour, dragEndCell.hour)
      return { startDate: dragStartCell.date, endDate: dragStartCell.date, startHour: sh, endHour: eh + 1 }
    }
    const a = dragStartCell.date < dragEndCell.date ? dragStartCell.date : dragEndCell.date
    const b = dragStartCell.date < dragEndCell.date ? dragEndCell.date : dragStartCell.date
    return { startDate: a, endDate: b, startHour: undefined, endHour: undefined }
  }

  function isCellHighlighted(date: string, hour?: number): boolean {
    if (!isCalDragging) return false
    const r = getDragRange(); if (!r) return false
    if (hour !== undefined && r.startHour !== undefined)
      return date === r.startDate && hour >= r.startHour && hour < (r.endHour || r.startHour + 1)
    return date >= r.startDate && date <= r.endDate
  }

  function finishCalDrag() {
    if (!isCalDragging) return
    const r = getDragRange()
    if (r) {
      const sh = r.startHour !== undefined ? `${String(r.startHour).padStart(2, '0')}:00` : undefined
      const eh = r.endHour !== undefined ? `${String(r.endHour).padStart(2, '0')}:00` : undefined
      openModal(r.startDate, sh, eh, r.startDate !== r.endDate ? r.endDate : undefined)
    }
    setIsCalDragging(false); setDragStartCell(null); setDragEndCell(null)
  }

  const today = formatDateKey(new Date())
  const recentFiles = [...files].filter(f => !f.isFolder && f.lastModified).sort((a, b) => new Date(b.lastModified!).getTime() - new Date(a.lastModified!).getTime()).slice(0, 6)
  const todayEvents = getEventsForDay(today)
  const upcomingEvents = events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5)
  const sectionLabels: Record<Section, string> = { 'accueil': 'Accueil', 'mes-skillz': 'Mes Skillz', 'partages': 'Skillz Partagés', 'favoris': 'Favoris', 'corbeille': 'Corbeille' }
  const chk = (key: string) => ({ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${selected.has(key) ? navy : '#d1d5db'}`, background: selected.has(key) ? navy : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 as const })

  async function loadAdminUsers() {
    const res = await fetch('/api/partners/admin')
    if (res.ok) {
      const data = await res.json()
      setAdminUsers(data)
    }
  }
  
  async function createUser() {
    if (!newUser.name || !newUser.email || !newUser.password) return
    const res = await fetch('/api/partners/admin', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ action: 'create', user: newUser })
    })
    if (res.ok) { setNewUser({name:'',email:'',password:'',role:'prestataire'}); loadAdminUsers() }
    else { const d = await res.json(); alert(d.error) }
  }
  
  async function deleteUser(id: string) {
    if (!confirm('Supprimer cet utilisateur ?')) return
    await fetch('/api/partners/admin', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ action: 'delete', user: { id } })
    })
    loadAdminUsers()
  }
  
  async function handleShare() {
    if (!shareFile) return
    const res = await fetch('/api/partners/share', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ fileKey: shareFile.key, fileName: shareFile.name, sharedWith: shareWithIds, fileSize: shareFile.size, fileLastModified: shareFile.lastModified })

    })
    if (res.ok) { setShowShareModal(false); setShareFile(null); setShareWithIds([]) }
  }
  
  async function copyPublicLink(key: string, name: string) {
    const res = await fetch('/api/partners/download-url', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ key, forceDownload: false })
    })
    const { url } = await res.json()
    await navigator.clipboard.writeText(url)
    alert('Lien copié !')
  }

  return (
    <div style={{ ...font, minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', position: 'relative' }}
    onClick={() => setMenuOpen(null)}
    onMouseUp={finishCalDrag}
    onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
    onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false) }}
    onDrop={async e => {
        e.preventDefault(); setIsDragging(false)
        for (const file of Array.from(e.dataTransfer.files)) {
          setUploading(true); setUploadProgress(0); setUploadName(file.name)
          const res = await fetch('/api/partners/upload-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: file.name, contentType: file.type || 'application/octet-stream', metadata: { 'uploaded-by': partnerStr } }) })
          const { url } = await res.json()
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            xhr.upload.onprogress = (e) => { if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100)) }
            xhr.onload = () => resolve(); xhr.onerror = () => reject()
            xhr.open('PUT', url); xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream'); xhr.send(file)
          })
        }
        setUploading(false); setUploadProgress(0); setUploadName(''); loadFiles()
      }}
    >
      {/* TOPBAR */}
      <header style={{ flexShrink: 0, background: 'linear-gradient(135deg, rgba(8,14,26,0.85) 0%, rgba(18,46,83,0.80) 100%), url(/bgheader.png) center/cover no-repeat #0d1829', zIndex: 10 }}>
        <div style={{ padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex', padding: '4px' }}>
              <Menu size={18} />
            </button>
            <Image src="/logo.png" alt="UPSKILLZ" width={110} height={30} style={{ height: '30px', width: 'auto' }} />
            <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.2)' }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.15em' }}>ESPACE PARTENAIRES</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
  onClick={e => { e.stopPropagation(); console.log('click avatar', userRole, showAdminModal); if (userRole === 'admin') { setShowAdminModal(true); loadAdminUsers() } }}

  style={{ width: '32px', height: '32px', borderRadius: '50%', background: gold, display: 'flex', alignItems: 'center', justifyContent: 'center', color: navy, fontSize: '11px', fontWeight: 700, cursor: userRole === 'admin' ? 'pointer' : 'default', position: 'relative' }}
  title={userRole === 'admin' ? 'Administration' : ''}>
  {partnerStr.slice(0, 2).toUpperCase()}
  {userRole === 'admin' && <span style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', border: '1.5px solid #0d1829' }} />}
</div>
<span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: 500, textTransform: 'capitalize' }}>{partnerStr}</span>
            </div>
            <button onClick={handleLogout} style={{ border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', padding: '5px 14px', background: 'transparent', color: 'rgba(255,255,255,0.65)', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Déconnexion</button>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* SIDEBAR */}
        {sidebarOpen && (
          <aside style={{ width: '220px', flexShrink: 0, background: '#fff', borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>

            {/* Onglets principaux */}
            <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
              {([['skillz', '📁', 'Skillz'], ['calendrier', '📅', 'Calendrier']] as [MainTab, string, string][]).map(([id, icon, label]) => (
                <button key={id} onClick={() => { setMainTab(id); if (id === 'skillz') setSection('accueil') }}
                  style={{ flex: 1, padding: '12px 4px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: mainTab === id ? 700 : 400, color: mainTab === id ? navy : '#6b7280', borderBottom: mainTab === id ? `2px solid ${gold}` : '2px solid transparent', fontFamily: 'inherit' }}>
                  {icon} {label}
                </button>
              ))}
            </div>

            {mainTab === 'skillz' ? (
              <>
                <div style={{ padding: '12px' }}>
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', background: navy, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <Upload size={15} />{uploading ? `${uploadProgress}%` : 'Envoyer'}
                  </button>
                  <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleUpload} />
                </div>

                <nav style={{ flex: 1, padding: '0 8px' }}>
                  {([
                    ['accueil', <Home size={15} />, 'Accueil'],
                    ['mes-skillz', <HardDrive size={15} />, 'Mes Skillz'],
                    ['partages', <Share2 size={15} />, 'Skillz Partagés'],
                    ['favoris', <Star size={15} />, 'Favoris'],
                    ['corbeille', <Trash2 size={15} />, 'Corbeille'],
                  ] as [Section, React.ReactNode, string][]).map(([id, icon, label]) => (
                    <button key={id} onClick={() => { setSection(id); setBreadcrumbs([]); setCurrentPrefix(''); setSearch(''); if (id === 'partages') loadSharedWithMe() }}

                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', border: 'none', background: section === id ? '#eff6ff' : 'transparent', color: id === 'corbeille' && section !== id ? '#ef4444' : section === id ? navy : '#374151', fontSize: '13px', fontWeight: section === id ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' as const, marginBottom: '2px' }}>
                      <span style={{ color: section === id ? gold : id === 'corbeille' ? '#ef4444' : '#9ca3af' }}>{icon}</span>
                      {label}
                    </button>
                  ))}
                </nav>

                <div style={{ padding: '12px', borderTop: '1px solid #f1f5f9' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: '6px' }}>STOCKAGE</p>
                  <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden', marginBottom: '4px' }}>
                    <div style={{ height: '100%', background: `linear-gradient(90deg, ${navy}, ${gold})`, width: `${Math.max(storagePercent, 0.5)}%`, borderRadius: '2px' }} />
                  </div>
                  <p style={{ fontSize: '10px', color: '#9ca3af' }}>{totalGB} GB / 300 GB</p>
                </div>
              </>
            ) : (
              <>
                {/* Nav calendrier */}
                <div style={{ padding: '12px' }}>
                <button onClick={() => openModal(today)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', background: navy, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <Plus size={15} />Nouvel événement
                  </button>
                </div>

                <nav style={{ flex: 1, padding: '0 8px' }}>
                  {([['mois', 'Vue mois'], ['semaine', 'Vue semaine']] as [CalView, string][]).map(([id, label]) => (
                    <button key={id} onClick={() => setCalView(id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', border: 'none', background: calView === id ? '#eff6ff' : 'transparent', color: calView === id ? navy : '#374151', fontSize: '13px', fontWeight: calView === id ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' as const, marginBottom: '2px' }}>
                      <span style={{ color: calView === id ? gold : '#9ca3af' }}>
                        {id === 'mois' ? <Calendar size={15} /> : <List size={15} />}
                      </span>
                      {label}
                    </button>
                  ))}

                  {/* Légende types */}
                  <div style={{ padding: '12px 12px 0', borderTop: '1px solid #f1f5f9', marginTop: '8px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: '8px' }}>CALENDRIERS</p>
                    {[['perso', navy, 'Personnel'], ['partage', '#22c55e', 'Partagé']].map(([type, color, label]) => (
                      <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: color }} />
                        <span style={{ fontSize: '12px', color: '#374151' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </nav>
              </>
            )}
          </aside>
        )}

        {/* MAIN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* ── CALENDRIER VIEW ── */}
          {mainTab === 'calendrier' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Cal toolbar */}
              <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={() => { const d = new Date(calDate); calView === 'mois' ? d.setMonth(d.getMonth() - 1) : d.setDate(d.getDate() - 7); setCalDate(d) }}
                    style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: navy, minWidth: '180px', textAlign: 'center' }}>
                    {calView === 'mois' ? `${MONTHS[calDate.getMonth()]} ${calDate.getFullYear()}` : `Semaine du ${getWeekDays(calDate)[0].getDate()} ${MONTHS[getWeekDays(calDate)[0].getMonth()]}`}
                  </span>
                  <button onClick={() => { const d = new Date(calDate); calView === 'mois' ? d.setMonth(d.getMonth() + 1) : d.setDate(d.getDate() + 7); setCalDate(d) }}
                    style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <ChevronRight size={16} />
                  </button>
                  <button onClick={() => setCalDate(new Date())}
                    style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}>
                    Aujourd'hui
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {([['mois', 'Mois'], ['semaine', 'Semaine']] as [CalView, string][]).map(([v, l]) => (
                    <button key={v} onClick={() => setCalView(v)}
                      style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', background: calView === v ? navy : '#fff', color: calView === v ? '#fff' : '#374151', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vue MOIS */}
              {calView === 'mois' && (
  <div style={{ flex: 1, overflow: 'auto' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
      {DAYS.map(d => <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em' }}>{d}</div>)}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '120px' }}>
      {getMonthDays(calDate).map((day, i) => {
        const key = day ? formatDateKey(day) : ''
        const dayEvents = day ? getEventsForDay(key) : []
        const isToday = key === today
        const isHl = isCalDragging && day && isCellHighlighted(key)
        return (
          <div key={i}
            style={{ borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '4px', background: isHl ? '#dbeafe' : day ? '#fff' : '#f8fafc', cursor: day ? 'crosshair' : 'default', userSelect: 'none' }}
            onMouseDown={() => { if (!day) return; setIsCalDragging(true); setDragStartCell({ date: key }); setDragEndCell({ date: key }) }}
            onMouseEnter={() => { if (isCalDragging && day) setDragEndCell({ date: key }) }}
          >
            {day && (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '2px' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: isToday ? navy : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: isToday ? 700 : 400, color: isToday ? '#fff' : '#374151' }}>{day.getDate()}</span>
                </div>
                {dayEvents.slice(0, 3).map(evt => (
                  <div key={evt.id}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); setEditingEvent(evt); setNewEvent(evt); setShowEventModal(true) }}
                    style={{ background: evt.color, color: '#fff', borderRadius: '3px', padding: '1px 5px', fontSize: '11px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                    {!evt.allDay && evt.time && <span style={{ opacity: 0.8, marginRight: '3px' }}>{evt.time}</span>}{evt.title}
                  </div>
                ))}
                {dayEvents.length > 3 && <div style={{ fontSize: '10px', color: '#9ca3af' }}>+{dayEvents.length - 3} autres</div>}
              </>
            )}
          </div>
        )
      })}
    </div>
  </div>
)}

              {/* Vue SEMAINE */}
              {calView === 'semaine' && (
  <div style={{ flex: 1, overflow: 'auto' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', minWidth: '800px' }}>
      <div style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9' }} />
      {getWeekDays(calDate).map((day, i) => {
        const key = formatDateKey(day); const isToday = key === today
        return (
          <div key={i} style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600 }}>{DAYS[i]}</div>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isToday ? navy : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px auto 0' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: isToday ? '#fff' : '#374151' }}>{day.getDate()}</span>
            </div>
          </div>
        )
      })}
      {Array.from({ length: 24 }, (_, h) => (
        <React.Fragment key={h}>
          <div style={{ borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f8fafc', height: '48px', display: 'flex', alignItems: 'flex-start', padding: '3px 6px 0' }}>
            <span style={{ fontSize: '10px', color: '#9ca3af' }}>{h === 0 ? '' : String(h).padStart(2, '0') + ':00'}</span>
          </div>
          {getWeekDays(calDate).map((day, di) => {
            const key = formatDateKey(day)
            const hEvs = getEventsForDay(key).filter(e => e.time && parseInt(e.time.split(':')[0]) === h)
            const isHl = isCalDragging && isCellHighlighted(key, h)
            return (
              <div key={di}
                style={{ borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f8fafc', height: '48px', padding: '1px', background: isHl ? '#dbeafe' : 'transparent', cursor: 'crosshair', userSelect: 'none', position: 'relative' }}
                onMouseDown={e => { e.preventDefault(); setIsCalDragging(true); setDragStartCell({ date: key, hour: h }); setDragEndCell({ date: key, hour: h }) }}
                onMouseEnter={() => { if (isCalDragging) setDragEndCell({ date: key, hour: h }) }}
              >
                {hEvs.map(evt => (
                  <div key={evt.id}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); setEditingEvent(evt); setNewEvent(evt); setShowEventModal(true) }}
                    style={{ background: evt.color, color: '#fff', borderRadius: '3px', padding: '1px 5px', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', marginBottom: '1px' }}>
                    {evt.title}
                  </div>
                ))}
              </div>
            )
          })}
        </React.Fragment>
      ))}
    </div>
  </div>
)}

</div>
)}

{/* ── SKILLZ VIEW ── */}
{mainTab === 'skillz' && (
            <>
              {/* ACTION BAR */}
              {section !== 'accueil' && (
                <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
                  <div style={{ padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: navy }}>{sectionLabels[section]}</span>
                      {section === 'mes-skillz' && (
                        <>
                          <div style={{ width: '1px', height: '16px', background: '#e5e7eb', margin: '0 4px' }} />
                          <button onClick={() => setShowNewFolder(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                            <FolderPlus size={13} />Nouveau dossier
                          </button>
                          <button onClick={() => { setSelecting(!selecting); setSelected(new Set()) }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: selecting ? '#f1f5f9' : '#fff', color: selecting ? navy : '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                            <Check size={13} />{selecting ? 'Annuler' : 'Sélectionner'}
                          </button>
                        </>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ position: 'relative' }}>
                        <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '30px', paddingRight: '10px', height: '34px', width: '200px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', color: '#374151', background: '#f9fafb', outline: 'none', fontFamily: 'inherit' }} />
                      </div>
                      <button onClick={() => setView('grid')} style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid #e5e7eb', background: view === 'grid' ? navy : '#fff', color: view === 'grid' ? '#fff' : '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><LayoutGrid size={15} /></button>
                      <button onClick={() => setView('list')} style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid #e5e7eb', background: view === 'list' ? navy : '#fff', color: view === 'list' ? '#fff' : '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><List size={15} /></button>
                      <a href="/UPSKILLZ.dmg" download style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none' }}>
                        <Download size={13} /> App Mac
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* SELECTION BAR */}
              {selecting && selected.size > 0 && (
                <div style={{ background: navy, padding: '8px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>{selected.size} sélectionné(s)</span>
                    <button onClick={toggleSelectAll} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
                      {selected.size === filtered.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleDownloadSelected} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: gold, color: navy, border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <Download size={13} /> Télécharger ({selected.size})
                    </button>
                    <button onClick={handleDeleteSelected} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <Trash2 size={13} /> Supprimer
                    </button>
                  </div>
                </div>
              )}

              {/* UPLOAD PROGRESS */}
              {uploading && (
                <div style={{ background: navy, padding: '8px 24px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#fff', fontSize: '11px', whiteSpace: 'nowrap' }}>Envoi de {uploadName}</span>
                    <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: gold, borderRadius: '2px', width: `${uploadProgress}%`, transition: 'width 0.2s' }} />
                    </div>
                    <span style={{ color: gold, fontSize: '11px', fontWeight: 700 }}>{uploadProgress}%</span>
                  </div>
                </div>
              )}

              {/* BREADCRUMB */}
              {section !== 'accueil' && (
                <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
                  <div style={{ padding: '6px 24px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <span onClick={() => navigateToBreadcrumb(-1)} style={{ color: navy, fontWeight: 600, cursor: 'pointer' }}>{sectionLabels[section]}</span>
                    {breadcrumbs.map((crumb, i) => (
                      <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ChevronRight size={11} color="#d1d5db" />
                        <span onClick={() => navigateToBreadcrumb(i)} style={{ color: i === breadcrumbs.length - 1 ? '#374151' : navy, fontWeight: i === breadcrumbs.length - 1 ? 400 : 600, cursor: i === breadcrumbs.length - 1 ? 'default' : 'pointer' }}>{crumb.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── ACCUEIL ── */}
              {section === 'accueil' && (
                <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>

                  {/* Salutation */}
                  <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: navy, marginBottom: '4px' }}>
                      Bonjour, {partnerStr.charAt(0).toUpperCase() + partnerStr.slice(1)} 👋
                    </h1>
                    <p style={{ fontSize: '13px', color: '#6b7280' }}>
                      {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>

                    {/* Colonne gauche */}
                    <div>
                      {/* Stats */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                        {[
                          { label: 'Fichiers', value: files.filter(f => !f.isFolder).length, icon: <File size={18} />, color: '#3b82f6' },
                          { label: 'Dossiers', value: files.filter(f => f.isFolder).length, icon: <Folder size={18} />, color: gold },
                          { label: 'Favoris', value: favorites.size, icon: <Star size={18} />, color: '#f97316' },
                        ].map((stat, i) => (
                          <div key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                              {stat.icon}
                            </div>
                            <div>
                              <p style={{ fontSize: '22px', fontWeight: 700, color: navy }}>{stat.value}</p>
                              <p style={{ fontSize: '11px', color: '#9ca3af' }}>{stat.label}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Fichiers récents */}
                      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={15} color={gold} />
                            <span style={{ fontSize: '14px', fontWeight: 700, color: navy }}>Fichiers récents</span>
                          </div>
                          <button onClick={() => setSection('mes-skillz')} style={{ fontSize: '12px', color: navy, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>Voir tout</button>
                        </div>
                        {recentFiles.length === 0 ? (
                          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>Aucun fichier récent</div>
                        ) : (
                          recentFiles.map((file, i) => {
                            const { Icon, bg, color } = getFileType(file.name)
                            return (
                              <div key={file.key}
                                onClick={() => handleDownload(file.key, file.name)}
                                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px', borderBottom: i < recentFiles.length - 1 ? '1px solid #f8fafc' : 'none', cursor: 'pointer' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                              >
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <Icon size={15} color={color} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ fontSize: '13px', fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                                  <p style={{ fontSize: '11px', color: '#9ca3af' }}>{formatSize(file.size)} · {file.lastModified ? new Date(file.lastModified).toLocaleDateString('fr-FR') : ''}</p>
                                </div>
                                {favorites.has(file.key) && <Star size={12} color={gold} fill={gold} />}
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>

                    {/* Colonne droite — Agenda */}
                    <div>
                      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={15} color={gold} />
                            <span style={{ fontSize: '14px', fontWeight: 700, color: navy }}>Agenda</span>
                          </div>
                          <button onClick={() => setMainTab('calendrier')} style={{ fontSize: '12px', color: navy, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>Voir calendrier</button>
                        </div>

                        {/* Aujourd'hui */}
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                          <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: '8px' }}>AUJOURD'HUI</p>
                          {todayEvents.length === 0 ? (
                            <p style={{ fontSize: '12px', color: '#9ca3af' }}>Aucun événement</p>
                          ) : (
                            todayEvents.map(evt => (
                              <div key={evt.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <div style={{ width: '3px', height: '28px', borderRadius: '2px', background: evt.color, flexShrink: 0 }} />
                                <div>
                                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>{evt.title}</p>
                                  {evt.time && <p style={{ fontSize: '10px', color: '#9ca3af' }}>{evt.time}{evt.endTime ? ` → ${evt.endTime}` : ''}</p>}
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* À venir */}
                        <div style={{ padding: '12px 16px' }}>
                          <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: '8px' }}>À VENIR</p>
                          {upcomingEvents.filter(e => e.date !== today).length === 0 ? (
                            <p style={{ fontSize: '12px', color: '#9ca3af' }}>Aucun événement à venir</p>
                          ) : (
                            upcomingEvents.filter(e => e.date !== today).map(evt => (
                              <div key={evt.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <div style={{ width: '36px', flexShrink: 0, textAlign: 'center' }}>
                                  <p style={{ fontSize: '16px', fontWeight: 700, color: navy }}>{parseInt(evt.date.split('-')[2])}</p>
                                  <p style={{ fontSize: '9px', color: '#9ca3af', marginTop: '-2px' }}>{MONTHS[parseInt(evt.date.split('-')[1]) - 1].slice(0, 3)}</p>
                                </div>
                                <div style={{ flex: 1, borderLeft: `3px solid ${evt.color}`, paddingLeft: '8px' }}>
                                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>{evt.title}</p>
                                  {evt.time && <p style={{ fontSize: '10px', color: '#9ca3af' }}>{evt.time}</p>}
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9' }}>
                          <button
onClick={() => openModal(today)}
style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: navy, color: '#fff', border: 'none', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            <Plus size={13} /> Nouvel événement
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── FILES VIEW ── */}
              {section === 'partages' && (
  <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
    {sharedFiles.length === 0 ? (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px' }}>
        <Share2 size={40} color="#d1d5db" />
        <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Aucun fichier partagé avec vous</p>
        <p style={{ color: '#94a3b8', fontSize: '12px' }}>Les fichiers partagés par d'autres apparaîtront ici</p>
      </div>
    ) : (
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        {sharedFiles.map((sf, i) => (
          <div key={sf.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: i < sharedFiles.length - 1 ? '1px solid #f8fafc' : 'none' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Share2 size={16} color="#0078d4" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
  <p style={{ fontSize: '13px', fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 2px' }}>{sf.fileName}</p>
  <div style={{ display: 'flex', gap: '12px' }}>
    <span style={{ fontSize: '11px', color: '#9ca3af' }}>{(sf as any).fileSize ? formatSize((sf as any).fileSize) : '—'}</span>
    <span style={{ fontSize: '11px', color: '#9ca3af' }}>{(sf as any).fileLastModified ? new Date((sf as any).fileLastModified).toLocaleDateString('fr-FR') : '—'}</span>
    <span style={{ fontSize: '11px', color: gold, fontWeight: 500 }}>↑ {adminUsers.find(u => u.id === sf.sharedBy)?.name || sf.sharedBy}</span>
  </div>
</div>
            <div style={{ display: 'flex', gap: '6px' }}>
  <button onClick={() => handleDownload(sf.fileKey, sf.fileName, false)}
    style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
    👁 Ouvrir
  </button>
  <button onClick={() => handleDownload(sf.fileKey, sf.fileName, true)}
    style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
    <Download size={13} />
  </button>
</div>
          </div>
        ))}
      </div>
    )}
  </div>
)}

              {section !== 'accueil' && section !== 'partages' && (
  <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
                  {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px', color: '#9ca3af' }}>
                      <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                      <span style={{ fontSize: '14px' }}>Chargement...</span>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <File size={28} color="#cbd5e1" />
                      </div>
                      <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Dossier vide</p>
                    </div>
                  ) : view === 'grid' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                      {filtered.map(file => {
                        const { Icon, bg, color } = file.isFolder ? { Icon: Folder, bg: '#e8f0fb', color: '#3b82f6' } : getFileType(file.name)
                        const isFav = favorites.has(file.key)
                        return (
                          <div key={file.key}
                            onClick={() => { if (selecting) { toggleSelect(file.key); return } file.isFolder ? navigateTo(file.key!, file.name) : handleDownload(file.key, file.name) }}
                            style={{ background: selected.has(file.key) ? '#eff6ff' : '#fff', border: `1px solid ${selected.has(file.key) ? navy : '#e5e7eb'}`, borderRadius: '12px', padding: '16px 12px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s', position: 'relative' }}
                            onMouseEnter={e => { if (!selected.has(file.key)) { (e.currentTarget as HTMLElement).style.borderColor = gold; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(212,175,55,0.15)' } }}
                            onMouseLeave={e => { if (!selected.has(file.key)) { (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' } }}
                          >
                            {selecting && (
                              <div style={{ position: 'absolute', top: '6px', left: '6px', ...chk(file.key) }}>
                                {selected.has(file.key) && <Check size={11} color="#fff" />}
                              </div>
                            )}
                            {!selecting && (
                              <button onClick={e => { e.stopPropagation(); toggleFavorite(file.key) }} style={{ position: 'absolute', top: '6px', left: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                                <Star size={11} color={isFav ? gold : '#d1d5db'} fill={isFav ? gold : 'none'} />
                              </button>
                            )}
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                              <Icon size={22} color={color} />
                            </div>
                            <p style={{ fontSize: '11px', fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }}>{file.name}</p>
                            <p style={{ fontSize: '10px', color: '#9ca3af' }}>{file.isFolder ? 'Dossier' : formatSize(file.size)}</p>
                            {!file.isFolder && file.lastModified && <p style={{ fontSize: '9px', color: '#c4c9d4', marginTop: '2px' }}>{new Date(file.lastModified).toLocaleDateString('fr-FR')}</p>}
                            {!file.isFolder && file.uploadedBy && <p style={{ fontSize: '9px', color: gold, marginTop: '2px', fontWeight: 600 }}>↑ {file.uploadedBy}</p>}
                            {!file.isFolder && !selecting && (
                              <button onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === file.key ? null : file.key) }} style={{ position: 'absolute', top: '6px', right: '6px', width: '22px', height: '22px', borderRadius: '4px', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9ca3af' }}>
                                <MoreHorizontal size={13} />
                              </button>
                            )}
                            {menuOpen === file.key && (
                              <div style={{ position: 'absolute', top: '28px', right: '6px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '160px', textAlign: 'left' }}>
                                <button onClick={e => { e.stopPropagation(); handleDownload(file.key, file.name, true) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: '#374151', fontFamily: 'inherit' }}><Download size={13} /> Télécharger</button>
                                <button onClick={e => { e.stopPropagation(); setShareFile({ key: file.key, name: file.name, size: file.size, lastModified: file.lastModified })
; setShareWithIds([]); setShowShareModal(true); setMenuOpen(null) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: '#374151', fontFamily: 'inherit' }}>
  <Share2 size={13} /> Partager
</button>
                                <button onClick={e => { e.stopPropagation(); toggleFavorite(file.key); setMenuOpen(null) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: '#374151', fontFamily: 'inherit' }}><Star size={13} /> {isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}</button>
                                <button onClick={e => { e.stopPropagation(); handleDelete(file.key) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: '#ef4444', fontFamily: 'inherit' }}><Trash2 size={13} /> Supprimer</button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: selecting ? '32px 1fr 100px 120px 80px 80px' : '1fr 100px 120px 80px 80px', padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                        {selecting && (
                          <div onClick={toggleSelectAll} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${selected.size === filtered.length ? navy : '#d1d5db'}`, background: selected.size === filtered.length ? navy : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {selected.size === filtered.length && <Check size={11} color="#fff" />}
                            </div>
                          </div>
                        )}
                        {['NOM', 'TAILLE', 'MODIFIÉ', 'PAR', ''].map((h, i) => (
                          <div key={i} style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em' }}>{h}</div>
                        ))}
                      </div>
                      {filtered.map((file, i) => {
                        const { Icon, bg, color } = file.isFolder ? { Icon: Folder, bg: '#e8f0fb', color: '#3b82f6' } : getFileType(file.name)
                        return (
                          <div key={file.key}
                            onClick={() => { if (selecting) { toggleSelect(file.key); return } file.isFolder ? navigateTo(file.key!, file.name) : handleDownload(file.key, file.name) }}
                            style={{ display: 'grid', gridTemplateColumns: selecting ? '32px 1fr 100px 120px 80px 80px' : '1fr 100px 120px 80px 80px', padding: '10px 16px', alignItems: 'center', cursor: 'pointer', background: selected.has(file.key) ? '#eff6ff' : 'transparent', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none' }}
                            onMouseEnter={e => { if (!selected.has(file.key)) (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
                            onMouseLeave={e => { if (!selected.has(file.key)) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                          >
                            {selecting && <div style={chk(file.key)}>{selected.has(file.key) && <Check size={11} color="#fff" />}</div>}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icon size={16} color={color} />
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                              {favorites.has(file.key) && <Star size={10} color={gold} fill={gold} />}
                            </div>
                            <div style={{ fontSize: '13px', color: '#6b7280' }}>{file.isFolder ? '—' : formatSize(file.size)}</div>
                            <div style={{ fontSize: '13px', color: '#6b7280' }}>{file.lastModified ? new Date(file.lastModified).toLocaleDateString('fr-FR') : '—'}</div>
                            <div style={{ fontSize: '12px', color: gold, fontWeight: 600 }}>{file.uploadedBy || '—'}</div>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              {!file.isFolder && !selecting && (
                                <button onClick={e => { e.stopPropagation(); handleDownload(file.key, file.name, true) }} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}>
                                  <Download size={13} />
                                </button>
                              )}
                              {!selecting && (
                                <div onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === file.key ? null : file.key) }} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280', position: 'relative' }}>
                                  <MoreHorizontal size={13} />
                                  {menuOpen === file.key && (
                                    <div style={{ position: 'absolute', top: '30px', right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '160px', textAlign: 'left' }}>
                                      {!file.isFolder && <button onClick={e => { e.stopPropagation(); handleDownload(file.key, file.name, true) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: '#374151', fontFamily: 'inherit' }}><Download size={13} /> Télécharger</button>}
                                      <button onClick={e => { e.stopPropagation(); toggleFavorite(file.key); setMenuOpen(null) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: '#374151', fontFamily: 'inherit' }}><Star size={13} /> {favorites.has(file.key) ? 'Retirer' : 'Ajouter aux favoris'}</button>
                                      <button onClick={e => { e.stopPropagation(); handleDelete(file.key) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: '#ef4444', fontFamily: 'inherit' }}><Trash2 size={13} /> Supprimer</button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODAL NOUVEAU DOSSIER */}
      {showNewFolder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowNewFolder(false)}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '380px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>Nouveau dossier</h3>
              <button onClick={() => setShowNewFolder(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={18} /></button>
            </div>
            <input autoFocus placeholder="Nom du dossier" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateFolder()} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', outline: 'none', color: navy, fontFamily: 'inherit', marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowNewFolder(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', color: navy, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
              <button onClick={handleCreateFolder} disabled={creatingFolder || !newFolderName.trim()} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: navy, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !newFolderName.trim() ? 0.5 : 1 }}>
                {creatingFolder ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ÉVÉNEMENT */}
      {showEventModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={closeModal}>
          <div style={{ background: '#fff', borderRadius: '4px', width: '560px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
      
            {/* Ribbon coloré */}
            <div style={{ background: newEvent.color || '#0078d4', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={saveEvent} disabled={!newEvent.title || !newEvent.date}
                  style={{ padding: '5px 16px', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: '3px', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !newEvent.title || !newEvent.date ? 0.5 : 1 }}>
                  💾 Enregistrer
                </button>
                <button onClick={closeModal}
                  style={{ padding: '5px 14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '3px', color: '#fff', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Fermer
                </button>
                {editingEvent && (
                  <button onClick={() => deleteEvent(editingEvent.id)}
                    style={{ padding: '5px 14px', background: 'rgba(180,30,30,0.35)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '3px', color: '#fff', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    🗑 Supprimer
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                {EVENT_COLORS.map(c => (
                  <button key={c.v} title={c.l} onClick={() => setNewEvent(p => ({ ...p, color: c.v }))}
                    style={{ width: '18px', height: '18px', borderRadius: '50%', background: c.v, border: newEvent.color === c.v ? '2.5px solid #fff' : '2px solid rgba(255,255,255,0.3)', cursor: 'pointer', outline: 'none' }} />
                ))}
                <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.75)', marginLeft: '4px', display: 'flex' }}><X size={16} /></button>
              </div>
            </div>
      
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '0' }}>
              {/* Titre */}
              <input value={newEvent.title || ''} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))}
                placeholder="Ajouter un titre" autoFocus
                style={{ border: 'none', borderBottom: `2px solid ${newEvent.color || '#0078d4'}`, padding: '6px 0', fontSize: '20px', fontWeight: 400, outline: 'none', fontFamily: 'inherit', color: '#111827', marginBottom: '16px', background: 'transparent', width: '100%' }} />
      
              {/* Date / heure */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <Clock size={16} color="#6b7280" style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const, flex: 1 }}>
                  <input type="date" value={newEvent.date || ''} onChange={e => setNewEvent(p => ({ ...p, date: e.target.value, endDate: p.endDate || e.target.value }))}
                    style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '5px 8px', fontSize: '12px', outline: 'none', fontFamily: 'inherit', color: '#111827' }} />
                  {!newEvent.allDay && <>
                    <input type="time" value={newEvent.time || ''} onChange={e => setNewEvent(p => ({ ...p, time: e.target.value }))}
                      style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '5px 8px', fontSize: '12px', outline: 'none', fontFamily: 'inherit', color: '#111827' }} />
                    <span style={{ color: '#9ca3af', fontSize: '12px' }}>→</span>
                    <input type="time" value={newEvent.endTime || ''} onChange={e => setNewEvent(p => ({ ...p, endTime: e.target.value }))}
                      style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '5px 8px', fontSize: '12px', outline: 'none', fontFamily: 'inherit', color: '#111827' }} />
                    <span style={{ color: '#9ca3af', fontSize: '12px' }}>–</span>
                    <input type="date" value={newEvent.endDate || newEvent.date || ''} onChange={e => setNewEvent(p => ({ ...p, endDate: e.target.value }))}
                      style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '5px 8px', fontSize: '12px', outline: 'none', fontFamily: 'inherit', color: '#111827' }} />
                  </>}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#6b7280', cursor: 'pointer', marginLeft: '4px' }}>
                    <input type="checkbox" checked={!!newEvent.allDay} onChange={e => setNewEvent(p => ({ ...p, allDay: e.target.checked }))} style={{ cursor: 'pointer' }} />
                    Journée entière
                  </label>
                </div>
              </div>
      
              {/* Lieu */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <MapPin size={16} color="#6b7280" style={{ flexShrink: 0 }} />
                <input value={newEvent.location || ''} onChange={e => setNewEvent(p => ({ ...p, location: e.target.value }))}
                  placeholder="Ajouter un lieu ou un lien Teams"
                  style={{ flex: 1, border: 'none', padding: '4px 0', fontSize: '13px', outline: 'none', fontFamily: 'inherit', color: '#111827', background: 'transparent' }} />
              </div>
      
              {/* Type */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <Users size={16} color="#6b7280" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Calendrier :</span>
                <select value={newEvent.type || 'perso'} onChange={e => setNewEvent(p => ({ ...p, type: e.target.value as 'perso' | 'partage' }))}
                  style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', outline: 'none', fontFamily: 'inherit', color: '#111827', background: '#fff' }}>
                  <option value="perso">👤 Personnel (privé)</option>
                  <option value="partage">👥 Partagé</option>
                </select>
              </div>
      
              {/* Rappel */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <Bell size={16} color="#6b7280" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Rappel :</span>
                <select value={newEvent.reminder || '15 minutes avant'} onChange={e => setNewEvent(p => ({ ...p, reminder: e.target.value }))}
                  style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', outline: 'none', fontFamily: 'inherit', color: '#111827', background: '#fff' }}>
                  {REMINDERS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
      
              {/* Description */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0' }}>
                <AlignLeft size={16} color="#6b7280" style={{ marginTop: '4px', flexShrink: 0 }} />
                <textarea value={newEvent.description || ''} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))}
                  placeholder="Ajouter une description ou des notes..." rows={3}
                  style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: '4px', padding: '6px 8px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', color: '#111827', resize: 'none' as const }}
                  onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = newEvent.color || '#0078d4'}
                  onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = '#e5e7eb'} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADMIN */}
      {showAdminModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:400}} onClick={()=>setShowAdminModal(false)}>
          <div style={{background:'#fff',borderRadius:'8px',width:'560px',maxHeight:'80vh',overflow:'auto',boxShadow:'0 20px 40px rgba(0,0,0,0.2)'}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:'20px 24px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center',background:navy}}>
              <span style={{fontSize:'16px',fontWeight:600,color:'#fff'}}>⚙️ Administration</span>
              <button onClick={()=>setShowAdminModal(false)} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.7)'}}><X size={18}/></button>
            </div>
            <div style={{padding:'20px 24px',borderBottom:'1px solid #f1f5f9'}}>
              <p style={{fontSize:'13px',fontWeight:700,color:navy,marginBottom:'12px'}}>Nouvel utilisateur</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'8px'}}>
                <input placeholder="Nom" value={newUser.name} onChange={e=>setNewUser(p=>({...p,name:e.target.value}))} style={{border:'1px solid #e5e7eb',borderRadius:'6px',padding:'7px 10px',fontSize:'12px',outline:'none',fontFamily:'inherit', color:'#1e3a8a' }}/>
                <input placeholder="Email" type="email" value={newUser.email} onChange={e=>setNewUser(p=>({...p,email:e.target.value}))} style={{border:'1px solid #e5e7eb',borderRadius:'6px',padding:'7px 10px',fontSize:'12px',outline:'none',fontFamily:'inherit',color:'#1e3a8a'}}/>
                <input placeholder="Mot de passe" type="password" value={newUser.password} onChange={e=>setNewUser(p=>({...p,password:e.target.value}))} style={{border:'1px solid #e5e7eb',borderRadius:'6px',padding:'7px 10px',fontSize:'12px',outline:'none',fontFamily:'inherit', color:'#1e3a8a'}}/>
                <select value={newUser.role} onChange={e=>setNewUser(p=>({...p,role:e.target.value}))} style={{border:'1px solid #e5e7eb',borderRadius:'6px',padding:'7px 10px',fontSize:'12px',outline:'none',fontFamily:'inherit',background:'#fff', color:'#1e3a8a'}}>
                  <option value="prestataire">Prestataire</option>
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button onClick={createUser} disabled={!newUser.name||!newUser.email||!newUser.password}
                style={{background:navy,color:'#fff',border:'none',borderRadius:'6px',padding:'8px 20px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',opacity:!newUser.name||!newUser.email||!newUser.password?0.5:1}}>
                Créer le compte
              </button>
            </div>
            <div style={{padding:'20px 24px'}}>
              <p style={{fontSize:'13px',fontWeight:700,color:navy,marginBottom:'12px'}}>Utilisateurs ({adminUsers.length})</p>
              {adminUsers.map(u=>(
                <div key={u.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',borderRadius:'8px',border:'1px solid #f1f5f9',marginBottom:'6px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <div style={{width:'32px',height:'32px',borderRadius:'50%',background:u.role==='admin'?navy:u.role==='client'?'#107c10':'#744da9',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'11px',fontWeight:700}}>{u.name.slice(0,2).toUpperCase()}</div>
                    <div>
                      <p style={{fontSize:'13px',fontWeight:500,color:'#111827',margin:0}}>{u.name}</p>
                      <p style={{fontSize:'11px',color:'#9ca3af',margin:0}}>{u.email} · <span style={{color:u.role==='admin'?navy:u.role==='client'?'#107c10':'#744da9'}}>{u.role}</span></p>
                    </div>
                  </div>
                  {u.id !== partnerStr && (
                    <button onClick={()=>deleteUser(u.id)} style={{background:'#fee2e2',color:'#ef4444',border:'none',borderRadius:'6px',padding:'5px 10px',fontSize:'11px',cursor:'pointer',fontFamily:'inherit'}}>Supprimer</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARTAGE */}
      {showShareModal && shareFile && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:400}} onClick={()=>setShowShareModal(false)}>
          <div style={{background:'#fff',borderRadius:'8px',width:'420px',boxShadow:'0 20px 40px rgba(0,0,0,0.2)'}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:'16px 20px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:'14px',fontWeight:700,color:navy}}>Partager "{shareFile.name}"</span>
              <button onClick={()=>setShowShareModal(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af'}}><X size={16}/></button>
            </div>
            <div style={{padding:'16px 20px'}}>
              <p style={{fontSize:'12px',fontWeight:600,color:'#6b7280',marginBottom:'10px'}}>Partager avec :</p>
              {adminUsers.filter(u=>u.id!==partnerStr).map(u=>(
                <label key={u.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 10px',borderRadius:'6px',cursor:'pointer',marginBottom:'4px',background:shareWithIds.includes(u.id)?'#eff6ff':'transparent'}}>
                  <input type="checkbox" checked={shareWithIds.includes(u.id)} onChange={e=>{setShareWithIds(p=>e.target.checked?[...p,u.id]:p.filter(x=>x!==u.id))}} style={{cursor:'pointer'}}/>
                  <div style={{width:'28px',height:'28px',borderRadius:'50%',background:navy,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'10px',fontWeight:700}}>{u.name.slice(0,2).toUpperCase()}</div>
                  <div>
                    <p style={{fontSize:'12px',fontWeight:500,color:'#111827',margin:0}}>{u.name}</p>
                    <p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>{u.role}</p>
                  </div>
                </label>
              ))}
              <div style={{borderTop:'1px solid #f1f5f9',marginTop:'12px',paddingTop:'12px',display:'flex',gap:'8px'}}>
                <button onClick={()=>copyPublicLink(shareFile.key,shareFile.name)}
                  style={{flex:1,background:'#f1f5f9',color:'#374151',border:'none',borderRadius:'6px',padding:'8px',fontSize:'12px',fontWeight:500,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                  <Download size={13}/>Copier le lien
                </button>
                <button onClick={handleShare} disabled={shareWithIds.length===0}
                  style={{flex:1,background:navy,color:'#fff',border:'none',borderRadius:'6px',padding:'8px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',opacity:shareWithIds.length===0?0.5:1}}>
                  Partager
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRAG OVERLAY */}
{isDragging && (
  <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(30,58,95,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', pointerEvents: 'none' }}>
    <div style={{ width: '120px', height: '120px', borderRadius: '24px', background: 'rgba(212,175,55,0.15)', border: `2px dashed ${gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Upload size={48} color={gold} />
    </div>
    <p style={{ color: '#fff', fontSize: '22px', fontWeight: 700 }}>Déposez vos fichiers ici</p>
  </div>
)}

{/* PREVIEW MODAL */}
{preview && (
  <div onClick={() => setPreview(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '20px' }}>
    <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', maxWidth: '90vw', maxHeight: '90vh', width: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{preview.name}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={async () => { const res = await fetch('/api/partners/download-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: preview.key, forceDownload: true }) }); const { url } = await res.json(); const a = document.createElement('a'); a.href = url; a.download = preview.name; a.click() }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: '#374151', fontFamily: 'inherit' }}>
            <Download size={13} /> Télécharger
          </button>
          <button onClick={() => setPreview(null)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}><X size={16} /></button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', minHeight: '300px' }}>
        {['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(preview.type) && <img src={preview.url} alt={preview.name} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '4px' }} />}
        {['mp4', 'mov'].includes(preview.type) && <video controls autoPlay style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '4px' }}><source src={preview.url} /></video>}
        {preview.type === 'pdf' && <iframe src={preview.url} style={{ width: '100%', height: '70vh', border: 'none' }} />}
      </div>
    </div>
  </div>
)}

<style dangerouslySetInnerHTML={{ __html: '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }' }} />
    </div>
  )
}