'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Play, Pause, Volume2, Mic, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceIntroProps {
    audioUrl?: string;
    userName?: string;
    isRecording?: boolean;
    onRecordComplete?: (blob: Blob) => void;
    className?: string;
    compact?: boolean;
}

export default function VoiceIntro({
    audioUrl,
    userName = 'Partner',
    isRecording: isRecordingMode = false,
    onRecordComplete,
    className,
    compact = false
}: VoiceIntroProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Waveform bars animation
    const waveformBars = 12;

    useEffect(() => {
        if (audioUrl) {
            audioRef.current = new Audio(audioUrl);
            audioRef.current.addEventListener('loadedmetadata', () => {
                setDuration(audioRef.current?.duration || 0);
            });
            audioRef.current.addEventListener('timeupdate', () => {
                if (audioRef.current) {
                    setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
                }
            });
            audioRef.current.addEventListener('ended', () => {
                setIsPlaying(false);
                setProgress(0);
            });
        }
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [audioUrl]);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                onRecordComplete?.(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Auto stop after 15 seconds
            intervalRef.current = setInterval(() => {
                setRecordingTime((prev) => {
                    if (prev >= 15) {
                        stopRecording();
                        return 15;
                    }
                    return prev + 1;
                });
            }, 1000);
        } catch (err) {
            console.error('Failed to start recording:', err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Recording mode UI
    if (isRecordingMode) {
        return (
            <div className={cn('bg-gradient-to-r from-primary-50 to-purple-50 rounded-2xl p-4', className)}>
                <div className="flex items-center gap-4">
                    <motion.button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={cn(
                            'w-14 h-14 rounded-full flex items-center justify-center shadow-lg',
                            isRecording
                                ? 'bg-red-500 text-white'
                                : 'bg-primary-500 text-white'
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {isRecording ? (
                            <StopCircle className="w-6 h-6" />
                        ) : (
                            <Mic className="w-6 h-6" />
                        )}
                    </motion.button>

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            {isRecording && (
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    <span className="text-red-500 font-medium text-sm">Đang ghi...</span>
                                </span>
                            )}
                            <span className="text-gray-600 text-sm">
                                {isRecording ? `${formatTime(recordingTime)} / 0:15` : 'Giới thiệu bằng giọng nói (tối đa 15s)'}
                            </span>
                        </div>

                        {/* Waveform visualization */}
                        <div className="flex items-center gap-1 h-8">
                            {Array.from({ length: waveformBars }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    className={cn(
                                        'w-1.5 rounded-full',
                                        isRecording ? 'bg-primary-500' : 'bg-gray-300'
                                    )}
                                    animate={isRecording ? {
                                        height: [8, Math.random() * 24 + 8, 8],
                                    } : { height: 8 }}
                                    transition={{
                                        duration: 0.3,
                                        repeat: isRecording ? Infinity : 0,
                                        delay: i * 0.05,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Playback mode UI
    if (!audioUrl) {
        return null;
    }

    if (compact) {
        return (
            <motion.button
                onClick={togglePlay}
                className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
                    'bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors',
                    className
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                {isPlaying ? (
                    <Pause className="w-4 h-4" />
                ) : (
                    <Volume2 className="w-4 h-4" />
                )}
                <span>Nghe giọng</span>
            </motion.button>
        );
    }

    return (
        <div className={cn(
            'bg-gradient-to-r from-primary-50 to-purple-50 rounded-2xl p-4',
            className
        )}>
            <div className="flex items-center gap-4">
                <motion.button
                    onClick={togglePlay}
                    className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-primary-500/30"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <AnimatePresence mode="wait">
                        {isPlaying ? (
                            <motion.div
                                key="pause"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                            >
                                <Pause className="w-5 h-5" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="play"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                            >
                                <Play className="w-5 h-5 ml-0.5" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>

                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                            🎙️ {userName} gửi lời chào
                        </span>
                        <span className="text-xs text-gray-500">
                            {formatTime(duration * (progress / 100))} / {formatTime(duration)}
                        </span>
                    </div>

                    {/* Waveform with progress */}
                    <div className="relative flex items-center gap-0.5 h-6">
                        {Array.from({ length: waveformBars }).map((_, i) => {
                            const barProgress = (i / waveformBars) * 100;
                            const isActive = barProgress <= progress;
                            return (
                                <motion.div
                                    key={i}
                                    className={cn(
                                        'flex-1 rounded-full transition-colors',
                                        isActive ? 'bg-primary-500' : 'bg-gray-300'
                                    )}
                                    animate={isPlaying ? {
                                        height: [8, Math.random() * 20 + 8, 8],
                                    } : { height: 12 }}
                                    transition={{
                                        duration: 0.4,
                                        repeat: isPlaying ? Infinity : 0,
                                        delay: i * 0.03,
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
