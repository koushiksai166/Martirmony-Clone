import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { getToken } from "../utils/token";

export function useSocket(namespace = "/chat") {
	const socket = useRef(null);

	useEffect(() => {
		const token = getToken();
		if (!token) return undefined;
		socket.current = io(`${import.meta.env.VITE_API_URL}${namespace}`, { auth: { token } });
		return () => socket.current?.disconnect();
	}, [namespace]);

	return socket;
}
