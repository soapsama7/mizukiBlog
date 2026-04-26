type SectionNode = {
	heading: HTMLElement;
	level: number;
	parent: SectionNode | null;
	children: SectionNode[];
	contentWrapper: HTMLDivElement;
	expanded: boolean;
};

const getLevel = (el: HTMLElement) => {
	const match = el.tagName.match(/^H([1-6])$/);
	return match ? Number(match[1]) : null;
};

export function initAboutAccordion() {
	const container = document.getElementById("corner-about-markdown");
	if (!container || container.dataset.accordionReady === "true") {
		return;
	}

	const markdownRoot =
		container.querySelector(".custom-md") || container.firstElementChild;
	if (!(markdownRoot instanceof HTMLElement)) {
		return;
	}

	const blocks = Array.from(markdownRoot.children).filter(
		(el): el is HTMLElement => el instanceof HTMLElement,
	);
	if (blocks.length === 0) {
		return;
	}

	const nodes: SectionNode[] = [];
	const stack: SectionNode[] = [];

	for (const block of blocks) {
		let heading: HTMLElement | null = null;
		if (/^H[1-6]$/.test(block.tagName)) {
			heading = block;
		} else {
			heading = block.querySelector(
				":scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6",
			);
		}

		if (!heading) {
			block.style.display = "";
			block.classList.add("about-intro");
			continue;
		}

		const level = getLevel(heading);
		if (!level) {
			continue;
		}

		const sectionContent = Array.from(block.children).filter(
			(el): el is HTMLElement => el instanceof HTMLElement && el !== heading,
		);

		const contentWrapper = document.createElement("div");
		contentWrapper.className = "about-node-content";
		contentWrapper.style.maxHeight = "0px";
		contentWrapper.style.opacity = "0";
		contentWrapper.style.overflow = "hidden";

		if (sectionContent.length > 0) {
			block.insertBefore(contentWrapper, sectionContent[0]);
			sectionContent.forEach((el) => contentWrapper.appendChild(el));
		} else {
			block.appendChild(contentWrapper);
		}

		const node: SectionNode = {
			heading,
			level,
			parent: null,
			children: [],
			contentWrapper,
			expanded: false,
		};

		while (stack.length > 0 && stack[stack.length - 1].level >= level) {
			stack.pop();
		}

		if (stack.length > 0) {
			const parent = stack[stack.length - 1];
			node.parent = parent;
			parent.children.push(node);
		}

		nodes.push(node);
		stack.push(node);
	}

	if (nodes.length === 0) {
		return;
	}

	const rootNodes = nodes.filter((node) => node.parent === null);
	const pinnedIntroNode = nodes[0];

	const setContentVisible = (
		node: SectionNode,
		visible: boolean,
		immediate = false,
	) => {
		const el = node.contentWrapper;
		const apply = () => {
			if (visible) {
				el.style.maxHeight = `${el.scrollHeight}px`;
				el.style.opacity = "1";
				return;
			}

			el.style.maxHeight = `${el.scrollHeight}px`;
			requestAnimationFrame(() => {
				el.style.maxHeight = "0px";
				el.style.opacity = "0";
			});
		};

		if (immediate) {
			el.style.maxHeight = visible ? "none" : "0px";
			el.style.opacity = visible ? "1" : "0";
			return;
		}

		requestAnimationFrame(apply);
	};

	const updateHeadingState = (node: SectionNode) => {
		node.heading.classList.toggle("about-heading-expanded", node.expanded);
		node.heading.classList.toggle("about-heading-collapsed", !node.expanded);
	};

	const hideDescendants = (node: SectionNode) => {
		node.children.forEach((child) => {
			child.heading.style.display = "none";
			setContentVisible(child, false);
			child.expanded = false;
			hideDescendants(child);
			updateHeadingState(child);
		});
	};

	const showDirectChildren = (node: SectionNode) => {
		node.children.forEach((child) => {
			child.heading.style.display = "";
		});
	};

	const toggleNode = (node: SectionNode) => {
		if (node === pinnedIntroNode) {
			return;
		}

		const willExpand = !node.expanded;
		const siblings = node.parent ? node.parent.children : rootNodes;

		if (!willExpand) {
			node.expanded = false;
			setContentVisible(node, false);
			hideDescendants(node);
			updateHeadingState(node);
			return;
		}

		siblings.forEach((sibling) => {
			if (sibling === node || sibling === pinnedIntroNode) {
				return;
			}
			sibling.expanded = false;
			setContentVisible(sibling, false);
			hideDescendants(sibling);
			updateHeadingState(sibling);
		});

		node.expanded = true;
		updateHeadingState(node);

		if (node.children.length > 0) {
			showDirectChildren(node);
		} else {
			setContentVisible(node, true);
		}
	};

	nodes.forEach((node) => {
		node.heading.classList.add("about-heading", "about-heading-collapsed");
		node.heading.style.display = node.parent ? "none" : "";
		setContentVisible(node, false, true);
	});

	rootNodes.forEach((node) => {
		node.heading.style.display = "";
	});

	if (pinnedIntroNode) {
		pinnedIntroNode.expanded = true;
		pinnedIntroNode.heading.classList.add("about-heading-pinned");
		pinnedIntroNode.heading.classList.remove("about-heading-collapsed");
		pinnedIntroNode.heading.classList.add("about-heading-expanded");
		setContentVisible(pinnedIntroNode, true, true);
	}

	nodes.forEach((node) => {
		node.heading.addEventListener("click", () => {
			toggleNode(node);
		});
	});

	container.dataset.accordionReady = "true";
}
