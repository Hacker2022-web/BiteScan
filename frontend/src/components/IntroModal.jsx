import React, { useState, useRef, useEffect } from 'react';
import { Shield, Leaf, ArrowRight, Volume2, VolumeX, FastForward, CheckCircle2, Sparkles, LogIn } from 'lucide-react';

export default function IntroModal({ isOpen, onClose, onSelectRole }) {
  const [phase, setPhase] = useState('video'); // 'video' | 'select'
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPhase('video');
      setVideoProgress(0);

      // Force immediate fullscreen video autoplay
      const timer = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(err => {
            console.log('Autoplay handled by browser policy:', err);
          });
        }
      }, 100);

      return () => clearTimeout(timer);
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

  const handleSkip = (e) => {
    e?.stopPropagation();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] w-screen h-screen bg-black overflow-hidden select-none">
      
      {/* ========================================================= */}
      {/* PHASE 1: TRUE EDGE-TO-EDGE FULLSCREEN APP STARTING VIDEO  */}
      {/* ========================================================= */}
      {phase === 'video' && (
        <div className="relative w-full h-full flex items-center justify-center bg-black animate-fade">
          
          {/* Fullscreen Video Element */}
          <video
            ref={videoRef}
            src="/intro.mp4"
            className="w-full h-full object-cover sm:object-contain bg-black cursor-pointer"
            playsInline
            autoPlay
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnded}
            onClick={toggleMute}
          />

          {/* Top Floating Controls */}
          <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 sm:p-7 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            
            {/* Minimal Brand Watermark */}
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="BiteScan Official Logo"
                className="w-10 h-10 object-contain rounded-full drop-shadow-md hover:scale-105 transition-transform"
              />
              <div>
                <div className="flex items-center gap-1 leading-none">
                  <span className="text-white font-serif italic font-extrabold text-xl tracking-tight">Bite</span>
                  <span className="text-terracotta font-extrabold text-xl tracking-tight">Scan</span>
                </div>
                <p className="text-[9px] font-mono tracking-widest text-zinc-400 uppercase mt-0.5 font-bold">
                  Govt. of India • SIH26034
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleMute}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/60 hover:bg-black/80 border border-white/25 text-white text-xs font-mono backdrop-blur-xl transition-all cursor-pointer shadow-lg hover:scale-105"
                title={isMuted ? "Click to Unmute Audio" : "Click to Mute"}
              >
                {isMuted ? <VolumeX size={15} className="text-amber animate-pulse" /> : <Volume2 size={15} className="text-forest" />}
                <span className="text-[11px] font-medium">{isMuted ? 'Unmute' : 'Audio On'}</span>
              </button>

              <button
                onClick={handleSkip}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 hover:bg-white text-zinc-950 text-xs font-bold font-mono backdrop-blur-xl transition-all cursor-pointer shadow-2xl hover:scale-105"
              >
                <span>Skip</span>
                <FastForward size={14} />
              </button>
            </div>
          </div>

          {/* Subtitle / Interaction Helper Banner */}
          <div className="absolute bottom-6 inset-x-0 z-30 flex items-center justify-center px-4 pointer-events-none">
            <span className="px-4 py-1.5 rounded-full bg-black/60 border border-white/15 text-white/80 text-[11px] font-mono backdrop-blur-md flex items-center gap-2 shadow-lg">
              <span>Tap screen to {isMuted ? 'turn on sound' : 'mute'}</span>
            </span>
          </div>

          {/* Bottom Edge Fullscreen Progress Bar */}
          <div className="absolute bottom-0 inset-x-0 h-1.5 bg-white/10 z-40">
            <div
              className="h-full bg-gradient-to-r from-forest via-amber to-terracotta transition-all duration-100"
              style={{ width: `${videoProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PHASE 2: LOGIN / ROLE SELECTION POP-UP                    */}
      {/* ========================================================= */}
      {phase === 'select' && (
        <div className="w-full h-full flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-2xl animate-fade">
          
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-9 shadow-2xl border border-oatmeal-dark animate-scale flex flex-col max-h-[95vh] overflow-y-auto">
            
            {/* National Crest & Heading */}
            <div className="text-center mb-6 sm:mb-8">
              <img
                src="/logo.png"
                alt="BiteScan Official Logo"
                className="w-20 h-20 object-contain rounded-full mx-auto mb-3 drop-shadow-md hover:scale-105 transition-transform"
              />
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-soft border border-forest/20 text-[10px] font-mono text-forest font-bold uppercase tracking-wider mb-2">
                <Sparkles size={12} />
                <span>Department of Consumer Affairs • Smart India Hackathon</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif font-extrabold text-walnut tracking-tight">
                Welcome to <span className="text-forest italic">Bite</span><span className="text-terracotta">Scan</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate mt-1.5 max-w-md mx-auto leading-relaxed">
                Ministry of Consumer Affairs, Food & Public Distribution, Government of India
              </p>
              <div className="inline-block mt-3 px-3 py-1 rounded-full bg-oatmeal border border-oatmeal-dark text-[11px] font-mono font-bold text-walnut uppercase tracking-wide">
                Select Your Login Portal:
              </div>
            </div>

            {/* Two Distinct Choice Cards */}
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
              
              {/* Choice 1: Citizen & Consumer Portal */}
              <button
                onClick={() => {
                  onSelectRole('citizen');
                  onClose();
                }}
                className="group bg-forest-soft/30 hover:bg-forest-soft/60 border-2 border-forest/30 hover:border-forest rounded-3xl p-6 text-left transition-all duration-300 hover:shadow-xl cursor-pointer flex flex-col justify-between hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-13 h-13 rounded-2xl bg-forest-soft flex items-center justify-center text-forest group-hover:scale-105 transition-transform shadow-inner">
                      <Leaf size={28} />
                    </div>
                    <span className="text-[9px] font-mono font-bold px-2.5 py-1 rounded-full bg-forest text-white shadow-2xs">
                      CITIZEN LOGIN
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-walnut group-hover:text-forest transition-colors">
                    Citizen & Consumer
                  </h3>
                  <p className="text-[10px] font-mono text-slate uppercase tracking-wider mb-2.5 font-bold">
                    Clean Food & Nutrition Portal
                  </p>
                  <p className="text-xs text-slate mb-5 leading-relaxed">
                    Scan FMCG foods to identify hidden palm oil, excessive sugars, unsafe E-numbers, and discover healthier alternatives.
                  </p>

                  <ul className="space-y-2 text-[11px] text-walnut font-medium mb-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-forest shrink-0" />
                      <span>FSSAI 1-10 Health Safety Rating</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-forest shrink-0" />
                      <span>Palm Oil & Added Sugar Alarms</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-forest shrink-0" />
                      <span>1-Click Consumer Forum Grievance</span>
                    </li>
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-forest/20 text-xs font-bold text-forest">
                  <span className="flex items-center gap-1.5">
                    <LogIn size={14} />
                    <span>Enter Citizen Portal</span>
                  </span>
                  <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
                </div>
              </button>

              {/* Choice 2: Government Enforcement Officer */}
              <button
                onClick={() => {
                  onSelectRole('inspector');
                  onClose();
                }}
                className="group bg-orange-50/40 hover:bg-orange-50/70 border-2 border-terracotta/30 hover:border-terracotta rounded-3xl p-6 text-left transition-all duration-300 hover:shadow-xl cursor-pointer flex flex-col justify-between hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-13 h-13 rounded-2xl bg-orange-100 flex items-center justify-center text-terracotta group-hover:scale-105 transition-transform shadow-inner">
                      <Shield size={28} />
                    </div>
                    <span className="text-[9px] font-mono font-bold px-2.5 py-1 rounded-full bg-terracotta text-white shadow-2xs">
                      OFFICER LOGIN
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-walnut group-hover:text-terracotta transition-colors">
                    Government Official
                  </h3>
                  <p className="text-[10px] font-mono text-slate uppercase tracking-wider mb-2.5 font-bold">
                    Legal Metrology Terminal
                  </p>
                  <p className="text-xs text-slate mb-5 leading-relaxed">
                    Statutory Rule 6 & 7 verification, physical barcode scale calibration, and automatic Section 36 Show-Cause notices.
                  </p>

                  <ul className="space-y-2 text-[11px] text-walnut font-medium mb-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-terracotta shrink-0" />
                      <span>Optical Font Height (mm) Calibration</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-terracotta shrink-0" />
                      <span>Legal Metrology PC Rules 2011 Audit</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-terracotta shrink-0" />
                      <span>Section 36 PDF Show Cause Notice</span>
                    </li>
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-terracotta/20 text-xs font-bold text-terracotta">
                  <span className="flex items-center gap-1.5">
                    <LogIn size={14} />
                    <span>Enter Officer Terminal</span>
                  </span>
                  <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
                </div>
              </button>

            </div>

            {/* Footer with Replay Button */}
            <div className="pt-3 border-t border-oatmeal-dark flex items-center justify-between text-xs text-slate">
              <span className="font-mono text-[11px]">Legal Metrology (Packaged Commodities) Rules, 2011</span>
              <button
                onClick={() => setPhase('video')}
                className="text-terracotta hover:underline font-mono font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <span>Replay Animation</span>
                <FastForward size={12} />
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
