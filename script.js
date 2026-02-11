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

// ===== GREEN SCREEN REMOVAL FROM BANDANA =====
function removeCheckerboard(img) {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const cx = c.getContext('2d');
    cx.drawImage(img, 0, 0);
    const imageData = cx.getImageData(0, 0, c.width, c.height);
    const d = imageData.data;

    for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];

        // Green screen detection: green channel significantly higher than red and blue
        const greenDominance = g - Math.max(r, b);

        if (greenDominance > 40 && g > 100) {
            // Pure green → fully transparent
            d[i + 3] = 0;
        } else if (greenDominance > 15 && g > 80) {
            // Edge pixels — partial transparency for anti-aliasing
            const alpha = Math.max(0, 255 - (greenDominance - 15) * 10);
            d[i + 3] = Math.min(d[i + 3], alpha);
            // Remove green spill from edge pixels
            d[i + 1] = Math.min(g, Math.max(r, b) + 10);
        }
    }

    cx.putImageData(imageData, 0, 0);

    const cleanImg = new Image();
    cleanImg.src = c.toDataURL('image/png');
    return new Promise(resolve => {
        cleanImg.onload = () => resolve(cleanImg);
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
    const statusEl = document.getElementById('pfpStatus');

    let userImage = null;
    let bandanaClean = null; // processed bandana with transparency

    // Load and process bandana
    const bandanaRaw = new Image();
    bandanaRaw.crossOrigin = 'anonymous';
    bandanaRaw.src = 'images/bandana-overlay.png';
    bandanaRaw.onload = async () => {
        bandanaClean = await removeCheckerboard(bandanaRaw);
        draw();
    };

    // Default bandana position — tuned to sit on KOTO's neck in the demo
    const DEMO_BANDANA = {
        x: 280, y: 400,
        size: 170,
        rotation: -8,
        flipH: false,
        flipV: false
    };

    let bandana = { ...DEMO_BANDANA };

    // Auto-load KOTO dog as demo on page load
    function loadDemo() {
        const demoImg = new Image();
        demoImg.crossOrigin = 'anonymous';
        demoImg.src = 'images/koto-closeup.png';
        demoImg.onload = () => {
            userImage = demoImg;
            placeholder.classList.add('hidden');
            wrap.classList.add('has-image');
            bandana = { ...DEMO_BANDANA };
            sizeSlider.value = bandana.size;
            rotationSlider.value = bandana.rotation;
            setStatus('🧣 This is KOTO! Upload your own pic to get your scarf.');
            draw();
        };
    }
    loadDemo();

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
        // Try browser's FaceDetector API (Chrome/Edge)
        if ('FaceDetector' in window) {
            try {
                const detector = new FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
                const faces = await detector.detect(img);
                if (faces.length > 0) {
                    return { box: faces[0].boundingBox, method: 'api' };
                }
            } catch (e) {
                console.log('FaceDetector failed:', e);
            }
        }

        // Fallback: find the dominant subject area using edge/contrast detection
        return { box: findSubjectArea(img), method: 'heuristic' };
    }

    function findSubjectArea(img) {
        const size = 150;
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const cx = c.getContext('2d');
        cx.drawImage(img, 0, 0, size, size);
        const data = cx.getImageData(0, 0, size, size).data;

        // Find the vertical center of brightness/contrast changes
        // This usually corresponds to where the face/subject is
        let colIntensity = new Array(size).fill(0);
        let rowIntensity = new Array(size).fill(0);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4;
                const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
                // Weight center pixels more heavily (subjects are usually centered)
                const centerWeight = 1 + 2 * Math.exp(-((x - size / 2) ** 2 + (y - size / 2) ** 2) / (size * size * 0.15));
                colIntensity[x] += brightness * centerWeight;
                rowIntensity[y] += brightness * centerWeight;
            }
        }

        // Find the peak region (highest intensity = likely the subject)
        let peakX = size / 2, peakY = size * 0.35;
        let maxRow = 0;
        for (let y = Math.floor(size * 0.1); y < Math.floor(size * 0.7); y++) {
            if (rowIntensity[y] > maxRow) {
                maxRow = rowIntensity[y];
                peakY = y;
            }
        }

        const scale = img.naturalWidth / size;
        // Estimate face as the center ~40% of image, near the peak
        const faceW = img.naturalWidth * 0.45;
        const faceH = img.naturalHeight * 0.45;
        return {
            x: (img.naturalWidth - faceW) / 2,
            y: peakY * scale - faceH * 0.2,
            width: faceW,
            height: faceH
        };
    }

    async function autoPlaceBandana(img) {
        setStatus('🔍 Detecting face...');

        const result = await detectFace(img);
        const faceBox = result.box;

        // Transform face coords to canvas coords (accounting for square crop)
        const imgRatio = img.naturalWidth / img.naturalHeight;
        let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
        if (imgRatio > 1) {
            sx = (img.naturalWidth - img.naturalHeight) / 2;
            sw = img.naturalHeight;
        } else {
            sy = (img.naturalHeight - img.naturalWidth) / 2;
            sh = img.naturalWidth;
        }

        const scaleToCanvas = canvas.width / sw;
        const faceCX = (faceBox.x + faceBox.width / 2 - sx) * scaleToCanvas;
        const faceCY = (faceBox.y - sy) * scaleToCanvas;
        const faceW = faceBox.width * scaleToCanvas;
        const faceH = faceBox.height * scaleToCanvas;

        // Place bandana at the chin/neck — bottom of face box
        bandana.x = faceCX;
        bandana.y = faceCY + faceH * 0.9;
        bandana.size = Math.max(60, Math.min(350, faceW * 0.75));
        bandana.rotation = 0;
        bandana.flipH = false;
        bandana.flipV = false;

        sizeSlider.value = bandana.size;
        rotationSlider.value = 0;

        if (result.method === 'api') {
            setStatus('✅ Face detected! Bandana placed. Drag to fine-tune.');
        } else {
            setStatus('✅ Bandana placed! Drag to fine-tune.');
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

        // Draw bandana
        const bImg = bandanaClean || bandanaRaw;
        if (bImg && bImg.complete && bImg.naturalWidth > 0) {
            ctx.save();
            ctx.translate(bandana.x, bandana.y);
            ctx.rotate((bandana.rotation * Math.PI) / 180);
            ctx.scale(bandana.flipH ? -1 : 1, bandana.flipV ? -1 : 1);

            const aspect = bImg.naturalWidth / bImg.naturalHeight;
            const w = bandana.size;
            const h = w / aspect;
            ctx.drawImage(bImg, -w / 2, -h / 2, w, h);
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
                draw();
                await autoPlaceBandana(img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    wrap.addEventListener('click', (e) => {
        if (!isDragging) fileInput.click();
    });
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleFile(e.target.files[0]);
    });

    wrap.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });
    wrap.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });

    // ===== BANDANA DRAGGING =====
    function getHitSize() {
        if (!bandanaClean && !bandanaRaw) return { w: bandana.size, h: bandana.size };
        const bImg = bandanaClean || bandanaRaw;
        const aspect = bImg.naturalWidth / bImg.naturalHeight;
        return { w: bandana.size, h: bandana.size / aspect };
    }

    canvas.addEventListener('mousedown', (e) => {
        if (!userImage) return;
        const scale = getCanvasScale();
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * scale;
        const my = (e.clientY - rect.top) * scale;
        const { w, h } = getHitSize();
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

    // Touch
    canvas.addEventListener('touchstart', (e) => {
        if (!userImage) return;
        const touch = e.touches[0];
        const scale = getCanvasScale();
        const rect = canvas.getBoundingClientRect();
        const mx = (touch.clientX - rect.left) * scale;
        const my = (touch.clientY - rect.top) * scale;
        const { w, h } = getHitSize();
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
    sizeSlider.addEventListener('input', () => { bandana.size = parseInt(sizeSlider.value); draw(); });
    rotationSlider.addEventListener('input', () => { bandana.rotation = parseInt(rotationSlider.value); draw(); });

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

    resetBtn.addEventListener('click', () => {
        flipHBtn.style.borderColor = '';
        flipVBtn.style.borderColor = '';
        loadDemo(); // Reset back to KOTO demo
    });

    downloadBtn.addEventListener('click', () => {
        if (!userImage) { alert('Upload an image first!'); return; }
        const link = document.createElement('a');
        link.download = 'koto-pfp.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

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
