// src/app.d.ts

declare global {
	namespace App {
		interface Locals {
			// Wird in hooks.server.js aus dem Session-Cookie gesetzt
			user: {
				userId: string;
				email: string;
				tokenVersion: number;
			} | null;
		}
	}
}

export {};
