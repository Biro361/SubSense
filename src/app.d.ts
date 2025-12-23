// src/app.d.ts
import type { Session } from '@auth/core/types';

declare global {
	namespace App {
		interface Locals {
			session: Session | null;
			user: Session['user'] | null;
		}
	}
}

export {};
