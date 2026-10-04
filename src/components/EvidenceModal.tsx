import React, { useState, useRef, useEffect } from 'react';
import { X, Mic, Square, Play, Pause, Camera, Video, Hash, FileText, Check, Upload, Trash2 } from 'lucide-react';
import { Task, EvidenceItem, TaskCategory } from '../types';

interface EvidenceModalProps {
  task: Task;
  dayNumber: number;
  dateStr: string;
  onSave: (evidence: Omit<EvidenceItem, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  initialMilestone?: 1 | 7 | 30 | 90 | 180 | 365;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  task,
  dayNumber,
  dateStr,
  onSave,
  onClose,
  initialMilestone,
}) => {
  const [evidenceType, setEvidenceType] = useState<'audio' | 'photo' | 'video' | 'metric' | 'observation'>(
    task.evidenceTypePrompt || 'observation'
  );
  const [metricValue, setMetricValue] = useState<string>('');
  const [metricUnit, setMetricUnit] = useState<string>(task.metricUnit || 'BPM');
  const [observation, setObservation] = useState<string>('');
  const [mediaDataUrl, setMediaDataUrl] = useState<string | null>(null);
  const [mediaName, setMediaName] = useState<string>('');
  const [milestone, setMilestone] = useState<1 | 7 | 30 | 90 | 180 | 365 | undefined>(initialMilestone);

  // Audio Recording State
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Audio recording handlers
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaDataUrl(reader.result as string);
          setMediaName(`audio_${task.category.toLowerCase()}_dia_${String(dayNumber).padStart(3, '0')}.webm`);
        };
        reader.readAsDataURL(audioBlob);

        // Stop media tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecordingAudio(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      alert('Não foi possível acessar o microfone. Verifique as permissões de áudio.');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleTogglePlayAudio = () => {
    if (!audioPlayerRef.current && mediaDataUrl) {
      const audio = new Audio(mediaDataUrl);
      audioPlayerRef.current = audio;
      audio.onended = () => setIsPlayingAudio(false);
    }

    if (audioPlayerRef.current) {
      if (isPlayingAudio) {
        audioPlayerRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioPlayerRef.current.play();
        setIsPlayingAudio(true);
      }
    }
  };

  const handleSave = () => {
    const year = new Date().getFullYear();
    const formattedDay = `Dia_${String(dayNumber).padStart(3, '0')}`;
    const drivePath = `10 MINUTOS/${year}/${task.category}/${formattedDay}/${mediaName || 'evidencia'}`;

    onSave({
      taskId: task.id,
      taskName: task.name,
      category: task.category,
      date: dateStr,
      dayNumber,
      milestone,
      type: evidenceType,
      metricValue: metricValue ? parseFloat(metricValue) : undefined,
      metricUnit: metricValue ? metricUnit : undefined,
      mediaDataUrl: mediaDataUrl || undefined,
      mediaName: mediaName || undefined,
      observation: observation.trim() || undefined,
      driveSyncStatus: 'local_only',
      drivePath,
    });

    onClose();
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono-numeric uppercase tracking-wider text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                PROVA DE EXECUÇÃO • DIA {dayNumber}
              </span>
              {milestone && (
                <span className="text-[11px] font-mono-numeric uppercase tracking-wider text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                  MARCO DIA {milestone}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white mt-1">{task.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Milestone selector pill */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2 font-mono-numeric">
              Marco de Evolução (opcional)
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {[1, 7, 30, 90, 180, 365].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMilestone(milestone === m ? undefined : (m as 1 | 7 | 30 | 90 | 180 | 365))}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono-numeric font-bold transition text-center border ${
                    milestone === m
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  D{m}
                </button>
              ))}
            </div>
          </div>

          {/* Evidence Type Selector */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2 font-mono-numeric">
              Tipo de Evidência
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { type: 'audio', label: 'Áudio', icon: Mic },
                { type: 'metric', label: 'Métrica', icon: Hash },
                { type: 'photo', label: 'Foto', icon: Camera },
                { type: 'video', label: 'Vídeo', icon: Video },
                { type: 'observation', label: 'Nota', icon: FileText },
              ].map((item) => {
                const Icon = item.icon;
                const active = evidenceType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      setEvidenceType(item.type as any);
                      setMediaDataUrl(null);
                      setMediaName('');
                    }}
                    className={`py-2 px-1 flex flex-col items-center justify-center space-y-1 rounded-xl text-xs font-medium border transition ${
                      active
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Type-Specific Input */}
          {/* 1. AUDIO RECORDING */}
          {evidenceType === 'audio' && (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-center space-y-3">
              <div className="text-xs text-zinc-400 font-mono-numeric">
                Gravação de voz, dicção, canto ou instrumento
              </div>

              {!mediaDataUrl ? (
                <div className="flex flex-col items-center justify-center py-4">
                  {isRecordingAudio ? (
                    <div className="flex flex-col items-center space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="h-3 w-3 rounded-full bg-red-500 animate-ping" />
                        <span className="text-xl font-mono-numeric font-bold text-red-400">
                          {formatSeconds(recordingSeconds)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={stopAudioRecording}
                        className="py-2.5 px-6 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs flex items-center space-x-2 transition active:scale-95"
                      >
                        <Square className="w-4 h-4 fill-current" />
                        <span>PARAR GRAVAÇÃO</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={startAudioRecording}
                      className="py-3 px-6 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs flex items-center space-x-2 border border-zinc-700 transition active:scale-95"
                    >
                      <Mic className="w-4 h-4 text-emerald-400" />
                      <span>GRAVAR ÁUDIO AGORA</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={handleTogglePlayAudio}
                      className="w-9 h-9 rounded-lg bg-emerald-500 text-black flex items-center justify-center font-bold"
                    >
                      {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <div className="text-left">
                      <div className="text-xs font-semibold text-zinc-200">{mediaName}</div>
                      <div className="text-[11px] text-zinc-500 font-mono-numeric">Áudio pronto para salvar</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaDataUrl(null);
                      setMediaName('');
                    }}
                    className="p-2 text-zinc-500 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. METRIC VALUE */}
          {evidenceType === 'metric' && (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-3">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block font-mono-numeric">
                Valor medido da execução
              </label>
              <div className="flex space-x-3">
                <input
                  type="number"
                  step="any"
                  placeholder="Ex: 80, 25, 120..."
                  value={metricValue}
                  onChange={(e) => setMetricValue(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-lg font-mono-numeric text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Unidade (BPM, reps, kg)"
                  value={metricUnit}
                  onChange={(e) => setMetricUnit(e.target.value)}
                  className="w-32 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-sm font-mono-numeric text-zinc-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {['BPM', 'Repetições', 'kg', 'Páginas', 'Segundos'].map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setMetricUnit(unit)}
                    className="text-[11px] px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50"
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. PHOTO UPLOAD / CAMERA */}
          {evidenceType === 'photo' && (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              {!mediaDataUrl ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl flex flex-col items-center justify-center space-y-2 text-zinc-400 hover:text-zinc-200 transition"
                >
                  <Camera className="w-8 h-8 text-emerald-500/70" />
                  <span className="text-xs font-semibold">Tirar Foto ou Escolher Imagem</span>
                  <span className="text-[10px] text-zinc-500">Postura, anotação ou resultado</span>
                </button>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-zinc-800 max-h-48 flex items-center justify-center bg-black">
                  <img src={mediaDataUrl} alt="Evidência" className="max-h-48 object-contain" />
                  <button
                    type="button"
                    onClick={() => {
                      setMediaDataUrl(null);
                      setMediaName('');
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-red-400 rounded-lg backdrop-blur-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 4. VIDEO UPLOAD */}
          {evidenceType === 'video' && (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              {!mediaDataUrl ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl flex flex-col items-center justify-center space-y-2 text-zinc-400 hover:text-zinc-200 transition"
                >
                  <Video className="w-8 h-8 text-blue-500/70" />
                  <span className="text-xs font-semibold">Anexar ou Gravar Vídeo</span>
                  <span className="text-[10px] text-zinc-500">Execução técnica de instrumento ou treino</span>
                </button>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-zinc-800 max-h-48 flex items-center justify-center bg-black">
                  <video src={mediaDataUrl} controls className="max-h-48 w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => {
                      setMediaDataUrl(null);
                      setMediaName('');
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-red-400 rounded-lg backdrop-blur-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Observation / Notes Field */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2 font-mono-numeric">
              Observação Concreta da Execução
            </label>
            <textarea
              rows={3}
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="O que funcionou? Qual foi o ajuste feito? Qual foi o limite atingido?"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Drive target structure preview */}
          <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-900 text-[11px] text-zinc-500 font-mono-numeric flex items-center justify-between">
            <span>Pasta Google Drive:</span>
            <span className="text-zinc-400 truncate max-w-[220px]">
              10 MINUTOS/{new Date().getFullYear()}/{task.category}/Dia_{String(dayNumber).padStart(3, '0')}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-end space-x-3 bg-zinc-950">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition"
          >
            Pular Evidência
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center space-x-2 transition active:scale-95 shadow-md shadow-emerald-500/20"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>SALVAR EVIDÊNCIA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
