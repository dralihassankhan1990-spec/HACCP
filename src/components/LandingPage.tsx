import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Leaf,
  Droplet,
  Flame,
  Factory,
  Thermometer,
  Microscope,
  Truck,
  Award,
  CheckCircle2,
  Zap,
  ArrowRight,
  PlayCircle,
  Video,
  Image,
  Layers,
  Database,
  Cpu,
  BookOpen,
  AlertTriangle,
  Globe,
  Sparkles,
  Target,
  ChevronRight,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  Maximize,
  Minimize,
} from 'lucide-react';
import { motion } from 'motion/react';
import { BRAND } from '../config/brand';

// Video Player Component
interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, title = "Veritas HACCP Demo" }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasError, setHasError] = useState(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const togglePlay = () => {
    if (videoRef.current && !hasError) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = percent * duration;
      setCurrentTime(percent * duration);
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
    }
  };

  const skipBack = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
    }
  };

  const toggleFullscreen = async () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        try {
          await videoRef.current.requestFullscreen();
          setIsFullscreen(true);
        } catch (err) {
          console.error('Fullscreen error:', err);
        }
      } else {
        try {
          await document.exitFullscreen();
          setIsFullscreen(false);
        } catch (err) {
          console.error('Exit fullscreen error:', err);
        }
      }
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="relative w-full h-full"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => { if (isPlaying) setShowControls(false); }}
      onMouseMove={handleMouseMove}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
        onError={() => setHasError(true)}
        playsInline
        preload="metadata"
      />
      
      {/* Poster/Pre-load hint (hidden once the video starts) */}
      {!isPlaying && !hasError && (
        <motion.button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-10 bg-haccp-surface-950/40 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileTap={{ scale: 0.98 }}
          aria-label={`Play ${title}`}
        >
          <div
            className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center backdrop-blur-xl border-2"
            style={{ background: 'rgba(34, 197, 94, 0.2)', borderColor: 'rgba(34, 197, 94, 0.5)', boxShadow: '0 0 40px rgba(34, 197, 94, 0.35)' }}
          >
            <PlayCircle className="w-9 h-9 md:w-11 md:h-11 text-haccp-300 ml-1" />
          </div>
        </motion.button>
      )}

      {/* Unavailable-source fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-haccp-surface-950/90 p-8 text-center">
          <div>
            <Video className="w-12 h-12 text-haccp-400 mx-auto mb-3 opacity-60" />
            <p className="text-haccp-surface-200 font-semibold mb-1">Demo video unavailable</p>
            <p className="text-haccp-surface-400 text-sm max-w-sm">
              Drop your AI-generated demo video into <code className="text-haccp-300">public/demo/haccp-demo.mp4</code> and reload.
            </p>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: showControls ? 1 : 0, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-haccp-surface-950/95 via-haccp-surface-950/50 to-transparent z-20"
      >
        {/* Progress Bar */}
        <div className="mb-3">
          <div 
            className="relative h-1.5 bg-haccp-surface-800 rounded-full cursor-pointer"
            onClick={handleProgressClick}
            role="slider"
            aria-label="Video progress"
            aria-valuemin={0}
            aria-valuemax={duration || 100}
            aria-valuenow={currentTime}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-haccp-500 to-haccp-teal-500 rounded-full transition-all duration-100"
              style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity"
              style={{ left: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-haccp-surface-500 font-mono mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2 rounded-lg bg-haccp-surface-800 hover:bg-haccp-surface-700 text-haccp-surface-100 transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <span className="flex">
                  <span className="w-1 h-5 bg-current mr-1" />
                  <span className="w-1 h-5 bg-current" />
                </span>
              ) : (
                <PlayCircle className="w-5 h-5 ml-1" />
              )}
            </button>
            <button
              onClick={skipBack}
              className="p-2 rounded-lg bg-haccp-surface-800 hover:bg-haccp-surface-700 text-haccp-surface-100 transition-colors"
              aria-label="Skip back 10 seconds"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={skipForward}
              className="p-2 rounded-lg bg-haccp-surface-800 hover:bg-haccp-surface-700 text-haccp-surface-100 transition-colors"
              aria-label="Skip forward 10 seconds"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg bg-haccp-surface-800 hover:bg-haccp-surface-700 text-haccp-surface-100 transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : 1}
              onChange={(e) => {
                if (videoRef.current) {
                  videoRef.current.volume = parseFloat(e.target.value);
                  setIsMuted(parseFloat(e.target.value) === 0);
                }
              }}
              className="w-20 h-1.5 appearance-none bg-haccp-surface-800 rounded-full accent-haccp-500 cursor-pointer"
              aria-label="Volume"
            />
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-haccp-surface-800 hover:bg-haccp-surface-700 text-haccp-surface-100 transition-colors"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  color: string;
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  icon, 
  title, 
  description, 
  href, 
  color,
  delay = 0 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative p-6 md:p-8 rounded-2xl glass-card glass-card-hover overflow-hidden"
      style={{ borderColor: `rgba(${color}, 0.3)` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[rgba(0,0,0,0)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
           style={{ background: `radial-gradient(ellipse at top right, rgba(${color}, 0.15) 0%, transparent 70%)` }} />
      
      <div className="relative z-10 flex flex-col h-full">
        <div 
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
          style={{ background: `rgba(${color}, 0.15)`, border: `1px solid rgba(${color}, 0.3)` }}
        >
          <span className="text-2xl" style={{ color: `rgb(${color})` }}>{icon}</span>
        </div>
        
        <h3 className="text-xl font-display font-bold text-haccp-surface-50 mb-3 group-hover:text-haccp-300 transition-colors">
          {title}
        </h3>
        
        <p className="text-haccp-surface-400 leading-relaxed mb-6 flex-1">
          {description}
        </p>
        
        <Link
          to={href}
          className="inline-flex items-center gap-2 text-sm font-semibold transition-all duration-300 group-hover:gap-4"
          style={{ color: `rgb(${color})` }}
        >
          Explore Module
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
      
      <div 
        className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, rgb(${color}), transparent)` }}
      />
    </motion.div>
  );
};

interface StatItemProps {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  delay: number;
}

const StatItem: React.FC<StatItemProps> = ({ value, label, icon, color, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="text-center p-4 md:p-6"
    >
      <div 
        className="w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center"
        style={{ background: `rgba(${color}, 0.15)`, border: `1px solid rgba(${color}, 0.3)` }}
      >
        <span className="text-xl" style={{ color: `rgb(${color})` }}>{icon}</span>
      </div>
      <div className="text-3xl md:text-4xl font-display font-black mb-1" style={{ color: `rgb(${color})` }}>
        {value}
      </div>
      <div className="text-haccp-surface-400 text-sm font-medium">{label}</div>
    </motion.div>
  );
};

export const LandingPage: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: <Shield className="w-7 h-7" />,
      title: 'HACCP Plan Management',
      description: 'Manage 4 certified production lines (Dairy, Ice Cream, Bakery, Meat) with ISO 22000, FDA PMO, USDA FSIS, and Codex Alimentarius compliance.',
      href: '/dashboard?plan=milk',
      color: '34, 197, 94',
      delay: 0.1,
    },
    {
      icon: <Cpu className="w-7 h-7" />,
      title: 'SCADA Digital Twin',
      description: 'Real-time process schematic with interactive CCP nodes, live sensor telemetry, and automated actuator interlock visualization.',
      href: '/dashboard?plan=milk',
      color: '20, 184, 166',
      delay: 0.2,
    },
    {
      icon: <Database className="w-7 h-7" />,
      title: 'Immutable Audit Ledger',
      description: 'Tamper-evident SQLite WAL database with cryptographic timestamps, full traceability, and regulatory export capabilities.',
      href: '/dashboard?plan=milk',
      color: '245, 158, 11',
      delay: 0.3,
    },
    {
      icon: <Zap className="w-7 h-7" />,
      title: 'Automated Interlocks',
      description: 'Sub-200ms actuator response: diverter valves, pneumatic reject rams, thermal hold locks with PLC telemetry logging.',
      href: '/dashboard?plan=milk',
      color: '244, 63, 94',
      delay: 0.4,
    },
    {
      icon: <BookOpen className="w-7 h-7" />,
      title: 'Regulatory Protocols',
      description: 'Integrated ISO 22000, HACCP Principles, FDA PMO, USDA 9 CFR 417, AIB Standards with hazard context per CCP.',
      href: '/dashboard?plan=milk',
      color: '34, 197, 94',
      delay: 0.5,
    },
    {
      icon: <Target className="w-7 h-7" />,
      title: 'Live Test Scenarios',
      description: 'Execute realistic breach simulations: pasteurization temp drop, metal detection, oven lethality, smokehouse core temp.',
      href: '/dashboard?plan=milk',
      color: '20, 184, 166',
      delay: 0.6,
    },
  ];

  const stats = [
    { value: '4', label: 'Certified Lines', icon: <Factory className="w-6 h-6" />, color: '34, 197, 94', delay: 0.1 },
    { value: '14', label: 'Active CCPs', icon: <Shield className="w-6 h-6" />, color: '20, 184, 166', delay: 0.15 },
    { value: '<200ms', label: 'Actuator Response', icon: <Zap className="w-6 h-6" />, color: '245, 158, 11', delay: 0.2 },
    { value: '100%', label: 'Traceability', icon: <Database className="w-6 h-6" />, color: '244, 63, 94', delay: 0.25 },
  ];

  const complianceStandards = [
    { name: 'ISO 22000:2018', icon: <Award className="w-5 h-5" />, color: '34, 197, 94' },
    { name: 'FDA Grade A PMO', icon: <CheckCircle2 className="w-5 h-5" />, color: '20, 184, 166' },
    { name: 'USDA FSIS 9 CFR 417', icon: <Globe className="w-5 h-5" />, color: '245, 158, 11' },
    { name: 'Codex Alimentarius', icon: <BookOpen className="w-5 h-5" />, color: '244, 63, 94' },
    { name: 'AIB International', icon: <Microscope className="w-5 h-5" />, color: '34, 197, 94' },
    { name: 'HACCP 7 Principles', icon: <Target className="w-5 h-5" />, color: '20, 184, 166' },
  ];

  return (
    <div className="min-h-screen bg-haccp-surface-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-haccp-food-pattern opacity-50" />
      <div className="absolute inset-0 bg-gradient-radial from-haccp-950/20 via-haccp-surface-950 to-haccp-teal-950/10" />
      
      {/* Floating 3D Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-20 animate-float"
          style={{ background: 'radial-gradient(circle, rgb(34, 197, 94) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 right-20 w-96 h-96 rounded-full blur-3xl opacity-15 animate-float"
          style={{ background: 'radial-gradient(circle, rgb(20, 184, 166) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute bottom-20 left-1/2 w-64 h-64 rounded-full blur-3xl opacity-15 animate-float"
          style={{ background: 'radial-gradient(circle, rgb(245, 158, 11) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.1, 1], rotate: [0, 3, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `rgba(${i % 3 === 0 ? '34, 197, 94' : i % 3 === 1 ? '20, 184, 166' : '245, 158, 11'}, ${0.3 + Math.random() * 0.4})`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0.3, 1, 0.3], 
              scale: [0.5, 1, 0.5],
              y: [0, -100, 0],
              x: [0, Math.random() * 40 - 20, 0]
            }}
            transition={{ 
              duration: 8 + Math.random() * 10, 
              repeat: Infinity, 
              ease: 'easeInOut',
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>

      {/* Header Navigation */}
      <header className="relative z-20 fixed top-0 left-0 right-0 z-50 bg-haccp-surface-950/80 backdrop-blur-xl border-b border-haccp-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link to="/" className="flex items-center gap-3" aria-label="Veritas HACCP Home">
              <motion.div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgb(34, 197, 94), rgb(20, 184, 166))' }}
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                whileHover={{ scale: 1.1, rotate: 180 }}
              >
                <Shield className="w-6 h-6 text-haccp-surface-950" />
              </motion.div>
              <span className="font-display font-black text-xl text-haccp-surface-50 hidden sm:block">
                {BRAND.name.toUpperCase()}
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                to="/dashboard" 
                className="text-haccp-surface-400 hover:text-haccp-300 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-haccp-surface-800/50"
              >
                Dashboard
              </Link>
              <Link 
                to="/dashboard?plan=milk" 
                className="text-haccp-surface-400 hover:text-haccp-300 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-haccp-surface-800/50"
              >
                Dairy
              </Link>
              <Link 
                to="/dashboard?plan=ice_cream" 
                className="text-haccp-surface-400 hover:text-haccp-300 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-haccp-surface-800/50"
              >
                Ice Cream
              </Link>
              <Link 
                to="/dashboard?plan=bakery" 
                className="text-haccp-surface-400 hover:text-haccp-300 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-haccp-surface-800/50"
              >
                Bakery
              </Link>
              <Link 
                to="/dashboard?plan=meat" 
                className="text-haccp-surface-400 hover:text-haccp-300 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-haccp-surface-800/50"
              >
                Meat
              </Link>
            </nav>
            
            <Link 
              to="/dashboard" 
              className="btn-primary hidden sm:inline-flex"
            >
              Launch Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Content */}
          <section className="mb-24" aria-labelledby="hero-title">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-center max-w-4xl mx-auto mb-16"
            >
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <motion.span
                  className="w-2 h-2 rounded-full"
                  style={{ background: 'rgb(34, 197, 94)' }}
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-sm font-bold text-haccp-300">LIVE • Food Safety Compliance Platform</span>
              </motion.div>
              
              <h1 
                id="hero-title"
                className="text-4xl md:text-6xl lg:text-7xl font-display font-black tracking-tight leading-tight mb-6"
              >
                <span className="block text-haccp-surface-50">Industrial Food Safety</span>
                <span className="block text-gradient">Compliance Engine</span>
              </h1>
              
              <motion.p
                className="text-lg md:text-xl text-haccp-surface-300 max-w-2xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Enterprise-grade HACCP management with real-time SCADA interlocks, 
                immutable audit trails, and automated corrective actions — built for 
                modern food manufacturing.
              </motion.p>
            </motion.div>

            {/* Hero Actions */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link 
                to="/dashboard?demo=true" 
                className="btn-primary group w-full sm:w-auto text-base py-4 px-8"
              >
                <Sparkles className="w-5 h-5" />
                <span>🚀 Quick Demo Mode</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              
              <Link 
                to="/dashboard" 
                className="btn-secondary group w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <PlayCircle className="w-5 h-5" />
                <span>Full Control Center</span>
              </Link>
            </motion.div>
          </section>

          {/* Quick Overview Section */}
          <section className="mb-16" aria-labelledby="overview-title">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center mb-8"
            >
              <h2 id="overview-title" className="text-2xl md:text-3xl font-display font-bold text-haccp-surface-50 mb-3">
                Platform Overview
              </h2>
              <p className="text-haccp-surface-400 max-w-2xl mx-auto">
                Enterprise-grade food safety compliance in one integrated system
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { 
                  icon: <Shield className="w-6 h-6" />,
                  title: '4 Production Lines',
                  desc: 'Dairy, Ice Cream, Bakery, Meat with certified CCPs',
                  color: '34, 197, 94',
                },
                { 
                  icon: <Cpu className="w-6 h-6" />,
                  title: 'Real-time SCADA',
                  desc: 'Live sensor telemetry & automated interlocks',
                  color: '20, 184, 166',
                },
                { 
                  icon: <Database className="w-6 h-6" />,
                  title: 'Immutable Audit Trail',
                  desc: 'SQLite WAL with cryptographic timestamps',
                  color: '245, 158, 11',
                },
                { 
                  icon: <Target className="w-6 h-6" />,
                  title: 'Regulatory Compliance',
                  desc: 'ISO 22000, FDA PMO, USDA FSIS aligned',
                  color: '244, 63, 94',
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * i }}
                  className="p-5 rounded-xl glass-card text-center"
                  style={{ borderColor: `rgba(${item.color}, 0.3)` }}
                >
                  <div 
                    className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                    style={{ background: `rgba(${item.color}, 0.15)`, border: `1px solid rgba(${item.color}, 0.3)` }}
                  >
                    <span style={{ color: `rgb(${item.color})` }}>{item.icon}</span>
                  </div>
                  <h3 className="font-bold text-haccp-surface-50 mb-1">{item.title}</h3>
                  <p className="text-xs text-haccp-surface-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Stats Section */}
          <section className="mb-16" aria-labelledby="stats-title">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
            >
              {stats.map((stat, i) => (
                <StatItem key={i} {...stat} />
              ))}
            </motion.div>
          </section>

          {/* Compliance Standards */}
          <section className="mb-16" aria-labelledby="standards-title">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center mb-8"
            >
              <h2 id="standards-title" className="text-2xl font-display font-bold text-haccp-surface-50 mb-3">
                Regulatory Compliance
              </h2>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-3"
            >
              {complianceStandards.map((standard, i) => (
                <motion.div
                  key={i}
                  className="px-4 py-2 rounded-xl glass-card text-center"
                  style={{ borderColor: `rgba(${standard.color}, 0.3)` }}
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-center gap-2">
                    <span style={{ color: `rgb(${standard.color})` }}>{standard.icon}</span>
                    <span className="text-sm font-semibold text-haccp-surface-50">{standard.name}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* Production Lines Showcase */}
          <section id="architecture" className="mb-16 scroll-mt-24" aria-labelledby="lines-title">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center mb-8"
            >
              <h2 id="lines-title" className="text-2xl md:text-3xl font-display font-bold text-haccp-surface-50 mb-3">
                Select Production Line
              </h2>
              <p className="text-haccp-surface-400 max-w-2xl mx-auto">
                Choose a certified line to enter the operations control center
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  id: 'milk', 
                  name: 'Fluid Milk & HTST', 
                  icon: <Droplet className="w-7 h-7" />,
                  color: '34, 197, 94',
                  ccps: 3,
                  standard: 'FDA PMO / ISO 22000',
                  delay: 0.1,
                },
                { 
                  id: 'ice_cream', 
                  name: 'Ice Cream & Frozen', 
                  icon: <Leaf className="w-7 h-7" />,
                  color: '20, 184, 166',
                  ccps: 3,
                  standard: 'Codex CXC 57 / ISO 22000',
                  delay: 0.2,
                },
                { 
                  id: 'bakery', 
                  name: 'Bakery & Extrusion', 
                  icon: <Flame className="w-7 h-7" />,
                  color: '245, 158, 11',
                  ccps: 3,
                  standard: 'AIB / ISO 22000',
                  delay: 0.3,
                },
                { 
                  id: 'meat', 
                  name: 'RTE Meats & Cook', 
                  icon: <Truck className="w-7 h-7" />,
                  color: '244, 63, 94',
                  ccps: 3,
                  standard: 'USDA FSIS / HACCP',
                  delay: 0.4,
                },
              ].map((line) => (
                <motion.div
                  key={line.id}
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, delay: line.delay, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="group relative p-6 rounded-2xl glass-card glass-card-hover overflow-hidden"
                  style={{ borderColor: `rgba(${line.color}, 0.3)` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[rgba(0,0,0,0)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                       style={{ background: `radial-gradient(ellipse at top right, rgba(${line.color}, 0.15) 0%, transparent 70%)` }} />
                  
                  <Link
                    to={`/dashboard?plan=${line.id}`}
                    className="relative z-10 block h-full"
                  >
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                      style={{ background: `rgba(${line.color}, 0.15)`, border: `1px solid rgba(${line.color}, 0.3)` }}
                    >
                      <span style={{ color: `rgb(${line.color})` }}>{line.icon}</span>
                    </div>
                    
                    <h3 className="text-lg font-display font-bold text-haccp-surface-50 mb-2 group-hover:text-haccp-300 transition-colors">
                      {line.name}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-sm text-haccp-surface-400 mb-4">
                      <span className="flex items-center gap-1">
                        <Shield className="w-4 h-4" style={{ color: `rgb(${line.color})` }} />
                        {line.ccps} CCPs
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-4 h-4" style={{ color: `rgb(${line.color})` }} />
                        Certified
                      </span>
                    </div>
                    
                    <p className="text-haccp-surface-500 text-xs font-mono mb-4">
                      {line.standard}
                    </p>
                    
                    <div className="inline-flex items-center gap-2 text-sm font-semibold transition-all duration-300 group-hover:gap-4"
                         style={{ color: `rgb(${line.color})` }}>
                      Enter Control Room
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                  
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(90deg, transparent, rgb(${line.color}), transparent)` }}
                  />
                </motion.div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="mb-12" aria-labelledby="cta-title">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative rounded-2xl overflow-hidden p-6 md:p-8 text-center"
              style={{ 
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(20, 184, 166, 0.15) 100%)',
                border: '1px solid rgba(34, 197, 94, 0.3)'
              }}
            >
              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 id="cta-title" className="text-2xl md:text-3xl font-display font-bold text-haccp-surface-50 mb-3">
                  Ready to Transform Your Food Safety Operations?
                </h2>
                <p className="text-haccp-surface-300 mb-6">
                  Real-time compliance, automated interlocks, and audit-ready documentation.
                </p>
                
                <Link to="/dashboard?demo=true" className="btn-primary group w-full sm:w-auto inline-flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Start Quick Demo</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </motion.div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-haccp-surface-800 bg-haccp-surface-950/50 backdrop-blur-xl py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" 
                   style={{ background: 'linear-gradient(135deg, rgb(34, 197, 94), rgb(20, 184, 166))' }}>
                <Shield className="w-4 h-4 text-haccp-surface-950" />
              </div>
              <span className="font-display font-bold text-haccp-surface-50">{BRAND.name}</span>
            </div>
            <p className="text-haccp-surface-500 text-sm font-mono">
              ISO 22000:2018 • FDA PMO • USDA FSIS Compliant
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;