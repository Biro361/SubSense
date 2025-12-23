// src/routes/auth/logout/+server.js
import { redirect } from '@sveltejs/kit';
import { clearSessionCookie } from '../../hooks.server.js';

export async function POST({ cookies }) {
	clearSessionCookie(cookies);
	throw redirect(303, '/auth/signin');
}
