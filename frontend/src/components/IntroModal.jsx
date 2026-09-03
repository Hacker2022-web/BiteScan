import React, { useState, useRef, useEffect } from 'react';
import { Shield, Leaf, ArrowRight, Volume2, VolumeX, FastForward, CheckCircle2, Play, Sparkles } from 'lucide-react';

export default function IntroModal({ isOpen, onClose, onSelectRole }) {
  const [phase, setPhase] = useState('video'); // 'video' | 'select'
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPhase('video');
      setVideoProgress(0);
      setHasStarted(false);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().then(() => {
            setHasStarted(true);
          }).catch(e => {
            console.log('Autoplay deferred, awaiting user touch:', e);
          });
        }
      }, 300);
    }
  }, [isOpen]);

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const prog = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(prog);
    }
  };

  const handleVideoEnded = () => {
    setPhase('select');
  };

  const handleSkip = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setPhase('select');
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleManualPlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setHasStarted(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-3 sm:p-6 animate-fade">
      
      {/* ========================================================= */}
      {/* PHASE 1: FULLSCREEN CINEMATIC INTRO VIDEO PLAYER          */}
      {/* ========================================================= */}
      {phase === 'video' && (
        <div className="relative w-full max-w-4xl bg-zinc-950 rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col">
          
          {/* Top Bar Controls */}
          <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4 sm:p-5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            
            {/* Branding Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                <span className="text-forest font-serif italic font-extrabold text-lg">B</span>
              </div>
              <div>
                <div className="flex items-center gap-1 leading-none">
                  <span className="text-white font-serif italic font-bold text-base">Bite</span>
                  <span className="text-terracotta font-bold text-base">Scan</span>
                </div>
                <p className="text-[9px] font-mono tracking-widest text-zinc-400 uppercase mt-0.5">
                  Ministry of Consumer Affairs • SIH26034
                </p>
              </div>
            </div>

            {/* Action Buttons: Sound & Skip */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleMute}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white text-xs font-mono transition-all cursor-pointer backdrop-blur-md"
              >
                {isMuted ? <VolumeX size={14} className="text-zinc-400" /> : <Volume2 size={14} className="text-forest" />}
                <span className="hidden sm:inline text-[11px]">{isMuted ? 'Unmute' : 'Muted'}</span>
              </button>

              <button
                onClick={handleSkip}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-bold font-mono transition-all cursor-pointer shadow-lg hover:scale-105"
              >
                <span>Skip Intro</span>
                <FastForward size={14} />
              </button>
            </div>
          </div>

          {/* Video Container */}
          <div className="relative aspect-video w-full bg-black flex items-center justify-center cursor-pointer" onClick={toggleMute}>
            <video
              ref={videoRef}
              src="/intro.mp4"
              className="w-full h-full object-contain"
              playsInline
              autoPlay
              muted={isMuted}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
              onPlay={() => setHasStarted(true)}
            />

            {/* Tap to Unmute Overlay Prompt */}
            {isMuted && hasStarted && (
              <div className="absolute bottom-6 left-6 z-20 pointer-events-none">
                <span className="px-3 py-1.5 rounded-full bg-black/60 border border-white/20 text-white/90 text-xs font-mono backdrop-blur-md flex items-center gap-2">
                  <VolumeX size={13} className="text-amber animate-pulse" />
                  Tap anywhere to unmute audio
                </span>
              </div>
            )}

            {/* Manual Play Button if autoplay was blocked */}
            {!hasStarted && (
              <button
                onClick={handleManualPlay}
                className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center text-white transition-transform hover:scale-110 cursor-pointer z-10"
              >
                <Play size={32} fill="white" className="ml-1" />
              </button>
            )}
          </div>

          {/* Bottom Progress Bar */}
          <div className="w-full bg-zinc-900 h-1 relative">
            <div
              className="h-full bg-gradient-to-r from-forest via-amber to-terracotta transition-all duration-150"
              style={{ width: `${videoProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PHASE 2: ROLE SELECTION POP-UP MODAL                      */}
      {/* ========================================================= */}
      {phase === 'select' && (
        <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-oatmeal-dark animate-scale flex flex-col max-h-[90vh] overflow-y-auto">
          
          {/* Government / Platform Crest */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-soft/60 border border-forest/20 text-[10px] font-mono text-forest font-bold uppercase tracking-wider mb-3">
              <Sparkles size={12} />
              <span>Smart India Hackathon 2024 • SIH26034</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-extrabold text-walnut tracking-tight">
              Welcome to <span className="text-forest italic">Bite</span><span className="text-terracotta">Scan</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate mt-1.5 max-w-md mx-auto">
              Department of Consumer Affairs, Ministry of Consumer Affairs, Food & Public Distribution
            </p>
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider mt-2 text-terracotta">
              Select Your Access Portal to Continue:
            </p>
          </div>

          {/* Dual Selection Cards */}
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 mb-6">
            
            {/* Portal 1: Citizen & Consumer */}
            <button
              onClick={() => {
                onSelectRole('citizen');
                onClose();
              }}
              className="group bg-forest-soft/20 hover:bg-forest-soft/40 border-2 border-forest/30 hover:border-forest rounded-3xl p-5 text-left transition-all duration-300 hover:shadow-lg cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-forest-soft flex items-center justify-center text-forest group-hover:scale-105 transition-transform">
                    <Leaf size={26} />
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-forest text-white">
                    PUBLIC ACCESS
                  </span>
                </div>

                <h3 className="text-base font-bold text-walnut group-hover:text-forest transition-colors">
                  Citizen & Consumer
                </h3>
                <p className="text-[10px] font-mono text-slate uppercase tracking-wider mb-2 font-bold">
                  Health & Nutrition Advisor
                </p>
                <p className="text-xs text-slate mb-4 leading-relaxed">
                  Scan any packaged food to reveal hidden sugars, palm oil, restricted additives, and clean-label alternatives.
                </p>

                <ul className="space-y-1.5 text-[11px] text-walnut/90 font-medium mb-4">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-forest shrink-0" />
                    <span>FSSAI 1-10 Health Safety Rating</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-forest shrink-0" />
                    <span>Palm Oil & Added Sugar Alarms</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-forest shrink-0" />
                    <span>1-Click Consumer Forum Grievance</span>
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-forest/20 text-xs font-bold text-forest">
                <span>Enter Citizen Portal</span>
                <ArrowRight size={15} className="group-hover:translate-x-1.5 transition-transform" />
              </div>
            </button>

            {/* Portal 2: Government Enforcement Officer */}
            <button
              onClick={() => {
                onSelectRole('inspector');
                onClose();
              }}
              className="group bg-orange-50/30 hover:bg-orange-50/60 border-2 border-terracotta/30 hover:border-terracotta rounded-3xl p-5 text-left transition-all duration-300 hover:shadow-lg cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-terracotta group-hover:scale-105 transition-transform">
                    <Shield size={26} />
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-terracotta text-white">
                    OFFICIAL ACCESS
                  </span>
                </div>

                <h3 className="text-base font-bold text-walnut group-hover:text-terracotta transition-colors">
                  Government Official
                </h3>
                <p className="text-[10px] font-mono text-slate uppercase tracking-wider mb-2 font-bold">
                  Legal Metrology Inspector
                </p>
                <p className="text-xs text-slate mb-4 leading-relaxed">
                  Automated Rule 6 & 7 verification, physical barcode scale calibration, and Section 36 statutory notice drafting.
                </p>

                <ul className="space-y-1.5 text-[11px] text-walnut/90 font-medium mb-4">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-terracotta shrink-0" />
                    <span>Optical Numeral Height (mm) Calibration</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-terracotta shrink-0" />
                    <span>Rule 6 Mandatory Declarations Check</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-terracotta shrink-0" />
                    <span>Instant Section 36 PDF Show Cause Notice</span>
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-terracotta/20 text-xs font-bold text-terracotta">
                <span>Enter Inspector Terminal</span>
                <ArrowRight size={15} className="group-hover:translate-x-1.5 transition-transform" />
              </div>
            </button>

          </div>

          {/* Replay Video Option */}
          <div className="text-center pt-2 border-t border-oatmeal-dark flex items-center justify-between text-xs text-slate">
            <span>Legal Metrology (Packaged Commodities) Rules, 2011</span>
            <button
              onClick={() => setPhase('video')}
              className="text-terracotta hover:underline font-mono font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Replay Intro Video</span>
              <Play size={10} />
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
