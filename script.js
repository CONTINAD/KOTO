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

// ===== AI PFP GENERATOR =====
function setupPFPGenerator() {
    const canvas = document.getElementById('pfpCanvas');
    const ctx = canvas.getContext('2d');
    const wrap = document.getElementById('pfpWrap');
    const placeholder = document.getElementById('pfpPlaceholder');
    const loading = document.getElementById('pfpLoading');
    const fileInput = document.getElementById('pfpUpload');
    const uploadBtn = document.getElementById('pfpUploadBtn');
    const generateBtn = document.getElementById('pfpGenerate');
    const resetBtn = document.getElementById('pfpReset');
    const downloadBtn = document.getElementById('pfpDownload');
    const statusEl = document.getElementById('pfpStatus');

    let userImageBase64 = null;
    let resultImageUrl = null;
    let isProcessing = false;

    function setStatus(msg) {
        if (statusEl) statusEl.textContent = msg;
    }

    // Resize image to 512x512 and return base64
    function resizeImage(img) {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 512;
        const cx = c.getContext('2d');

        // Cover crop to square
        const imgRatio = img.naturalWidth / img.naturalHeight;
        let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
        if (imgRatio > 1) {
            sx = (img.naturalWidth - img.naturalHeight) / 2;
            sw = img.naturalHeight;
        } else {
            sy = (img.naturalHeight - img.naturalWidth) / 2;
            sh = img.naturalWidth;
        }
        cx.drawImage(img, sx, sy, sw, sh, 0, 0, 512, 512);
        return c.toDataURL('image/png');
    }

    // Draw image (either uploaded or result) on canvas
    function drawImage(src) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = src;
    }

    // Draw uploaded image directly
    function drawUploadedImage(img) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const imgRatio = img.naturalWidth / img.naturalHeight;
        let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
        if (imgRatio > 1) {
            sx = (img.naturalWidth - img.naturalHeight) / 2;
            sw = img.naturalHeight;
        } else {
            sy = (img.naturalHeight - img.naturalWidth) / 2;
            sh = img.naturalWidth;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    }

    // Handle file upload
    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Show uploaded image on canvas
                drawUploadedImage(img);
                placeholder.classList.add('hidden');
                wrap.classList.add('has-image');

                // Store resized base64 for API
                userImageBase64 = resizeImage(img);

                // Enable generate button
                generateBtn.disabled = false;
                downloadBtn.disabled = true;
                resultImageUrl = null;

                setStatus('📸 Image loaded — click "Add Scarf with AI" to generate!');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // ===== AI GENERATION =====
    async function generateWithAI() {
        if (!userImageBase64 || isProcessing) return;

        isProcessing = true;
        generateBtn.disabled = true;
        loading.classList.remove('hidden');
        setStatus('🧠 Sending to AI...');

        try {
            // Step 1: Start the prediction
            const startRes = await fetch('/.netlify/functions/generate-pfp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: userImageBase64 }),
            });

            const startData = await startRes.json();

            if (startData.error) {
                throw new Error(startData.error);
            }

            setStatus('⏳ AI is working on it...');

            // Step 2: Poll for result
            const predictionId = startData.id;
            let result = null;
            let attempts = 0;
            const maxAttempts = 60; // 2 minutes max

            while (attempts < maxAttempts) {
                await new Promise(r => setTimeout(r, 2000));
                attempts++;

                const checkRes = await fetch(`/.netlify/functions/check-pfp?id=${predictionId}`);
                const checkData = await checkRes.json();

                if (checkData.status === 'succeeded') {
                    result = checkData.output;
                    break;
                } else if (checkData.status === 'failed') {
                    throw new Error(checkData.error || 'AI generation failed');
                }

                // Update status with progress dots
                const dots = '.'.repeat((attempts % 3) + 1);
                setStatus(`⏳ AI is working${dots} (${attempts * 2}s)`);
            }

            if (!result) {
                throw new Error('Generation timed out');
            }

            // Step 3: Show result
            // instruct-pix2pix returns an array of output URLs
            const outputUrl = Array.isArray(result) ? result[result.length - 1] : result;
            resultImageUrl = outputUrl;

            drawImage(outputUrl);
            downloadBtn.disabled = false;
            setStatus('✅ Done! Your scarfed PFP is ready to download.');

        } catch (err) {
            console.error('AI generation error:', err);
            setStatus(`❌ Error: ${err.message}`);

            // Re-draw original
            if (userImageBase64) drawImage(userImageBase64);
        } finally {
            isProcessing = false;
            generateBtn.disabled = false;
            loading.classList.add('hidden');
        }
    }

    // ===== EVENT LISTENERS =====

    // Upload click
    wrap.addEventListener('click', () => {
        if (!isProcessing) fileInput.click();
    });
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleFile(e.target.files[0]);
    });

    // Drag & drop
    wrap.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });
    wrap.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });

    // Generate
    generateBtn.addEventListener('click', generateWithAI);

    // Reset
    resetBtn.addEventListener('click', () => {
        userImageBase64 = null;
        resultImageUrl = null;
        isProcessing = false;
        generateBtn.disabled = true;
        downloadBtn.disabled = true;
        placeholder.classList.remove('hidden');
        loading.classList.add('hidden');
        wrap.classList.remove('has-image');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#12121a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setStatus('');
    });

    // Download
    downloadBtn.addEventListener('click', async () => {
        if (resultImageUrl) {
            // If we have a URL from the API, fetch it and download
            try {
                const response = await fetch(resultImageUrl);
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = 'koto-pfp.png';
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
            } catch {
                // Fallback: download from canvas
                const link = document.createElement('a');
                link.download = 'koto-pfp.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            }
        } else {
            const link = document.createElement('a');
            link.download = 'koto-pfp.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    });

    // Init canvas bg
    ctx.fillStyle = '#12121a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
