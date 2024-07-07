import { isPlatformServer } from '@angular/common';
import { ApplicationRef, Component, Inject, NgZone, PLATFORM_ID, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { first } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',
})
export class AppComponent {
    private socket?: Socket;
    public isConnected = signal<boolean>(false);

    constructor(
        @Inject(PLATFORM_ID) private platformId: Object,
        private appRef: ApplicationRef,
        private zone: NgZone,
    ) {}

    ngOnInit(): void {
        this.appRef.isStable.pipe(first(Boolean)).subscribe(() => this.connect());
    }

    private connect() {
        if (isPlatformServer(this.platformId)) return;
        this.zone.runOutsideAngular(() => {
            this.socket = io();
            this.socket.on('connect', () => {
                this.isConnected.set(this.socket!.connected);
                console.log('WebSocket Connected');
            });
            this.socket.on('disconnect', (reason) => {
                this.isConnected.set(this.socket!.connected);
                console.log('WebSocket disconnected', reason);
            });
            this.socket.io.on('reconnect', () => console.log('WebSocket reconnected'));
        });
    }
}
