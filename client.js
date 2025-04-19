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
  serverCertificateHashes: [
    {
      algorithm: "sha-256",
      //value: base64ToArrayBuffer("2BKrG2dqsSH2jyv1K9YmkPiuVlKzL7IbmiluEX8cuuU="),
      value: new Uint8Array(
        "07:F5:D9:DC:76:2A:EE:16:B3:F1:FF:EA:1C:5C:67:CE:EA:74:8F:E6:78:2C:51:B6:5F:AF:CE:48:55:BE:84:68"
          .split(":")
          .map((el) => parseInt(el, 16))
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
