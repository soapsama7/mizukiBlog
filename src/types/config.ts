// AzaMOE 最小配置类型

export interface AzaSiteConfig {
	title: string;
	lang: string;
	siteURL: string;
	favicon: string;
}

export interface AzaNavItemConfig {
	key: "friends" | "albums" | "blog" | "life" | "about" | "home";
	label: string;
	href: string;
}

export interface AzaPageTextConfig {
	title: string;
	subtitle?: string;
}

export interface AzaThemeTextConfig {
	homeHeroTop: string;
	homeHeroBottom: string;
	navItems: AzaNavItemConfig[];
	pages: {
		friends: AzaPageTextConfig;
		albums: AzaPageTextConfig;
		blog: AzaPageTextConfig;
		life: AzaPageTextConfig;
		about: AzaPageTextConfig;
		home: AzaPageTextConfig;
	};
}

export interface AzaMusicTrack {
	title: string;
	artist?: string;
	src: string;
	cover?: string;
}

export interface AzaNeteaseConfig {
	playlistId: string;
	// 可选自建 API，默认使用公共 NeteaseCloudMusicApi 实例
	apiBase?: string;
	// 网易云 Cookie（需要登录态的歌单/歌曲建议填写）
	cookie?: string;
}

export interface AzaMusicPlayerConfig {
	enable: boolean;
	mode: "local" | "netease" | "meting";
	autoplay?: boolean;
	loop?: "off" | "one" | "all";
	defaultVolume?: number;
	emptyState?: {
		title?: string;
		artist?: string;
	};
	// local 模式直接播放此列表；netease 模式可留空
	playlist: AzaMusicTrack[];
	netease?: AzaNeteaseConfig;
	// mizuki 兼容模式：通过 meting api 拉取歌单
	meting_api?: string;
	id?: string;
	server?: string;
	type?: string;
	auth?: string;
	r?: string;
}
