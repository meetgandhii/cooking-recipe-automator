import React, { useState, useRef } from "react";

const AudioRecorder = ({ onSave }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = (event) =>
      audioChunks.current.push(event.data);
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunks.current, { type: "audio/webm" });
      onSave(blob);
      audioChunks.current = [];
    };
    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  return (
    <div>
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-4 py-2 rounded ${
          isRecording ? "bg-red-500" : "bg-green-500"
        } text-white`}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
    </div>
  );
};

export default AudioRecorder;