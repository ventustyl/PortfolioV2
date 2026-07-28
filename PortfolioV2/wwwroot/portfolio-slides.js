(() => {
    let cleanup = () => {};

    const init = () => {
        cleanup();

        const root = document.querySelector("[data-intro]");
        const dot = document.querySelector("[data-cursor-dot]");
        const ring = document.querySelector("[data-cursor-ring]");
        const glow = root?.querySelector(".intro-glow");
        const canUseCustomCursor =
            innerWidth > 672 &&
            matchMedia("(hover: hover) and (pointer: fine)").matches;

        if (!root || !dot || !ring || !canUseCustomCursor) {
            document.documentElement.classList.remove("custom-cursor-active", "cursor-idle");
            cleanup = () => {};
            return;
        }

        document.documentElement.classList.add("custom-cursor-active");

        let pointerX = innerWidth / 2;
        let pointerY = innerHeight / 2;
        let ringX = pointerX;
        let ringY = pointerY;
        let frame = 0;
        let idleTimer = 0;

        const draw = () => {
            ringX += (pointerX - ringX) * 0.16;
            ringY += (pointerY - ringY) * 0.16;

            dot.style.transform = `translate3d(${pointerX - 2.5}px, ${pointerY - 2.5}px, 0)`;
            ring.style.transform = `translate3d(${ringX - 27}px, ${ringY - 27}px, 0)`;
            frame = requestAnimationFrame(draw);
        };

        const onPointerMove = (event) => {
            pointerX = event.clientX;
            pointerY = event.clientY;
            document.documentElement.classList.remove("cursor-idle");

            const offsetX = ((event.clientX / innerWidth) - 0.5) * 42;
            const offsetY = ((event.clientY / innerHeight) - 0.5) * 42;
            root.style.setProperty("--glow-x", `${offsetX}px`);
            root.style.setProperty("--glow-y", `${offsetY}px`);

            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                document.documentElement.classList.add("cursor-idle");
            }, 1400);
        };

        addEventListener("pointermove", onPointerMove, { passive: true });
        frame = requestAnimationFrame(draw);

        cleanup = () => {
            removeEventListener("pointermove", onPointerMove);
            cancelAnimationFrame(frame);
            clearTimeout(idleTimer);
            document.documentElement.classList.remove("custom-cursor-active", "cursor-idle");
        };
    };

    document.addEventListener("DOMContentLoaded", init, { once: true });
    document.addEventListener("enhancedload", init);
})();
