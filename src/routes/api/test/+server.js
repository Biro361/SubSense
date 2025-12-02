import clientPromise from '$lib/mongodb';
import { json } from '@sveltejs/kit';

export async function GET() {
	try {
		const client = await clientPromise;
		const db = client.db('subsense');
		
		// Teste Verbindung mit einem einfachen Command
		await db.command({ ping: 1 });
		
		return json({ 
			success: true, 
			message: 'MongoDB Verbindung erfolgreich!' 
		});
	} catch (error) {
		console.error('MongoDB Connection Error:', error);
		return json({ 
			success: false, 
			message: 'Verbindung fehlgeschlagen',
			error: error.message 
		}, { status: 500 });
	}
}
