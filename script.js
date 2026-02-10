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

// ===== PFP BANDANA GENERATOR (AUTO-DETECT) =====
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
    const statusEl = document.getElementById('pfpStatus');

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

    function setStatus(msg) {
        if (statusEl) statusEl.textContent = msg;
    }

    // ===== FACE DETECTION =====
    async function detectFace(img) {
        // Method 1: Browser FaceDetector API (Chrome/Edge)
        if ('FaceDetector' in window) {
            try {
                const detector = new FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
                const faces = await detector.detect(img);
                if (faces.length > 0) {
                    return faces[0].boundingBox;
                }
            } catch (e) {
                console.log('FaceDetector API failed, using heuristic', e);
            }
        }

        // Method 2: Smart heuristic - analyze skin tone regions
        return detectFaceHeuristic(img);
    }

    function detectFaceHeuristic(img) {
        // Use a temporary canvas to analyze the image
        const tmpCanvas = document.createElement('canvas');
        const tmpCtx = tmpCanvas.getContext('2d');
        const analysisSize = 200; // small for speed
        tmpCanvas.width = analysisSize;
        tmpCanvas.height = analysisSize;

        // Draw scaled image
        tmpCtx.drawImage(img, 0, 0, analysisSize, analysisSize);
        const imageData = tmpCtx.getImageData(0, 0, analysisSize, analysisSize);
        const data = imageData.data;

        // Detect skin-colored pixels and find their center of mass
        let skinX = 0, skinY = 0, skinCount = 0;
        let topSkinY = analysisSize, bottomSkinY = 0;
        let leftSkinX = analysisSize, rightSkinX = 0;

        for (let y = 0; y < analysisSize; y++) {
            for (let x = 0; x < analysisSize; x++) {
                const i = (y * analysisSize + x) * 4;
                const r = data[i], g = data[i + 1], b = data[i + 2];

                if (isSkinTone(r, g, b)) {
                    skinX += x;
                    skinY += y;
                    skinCount++;
                    if (y < topSkinY) topSkinY = y;
                    if (y > bottomSkinY) bottomSkinY = y;
                    if (x < leftSkinX) leftSkinX = x;
                    if (x > rightSkinX) rightSkinX = x;
                }
            }
        }

        if (skinCount > 100) {
            // Scale back to original image coordinates
            const scaleX = img.naturalWidth / analysisSize;
            const scaleY = img.naturalHeight / analysisSize;

            const centerX = (skinX / skinCount) * scaleX;
            const width = (rightSkinX - leftSkinX) * scaleX;
            const height = (bottomSkinY - topSkinY) * scaleY;
            const top = topSkinY * scaleY;

            return {
                x: centerX - width / 2,
                y: top,
                width: width,
                height: height
            };
        }

        // Absolute fallback: assume face is center-top
        return {
            x: img.naturalWidth * 0.2,
            y: img.naturalHeight * 0.1,
            width: img.naturalWidth * 0.6,
            height: img.naturalHeight * 0.6
        };
    }

    function isSkinTone(r, g, b) {
        // Multiple skin tone detection rules for diversity
        // Rule 1: RGB-based
        const rgbSkin = r > 80 && g > 40 && b > 20 &&
            r > g && r > b &&
            (r - g) > 10 &&
            Math.abs(r - g) < 120 &&
            r - b > 20;

        // Rule 2: Normalized RGB
        const total = r + g + b;
        if (total === 0) return false;
        const nr = r / total, ng = g / total;
        const normalizedSkin = nr > 0.35 && nr < 0.55 && ng > 0.25 && ng < 0.42;

        // Rule 3: YCbCr space (handles darker skin tones better)
        const y = 0.299 * r + 0.587 * g + 0.114 * b;
        const cb = 128 - 0.169 * r - 0.331 * g + 0.5 * b;
        const cr = 128 + 0.5 * r - 0.419 * g - 0.081 * b;
        const ycbcrSkin = y > 40 && cb > 77 && cb < 127 && cr > 133 && cr < 173;

        return rgbSkin || normalizedSkin || ycbcrSkin;
    }

    async function autoPlaceBandana(img) {
        setStatus('🔍 Detecting face...');

        const faceBox = await detectFace(img);

        if (faceBox) {
            // Get canvas-relative coordinates
            const imgRatio = img.naturalWidth / img.naturalHeight;
            let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
            if (imgRatio > 1) {
                sx = (img.naturalWidth - img.naturalHeight) / 2;
                sw = img.naturalHeight;
            } else {
                sy = (img.naturalHeight - img.naturalWidth) / 2;
                sh = img.naturalWidth;
            }

            // Transform face coordinates to canvas space
            const scaleToCanvas = canvas.width / sw;
            const faceCanvasX = (faceBox.x + faceBox.width / 2 - sx) * scaleToCanvas;
            const faceCanvasY = (faceBox.y - sy) * scaleToCanvas;
            const faceCanvasW = faceBox.width * scaleToCanvas;
            const faceCanvasH = faceBox.height * scaleToCanvas;

            // Position bandana at the bottom of the face (chin/neck area)
            bandana.x = faceCanvasX;
            bandana.y = faceCanvasY + faceCanvasH * 0.85;
            bandana.size = Math.max(80, Math.min(400, faceCanvasW * 0.9));
            bandana.rotation = 0;
            bandana.flipH = false;
            bandana.flipV = false;

            // Update sliders
            sizeSlider.value = bandana.size;
            rotationSlider.value = 0;

            setStatus('✅ Bandana placed! Fine-tune by dragging.');
        } else {
            // Smart default: center-bottom
            bandana.x = canvas.width / 2;
            bandana.y = canvas.height * 0.65;
            bandana.size = 180;
            setStatus('📌 Placed at default. Drag to adjust.');
        }

        draw();
    }

    // ===== DRAWING =====
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (userImage) {
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

    // ===== FILE HANDLING =====
    async function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) return;
        setStatus('⏳ Loading image...');

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = async () => {
                userImage = img;
                placeholder.classList.add('hidden');
                wrap.classList.add('has-image');
                draw(); // draw image first
                await autoPlaceBandana(img); // then auto-detect and place
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

    // ===== BANDANA DRAGGING (MOUSE) =====
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

        if (Math.abs(dx) < w / 2 + 30 && Math.abs(dy) < h / 2 + 30) {
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

    // ===== TOUCH SUPPORT =====
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

        if (Math.abs(dx) < w / 2 + 30 && Math.abs(dy) < h / 2 + 30) {
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

    // ===== CONTROLS =====
    sizeSlider.addEventListener('input', () => {
        bandana.size = parseInt(sizeSlider.value);
        draw();
    });
    rotationSlider.addEventListener('input', () => {
        bandana.rotation = parseInt(rotationSlider.value);
        draw();
    });

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
        setStatus('');
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
