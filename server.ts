const cert = Deno.readTextFileSync("./cert.pem");
const key = Deno.readTextFileSync("./key.pem");

import { serveDir, serveFile } from "jsr:@std/http/file-server";

const server = new Deno.QuicEndpoint({
  hostname: "0.0.0.0",
  port: 4433,
});

const listener = server.listen({
  cert,
  key,
  alpnProtocols: ["h3"],
});

async function handle(wt: WebTransport & { url: string }) {
  try {
    await wt.ready;

    for await (const {
      readable,
      writable,
    } of wt.incomingBidirectionalStreams) {
      const output = await Deno.open("out.opus", {
        read: true,
        write: false,
      });

      await output.readable.pipeTo(writable);
    }
  } catch (e) {
    console.log(e);
    console.trace();
  }

  return wt.closed.then(() => ({
    code: 0,
    reason: `Done streaming request`,
  }));
}

Deno.serve((req: Request) => {
  return serveDir(req);
});

for await (const conn of listener) {
  try {
    const wt: WebTransport & { url: string } = await Deno.upgradeWebTransport(
      conn
    );
    handle(wt)
      .then((session) => console.log(session))
      .catch((e) => console.log(e));
  } catch (e) {
    console.log(e);
  }
}

server.close();
