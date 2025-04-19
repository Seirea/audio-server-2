const client = new WebTransport("https://localhost:4433/");
await client.ready;
const { readable, writable } = await client.createBidirectionalStream();

const download_file = await Deno.open("downloaded.opus", {
  write: true,
  create: true,
});

const consoleOutStream = new WritableStream({
  write(chunk) {
    console.log(chunk);
  },
});

// let mediaSource = new MediaSource();
// await new Promise((resolve) =>
//   mediaSource.addEventListener("sourceopen", resolve, { once: true })
// );
// const sourceBuffer = mediaSource.addSourceBuffer("audio/opus");

await writable
  .getWriter()
  .write(new TextEncoder().encode("Hello from Client!"));

await readable.pipeTo(download_file.writable);

client.close();
