export async function extractAudioClipBase64(file: File, durationSeconds: number): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Use a temporary AudioContext to decode
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioContextClass();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  
  // target duration is either requested duration or full file, whichever is smaller
  const actualDuration = Math.min(durationSeconds, audioBuffer.duration);
  const targetSampleRate = 16000; // 16kHz for voice processing (keeps size small)
  
  // Create an offline context to mix down to mono and resample to 16kHz
  const offlineCtx = new OfflineAudioContext(1, targetSampleRate * actualDuration, targetSampleRate);
  
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start(0);
  
  const renderedBuffer = await offlineCtx.startRendering();
  
  // Cleanup original context
  audioCtx.close();
  
  // Convert to WAV
  const wavArrayBuffer = audioBufferToWav(renderedBuffer);
  
  // Convert ArrayBuffer to Base64 (using chunks to avoid stack overflow on large arrays)
  const bytes = new Uint8Array(wavArrayBuffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as any);
  }
  
  return window.btoa(binary);
}

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = 1; // mono
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const channelData = buffer.getChannelData(0);
  
  const dataLength = channelData.length * (bitDepth / 8);
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // RIFF Chunk
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true); // chunk size
  writeString(view, 8, 'WAVE');
  
  // fmt Subchunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);             // Subchunk1Size (16 for PCM)
  view.setUint16(20, format, true);         // AudioFormat
  view.setUint16(22, numChannels, true);    // NumChannels
  view.setUint32(24, sampleRate, true);     // SampleRate
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true); // ByteRate
  view.setUint16(32, numChannels * (bitDepth / 8), true); // BlockAlign
  view.setUint16(34, bitDepth, true);       // BitsPerSample
  
  // data Subchunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < channelData.length; i++) {
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    // Scale to 16 bit signed int
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }

  return arrayBuffer;
}
