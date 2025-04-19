const client = new WebTransport("https://localhost:4433/path");
await client.ready;
const { readable, writable } = await client.createBidirectionalStream();

const consoleOutStream = new WritableStream({
  write(chunk) {
    console.log(chunk);
  },
});

await writable
  .getWriter()
  .write(new TextEncoder().encode("Hello from Client!"));

await readable.pipeThrough(new TextDecoderStream()).pipeTo(consoleOutStream);

client.close();
