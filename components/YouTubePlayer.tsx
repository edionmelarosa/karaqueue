"use client";

import Script from "next/script";
import { useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface Props {
  videoId: string | null;
  startedAt?: number;
  onEnded?: () => void;
}

export default function YouTubePlayer({ videoId, startedAt, onEnded }: Props) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const readyRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const startedAtRef = useRef(startedAt);
  startedAtRef.current = startedAt;

  const createPlayer = useCallback((vid: string) => {
    if (!containerRef.current) return;
    if (playerRef.current) {
      playerRef.current.destroy();
    }
    const elapsedSeconds = startedAtRef.current
      ? Math.floor((Date.now() - startedAtRef.current) / 1000)
      : 0;
    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId: vid,
      playerVars: { autoplay: 1, controls: 1, rel: 0, origin: window.location.origin, start: elapsedSeconds },
      events: {
        onReady: (e: any) => e.target.playVideo(),
        onStateChange: (e: any) => {
          if (e.data === window.YT.PlayerState.ENDED) {
            onEndedRef.current?.();
          }
        },
      },
    });
  }, []);

  const initPlayer = useCallback(() => {
    readyRef.current = true;
    if (videoId) createPlayer(videoId);
  }, [videoId, createPlayer]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.YT?.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }
    return () => {
      playerRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!readyRef.current || !window.YT?.Player) return;
    if (videoId) {
      createPlayer(videoId);
    } else {
      playerRef.current?.stopVideo();
    }
  }, [videoId, createPlayer]);

  return (
    <>
      <Script src="https://www.youtube.com/iframe_api" strategy="afterInteractive" />
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        {videoId ? (
          <div ref={containerRef} className="w-full h-full" />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-gray-500 text-lg">
            <span>Add a song to start</span>
          </div>
        )}
      </div>
    </>
  );
}
