import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
	token: string | null;
	playerId: number | null;
	playerName: string | null;
	_hasHydrated: boolean;
	setAuth: (token: string, playerId: number, playerName: string) => void;
	setName: (name: string) => void;
	clearAuth: () => void;
	isValid: () => boolean;
	setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			token: null,
			playerId: null,
			playerName: null,
			_hasHydrated: false,
			setAuth: (token, playerId, playerName) =>
				set({
					token,
					playerId,
					playerName,
				}),
			setName: (name) =>
				set({
					playerName: name,
				}),
			clearAuth: () =>
				set({
					token: null,
					playerId: null,
					playerName: null,
				}),
			isValid: () => {
				const state = get();
				return !!state.token && !!state.playerId;
			},
			setHasHydrated: (state) => {
				set({ _hasHydrated: state });
			},
		}),
		{
			name: 'bunker-auth',
			onRehydrateStorage: () => (state) => {
				state?.setHasHydrated(true);
			},
		}
	)
);
