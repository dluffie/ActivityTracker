// =============================================
// Presentation — Slide Navigation
// =============================================

let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;

function updateSlide(direction) {
    // Remove active/exit classes
    slides[currentSlide].classList.remove('active');
    
    if (direction === 'next') {
        slides[currentSlide].classList.add('exit-left');
        setTimeout(() => slides[currentSlide - 1]?.classList.remove('exit-left'), 500);
    }

    // Update counter
    document.getElementById('currentSlide').textContent = currentSlide + 1;

    // Update progress bar
    const progress = ((currentSlide) / (totalSlides - 1)) * 100;
    document.getElementById('progressFill').style.width = progress + '%';

    // Show active slide
    slides[currentSlide].classList.add('active');
}

function nextSlide() {
    if (currentSlide < totalSlides - 1) {
        slides[currentSlide].classList.remove('active');
        slides[currentSlide].classList.add('exit-left');
        currentSlide++;
        slides[currentSlide].classList.remove('exit-left');
        slides[currentSlide].classList.add('active');
        
        // Cleanup previous
        setTimeout(() => {
            if (currentSlide > 0) slides[currentSlide - 1].classList.remove('exit-left');
        }, 500);
        
        updateUI();
    }
}

function prevSlide() {
    if (currentSlide > 0) {
        slides[currentSlide].classList.remove('active');
        currentSlide--;
        slides[currentSlide].classList.remove('exit-left');
        slides[currentSlide].classList.add('active');
        updateUI();
    }
}

function updateUI() {
    document.getElementById('currentSlide').textContent = currentSlide + 1;
    const progress = ((currentSlide) / (totalSlides - 1)) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
    }
});

// Touch swipe support
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > 60) {
        if (diff > 0) {
            nextSlide();
        } else {
            prevSlide();
        }
    }
}, { passive: true });

// Initialize
updateUI();
