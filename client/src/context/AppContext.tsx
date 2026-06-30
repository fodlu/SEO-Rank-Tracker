import type { AxiosInstance } from "axios";
import axios from "axios";
import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";

interface User {
	email: string;
	name: string;
	plan: string;
	analysisCount?: number;
}

interface AppContextType {
	user: User | null;
	token: string | null;
	loading: boolean;
	api: AxiosInstance;
	login: (
		email: string,
		password: string,
	) => Promise<{ success: boolean; message?: string }>;
	register: (
		name: string,
		email: string,
		password: string,
	) => Promise<{ success: boolean; message?: string }>;
	logout: () => void;
}

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(
		localStorage.getItem("token"),
	);
	const [loading, setLoading] = useState(true);

	// axios instance with authHeader
	const api = useMemo(() => {
		const instance = axios.create({ baseURL: backendUrl });

		// update axios header when the token changes
		instance.interceptors.request.use((config) => {
			const token = localStorage.getItem("token");

			if (token) {
				config.headers.Authorization = `Bearer ${token}`;
			}

			return config;
		});

		return instance;
	}, []);

	const login = async (email: string, password: string) => {
		try {
			const res = await axios.post(`${backendUrl}/api/auth/login`, {
				email,
				password,
			});
			if (res.data.success) {
				setToken(res.data.token);
				setUser(res.data.user);
				localStorage.setItem("token", res.data.token);
				return { success: true };
			}
			return { success: false, message: res.data.message };
		} catch (error: any) {
			return {
				success: false,
				message: error.response?.data?.message || "Login Failed",
			};
		}
	};

	const register = async (name: string, email: string, password: string) => {
		try {
			const res = await axios.post(`${backendUrl}/api/auth/register`, {
				name,
				email,
				password,
			});
			if (res.data.success) {
				setToken(res.data.token);
				setUser(res.data.user);
				localStorage.setItem("token", res.data.token);
				return { success: true };
			}
			return { success: false, message: res.data.message };
		} catch (error: any) {
			return {
				success: false,
				message: error.response?.data?.message || "Registration Failed",
			};
		}
	};

	const logout = async () => {
		setToken(null);
		setUser(null);
		localStorage.removeItem("token");
	};

	useEffect(() => {
		const loadUser = async () => {
			if (!token) {
				setLoading(false);
				return;
			}
			try {
				const {data} = await api.get("/api/auth/user");
				if (data && data.success) {
					setUser(data.user);
				} else {
					logout();
				}
			} catch {
				localStorage.removeItem("token");
				setToken(null);
				setUser(null);
				logout();
			} finally {
				setLoading(false);
			}
		};

		loadUser();
	}, [token, api]);

	const value = { user, token, loading, api, login, register, logout };

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
	const context = useContext(AppContext);

	if (!context) throw new Error("useApp must be within AppProvider");
	return context;
}
