function base64ToArrayBuffer(base64) {
  var binaryString = atob(base64);
  var bytes = new Uint8Array(binaryString.length);
  for (var i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

console.log("Hello from client");
const client = new WebTransport("https://127.0.0.1:4433", {
  serverCertificateHashes: [{
    algorithm: "sha-256",
    value: base64ToArrayBuffer("2BKrG2dqsSH2jyv1K9YmkPiuVlKzL7IbmiluEX8cuuU="),
  }],
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

console.log("Hello from client3");
// let mediaSource = new MediaSource();
// await new Promise((resolve) =>
//   mediaSource.addEventListener("sourceopen", resolve, { once: true })
// );
// const sourceBuffer = mediaSource.addSourceBuffer("audio/opus");

await writable
  .getWriter()
  .write(new TextEncoder().encode("Hello from Client!"));

await readable.pipeTo(consoleOutStream);

client.close();
