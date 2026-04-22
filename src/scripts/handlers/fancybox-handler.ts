/**
 * Fancybox 处理器
 * 管理图片灯箱的初始化和清理
 */

const FANCYBOX_SELECTORS = {
	albumImages: ".custom-md img, #post-cover img, .moment-images img",
	albumLinks: ".moment-images a[data-fancybox]",
	singleFancybox: "[data-fancybox]:not(.moment-images a)",
} as const;

const getDefaultFancyboxConfig = () => ({
	Thumbs: { autoStart: true, showOnStart: "yes" },
	Toolbar: {
		display: {
			left: ["infobar"],
			middle: [
				"zoomIn",
				"zoomOut",
				"toggle1to1",
				"rotateCCW",
				"rotateCW",
				"flipX",
				"flipY",
			],
			right: ["slideshow", "thumbs", "close"],
		},
	},
	animated: true,
	dragToClose: true,
	fitToView: true,
	preload: 3,
	infinite: true,
	caption: false,
	Panzoom: { maxScale: 3, minScale: 1 },
});

// Fancybox 模块类型
type FancyboxType = any;

/**
 * Fancybox 处理器类
 * 负责图片灯箱的按需加载和管理
 */
export class FancyboxHandler {
	private Fancybox: FancyboxType | null = null;
	private boundSelectors: string[] = [];
	private initialized = false;

	/**
	 * 初始化 Fancybox
	 * 按需加载 Fancybox 模块和样式
	 */
	async init(): Promise<void> {
		const hasImages = this.checkForImages();

		if (!hasImages) {
			return;
		}

		// 按需加载 Fancybox 模块
		if (!this.Fancybox) {
			await this.loadFancybox();
		}

		// 避免重复初始化
		if (this.boundSelectors.length > 0) {
			return;
		}

		this.bindImageSelectors();
		this.initialized = true;
	}

	/**
	 * 检查页面是否有需要 Fancybox 的图片
	 */
	private checkForImages(): boolean {
		return (
			document.querySelector(FANCYBOX_SELECTORS.albumImages) !== null ||
			document.querySelector(FANCYBOX_SELECTORS.albumLinks) !== null ||
			document.querySelector(FANCYBOX_SELECTORS.singleFancybox) !== null
		);
	}

	/**
	 * 加载 Fancybox 模块和样式
	 */
	private async loadFancybox(): Promise<void> {
		const mod = await import('@fancyapps/ui');
		this.Fancybox = mod.Fancybox;
		await import('@fancyapps/ui/dist/fancybox/fancybox.css');
	}

	/**
	 * 绑定图片选择器
	 */
	private bindImageSelectors(): void {
		if (!this.Fancybox) {return;}

		const commonConfig = getDefaultFancyboxConfig();

		// 绑定相册/文章图片
		this.Fancybox.bind(FANCYBOX_SELECTORS.albumImages, {
			...commonConfig,
			groupAll: true,
			Carousel: {
				transition: 'slide',
				preload: 2,
			},
		});
		this.boundSelectors.push(FANCYBOX_SELECTORS.albumImages);

		// 绑定相册链接
		this.Fancybox.bind(FANCYBOX_SELECTORS.albumLinks, {
			...commonConfig,
			source: (el: any) => {
				return el.getAttribute('data-src') || el.getAttribute('href');
			},
		});
		this.boundSelectors.push(FANCYBOX_SELECTORS.albumLinks);

		// 绑定单独的 fancybox 图片
		this.Fancybox.bind(FANCYBOX_SELECTORS.singleFancybox, commonConfig);
		this.boundSelectors.push(FANCYBOX_SELECTORS.singleFancybox);
	}

	/**
	 * 清理 Fancybox 绑定
	 * 在页面切换前调用
	 */
	cleanup(): void {
		if (!this.Fancybox) {return;}

		this.boundSelectors.forEach((selector) => {
			this.Fancybox.unbind(selector);
		});
		this.boundSelectors = [];
	}

	/**
	 * 完全销毁 Fancybox
	 */
	destroy(): void {
		this.cleanup();
		this.Fancybox = null;
		this.initialized = false;
	}

	/**
	 * 获取初始化状态
	 */
	isInitialized(): boolean {
		return this.initialized;
	}

	/**
	 * 获取已绑定的选择器列表
	 */
	getBoundSelectors(): string[] {
		return [...this.boundSelectors];
	}
}

// 创建全局实例
let globalFancyboxHandler: FancyboxHandler | null = null;

/**
 * 获取全局 Fancybox 处理器实例
 */
export function getFancyboxHandler(): FancyboxHandler {
	if (!globalFancyboxHandler) {
		globalFancyboxHandler = new FancyboxHandler();
	}
	return globalFancyboxHandler;
}

/**
 * 初始化 Fancybox（便捷函数）
 */
export async function initFancybox(): Promise<void> {
	const handler = getFancyboxHandler();
	await handler.init();
}

/**
 * 清理 Fancybox（便捷函数）
 */
export function cleanupFancybox(): void {
	if (globalFancyboxHandler) {
		globalFancyboxHandler.cleanup();
	}
}
