<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = "default",
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & { size?: "default" | "sm" } = $props();
</script>

<div
	bind:this={ref}
	data-slot="card"
	data-size={size}
	class={cn("gap-(--card-spacing) overflow-hidden rounded-[1.25rem] bg-card py-(--card-spacing) text-sm text-card-foreground shadow-[0_20px_40px_-28px_rgb(26_37_32_/_42%)] ring-1 ring-foreground/8 [--card-spacing:--spacing(5)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] dark:ring-foreground/10 *:[img:first-child]:rounded-t-[1.25rem] *:[img:last-child]:rounded-b-[1.25rem] group/card flex flex-col", className)}
	{...restProps}
>
	{@render children?.()}
</div>
