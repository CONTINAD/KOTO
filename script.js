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

// ===== CHROMA KEY (GREEN SCREEN REMOVAL) =====
function chromaKey(img) {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const cx = c.getContext('2d');
    cx.drawImage(img, 0, 0);
    const imageData = cx.getImageData(0, 0, c.width, c.height);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const greenDom = g - Math.max(r, b);
        if (greenDom > 40 && g > 100) {
            d[i + 3] = 0;
        } else if (greenDom > 15 && g > 80) {
            const alpha = Math.max(0, 255 - (greenDom - 15) * 10);
            d[i + 3] = Math.min(d[i + 3], alpha);
            d[i + 1] = Math.min(g, Math.max(r, b) + 10);
        }
    }
    cx.putImageData(imageData, 0, 0);
    const clean = new Image();
    clean.src = c.toDataURL('image/png');
    return new Promise(r => { clean.onload = () => r(clean); });
}

// ===== FACE-API.JS MODEL LOADER =====
let modelsLoaded = false;
async function loadFaceModels() {
    if (modelsLoaded) return;
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
}

// ===== PFP BANDANA GENERATOR (AI-POWERED) =====
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
    let bandanaClean = null;

    const bandanaRaw = new Image();
    bandanaRaw.src = 'images/bandana-overlay.png';
    bandanaRaw.onload = async () => {
        bandanaClean = await chromaKey(bandanaRaw);
        draw();
    };

    // Bandana state
    let bandana = { x: 256, y: 380, size: 170, rotation: -8, flipH: false, flipV: false };
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    function getCanvasScale() {
        return canvas.width / canvas.getBoundingClientRect().width;
    }

    function setStatus(msg) {
        if (statusEl) statusEl.textContent = msg;
    }

    // ===== AI FACE DETECTION WITH FACE-API.JS =====
    async function detectFaceAI(imgElement) {
        try {
            setStatus('🧠 Loading AI model...');
            await loadFaceModels();

            setStatus('🔍 AI scanning face...');

            // face-api needs an image/canvas element to detect from
            // Create a temp canvas at the image's natural resolution
            const tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = imgElement.naturalWidth;
            tmpCanvas.height = imgElement.naturalHeight;
            const tmpCtx = tmpCanvas.getContext('2d');
            tmpCtx.drawImage(imgElement, 0, 0);

            const detection = await faceapi
                .detectSingleFace(tmpCanvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 }))
                .withFaceLandmarks();

            if (detection) {
                const landmarks = detection.landmarks;
                const jaw = landmarks.getJawOutline(); // 17 points along jawline
                const nose = landmarks.getNose();

                // Key points
                const leftJaw = jaw[0];       // left side of face
                const rightJaw = jaw[16];     // right side of face
                const chin = jaw[8];          // bottom of chin
                const leftMid = jaw[3];       // left middle jaw
                const rightMid = jaw[13];     // right middle jaw

                // Face width from jaw endpoints
                const faceWidth = Math.sqrt(
                    (rightJaw.x - leftJaw.x) ** 2 +
                    (rightJaw.y - leftJaw.y) ** 2
                );

                // Face angle from jaw tilt
                const faceAngle = Math.atan2(
                    rightJaw.y - leftJaw.y,
                    rightJaw.x - leftJaw.x
                ) * (180 / Math.PI);

                // Bandana center: just below chin
                const bandanaCenterX = chin.x;
                const bandanaCenterY = chin.y + faceWidth * 0.12;

                return {
                    x: bandanaCenterX,
                    y: bandanaCenterY,
                    size: faceWidth * 0.8,
                    rotation: faceAngle,
                    detected: true
                };
            }

            return null;
        } catch (err) {
            console.error('Face detection error:', err);
            return null;
        }
    }

    // ===== AUTO-PLACE BANDANA =====
    async function autoPlaceBandana(img) {
        const aiResult = await detectFaceAI(img);

        // Get canvas coordinate transform (image may be cropped to square)
        const imgRatio = img.naturalWidth / img.naturalHeight;
        let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
        if (imgRatio > 1) {
            sx = (img.naturalWidth - img.naturalHeight) / 2;
            sw = img.naturalHeight;
        } else {
            sy = (img.naturalHeight - img.naturalWidth) / 2;
            sh = img.naturalWidth;
        }
        const scale = canvas.width / sw;

        if (aiResult && aiResult.detected) {
            // Transform from image coords to canvas coords
            bandana.x = (aiResult.x - sx) * scale;
            bandana.y = (aiResult.y - sy) * scale;
            bandana.size = Math.max(60, Math.min(400, aiResult.size * scale));
            bandana.rotation = aiResult.rotation;
            bandana.flipH = false;
            bandana.flipV = false;

            sizeSlider.value = bandana.size;
            rotationSlider.value = Math.round(bandana.rotation);

            setStatus('✅ AI detected face — bandana placed! Drag to fine-tune.');
        } else {
            // Fallback: center bottom
            bandana.x = canvas.width / 2;
            bandana.y = canvas.height * 0.65;
            bandana.size = canvas.width * 0.35;
            bandana.rotation = 0;

            sizeSlider.value = bandana.size;
            rotationSlider.value = 0;

            setStatus('⚠️ No face found — placed at center. Drag to adjust.');
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

        // Draw bandana with rotation and transforms
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

    // Click canvas to upload
    wrap.addEventListener('click', (e) => {
        if (!isDragging) fileInput.click();
    });
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleFile(e.target.files[0]);
    });

    // Drag & drop file
    wrap.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });
    wrap.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });

    // ===== BANDANA DRAGGING =====
    function getHitSize() {
        const bImg = bandanaClean || bandanaRaw;
        if (!bImg) return { w: bandana.size, h: bandana.size };
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
            e.stopPropagation();
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
            e.stopPropagation();
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

    // Reset — reload KOTO demo
    resetBtn.addEventListener('click', () => {
        flipHBtn.style.borderColor = '';
        flipVBtn.style.borderColor = '';
        loadDemo();
    });

    // Download
    downloadBtn.addEventListener('click', () => {
        if (!userImage) { alert('Upload an image first!'); return; }
        const link = document.createElement('a');
        link.download = 'koto-pfp.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    // ===== DEMO PRELOAD =====
    function loadDemo() {
        const demoImg = new Image();
        demoImg.src = 'images/koto-closeup.png';
        demoImg.onload = () => {
            userImage = demoImg;
            placeholder.classList.add('hidden');
            wrap.classList.add('has-image');
            // Manually tuned position for KOTO
            bandana.x = 280; bandana.y = 400;
            bandana.size = 170; bandana.rotation = -8;
            bandana.flipH = false; bandana.flipV = false;
            sizeSlider.value = 170;
            rotationSlider.value = -8;
            setStatus('🧣 This is KOTO! Upload your own pic to get your scarf.');
            draw();
        };
    }
    loadDemo();

    // Pre-load AI models in background
    loadFaceModels().then(() => {
        console.log('Face AI models ready');
    }).catch(err => {
        console.warn('Could not preload face models:', err);
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
