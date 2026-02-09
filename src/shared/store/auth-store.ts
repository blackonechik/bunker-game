import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
	token: string | null;
	playerId: number | null;
	expiresAt: number | null;
	_hasHydrated: boolean;
	setAuth: (token: string, playerId: number) => void;
	clearAuth: () => void;
	isValid: () => boolean;
	setHasHydrated: (state: boolean) => void;
}

const ONE_DAY = 24 * 60 * 60 * 1000; // 1 день в миллисекундах

export const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			token: null,
			playerId: null,
			expiresAt: null,
			_hasHydrated: false,
			setAuth: (token, playerId) =>
				set({
					token,
					playerId,
					expiresAt: Date.now() + ONE_DAY,
				}),
			clearAuth: () =>
				set({
					token: null,
					playerId: null,
					expiresAt: null,
				}),
			isValid: () => {
				const state = get();
				console.log(state);
				if (!state.token || !state.expiresAt) return false;
				if (Date.now() > state.expiresAt) {
					get().clearAuth();
					return false;
				}
				return true;
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
