import type {
	AzaMusicPlayerConfig,
	AzaSiteConfig,
	AzaThemeTextConfig,
} from "./types/config";

// =========================
// AzaMOE 配置模板（可入库）
// =========================

export const siteConfig: AzaSiteConfig = {
	title: "AzaMOE",
	lang: "zh_CN",
	siteURL: "https://your-domain.com/",
	favicon: "/favicon/favicon.ico",
};

export const themeTextConfig: AzaThemeTextConfig = {
	homeHeroTop: "AzaMOE's",
	homeHeroBottom: "Road Less Traveled",
	navItems: [
		{ key: "friends", label: "友链", href: "/friends/" },
		{ key: "albums", label: "相册", href: "/albums/" },
		{ key: "blog", label: "文章", href: "/blog/" },
		{ key: "life", label: "生活", href: "/life/" },
		{ key: "about", label: "关于", href: "/about/" },
		{ key: "home", label: "主页", href: "/" },
	],
	pages: {
		home: { title: "主页" },
		friends: { title: "友链", subtitle: "记录一起写博客的朋友们" },
		albums: { title: "相册", subtitle: "收藏生活里的片段" },
		blog: { title: "文章", subtitle: "一些思考与记录，值得被认真保存" },
		life: { title: "生活", subtitle: "一些日常碎片" },
		about: { title: "关于" },
	},
};

// 所有配置都集中在这里，不依赖 .env，更改歌单id即可
export const musicPlayerConfig: AzaMusicPlayerConfig = {
	enable: true,
	mode: "meting",
	autoplay: false,
	loop: "all",
	defaultVolume: 0.65,
	emptyState: {
		title: "暂无可播放音乐",
		artist: "请在 config.ts 填写有效歌单配置",
	},
	meting_api:
		"https://meting.mysqil.com/api?server=:server&type=:type&id=:id&auth=:auth&r=:r",
	id: "928530170",
	server: "netease",
	type: "playlist",

	playlist: [],
};
