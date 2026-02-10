// ===== COPY TO CLIPBOARD =====
const CA = '29zqoxrhs6dfGnQvx3LfdS9EfHwYdvehXyQ9JYTjpump';

function showCopyToast() {
    let toast = document.querySelector('.copy-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'copy-toast';
        toast.textContent = '✓ Contract address copied!';
        document.body.appendChild(toast);
    }
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

function setupCopyButtons() {
    const copyBtns = document.querySelectorAll('.ca-copy');
    copyBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(CA);
                btn.classList.add('copied');
                showCopyToast();
                setTimeout(() => btn.classList.remove('copied'), 2000);
            } catch {
                const textarea = document.createElement('textarea');
                textarea.value = CA;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                btn.classList.add('copied');
                showCopyToast();
                setTimeout(() => btn.classList.remove('copied'), 2000);
            }
        });
    });
}

// ===== STICKY NAV =====
function setupNav() {
    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 50);
    });
}

// ===== MOBILE MENU =====
function setupMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');
    btn.addEventListener('click', () => {
        menu.classList.toggle('active');
        btn.classList.toggle('active');
    });
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('active');
            btn.classList.remove('active');
        });
    });
}

// ===== SMOOTH SCROLL =====
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

// ===== SCROLL REVEAL =====
function setupScrollReveal() {
    const elements = document.querySelectorAll(
        '.about-card, .step-card, .social-card, .ca-box, .chart-wrapper, .section-header, .pfp-generator'
    );
    elements.forEach(el => el.classList.add('fade-in'));
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    elements.forEach(el => observer.observe(el));
}

// ===== CURSOR GLOW =====
function setupCursorGlow() {
    const hero = document.querySelector('.hero');
    const glow = document.querySelector('.hero-bg-glow');
    if (!hero || !glow) return;
    hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        glow.style.left = (e.clientX - rect.left - 350) + 'px';
        glow.style.top = (e.clientY - rect.top - 350) + 'px';
    });
}

// ===== PFP BANDANA GENERATOR =====
function setupPFPGenerator() {
    const canvas = document.getElementById('pfpCanvas');
    const ctx = canvas.getContext('2d');
    const wrap = document.querySelector('.pfp-canvas-wrap');
    const placeholder = document.getElementById('pfpPlaceholder');
    const fileInput = document.getElementById('pfpUpload');
    const uploadBtn = document.getElementById('pfpUploadBtn');
    const resetBtn = document.getElementById('pfpReset');
    const downloadBtn = document.getElementById('pfpDownload');
    const sizeSlider = document.getElementById('bandanaSize');
    const rotationSlider = document.getElementById('bandanaRotation');
    const flipHBtn = document.getElementById('flipH');
    const flipVBtn = document.getElementById('flipV');

    let userImage = null;
    let bandanaImage = new Image();
    bandanaImage.crossOrigin = 'anonymous';
    bandanaImage.src = 'images/bandana-overlay.png';

    // Bandana state
    let bandana = {
        x: 256, y: 320,
        size: 180,
        rotation: 0,
        flipH: false,
        flipV: false
    };

    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    function getCanvasScale() {
        return canvas.width / canvas.getBoundingClientRect().width;
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw user image
        if (userImage) {
            // Cover the canvas (crop to square)
            const imgRatio = userImage.width / userImage.height;
            let sx = 0, sy = 0, sw = userImage.width, sh = userImage.height;
            if (imgRatio > 1) {
                sx = (userImage.width - userImage.height) / 2;
                sw = userImage.height;
            } else {
                sy = (userImage.height - userImage.width) / 2;
                sh = userImage.width;
            }
            ctx.drawImage(userImage, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        } else {
            // dark bg
            ctx.fillStyle = '#12121a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw bandana overlay
        if (bandanaImage.complete && bandanaImage.naturalWidth > 0) {
            ctx.save();
            ctx.translate(bandana.x, bandana.y);
            ctx.rotate((bandana.rotation * Math.PI) / 180);
            ctx.scale(bandana.flipH ? -1 : 1, bandana.flipV ? -1 : 1);

            const aspect = bandanaImage.naturalWidth / bandanaImage.naturalHeight;
            const w = bandana.size;
            const h = w / aspect;
            ctx.drawImage(bandanaImage, -w / 2, -h / 2, w, h);
            ctx.restore();
        }
    }

    // Upload handlers
    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                userImage = img;
                placeholder.classList.add('hidden');
                wrap.classList.add('has-image');
                draw();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Click to upload
    wrap.addEventListener('click', (e) => {
        if (!userImage && !isDragging) fileInput.click();
    });
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleFile(e.target.files[0]);
    });

    // Drag and drop file
    wrap.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });
    wrap.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });

    // Bandana dragging (mouse)
    canvas.addEventListener('mousedown', (e) => {
        if (!userImage) return;
        const scale = getCanvasScale();
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * scale;
        const my = (e.clientY - rect.top) * scale;

        const aspect = bandanaImage.naturalWidth / bandanaImage.naturalHeight;
        const w = bandana.size;
        const h = w / aspect;

        const dx = mx - bandana.x;
        const dy = my - bandana.y;
        if (Math.abs(dx) < w / 2 + 20 && Math.abs(dy) < h / 2 + 20) {
            isDragging = true;
            dragOffset.x = dx;
            dragOffset.y = dy;
            e.preventDefault();
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const scale = getCanvasScale();
        const rect = canvas.getBoundingClientRect();
        bandana.x = (e.clientX - rect.left) * scale - dragOffset.x;
        bandana.y = (e.clientY - rect.top) * scale - dragOffset.y;
        draw();
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
        if (!userImage) return;
        const touch = e.touches[0];
        const scale = getCanvasScale();
        const rect = canvas.getBoundingClientRect();
        const mx = (touch.clientX - rect.left) * scale;
        const my = (touch.clientY - rect.top) * scale;

        const aspect = bandanaImage.naturalWidth / bandanaImage.naturalHeight;
        const w = bandana.size;
        const h = w / aspect;
        const dx = mx - bandana.x;
        const dy = my - bandana.y;
        if (Math.abs(dx) < w / 2 + 20 && Math.abs(dy) < h / 2 + 20) {
            isDragging = true;
            dragOffset.x = dx;
            dragOffset.y = dy;
            e.preventDefault();
        }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        const scale = getCanvasScale();
        const rect = canvas.getBoundingClientRect();
        bandana.x = (touch.clientX - rect.left) * scale - dragOffset.x;
        bandana.y = (touch.clientY - rect.top) * scale - dragOffset.y;
        draw();
    }, { passive: false });

    canvas.addEventListener('touchend', () => { isDragging = false; });

    // Sliders
    sizeSlider.addEventListener('input', () => {
        bandana.size = parseInt(sizeSlider.value);
        draw();
    });
    rotationSlider.addEventListener('input', () => {
        bandana.rotation = parseInt(rotationSlider.value);
        draw();
    });

    // Flip buttons
    flipHBtn.addEventListener('click', () => {
        bandana.flipH = !bandana.flipH;
        flipHBtn.style.borderColor = bandana.flipH ? 'var(--accent)' : '';
        draw();
    });
    flipVBtn.addEventListener('click', () => {
        bandana.flipV = !bandana.flipV;
        flipVBtn.style.borderColor = bandana.flipV ? 'var(--accent)' : '';
        draw();
    });

    // Reset
    resetBtn.addEventListener('click', () => {
        userImage = null;
        bandana = { x: 256, y: 320, size: 180, rotation: 0, flipH: false, flipV: false };
        sizeSlider.value = 180;
        rotationSlider.value = 0;
        flipHBtn.style.borderColor = '';
        flipVBtn.style.borderColor = '';
        placeholder.classList.remove('hidden');
        wrap.classList.remove('has-image');
        draw();
    });

    // Download
    downloadBtn.addEventListener('click', () => {
        if (!userImage) {
            alert('Upload an image first!');
            return;
        }
        const link = document.createElement('a');
        link.download = 'koto-pfp.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    // Initial draw
    bandanaImage.onload = () => draw();
    draw();
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    setupCopyButtons();
    setupNav();
    setupMobileMenu();
    setupSmoothScroll();
    setupScrollReveal();
    setupCursorGlow();
    setupPFPGenerator();
});
