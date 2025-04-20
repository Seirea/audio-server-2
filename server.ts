const cert = Deno.readTextFileSync("./cert.pem");
const key = Deno.readTextFileSync("./key.pem");

import { serveDir } from "jsr:@std/http/file-server";
import {
  InitiateResponseSchema,
  InitiateSchema,
  PollRequestSchema,
  PollResponseSchema,
  ReponseType,
} from "./generated/streaming_pb.ts";
import { fromBinary, toBinary, create } from "npm:@bufbuild/protobuf";

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
      const reader = readable.getReader();
      const writer = writable.getWriter();

      // Read initial message
      const { value: initData } = await reader.read();
      const initMsg = fromBinary(InitiateSchema, initData!);

      // Handle track lookup
      const track = await findTrack(initMsg.trackId);
      if (!track) {
        await writer.write(
          toBinary(
            InitiateResponseSchema,
            create(InitiateResponseSchema, {
              type: ReponseType.FAILED_TO_LOCATE,
            })
          )
        );
        continue;
      }

      await writer.write(
        toBinary(
          InitiateResponseSchema,
          create(InitiateResponseSchema, {
            length: track.length,
            type: ReponseType.FAILED_TO_LOCATE,
          })
        )
      );

      // Handle polling requests
      while (true) {
        const { value: pollData, done } = await reader.read();
        if (done) break;

        const pollReq = fromBinary(PollRequestSchema, pollData!);

        try {
          const chunk = await readTrackChunk(
            track,
            pollReq.index,
            pollReq.length
          );
          await writer.write(
            toBinary(
              PollResponseSchema,
              create(PollResponseSchema, {
                type: ReponseType.SUCCESS,
                data: chunk,
              })
            )
          );
        } catch (_err) {
          await writer.write(
            toBinary(
              PollResponseSchema,
              create(PollResponseSchema, {
                type: ReponseType.OUT_OF_BOUNDS,
              })
            )
          );
          break;
        }
      }
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

async function findTrack(id: bigint) {
  // TODO: Implement track lookup
  return { length: 0 };
}

async function readTrackChunk(track: any, index: number, length: number) {
  // TODO: Implement actual track reading
  return new Uint8Array(length);
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
