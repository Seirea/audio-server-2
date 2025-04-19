console.log("Hello from client");
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

console.log("Hello from client1.1");
await client.ready;
console.log("Hello from client1.2");
const { readable, writable } = await client.createBidirectionalStream();

console.log("Hello from client2");
const consoleOutStream = new WritableStream({
  write(chunk) {
    console.log(chunk);
  },
});

console.log("Hello from client4");

let mediaSource = new MediaSource();
let feelz = document.getElementById("sentir");
feelz.src = URL.createObjectURL(mediaSource);
await new Promise((resolve) =>
  mediaSource.addEventListener("sourceopen", resolve, { once: true })
);
const sourceBuffer = mediaSource.addSourceBuffer('audio/webm;codecs="opus"');

await writable
  .getWriter()
  .write(new TextEncoder().encode("Hello from Client!"));

const reader = readable.getReader();

while (true) {
  const { done, value } = await reader.read();

  console.log("READ", done, value);

  if (done) {
    if (mediaSource.readyState === "open") {
      mediaSource.endOfStream();
    }
    break;
  }

  // Append the received data chunk to the SourceBuffer
  try {
    // Wait for the previous append operation to finish if updating
    if (sourceBuffer.updating) {
      await new Promise((resolve) =>
        sourceBuffer.addEventListener("updateend", resolve, { once: true })
      );
    }
    sourceBuffer.appendBuffer(value);
  } catch (error) {
    console.error("Error appending buffer:", error);
    console.log("ENDING MEDIA SOURCE NOW!");
    // Handle errors, potentially close the MediaSource
    if (mediaSource.readyState === "open") {
      mediaSource.endOfStream("decode"); // Or 'network' depending on the error
    }
    break;
  }
}

client.close();
