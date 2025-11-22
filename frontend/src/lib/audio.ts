import { useRef, useState, useCallback } from 'react';

// Audio file configuration matching your structure
const AUDIO_FILES = {
  feet: [
    '/sounds/feet/feet-1.mp3',
    '/sounds/feet/feet-2.mp3',
    '/sounds/feet/feet-3.mp3',
    '/sounds/feet/feet-4.mp3',
    '/sounds/feet/feet-5.mp3',
  ],
  knee: [
    '/sounds/knee/knees-1.mp3',
    '/sounds/knee/knees-2.mp3',
    '/sounds/knee/knees-3.mp3',
    '/sounds/knee/knees-4.mp3',
    '/sounds/knee/knees-5.mp3',
  ],
  spine: [
    '/sounds/spine/spine-1.mp3',
    '/sounds/spine/spine-2.mp3',
    '/sounds/spine/spine-3.mp3',
    '/sounds/spine/spine-4.mp3',
    '/sounds/spine/spine-5.mp3',
  ],
};

const useAudioPlayer = (cooldownMs = 1000) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const cooldownTimerRef = useRef(null);

  const getRandomAudioFromCategory = useCallback((category) => {
    const files = AUDIO_FILES[category];
    if (!files || files.length === 0) {
      console.error(`Category "${category}" not found or empty`);
      return null;
    }
    const randomIndex = Math.floor(Math.random() * files.length);
    return files[randomIndex];
  }, []);

  const playAudioFromCategory = useCallback((category) => {
    if (isPlaying || isOnCooldown) {
      console.log('Audio blocked: already playing or on cooldown');
      return false;
    }

    const audioSrc = getRandomAudioFromCategory(category);
    if (!audioSrc) {
      return false;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(audioSrc);
    audioRef.current = audio;
    setIsPlaying(true);
    setCurrentCategory(category);

    console.log(`Playing from ${category}: ${audioSrc}`);

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentCategory(null);

      setIsOnCooldown(true);
      cooldownTimerRef.current = setTimeout(() => {
        setIsOnCooldown(false);
      }, cooldownMs);
    };

    audio.onerror = () => {
      console.error('Error playing audio');
      setIsPlaying(false);
      setCurrentCategory(null);
    };

    audio.play().catch(err => {
      console.error('Failed to play audio:', err);
      setIsPlaying(false);
      setCurrentCategory(null);
    });

    return true;
  }, [isPlaying, isOnCooldown, cooldownMs, getRandomAudioFromCategory]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentCategory(null);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
    }
  }, []);

  return {
    playAudioFromCategory,
    stopAudio,
    isPlaying,
    isOnCooldown,
    currentCategory,
    cleanup
  };
};

export default useAudioPlayer;
