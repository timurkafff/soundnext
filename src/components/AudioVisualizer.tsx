"use client";

import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  isPlaying: boolean;
  audioElement: HTMLAudioElement | null;
}

export default function AudioVisualizer({ isPlaying, audioElement }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Инициализация Web Audio API
  useEffect(() => {
    if (!audioElement || analyserRef.current) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaElementSource(audioElement);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;

      // Возобновляем контекст если suspended
      if (audioContext.state === 'suspended') {
        const resume = () => {
          audioContext.resume();
          document.removeEventListener('click', resume);
          document.removeEventListener('touchstart', resume);
        };
        document.addEventListener('click', resume);
        document.addEventListener('touchstart', resume);
      }

      console.log('Audio context initialized successfully');
    } catch (error) {
      console.error("Failed to create audio context:", error);
    }

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [audioElement]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Настройка canvas размера
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const bars = 80;
    const barHeights = Array(bars).fill(0);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / bars;
      const maxBarHeight = canvas.height * 0.4;

      // Получаем реальные данные аудио
      if (analyserRef.current && dataArrayRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        
        // Распределяем частоты по барам
        const step = Math.floor(dataArrayRef.current.length / bars);
        
        for (let i = 0; i < bars; i++) {
          const index = i * step;
          // Нормализуем от 0 до 1
          const value = dataArrayRef.current[index] / 255;
          // Плавная интерполяция
          barHeights[i] = barHeights[i] * 0.7 + value * 0.3;
        }
      } else {
        // Затухание когда не играет
        for (let i = 0; i < bars; i++) {
          barHeights[i] *= 0.95;
        }
      }

      // Рисуем бары
      for (let i = 0; i < bars; i++) {
        const barHeight = Math.max(barHeights[i] * maxBarHeight, 4); // Минимум 4px
        const x = i * barWidth;
        const y = canvas.height - barHeight;

        // Белый градиент
        const gradient = ctx.createLinearGradient(x, y, x, canvas.height);
        
        if (isPlaying) {
          gradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
          gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.6)");
          gradient.addColorStop(1, "rgba(255, 255, 255, 0.3)");
        } else {
          gradient.addColorStop(0, "rgba(255, 255, 255, 0.2)");
          gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.1)");
          gradient.addColorStop(1, "rgba(255, 255, 255, 0.05)");
        }

        ctx.fillStyle = gradient;
        
        // Рисуем бар с закругленными краями
        const radius = 2;
        ctx.beginPath();
        ctx.moveTo(x, canvas.height);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.lineTo(x + barWidth - 2 - radius, y);
        ctx.quadraticCurveTo(x + barWidth - 2, y, x + barWidth - 2, y + radius);
        ctx.lineTo(x + barWidth - 2, canvas.height);
        ctx.closePath();
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}

