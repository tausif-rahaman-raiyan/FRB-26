import { useState, useMemo, useRef, useEffect } from 'react';
import { Play, Check, Search, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import { UniversalPlayer } from './UniversalPlayer';
import { AccordionItem } from './AccordionItem';
import {
  lectureData,
  motivationalQuotes,
  getVideoId,
  isValidVideoId,
  formatChapterName,
} from '../data/lectureData';
import type { FlatVideoItem, SubjectItem } from '../types';
import type { User } from '../firebase';

interface LibraryViewProps {
  user: User | null;
  watchedVideos: string[];
  onMarkWatched: (videoId: string) => void;
  onRequireLogin: () => void;
}

export function LibraryView({
  user,
  watchedVideos,
  onMarkWatched,
  onRequireLogin,
}: LibraryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [activeSubject, setActiveSubject] = useState<string | null>(lectureData[0].name);
  const [activeChapter, setActiveChapter] = useState<string | null>(lectureData[0].chapters[0]?.name || null);
  const [selectedVideo, setSelectedVideo] = useState<FlatVideoItem | null>(null);
  const [randomQuotes, setRandomQuotes] = useState<string[]>([]);

  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  // Flatten all lectures for sequential playback
  const flatVideos = useMemo(() => {
    const list: FlatVideoItem[] = [];
    lectureData.forEach((sub) => {
      sub.chapters.forEach((chap) => {
        chap.links.forEach((link) => {
          const id = getVideoId(link.url);
          const isHls = /\.m3u8(?:$|\?)/i.test(link.url);
          list.push({
            id,
            text: link.text,
            url: link.url,
            subName: sub.name,
            chapName: chap.name,
            type: isHls ? 'bunny' : 'youtube',
          });
        });
      });
    });
    return list;
  }, []);

  // Set default video on mount
  useEffect(() => {
    if (!selectedVideo && flatVideos.length > 0) {
      setSelectedVideo(flatVideos[0]);
    }
  }, [flatVideos, selectedVideo]);

  // Shuffle quotes when video changes
  useEffect(() => {
    const shuffled = [...motivationalQuotes].sort(() => 0.5 - Math.random());
    setRandomQuotes(shuffled.slice(0, 2));
  }, [selectedVideo]);

  const isVideoWatched = (url: string) => {
    const id = getVideoId(url);
    return isValidVideoId(id) && watchedVideos.includes(id);
  };

  // Next up videos
  const nextVideos = useMemo(() => {
    if (!selectedVideo) return [];
    const currentIndex = flatVideos.findIndex((v) => v.id === selectedVideo.id);
    if (currentIndex === -1) return [];

    return flatVideos
      .slice(currentIndex + 1)
      .filter((v) => isValidVideoId(v.id) && !watchedVideos.includes(v.id))
      .slice(0, 2);
  }, [selectedVideo, flatVideos, watchedVideos]);

  // Filtered subjects and chapters based on search term & pill filter
  const filteredData = useMemo(() => {
    let list = lectureData;
    if (selectedSubjectFilter !== 'all') {
      list = list.filter((s) => s.name === selectedSubjectFilter);
    }

    if (!searchTerm.trim()) return list;
    const lower = searchTerm.toLowerCase();

    return list
      .map((subject) => {
        if (subject.name.toLowerCase().includes(lower)) return subject;
        const chapters = subject.chapters
          .map((chapter) => {
            if (chapter.name.toLowerCase().includes(lower)) return chapter;
            const links = chapter.links.filter((l) => l.text.toLowerCase().includes(lower));
            return links.length > 0 ? { ...chapter, links } : null;
          })
          .filter(Boolean) as typeof subject.chapters;

        return chapters.length > 0 ? { ...subject, chapters } : null;
      })
      .filter(Boolean) as SubjectItem[];
  }, [searchTerm, selectedSubjectFilter]);

  const handleSelectVideo = (videoItem: FlatVideoItem) => {
    setSelectedVideo(videoItem);
    setTimeout(() => {
      playerContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
      {/* LEFT COLUMN: Video Player & Up Next */}
      <div className="xl:col-span-2 space-y-6">
        {/* Video Player Container */}
        <div
          ref={playerContainerRef}
          className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-950 group"
        >
          <UniversalPlayer
            key={selectedVideo?.id || 'empty'}
            video={selectedVideo}
            user={user}
            onMarkWatched={onMarkWatched}
            onRequireLogin={onRequireLogin}
          />
        </div>

        {/* Current Class Info Bar */}
        {selectedVideo && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-md">
            <div>
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                {selectedVideo.subName} &bull; {formatChapterName(selectedVideo.chapName)}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {selectedVideo.text}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700 font-mono">
                {selectedVideo.type === 'bunny' ? 'Bunny HLS Secured' : 'YouTube'}
              </span>
              {isVideoWatched(selectedVideo.url) ? (
                <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1 rounded-full font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Watched
                </span>
              ) : (
                <button
                  onClick={() => onMarkWatched(selectedVideo.id)}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/80 px-3 py-1 rounded-full font-bold transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> Mark Watched
                </button>
              )}
            </div>
          </div>
        )}

        {/* Motivational Quotes */}
        {randomQuotes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {randomQuotes.map((quote, idx) => (
              <div
                key={idx}
                className="bg-slate-900/50 border-l-4 border-cyan-500 p-4 rounded-xl shadow-md backdrop-blur-sm"
              >
                <p className="text-xs sm:text-sm font-medium text-slate-300 italic leading-relaxed">
                  "{quote}"
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Up Next Recommendation */}
        {selectedVideo && (
          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-slate-800 shadow-lg">
            <h3 className="text-sm sm:text-base font-bold text-white mb-3.5 flex items-center">
              <span className="bg-cyan-500/20 text-cyan-400 p-1.5 rounded-lg mr-2.5">
                <Sparkles className="w-4 h-4" />
              </span>
              Up Next
            </h3>
            {nextVideos.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {nextVideos.map((vid) => (
                  <button
                    key={vid.id}
                    onClick={() => handleSelectVideo(vid)}
                    className="flex text-left items-start p-3 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 rounded-xl transition-all group"
                  >
                    <div className="relative w-24 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-900 mr-3 border border-slate-700">
                      {vid.type === 'bunny' ? (
                        <img
                          src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhgsnbROZ9S_lmIUDcVYp05WasqiVM0dtDKFT1wOBbboY28YPRJkLQxu8R_s0G9-AcDq6o0CyNbHtm2my78R4Gsdd7OsW6q61w5F1uWsFJ9kIh_g7hnuyIW5Gkf1FVN7dpiZDgA9xC8pi-qxo14L1w85AQLp2mhl5_yUVb6-p2Pqe7V6fbVVBDsY7pNOmn-/s1600/ACS-HSC-26-Final-Revision-Batch-all-teacher-1.png"
                          alt="ACS Class"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <img
                          src={`https://img.youtube.com/vi/${vid.id}/mqdefault.jpg`}
                          alt={vid.text}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate mb-1">
                        {vid.text}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {formatChapterName(vid.chapName)}
                      </p>
                      <span className="text-[10px] font-bold text-cyan-400 mt-1 uppercase tracking-wider block group-hover:translate-x-1 transition-transform">
                        ▶ Watch Next
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-semibold">
                🎉 Excellent! You have completed all classes in this playlist sequence.
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Search & Subjects/Chapters Accordion */}
      <div className="space-y-4 xl:sticky xl:top-20 xl:max-h-[calc(100vh-100px)] xl:overflow-y-auto pr-1">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search classes, chapters, subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-inner"
          />
        </div>

        {/* Quick Subject Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedSubjectFilter('all')}
            className={`px-3 py-1 rounded-full whitespace-nowrap font-bold transition-all ${
              selectedSubjectFilter === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            All (13)
          </button>
          {lectureData.map((sub) => (
            <button
              key={sub.name}
              onClick={() => setSelectedSubjectFilter(sub.name)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap font-semibold transition-all ${
                selectedSubjectFilter === sub.name
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {sub.shortName || sub.name}
            </button>
          ))}
        </div>

        {/* Subjects & Chapters List */}
        <div className="space-y-3">
          {filteredData.length > 0 ? (
            filteredData.map((subject) => {
              let subTotal = 0;
              let subCompleted = 0;
              subject.chapters.forEach((chap) => {
                chap.links.forEach((l) => {
                  if (!isValidVideoId(getVideoId(l.url))) return;
                  subTotal++;
                  if (isVideoWatched(l.url)) subCompleted++;
                });
              });

              return (
                <AccordionItem
                  key={subject.name}
                  title={subject.name}
                  progressInfo={{ completed: subCompleted, total: subTotal }}
                  isSubject={true}
                  isOpen={activeSubject === subject.name}
                  onToggle={() => {
                    if (activeSubject === subject.name) {
                      setActiveSubject(null);
                      setActiveChapter(null);
                    } else {
                      setActiveChapter(null);
                      setActiveSubject(subject.name);
                    }
                  }}
                >
                  <div className="space-y-2.5">
                    {subject.chapters.map((chapter) => {
                      const chapTotal = chapter.links.length;
                      const chapCompleted = chapter.links.filter((l) => isVideoWatched(l.url)).length;

                      return (
                        <AccordionItem
                          key={chapter.name}
                          title={formatChapterName(chapter.name)}
                          progressInfo={{ completed: chapCompleted, total: chapTotal }}
                          isOpen={activeChapter === chapter.name}
                          onToggle={() =>
                            setActiveChapter(activeChapter === chapter.name ? null : chapter.name)
                          }
                        >
                          <div className="space-y-1.5">
                            {chapter.links.map((link) => {
                              const id = getVideoId(link.url);
                              const isHls = /\.m3u8(?:$|\?)/i.test(link.url);
                              const isActive = selectedVideo?.id === id;
                              const isFinished = isVideoWatched(link.url);

                              const videoItem: FlatVideoItem = {
                                id,
                                text: link.text,
                                url: link.url,
                                subName: subject.name,
                                chapName: chapter.name,
                                type: isHls ? 'bunny' : 'youtube',
                              };

                              return (
                                <button
                                  key={link.url}
                                  onClick={() => handleSelectVideo(videoItem)}
                                  className={`w-full flex items-center p-2.5 rounded-lg transition-all text-left text-xs font-medium border ${
                                    isActive
                                      ? 'bg-cyan-950/60 border-cyan-500/60 text-white shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/80 hover:border-slate-700 text-slate-300'
                                  }`}
                                >
                                  <div
                                    className={`shrink-0 mr-2.5 p-1 rounded-full ${
                                      isFinished
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : isActive
                                        ? 'bg-cyan-500/20 text-cyan-400'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {isFinished ? (
                                      <Check className="w-3.5 h-3.5" />
                                    ) : (
                                      <Play className="w-3.5 h-3.5" />
                                    )}
                                  </div>
                                  <span className="flex-1 truncate">{link.text}</span>
                                  {isFinished && (
                                    <span className="text-[10px] text-emerald-400 font-bold ml-2">
                                      Done
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </AccordionItem>
                      );
                    })}
                  </div>
                </AccordionItem>
              );
            })
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">
              No classes matched your search query.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
