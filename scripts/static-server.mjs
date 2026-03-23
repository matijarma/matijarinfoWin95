import { createServer } from "node:http";
import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const cwd = process.cwd();
const normalizedRoot = path.resolve(cwd);

function parsePort(args) {
  const portFlagIndex = args.indexOf("--port");

  if (portFlagIndex === -1) {
    return 4173;
  }

  const nextValue = Number(args[portFlagIndex + 1]);

  if (!Number.isInteger(nextValue) || nextValue <= 0) {
    throw new Error("Invalid --port value.");
  }

  return nextValue;
}

function safeResolvePath(urlPathname) {
  const decodedPath = decodeURIComponent(urlPathname);
  const absolutePath = path.resolve(normalizedRoot, `.${decodedPath}`);

  if (!absolutePath.startsWith(normalizedRoot)) {
    return null;
  }

  return absolutePath;
}

async function resolveFilePath(urlPathname) {
  const initialPath = safeResolvePath(urlPathname);

  if (!initialPath) {
    return null;
  }

  let targetPath = initialPath;

  try {
    const entryStat = await stat(targetPath);

    if (entryStat.isDirectory()) {
      targetPath = path.join(targetPath, "index.html");
    }
  } catch {
    if (urlPathname === "/") {
      targetPath = path.join(normalizedRoot, "index.html");
    }
  }

  try {
    await access(targetPath);
  } catch {
    return null;
  }

  return targetPath;
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || "/", "http://localhost");
    const filePath = await resolveFilePath(requestUrl.pathname);

    if (!filePath) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not Found");
      return;
    }

    const extname = path.extname(filePath).toLowerCase();
    const mimeType = MIME_TYPES[extname] || "application/octet-stream";
    const fileBuffer = await readFile(filePath);

    response.writeHead(200, { "content-type": mimeType });
    response.end(fileBuffer);
  } catch (error) {
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end(`Server error: ${error.message}`);
  }
});

const port = parsePort(process.argv.slice(2));

server.listen(port, "127.0.0.1", () => {
  console.log(`Static server listening at http://127.0.0.1:${port}`);
});

const shutdown = () => {
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
