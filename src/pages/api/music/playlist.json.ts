import type { APIRoute } from "astro";
import { musicPlayerConfig } from "../../../config";
import type { AzaMusicTrack } from "../../../types/config";

const json = (payload: unknown, status = 200) =>
	new Response(JSON.stringify(payload), {
		status,
		headers: { "content-type": "application/json; charset=utf-8" },
	});

const safeReadJson = async (res: Response, stage: "playlist" | "song_url") => {
	const contentType = res.headers.get("content-type") || "";
	const raw = await res.text();
	const preview = raw.slice(0, 120);

	if (!contentType.includes("application/json")) {
		console.warn(
			`[AzaMOE Music] ${stage} returned non-json content-type: ${contentType}; preview=${preview}`,
		);
		return {
			ok: false as const,
			error: "invalid_api_response_format",
			detail: "apiBase 不是可用的 NeteaseCloudMusicApi 服务地址（返回了 HTML/非 JSON）",
		};
	}

	try {
		return { ok: true as const, data: JSON.parse(raw) };
	} catch {
		console.warn(
			`[AzaMOE Music] ${stage} json parse failed; preview=${preview}`,
		);
		return {
			ok: false as const,
			error: "invalid_api_json",
			detail: "API 返回内容不是有效 JSON",
		};
	}
};

export const GET: APIRoute = async () => {
	if (!musicPlayerConfig.enable) {
		return json({ playlist: [] });
	}

	if (musicPlayerConfig.mode === "local") {
		return json({ playlist: musicPlayerConfig.playlist || [] });
	}

	if (musicPlayerConfig.mode === "meting") {
		const metingApi = musicPlayerConfig.meting_api?.trim();
		const id = musicPlayerConfig.id?.trim();
		const server = musicPlayerConfig.server?.trim() || "netease";
		const type = musicPlayerConfig.type?.trim() || "playlist";
		const auth = musicPlayerConfig.auth?.trim() || "";
		const r = musicPlayerConfig.r?.trim() || "0";

		if (!metingApi || !id) {
			return json({ playlist: [], error: "missing_meting_config" }, 400);
		}

		const endpoint = metingApi
			.replace(":server", encodeURIComponent(server))
			.replace(":type", encodeURIComponent(type))
			.replace(":id", encodeURIComponent(id))
			.replace(":auth", encodeURIComponent(auth))
			.replace(":r", encodeURIComponent(r));

		try {
			const res = await fetch(endpoint, {
				headers: {
					"user-agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
					referer: "https://music.163.com/",
				},
			});
			if (!res.ok) {
				return json({ playlist: [], error: "meting_fetch_failed", status: res.status }, 200);
			}
			const parsed = await safeReadJson(res, "playlist");
			if (!parsed.ok) {
				return json({ playlist: [], error: parsed.error, detail: parsed.detail }, 200);
			}

			const rawTracks = Array.isArray(parsed.data)
				? parsed.data
				: Array.isArray(parsed.data?.data)
					? parsed.data.data
					: [];
			const playlist: AzaMusicTrack[] = rawTracks
				.map((track: any) => {
					const src = track?.url || track?.src;
					if (typeof src !== "string" || !src.trim()) return null;
					return {
						title: String(track?.name || track?.title || "Unknown Track"),
						artist: String(track?.artist || track?.author || "Unknown Artist"),
						src,
						cover: typeof track?.pic === "string" ? track.pic : undefined,
					} satisfies AzaMusicTrack;
				})
				.filter(Boolean) as AzaMusicTrack[];

			return json({ playlist, source: "meting" });
		} catch (error) {
			console.warn("[AzaMOE Music] meting fetch failed:", error);
			return json({ playlist: [], error: "meting_fetch_failed" }, 200);
		}
	}

	const playlistId = musicPlayerConfig.netease?.playlistId?.trim();
	if (!playlistId) {
		return json({ playlist: [], error: "missing_playlist_id" }, 400);
	}

	const apiBase = musicPlayerConfig.netease?.apiBase?.trim();
	const cookie = musicPlayerConfig.netease?.cookie?.trim();
	if (!apiBase) {
		return json({ playlist: [], error: "missing_api_base" }, 400);
	}
	const headers: Record<string, string> = {};
	if (cookie) {
		headers.cookie = cookie;
	}
	headers["user-agent"] =
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36";
	headers.referer = "https://music.163.com/";

	try {
		const ts = Date.now();
		const tracksRes = await fetch(
			`${apiBase}/playlist/track/all?id=${encodeURIComponent(playlistId)}&timestamp=${ts}`,
			{ headers },
		);
		if (!tracksRes.ok) {
			const body = await tracksRes.text();
			console.warn(
				`[AzaMOE Music] playlist fetch failed: ${tracksRes.status} ${body.slice(0, 120)}`,
			);
			return json(
				{ playlist: [], error: "playlist_fetch_failed", status: tracksRes.status },
				200,
			);
		}
		const tracksParsed = await safeReadJson(tracksRes, "playlist");
		if (!tracksParsed.ok) {
			return json({ playlist: [], error: tracksParsed.error, detail: tracksParsed.detail }, 200);
		}
		const tracksJson = tracksParsed.data;
		const songs = Array.isArray(tracksJson?.songs) ? tracksJson.songs : [];
		if (songs.length === 0) {
			return json({ playlist: [], error: "empty_playlist" }, 200);
		}

		const ids = songs
			.map((song: { id?: number | string }) => song?.id)
			.filter(Boolean)
			.map((id: number | string) => String(id))
			.join(",");

		const urlRes = await fetch(
			`${apiBase}/song/url/v1?id=${encodeURIComponent(ids)}&level=standard&timestamp=${ts + 1}`,
			{ headers },
		);
		if (!urlRes.ok) {
			const body = await urlRes.text();
			console.warn(
				`[AzaMOE Music] song url fetch failed: ${urlRes.status} ${body.slice(0, 120)}`,
			);
			return json(
				{ playlist: [], error: "song_url_fetch_failed", status: urlRes.status },
				200,
			);
		}
		const urlParsed = await safeReadJson(urlRes, "song_url");
		if (!urlParsed.ok) {
			return json({ playlist: [], error: urlParsed.error, detail: urlParsed.detail }, 200);
		}
		const urlJson = urlParsed.data;
		const urlData = Array.isArray(urlJson?.data) ? urlJson.data : [];
		const urlMap = new Map<string, string>();
		for (const item of urlData) {
			const id = item?.id;
			const url = item?.url;
			if (id != null && typeof url === "string" && url.length > 0) {
				urlMap.set(String(id), url);
			}
		}

		const playlist: AzaMusicTrack[] = songs
			.map((song: any) => {
				const songId = String(song?.id ?? "");
				const src = urlMap.get(songId);
				if (!src) return null;
				const artists = Array.isArray(song?.ar)
					? song.ar.map((a: any) => a?.name).filter(Boolean).join(" / ")
					: undefined;
				const cover = song?.al?.picUrl;
				return {
					title: String(song?.name ?? "Unknown Track"),
					artist: artists || "Unknown Artist",
					src,
					cover: typeof cover === "string" ? cover : undefined,
				} satisfies AzaMusicTrack;
			})
			.filter(Boolean) as AzaMusicTrack[];

		if (playlist.length === 0) {
			return json({ playlist: [], error: "no_playable_track" }, 200);
		}

		return json({ playlist, source: "netease" });
	} catch (error) {
		console.warn("[AzaMOE Music] load netease playlist failed:", error);
		return json({ playlist: [], error: "netease_fetch_failed" }, 200);
	}
};
