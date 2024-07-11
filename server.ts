import 'dotenv/config';
import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

export function expressApp(): express.Express {
    const server = express();
    const serverDistFolder = dirname(fileURLToPath(import.meta.url));
    const browserDistFolder = resolve(serverDistFolder, '../browser');
    const indexHtml = join(serverDistFolder, 'index.server.html');

    const commonEngine = new CommonEngine();

    server.set('view engine', 'html');
    server.set('views', browserDistFolder);

    server.get('**', express.static(browserDistFolder, { maxAge: '1y', index: 'index.html' }));

    server.get('**', (req, res, next) => {
        const { protocol, originalUrl, baseUrl, headers } = req;

        commonEngine
            .render({
                bootstrap,
                documentFilePath: indexHtml,
                url: `${protocol}://${headers.host}${originalUrl}`,
                publicPath: browserDistFolder,
                providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
            })
            .then((html) => res.send(html))
            .catch((err) => next(err));
    });

    return server;
}

function run(): void {
    const port = 3000;

    const app = expressApp();

    const httpServer = createServer(app);

    const io = new Server(httpServer, { pingInterval: 2000, pingTimeout: 3000 });

    io.on('connection', (socket: any) => {
        console.log('a user connected');
        socket.on('disconnect', (reason: any) => console.log('a user disconnected', reason));
    });

    httpServer.listen(port, () => console.log(`Node Express server listening on http://localhost:${port}`));
}

run();
