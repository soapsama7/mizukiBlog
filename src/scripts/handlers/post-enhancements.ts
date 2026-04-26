import { initFancybox } from "./fancybox-handler";

function preparePostImagesForZoom() {
	const imgs = Array.from(
		document.querySelectorAll<HTMLImageElement>(".custom-md img"),
	);

	imgs.forEach((img, index) => {
		const parent = img.parentElement;
		if (!parent) {
			return;
		}

		if (parent.tagName === "A") {
			const link = parent as HTMLAnchorElement;
			link.setAttribute("data-fancybox", "post-gallery");
			if (!link.getAttribute("href")) {
				link.setAttribute("href", img.currentSrc || img.src);
			}
			return;
		}

		const link = document.createElement("a");
		link.href = img.currentSrc || img.src;
		link.setAttribute("data-fancybox", "post-gallery");
		link.setAttribute("data-src", img.currentSrc || img.src);
		link.setAttribute("aria-label", img.alt || `post-image-${index + 1}`);
		link.style.cursor = "zoom-in";

		parent.insertBefore(link, img);
		link.appendChild(img);
	});
}

async function setupPostImageZoom() {
	preparePostImagesForZoom();
	await initFancybox();
}

function setupTocAccordion() {
	const toc = document.querySelector<HTMLElement>(".corner-toc");
	if (!toc || toc.dataset.bound === "true") {
		return;
	}
	toc.dataset.bound = "true";

	const getGroups = () =>
		Array.from(toc.querySelectorAll<HTMLElement>(".corner-toc-group"));

	const collapseAll = () => {
		getGroups().forEach((group) => {
			group.classList.remove("expanded");
			const root = group.querySelector<HTMLElement>("[data-role='toc-root']");
			root?.setAttribute("aria-expanded", "false");
		});
	};

	const jumpToAnchor = (hash: string) => {
		const rawId = hash.replace(/^#/, "");
		if (!rawId) {
			return;
		}

		const candidates = new Set<string>([rawId]);
		try {
			candidates.add(decodeURIComponent(rawId));
		} catch {
			// ignore malformed uri
		}
		try {
			candidates.add(encodeURIComponent(rawId));
		} catch {
			// ignore encode failure
		}

		let target: HTMLElement | null = null;
		for (const id of candidates) {
			target =
				document.getElementById(id) ||
				(document.querySelector(`[id="${CSS.escape(id)}"]`) as HTMLElement | null);
			if (target) {
				break;
			}
		}
		if (!target) {
			return;
		}

		target.scrollIntoView({ behavior: "smooth", block: "start" });
		history.replaceState(null, "", `#${encodeURIComponent(target.id)}`);
	};

	toc.addEventListener("click", (event) => {
		const target = event.target;
		if (!(target instanceof Element)) {
			return;
		}

		const rootLink = target.closest<HTMLAnchorElement>(".corner-toc-root-link");
		if (rootLink && toc.contains(rootLink)) {
			event.preventDefault();
			const group = rootLink.closest<HTMLElement>(".corner-toc-group");
			if (!group) {
				return;
			}
			const expanded = group.classList.contains("expanded");
			collapseAll();
			if (!expanded) {
				group.classList.add("expanded");
				rootLink.setAttribute("aria-expanded", "true");
			}
			jumpToAnchor(rootLink.hash);
			return;
		}

		const childLink = target.closest<HTMLAnchorElement>(
			".corner-toc-children a[href^='#']",
		);
		if (childLink && toc.contains(childLink)) {
			event.preventDefault();
			jumpToAnchor(childLink.hash);
		}
	});
}

export function initPostEnhancements() {
	setupPostImageZoom();
	setupTocAccordion();
}
