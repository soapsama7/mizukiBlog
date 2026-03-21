// 友情链接数据配置
// 用于管理友情链接页面的数据

export interface FriendItem {
	id: number;
	title: string;
	imgurl: string;
	desc: string;
	siteurl: string;
	tags: string[];
}

// 友情链接数据
export const friendsData: FriendItem[] = [
	{
		id: 1,
		title: "Spreng",
		imgurl: "https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/post/1748020210-spreng.jpg",
		desc: "Spreng的小屋",
		siteurl: "https://spreng.top/",
		tags: ["友链"],
	},
	{
		id: 2,
		title: "PureStream",
		imgurl: "https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/post/202511022235341.jpg",
		desc: "PureStream & Marblue",
		siteurl: "https://marblue.pink/",
		tags: ["友链"],
	},
	{
		id: 3,
		title: "zer00ne",
		imgurl: "https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/post/1748019728-zer00ne.jpg",
		desc: "zer00ne",
		siteurl: "https://khighl.github.io/",
		tags: ["友链"],
	},
	{
		id: 4,
		title: "sofish",
		imgurl: "https://img.wjwj.top/2025/10/31/0643ca30556495e126d7f7dfc4cfa12e.webp",
		desc: "记录学习，分享美化",
		siteurl: "https://sofish.top/",
		tags: ["友链"],
	},
	{
		id: 5,
		title: "s3loy's blog",
		imgurl: "https://blog.s3loy.tech/images/1.jpg",
		desc: "noob in computer science",
		siteurl: "https://blog.s3loy.tech/",
		tags: ["友链"],
	},
	{
		id: 6,
		title: "futurefe's blog",
		imgurl: "https://futurefe414.github.io/images/facial.jpg",
		desc: "菜鸡🥹🥹",
		siteurl: "https://futurefe414.github.io/",
		tags: ["友链"],
	},
	{
		id: 7,
		title: "st4rr's blog",
		imgurl: "https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/post/st4rr.jpg",
		desc: "st4rr",
		siteurl: "https://www.blog.st4rr.top/",
		tags: ["友链"],
	},
];

// 获取所有友情链接数据
export function getFriendsList(): FriendItem[] {
	return friendsData;
}

// 获取随机排序的友情链接数据
export function getShuffledFriendsList(): FriendItem[] {
	const shuffled = [...friendsData];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}
