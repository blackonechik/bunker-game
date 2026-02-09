import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
	token: string | null;
	playerId: number | null;
	setAuth: (token: string, playerId: number) => void;
	clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			token: null,
			playerId: null,
			setAuth: (token, playerId) => set({ token, playerId }),
			clearAuth: () => set({ token: null, playerId: null }),
		}),
		{
			name: 'bunker-auth',
		}
	)
);
