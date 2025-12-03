document.addEventListener("DOMContentLoaded", () => {
    const buckets = document.querySelectorAll(".kpiBucket");
    const shipCards = document.getElementById("shipCards");

    buckets.forEach(bucket => {
        bucket.addEventListener("click", () => {
            const isAlreadyFocused = bucket.classList.contains("focused");

            // Reset all buckets and shipCards if clicked again
            if (isAlreadyFocused) {
                buckets.forEach(b => b.classList.remove("focused", "shrunk"));
                shipCards.classList.remove("collapsed");
                return;
            }

            // Apply focused/shrunk classes
            buckets.forEach(b => {
                if (b === bucket) {
                    b.classList.add("focused");
                    b.classList.remove("shrunk");
                } else {
                    b.classList.remove("focused");
                    b.classList.add("shrunk");
                }
            });

            // Collapse shipCards
            shipCards.classList.add("collapsed");
        });
    });
});