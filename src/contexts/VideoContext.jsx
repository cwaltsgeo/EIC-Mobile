import { createContext, useState, useRef } from 'react';

export const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoElementRef = useRef(null);

  const playVideo = () => {
    if (videoElementRef.current) {
        console.log(videoElementRef.current.content);
      videoElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseVideo = () => {
    if (videoElementRef.current) {
      videoElementRef.current.pause();
      setIsPlaying(false);
      setCurrentTime(videoElementRef.current.currentTime);
    }
  };

  const seekVideo = (time) => {
    if (videoElementRef.current) {
      videoElementRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return (
    <VideoContext.Provider
      value={{
        isPlaying,
        currentTime,
        playVideo,
        pauseVideo,
        seekVideo,
        videoElementRef,
      }}
    >
      {children}
    </VideoContext.Provider>
  );
};
