console.log("Hello from client");
const decoder = new window["ogg-opus-decoder"].OggOpusDecoderWebWorker();
await decoder.ready;
console.log("Opus decoder ready");

const client = new WebTransport("https://127.0.0.1:4433", {
  serverCertificateHashes: [
    {
      algorithm: "sha-256",
      //value: base64ToArrayBuffer("2BKrG2dqsSH2jyv1K9YmkPiuVlKzL7IbmiluEX8cuuU="),
      value: new Uint8Array(
        "6C:0A:C3:63:04:39:75:25:64:98:8F:01:81:0F:1B:43:C0:9F:7D:AE:33:08:79:AE:82:95:66:63:1F:D3:3D:1F"
          .split(":")
          .map((el) => parseInt(el, 16)),
      ),
    },
  ],
});

await client.ready;
console.log("WebTransport ready");

const { readable, writable } = await client.createBidirectionalStream();
console.log("Stream Created");

const consoleOutStream = new WritableStream({
  write(chunk) {
    console.log(chunk);
  },
});

let audioContext = new AudioContext({
  latencyHint: "interactive",
});

window.resumeAudioContext = async function () {
  console.log("started audio playing!");
  await startFeelzing();
};

await writable
  .getWriter()
  .write(new TextEncoder().encode("Hello from Client!"));

const reader = readable.getReader();

async function startFeelzing() {
  let offset = audioContext.currentTime;
  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      const res = await decoder.flush();

      console.log("Final out:", res);

      await decoder.reset();
      break;
    }

    const { channelData, samplesDecoded, sampleRate } = await decoder.decode(
      value,
    );

    console.log(`Decoded ${samplesDecoded} samples!`);

    const bufferSource = audioContext.createBufferSource();
    const audioBuffer = audioContext.createBuffer(
      channelData.length,
      samplesDecoded,
      sampleRate,
    );

    channelData.forEach((channel, idx) => {
      audioBuffer.getChannelData(idx).set(channel);
    });

    bufferSource.buffer = audioBuffer;
    bufferSource.connect(audioContext.destination);

    console.log("STARING WITH OFFSET:", offset);
    bufferSource.start(offset);

    offset += audioBuffer.duration;
  }

  client.close();
}
