import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Loader2, CheckCircle2, XCircle, Volume2, Play, Square, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';

type TestState = 'idle' | 'recording' | 'recorded' | 'playing' | 'error';

interface MicrophoneTestProps {
  onTestComplete?: (success: boolean) => void;
}

export const MicrophoneTest: React.FC<MicrophoneTestProps> = ({ onTestComplete }) => {
  const [testState, setTestState] = useState<TestState>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef<string | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_RECORDING_TIME = 5; // 5 seconds max

  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    analyserRef.current = null;
  }, []);

  const cleanupAudio = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    chunksRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
      cleanupAudio();
    };
  }, [cleanup, cleanupAudio]);

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const normalizedLevel = Math.min(100, (average / 128) * 100);
    
    setAudioLevel(normalizedLevel);
    animationRef.current = requestAnimationFrame(updateAudioLevel);
  }, []);

  const startRecording = useCallback(async () => {
    cleanup();
    cleanupAudio();
    setTestState('recording');
    setErrorMessage('');
    setAudioLevel(0);
    setRecordingTime(0);
    chunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording is not supported on this device/browser');
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          }
        });
      } catch (constraintError) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      streamRef.current = stream;

      // Set up audio analysis
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      source.connect(analyser);

      // Set up MediaRecorder
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = '';
          }
        }
      }

      const recorderOptions: MediaRecorderOptions = {};
      if (mimeType) {
        recorderOptions.mimeType = mimeType;
      }

      const mediaRecorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        audioUrlRef.current = URL.createObjectURL(blob);
        setTestState('recorded');
        onTestComplete?.(true);
      };

      mediaRecorder.start();
      updateAudioLevel();

      // Recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_RECORDING_TIME - 1) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error: any) {
      cleanup();
      setTestState('error');
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        if (Capacitor.isNativePlatform()) {
          setErrorMessage('Microphone access denied. Please enable microphone in your device settings.');
        } else {
          setErrorMessage('Microphone access denied. Please allow access in your browser settings.');
        }
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setErrorMessage('No microphone found. Please connect a microphone.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setErrorMessage('Microphone is in use by another app.');
      } else {
        setErrorMessage(error.message || 'Could not access microphone.');
      }
      
      onTestComplete?.(false);
    }
  }, [cleanup, cleanupAudio, updateAudioLevel, onTestComplete]);

  const stopRecording = useCallback(() => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const playRecording = useCallback(() => {
    if (!audioUrlRef.current) return;

    const audio = new Audio(audioUrlRef.current);
    audioElementRef.current = audio;
    
    audio.onplay = () => setTestState('playing');
    audio.onended = () => {
      setTestState('recorded');
      setPlaybackProgress(0);
    };
    audio.ontimeupdate = () => {
      if (audio.duration) {
        setPlaybackProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.play();
  }, []);

  const stopPlayback = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      audioElementRef.current = null;
    }
    setTestState('recorded');
    setPlaybackProgress(0);
  }, []);

  const resetTest = useCallback(() => {
    cleanup();
    cleanupAudio();
    setTestState('idle');
    setAudioLevel(0);
    setRecordingTime(0);
    setPlaybackProgress(0);
    setErrorMessage('');
  }, [cleanup, cleanupAudio]);

  return (
    <div className="space-y-4">
      {/* Status display */}
      <div className={cn(
        'p-4 rounded-xl border-2 transition-all',
        testState === 'recorded' && 'border-green-500/50 bg-green-500/10',
        testState === 'playing' && 'border-primary/50 bg-primary/10',
        testState === 'error' && 'border-destructive/50 bg-destructive/10',
        testState === 'recording' && 'border-primary/50 bg-primary/10',
        testState === 'idle' && 'border-muted bg-muted/50'
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
            testState === 'recorded' && 'bg-green-500/20',
            testState === 'playing' && 'bg-primary/20',
            testState === 'error' && 'bg-destructive/20',
            testState === 'recording' && 'bg-primary/20 animate-pulse',
            testState === 'idle' && 'bg-muted'
          )}>
            {testState === 'recording' ? (
              <Mic className="w-6 h-6 text-primary" />
            ) : testState === 'recorded' ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : testState === 'playing' ? (
              <Volume2 className="w-6 h-6 text-primary" />
            ) : testState === 'error' ? (
              <XCircle className="w-6 h-6 text-destructive" />
            ) : (
              <MicOff className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-semibold">
              {testState === 'recording' && `Recording... ${recordingTime}s / ${MAX_RECORDING_TIME}s`}
              {testState === 'recorded' && 'Recording complete!'}
              {testState === 'playing' && 'Playing back...'}
              {testState === 'error' && 'Test failed'}
              {testState === 'idle' && 'Microphone test'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {testState === 'recording' && 'Speak into your microphone'}
              {testState === 'recorded' && 'Press play to hear your recording'}
              {testState === 'playing' && 'Listening to your recording'}
              {testState === 'error' && errorMessage}
              {testState === 'idle' && 'Record up to 5 seconds to test'}
            </p>
          </div>
        </div>

        {/* Audio level indicator for recording */}
        {testState === 'recording' && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Audio Level</span>
            </div>
            <Progress value={audioLevel} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              {audioLevel > 30 ? '🎤 Sound detected!' : 'Speak into your microphone...'}
            </p>
          </div>
        )}

        {/* Playback progress */}
        {testState === 'playing' && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Playback</span>
            </div>
            <Progress value={playbackProgress} className="h-2" />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {testState === 'idle' && (
          <Button
            onClick={startRecording}
            className="flex-1 rounded-xl"
            size="lg"
          >
            <Mic className="w-5 h-5 mr-2" />
            Start Recording
          </Button>
        )}

        {testState === 'recording' && (
          <Button
            onClick={stopRecording}
            variant="destructive"
            className="flex-1 rounded-xl"
            size="lg"
          >
            <Square className="w-5 h-5 mr-2" />
            Stop Recording
          </Button>
        )}

        {testState === 'recorded' && (
          <>
            <Button
              onClick={playRecording}
              className="flex-1 rounded-xl"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Play Recording
            </Button>
            <Button
              onClick={resetTest}
              variant="outline"
              className="rounded-xl"
              size="lg"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </>
        )}

        {testState === 'playing' && (
          <>
            <Button
              onClick={stopPlayback}
              variant="secondary"
              className="flex-1 rounded-xl"
              size="lg"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop
            </Button>
            <Button
              onClick={resetTest}
              variant="outline"
              className="rounded-xl"
              size="lg"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </>
        )}

        {testState === 'error' && (
          <Button
            onClick={startRecording}
            className="flex-1 rounded-xl"
            size="lg"
          >
            <Mic className="w-5 h-5 mr-2" />
            Retry
          </Button>
        )}
      </div>

      {/* Help text */}
      {testState === 'error' && Capacitor.isNativePlatform() && (
        <p className="text-xs text-center text-muted-foreground">
          On mobile, go to Settings → Apps → AURA → Permissions → Microphone
        </p>
      )}
    </div>
  );
};
