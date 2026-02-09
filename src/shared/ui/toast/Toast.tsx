'use client';

import { toast, Toaster, type Toast } from 'react-hot-toast';

interface NotificationProps {
	t: Toast;
	type: 'alert' | 'success' | 'error';
	title: string;
	message: string;
}

function Notification({ t, type, title, message }: NotificationProps) {
	const config = {
		alert: {
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					className="w-[24px] h-[24px] text-orange-500"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
			),
			bgColor: 'bg-orange-600',
			borderColor: 'border-orange-600',
			textColor: 'text-orange-500',
			stripe: 'bg-[repeating-linear-gradient(45deg,#ea580c,#ea580c_10px,#000_10px,#000_20px)]',
		},
		success: {
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					className="w-[24px] h-[24px] text-green-500"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			),
			bgColor: 'bg-green-600',
			borderColor: 'border-green-600',
			textColor: 'text-green-500',
			stripe: 'bg-[repeating-linear-gradient(45deg,#16a34a,#16a34a_10px,#000_10px,#000_20px)]',
		},
		error: {
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					className="w-[24px] h-[24px] text-red-500"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			),
			borderColor: 'border-red-600',
			textColor: 'text-red-500',
			stripe: 'bg-[repeating-linear-gradient(45deg,#dc2626,#dc2626_10px,#000_10px,#000_20px)]',
		},
	};

	const { icon, textColor, stripe } = config[type];

	return (
		<div
			className={`relative bg-neutral-900 border-l-4 border-t border-r border-b border-neutral-700 p-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] transform transition-all duration-300 ${
				t.visible ? 'translate-x-0 opacity-100' : 'translate-x-[calc(100%+2rem)] opacity-0'
			}`}
		>
			<div className="flex items-start gap-3">
				<div className={`p-2`}>{icon}</div>
				<div className="flex-1">
					<div className="flex justify-between items-center mb-1">
						<span className={`text-lg font-black uppercase ${textColor}`}>{title}</span>
					</div>
					<p className="text-sm leading-relaxed text-neutral-400">{message}</p>
				</div>
				<button
					aria-label="Dismiss notification"
					onClick={() => toast.dismiss(t.id)}
					className="text-neutral-600 hover:text-neutral-400 transition-colors"
				>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-[15px] h-[15px]">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div className={`absolute bottom-0 left-0 right-0 h-1 ${stripe} opacity-30`} />
		</div>
	);
}

export function ToastProvider() {
	return (
		<Toaster
			position="top-right"
			toastOptions={{
				duration: 4000,
				style: {
					background: 'transparent',
					padding: 0,
					boxShadow: 'none',
				},
			}}
		/>
	);
}

export const showNotification = {
	alert: (title: string, message: string) => {
		toast.custom((t) => <Notification t={t} type="alert" title={title} message={message} />);
	},
	success: (title: string, message: string) => {
		toast.custom((t) => <Notification t={t} type="success" title={title} message={message} />);
	},
	error: (title: string, message: string) => {
		toast.custom((t) => <Notification t={t} type="error" title={title} message={message} />);
	},
};
