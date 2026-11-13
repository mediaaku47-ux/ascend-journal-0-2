import React, { useState, useMemo } from 'react';
import { QuickNote, UserProfile } from '../../types';
import { 
  StickyNote, 
  Plus, 
  Calendar, 
  Clock, 
  Search, 
  Copy, 
  Check, 
  Trash2, 
  Tag, 
  FileText,
  Filter,
  Layers,
  Mic
} from 'lucide-react';
import { triggerConfetti } from '../../utils/confetti';
import { getRealToday, MONTH_NAMES_ID } from '../../utils/dateUtils';
import { VoiceNoteRecorderModal } from '../VoiceNoteRecorderModal';
import { VoiceNotePlayer } from '../VoiceNotePlayer';

interface NotesViewProps {
  notes: QuickNote[];
  userProfile: UserProfile;
  onSaveNote: (note: QuickNote) => void;
  onDeleteNote: (id: string) => void;
  theme?: 'dark' | 'light';
}

const CATEGORY_TAGS = [
  'Semua',
  'Umum',
  'Refleksi',
  'Pekerjaan',
  'Ide Kreatif',
  'Pribadi',
  'Belajar',
  'Penting'
];

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  userProfile,
  onSaveNote,
  onDeleteNote,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const realToday = getRealToday();
  const todayDateISO = `${realToday.year}-${String(realToday.monthIndex + 1).padStart(2, '0')}-${String(realToday.day).padStart(2, '0')}`;

  // Form states
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('Umum');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('Semua');
  const [sortOrder] = useState<'newest' | 'oldest'>('newest');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const REFLECTION_TEMPLATE = `✨ Catatan Syukur:
- 

🎯 Evaluasi Diri:
- 

💭 Perasaan Hari Ini:
- `;

  // Helper untuk format tanggal tampilan bahasa Indonesia
  const formatDisplayDate = (dateStr?: string, timestamp?: number): string => {
    if (dateStr && dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parts[0];
        const m = parseInt(parts[1], 10) - 1;
        const d = parts[2];
        const monthName = MONTH_NAMES_ID[m] || parts[1];
        return `${d} ${monthName} ${y}`;
      }
    }
    if (timestamp) {
      return new Date(timestamp).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    return dateStr || 'Tanggal tidak disetel';
  };

  // Hitung nomor urut catatan kronologis permanen (Catatan 1, Catatan 2, Catatan 3, dll.)
  const notesWithNumbers = useMemo(() => {
    // Urutkan berdasarkan timestamp / pembuatan awal untuk memberi indeks Catatan 1, Catatan 2, dll.
    const sortedChronological = [...notes].sort((a, b) => {
      const timeA = a.timestamp || 0;
      const timeB = b.timestamp || 0;
      return timeA - timeB;
    });

    const numberMap = new Map<string, number>();
    sortedChronological.forEach((n, idx) => {
      numberMap.set(n.id, n.noteNumber || idx + 1);
    });

    return notes.map((n) => ({
      ...n,
      assignedNumber: numberMap.get(n.id) || 1,
    }));
  }, [notes]);

  // Filter dan sorting untuk daftar riwayat
  const filteredNotes = useMemo(() => {
    return notesWithNumbers
      .filter((n) => {
        const titleMatch = (n.title || '').toLowerCase().includes(searchQuery.toLowerCase());
        const textMatch = n.text.toLowerCase().includes(searchQuery.toLowerCase());
        const dateMatch = (n.date || n.createdAt || '').toLowerCase().includes(searchQuery.toLowerCase());
        const tagMatch = filterTag === 'Semua' || (n.tags && n.tags.includes(filterTag));
        const numMatch = `catatan ${n.assignedNumber}`.includes(searchQuery.toLowerCase());

        return (titleMatch || textMatch || dateMatch || numMatch) && tagMatch;
      })
      .sort((a, b) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [notesWithNumbers, searchQuery, filterTag, sortOrder]);

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    const now = Date.now();
    const realDate = getRealToday();
    const autoDateISO = `${realDate.year}-${String(realDate.monthIndex + 1).padStart(2, '0')}-${String(realDate.day).padStart(2, '0')}`;
    const formattedDate = formatDisplayDate(autoDateISO, now);
    const timeStr = new Date(now).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const nextNumber = notes.length + 1;

    const finalTitle = noteTitle.trim() || `Catatan ${nextNumber}`;

    const newNote: QuickNote = {
      id: `note-${now}`,
      title: finalTitle,
      text: noteContent.trim(),
      createdAt: `${formattedDate}, ${timeStr}`,
      date: autoDateISO,
      timestamp: now,
      tags: [selectedTag],
      noteNumber: nextNumber,
    };

    onSaveNote(newNote);
    setNoteTitle('');
    setNoteContent('');
    setSelectedTag('Umum');

    triggerConfetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#38bdf8', '#2dd4bf', '#818cf8', '#f59e0b'],
    });
  };

  const handleCopyNote = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCategoryChange = (newTag: string) => {
    setSelectedTag(newTag);
    if (newTag === 'Refleksi') {
      if (!noteTitle.trim()) {
        setNoteTitle(`Refleksi Harian - ${formatDisplayDate(todayDateISO)}`);
      }
      if (!noteContent.trim()) {
        setNoteContent(REFLECTION_TEMPLATE);
      }
    } else if (noteContent === REFLECTION_TEMPLATE) {
      setNoteContent('');
      if (noteTitle.startsWith('Refleksi Harian - ')) {
        setNoteTitle('');
      }
    }
  };

  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const handleSaveVoiceNoteDirectly = (result: { text: string; audioUrl?: string; duration: number }) => {
    const now = Date.now();
    const realDate = getRealToday();
    const autoDateISO = `${realDate.year}-${String(realDate.monthIndex + 1).padStart(2, '0')}-${String(realDate.day).padStart(2, '0')}`;
    const formattedDate = formatDisplayDate(autoDateISO, now);
    const timeStr = new Date(now).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const nextNumber = notes.length + 1;

    // Bersihkan teks transkripsi untuk judul ringkas
    const cleanSnippet = result.text.replace(/\[.*?\]/g, '').trim().split(/\s+/).slice(0, 5).join(' ');
    const voiceTitle = cleanSnippet ? `🎙️ ${cleanSnippet}...` : `Catatan Suara ${nextNumber}`;

    const newNote: QuickNote = {
      id: `note-${now}`,
      title: voiceTitle,
      text: result.text,
      createdAt: `${formattedDate}, ${timeStr}`,
      date: autoDateISO,
      timestamp: now,
      tags: ['Suara', selectedTag !== 'Umum' ? selectedTag : 'Suara'],
      noteNumber: nextNumber,
      audioUrl: result.audioUrl,
      audioDuration: result.duration,
      isVoiceNote: true,
    };

    onSaveNote(newNote);

    triggerConfetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#2dd4bf', '#38bdf8', '#818cf8', '#10b981'],
    });
  };

  const handleApplyVoiceToForm = (transcript: string) => {
    setNoteContent((prev) => (prev ? `${prev}\n${transcript}` : transcript));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Utama Fitur Catatan */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b ${
        isLight ? 'border-slate-200' : 'border-white/10'
      }`}>
        <div>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-lg ${
              isLight
                ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-teal-500/5'
                : 'bg-gradient-to-tr from-sky-500/25 via-indigo-500/20 to-teal-500/20 text-sky-400 border-sky-500/30 shadow-sky-500/10'
            }`}>
              <StickyNote className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className={`text-2xl font-black tracking-tight ${
                  isLight ? 'text-slate-950' : 'text-white'
                }`}>
                  Catatan
                </h2>
                <span className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-full border ${
                  isLight
                    ? 'bg-teal-100 border-teal-300 text-teal-900'
                    : 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                }`}>
                  {notes.length} Catatan
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tombol Catatan Suara Instan diletakkan di atas catatan (Header Utama) */}
        <button
          type="button"
          onClick={() => setIsVoiceModalOpen(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black border transition-all cursor-pointer shadow-sm ${
            isLight
              ? 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600 shadow-teal-600/20'
              : 'bg-gradient-to-r from-teal-500 via-sky-500 to-indigo-500 hover:from-teal-600 hover:to-indigo-600 text-white border-teal-400/40 shadow-lg shadow-teal-500/20'
          }`}
          title="Rekam suara untuk membuat catatan baru secara instan tanpa mengetik"
        >
          <Mic className="w-4 h-4 text-white animate-pulse" />
          <span>Catatan Suara Instan</span>
        </button>
      </div>

      {/* 1. FORM INPUT CATATAN BARU (DENGAN TAMBAH TANGGAL) */}
      <div 
        id="form-tambah-catatan"
        className={`rounded-[28px] p-5 md:p-6 relative overflow-hidden transition-all duration-300 ${
          isLight
            ? 'bg-white border border-slate-200/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] text-slate-950'
            : 'bg-[#0D1525] border border-slate-700/80 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.65)] text-white'
        }`}
      >
        {!isLight && (
          <>
            {/* Top Accent Gradient Line */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-teal-400/60 to-transparent pointer-events-none" />
            {/* Subtle Ambient Corner Glows */}
            <div className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 bg-teal-500/10 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 w-44 h-44 bg-sky-500/10 rounded-full blur-3xl" />
          </>
        )}

        <div className={`flex items-center justify-between gap-2 pb-3 mb-4 border-b relative z-10 ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div className="flex items-center gap-2 font-black text-sm">
            <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-teal-600' : 'bg-teal-400 shadow-[0_0_8px_#2dd4bf]'}`} />
            <span className={isLight ? 'text-slate-950' : 'text-white'}>Catatan Baru</span>
          </div>
        </div>

        <form onSubmit={handleCreateNote} className="space-y-4 relative z-10">
          {/* Baris Kontrol: Judul Catatan & Kategori (Tanggal Otomatis Direkam ke Riwayat) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Input Judul */}
            <div className="md:col-span-8 space-y-1.5">
              <label className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                <FileText className={`w-3.5 h-3.5 ${isLight ? 'text-teal-600' : 'text-teal-400'}`} />
                <span>Judul Catatan</span>
              </label>
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Judul catatan..."
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs transition-all font-semibold border ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-400 focus:border-teal-500 focus:bg-white'
                    : 'bg-[#131D31] border-slate-700/80 text-white placeholder-slate-400 focus:border-teal-400 focus:bg-[#16233B] focus:ring-1 focus:ring-teal-400/30'
                }`}
              />
            </div>

            {/* Pilihan Kategori */}
            <div className="md:col-span-4 space-y-1.5">
              <label className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                <Tag className={`w-3.5 h-3.5 ${isLight ? 'text-teal-600' : 'text-amber-400'}`} />
                <span>Kategori</span>
              </label>
              <select
                value={selectedTag}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={`w-full rounded-xl px-3 py-2.5 text-xs transition-all font-bold border ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-950 focus:border-teal-500'
                    : 'bg-[#131D31] border-slate-700/80 text-white focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30'
                }`}
              >
                {CATEGORY_TAGS.filter((t) => t !== 'Semua').map((tag) => (
                  <option key={tag} value={tag} className={isLight ? 'bg-white text-slate-950' : 'bg-[#131D31] text-white'}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Input Isi Catatan */}
          <div className="space-y-1.5">
            <label className={`block text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              Isi Catatan
            </label>
            <textarea
              rows={4}
              required
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleCreateNote(e);
                }
              }}
              placeholder="Tulis catatan..."
              className={`w-full rounded-2xl p-4 text-xs resize-y min-h-[110px] transition-all leading-relaxed font-semibold border ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-400 focus:border-teal-500 focus:bg-white'
                  : 'bg-[#131D31] border-slate-700/80 text-white placeholder-slate-400 focus:border-teal-400 focus:bg-[#16233B] focus:ring-1 focus:ring-teal-400/30'
              }`}
            />
          </div>

          {/* Tombol Simpan & Info Tanggal Otomatis */}
          <div className="flex flex-wrap justify-between items-center pt-2 gap-3">
            <div className={`text-[11px] flex items-center gap-1.5 font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              <Clock className={`w-3.5 h-3.5 ${isLight ? 'text-teal-600' : 'text-teal-400'}`} />
              <span className="font-semibold font-mono">{formatDisplayDate(todayDateISO)}</span>
            </div>

            <button
              type="submit"
              disabled={!noteContent.trim()}
              className={`font-black text-xs px-6 py-2.5 rounded-xl ${
                isLight 
                  ? 'bg-[#003B2F] hover:bg-[#002e24] text-white shadow-md' 
                  : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-lg shadow-teal-500/20 font-extrabold'
              } disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-2 active:scale-98`}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Simpan Catatan</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. DAFTAR RIWAYAT CATATAN */}
      <div 
        id="riwayat-catatan-container"
        className="space-y-4"
      >
        {/* Header Riwayat & Filter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-2">
          <div>
            <h3 className={`text-lg font-black tracking-tight flex items-center gap-2 ${
              isLight ? 'text-slate-950' : 'text-white'
            }`}>
              <Layers className="w-5 h-5 text-teal-500" />
              <span>Riwayat Catatan</span>
            </h3>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                isLight ? 'text-slate-400' : 'text-white/40'
              }`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari catatan..."
                className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold border transition-all ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-400 focus:bg-white focus:border-teal-500'
                    : 'bg-[#131D31] border-slate-700/80 text-white placeholder-slate-400 focus:border-teal-400'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Filter Tag Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          <Filter className={`w-3 h-3 shrink-0 ml-1 mr-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
          {CATEGORY_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag)}
              className={`text-[11px] px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer border ${
                filterTag === tag
                  ? isLight
                    ? 'bg-[#003B2F] border-[#003B2F] text-white shadow-xs'
                    : 'bg-teal-500/25 border-teal-500/50 text-teal-200 shadow-xs'
                  : isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-[#131D31] hover:bg-[#1A2640] border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Daftar Kartu Catatan (Catatan 1, Catatan 2, Catatan 3, dll.) */}
        {filteredNotes.length === 0 ? (
          <div className={`p-12 text-center rounded-[24px] border space-y-3 ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#0F172A] border-slate-800 text-slate-300'
          }`}>
            <StickyNote className={`w-10 h-10 mx-auto ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
            <div className="space-y-1">
              <h4 className={`text-sm font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {searchQuery || filterTag !== 'Semua' 
                  ? 'Catatan tidak ditemukan' 
                  : 'Belum ada catatan'}
              </h4>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotes.map((note) => {
              const noteNumberBadge = `Catatan ${note.assignedNumber}`;
              const displayDate = formatDisplayDate(note.date, note.timestamp);

              return (
                <div
                  key={note.id}
                  className={`rounded-[22px] p-5 flex flex-col justify-between group transition-all duration-300 border relative overflow-hidden ${
                    isLight
                      ? 'bg-white border-slate-200/90 hover:border-teal-500/60 text-slate-950 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] hover:shadow-md'
                      : 'bg-[#0F172A] border-slate-800 hover:border-teal-500/40 text-white shadow-xl hover:shadow-2xl'
                  }`}
                >
                  <div className="relative z-10">
                    {/* Header Kartu: Nama Catatan (Catatan 1, 2, dll.) & Tanggal */}
                    <div className={`flex items-start justify-between gap-3 pb-3 border-b ${
                      isLight ? 'border-slate-100' : 'border-slate-800'
                    }`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Label Penomoran Catatan 1, Catatan 2, dll. */}
                          <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg font-mono border ${
                            isLight
                              ? 'bg-teal-50 text-teal-800 border-teal-200'
                              : 'bg-teal-500/15 border-teal-500/30 text-teal-300'
                          }`}>
                            {noteNumberBadge}
                          </span>

                          {/* Tag Kategori */}
                          {note.tags && note.tags[0] && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              isLight
                                ? 'bg-slate-100 border-slate-200 text-slate-700'
                                : 'bg-[#131D31] border-slate-700/60 text-slate-300'
                            }`}>
                              {note.tags[0]}
                            </span>
                          )}

                          {/* Badge Catatan Suara */}
                          {(note.isVoiceNote || note.audioUrl) && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 font-mono ${
                              isLight
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            }`}>
                              <Mic className="w-2.5 h-2.5" /> Suara
                            </span>
                          )}
                        </div>

                        {/* Judul Catatan */}
                        {note.title && note.title !== noteNumberBadge && (
                          <h4 className={`text-sm font-black tracking-tight pt-0.5 ${
                            isLight ? 'text-slate-950' : 'text-white'
                          }`}>
                            {note.title}
                          </h4>
                        )}
                      </div>

                      {/* Badge Tanggal Prominen */}
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold shrink-0 ${
                        isLight
                          ? 'bg-slate-100 border-slate-200/80 text-slate-700'
                          : 'bg-[#131D31] border-slate-700/70 text-teal-300'
                      }`}>
                        <Calendar className={`w-3.5 h-3.5 ${isLight ? 'text-teal-700' : 'text-teal-400'}`} />
                        <span className="font-mono">{displayDate}</span>
                      </div>
                    </div>

                    {/* Isi Catatan */}
                    <div className={`py-3 text-xs whitespace-pre-wrap leading-relaxed font-semibold ${
                      isLight ? 'text-slate-800' : 'text-slate-200'
                    }`}>
                      {note.text}
                    </div>

                    {/* Voice Note Audio Player jika ada rekaman suara */}
                    {note.audioUrl && (
                      <VoiceNotePlayer
                        audioUrl={note.audioUrl}
                        duration={note.audioDuration}
                        isLight={isLight}
                      />
                    )}
                  </div>

                  {/* Footer Kartu: Timestamp detail & Tombol Aksi */}
                  <div className={`pt-3 border-t flex items-center justify-between text-[11px] relative z-10 ${
                    isLight ? 'border-slate-100 text-slate-500' : 'border-slate-800 text-slate-400'
                  }`}>
                    <span className="font-mono text-[10px]">
                      {note.createdAt}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyNote(note.id, `${note.title || noteNumberBadge}\nTanggal: ${displayDate}\n\n${note.text}`)}
                        className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 cursor-pointer font-semibold ${
                          isLight
                            ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 border-slate-200'
                            : 'text-slate-400 hover:text-teal-300 hover:bg-[#131D31] border-slate-800 hover:border-slate-700'
                        }`}
                        title="Salin isi catatan"
                      >
                        {copiedId === note.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] text-emerald-700 font-bold">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="text-[10px]">Salin</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Hapus ${noteNumberBadge}?`)) {
                            onDeleteNote(note.id);
                          }
                        }}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isLight
                            ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            : 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10'
                        }`}
                        title={`Hapus ${noteNumberBadge}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Perekam Catatan Suara Instan */}
      <VoiceNoteRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onFinishSaveDirectly={handleSaveVoiceNoteDirectly}
        onApplyToForm={handleApplyVoiceToForm}
        theme={theme}
      />
    </div>
  );
};
