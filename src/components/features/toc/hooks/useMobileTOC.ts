/**
 * MobileTOC 自定义钩子
 * 处理移动端目录的状态管理和交互逻辑
 */

import {
	extractHeadings,
	generateTOCItems as buildTOCItemsFromHeadings,
	getTOCConfig as getFullTOCConfig,
} from "../utils/toc-utils";

export interface TOCItem {
	id: string;
	text: string;
	level: number;
	depth: number;
	badge?: string;
}

export interface PostItem {
	title: string;
	url: string;
	category?: string;
	pinned?: boolean;
}

export interface TOCConfig {
	useJapaneseBadge: boolean;
	depth: number;
}

/** 生成目录项（与侧边栏共用 toc-utils 的过滤逻辑） */
export function generateTOCItems(): TOCItem[] {
	const headings = extractHeadings("#post-container");
	const built = buildTOCItemsFromHeadings(headings, getFullTOCConfig());
	return built.map((item) => ({
		id: item.id,
		text: item.text,
		level: item.level,
		depth: item.depth,
		badge: item.badge,
	}));
}

/**
 * 生成文章列表项（首页使用）
 */
export function generatePostItems(): PostItem[] {
	const postCards = document.querySelectorAll(".card-base");
	const items: PostItem[] = [];

	postCards.forEach((card) => {
		const titleLink = card.querySelector(
			'a[href*="/posts/"].transition.group',
		);
		const categoryLink = card.querySelector(
			'a[href*="/categories/"].link-lg',
		);
		const pinnedIcon = titleLink?.querySelector('svg[data-icon="mdi:pin"]');

		if (titleLink) {
			const href = titleLink.getAttribute("href");
			const title =
				titleLink.textContent?.replace(/\s+/g, " ").trim() || "";
			const category = categoryLink?.textContent?.trim() || "";
			const pinned = !!pinnedIcon;

			if (href && title) {
				items.push({ title, url: href, category, pinned });
			}
		}
	});

	return items;
}

/**
 * 检查是否为首页
 */
export function checkIsHomePage(): boolean {
	const pathname = window.location.pathname;
	return pathname === "/" || pathname === "" || /^\/\d+\/?$/.test(pathname);
}

/**
 * 更新活动标题（基于滚动位置）
 */
export function updateActiveHeading(): string {
	const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
	const scrollTop = window.scrollY;
	const offset = 100;

	let currentActiveId = "";
	headings.forEach((heading) => {
		if (heading.id) {
			const elementTop = (heading as HTMLElement).offsetTop - offset;
			if (scrollTop >= elementTop) {
				currentActiveId = heading.id;
			}
		}
	});

	return currentActiveId;
}

/**
 * 滚动到指定标题
 */
export function scrollToHeading(id: string, offset = 80): void {
	const element = document.getElementById(id);
	if (element) {
		const elementPosition = element.offsetTop - offset;
		window.scrollTo({
			top: elementPosition,
			behavior: "smooth",
		});
	}
}

/**
 * 获取 TOC 配置
 */
export function getTOCConfig(): TOCConfig {
	return {
		useJapaneseBadge: window.siteConfig?.toc?.useJapaneseBadge ?? false,
		depth: window.siteConfig?.toc?.depth ?? 3,
	};
}
