import { RoomDTO, PlayerDTO } from '@/shared/types';

interface RoomResponse {
	success: boolean;
	data?: {
		room: RoomDTO;
		players: PlayerDTO[];
	};
	error?: string;
}

export const lobbyApi = {
	async getRoom(code: string): Promise<RoomResponse> {
		try {
			const res = await fetch(`/api/rooms/${code}`);
			return await res.json();
		} catch (error) {
			return {
				success: false,
				error: 'Ошибка загрузки данных комнаты',
			};
		}
	},
};
