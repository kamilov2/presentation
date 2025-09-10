/**
 * Presentation Controller
 * Handles slide navigation, charts, and user interactions
 */

class PresentationController {
    constructor() {
        this.slides = document.querySelectorAll('.slide');
        this.currentSlide = 0;
        this.totalSlides = this.slides.length;
        this.isAnimating = false;
        
        // Elements
        this.currentSlideElement = document.querySelector('.current-slide');
        this.totalSlidesElement = document.querySelector('.total-slides');
        this.prevButton = document.querySelector('.nav-button.prev');
        this.nextButton = document.querySelector('.nav-button.next');
        this.progressFill = document.querySelector('.progress-fill');
        
        // Touch handling
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        
        // Charts
        this.charts = new Map();
        
        // Performance optimization
        this.isMobile = window.innerWidth <= 768;
        this.isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
        
        // Throttle resize events
        this.resizeTimeout = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateSlideCounter();
        this.updateProgress();
        this.updateButtonStates();
        this.initCharts();
        this.loadProgress();
        
        // Show first slide
        this.showSlide(0);
    }
    
    setupEventListeners() {
        // Navigation buttons
        if (this.prevButton) {
            this.prevButton.addEventListener('click', () => this.previousSlide());
        }
        if (this.nextButton) {
            this.nextButton.addEventListener('click', () => this.nextSlide());
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Touch navigation
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
        
        // Window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Chart resize observer
        this.setupChartResizeObserver();
    }
    
    handleKeyboard(e) {
        if (this.isAnimating) return;
        
        switch (e.key) {
            case 'ArrowLeft':
            case 'PageUp':
                e.preventDefault();
                this.previousSlide();
                break;
            case 'ArrowRight':
            case 'PageDown':
            case ' ':
                e.preventDefault();
                this.nextSlide();
                break;
            case 'Home':
                e.preventDefault();
                this.goToSlide(0);
                break;
            case 'End':
                e.preventDefault();
                this.goToSlide(this.totalSlides - 1);
                break;
        }
    }
    
    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.touchStartTime = Date.now();
    }
    
    handleTouchEnd(e) {
        if (this.isAnimating) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const touchEndTime = Date.now();
        
        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;
        const deltaTime = touchEndTime - this.touchStartTime;
        
        // Only handle horizontal swipes with minimum distance and maximum time
        if (Math.abs(deltaX) > Math.abs(deltaY) && 
            Math.abs(deltaX) > 50 && 
            deltaTime < 500) {
            
            // Prevent default to avoid scrolling
            e.preventDefault();
            
            if (deltaX > 0) {
                this.previousSlide();
            } else {
                this.nextSlide();
            }
        }
    }
    
    handleResize() {
        // Throttle resize events for better performance
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        this.resizeTimeout = setTimeout(() => {
            // Update device type detection
            this.isMobile = window.innerWidth <= 768;
            this.isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
            
            // Resize charts when window resizes
            this.charts.forEach(chart => {
                if (chart && typeof chart.resize === 'function') {
                    chart.resize();
                }
            });
            
            // Update slide content for mobile
            if (this.isMobile) {
                this.optimizeForMobile();
            }
        }, 250);
    }
    
    optimizeForMobile() {
        // Reduce animation complexity on mobile
        const slides = document.querySelectorAll('.slide');
        slides.forEach(slide => {
            if (this.isMobile) {
                slide.style.transition = 'opacity 0.3s ease';
            } else {
                slide.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            }
        });
    }
    
    setupChartResizeObserver() {
        if ('ResizeObserver' in window) {
            const resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    const canvas = entry.target.querySelector('canvas');
                    if (canvas) {
                        const chart = this.charts.get(canvas.id);
                        if (chart && typeof chart.resize === 'function') {
                            chart.resize();
                        }
                    }
                }
            });
            
            // Observe all chart containers
            document.querySelectorAll('.chart-container, .progress-circle').forEach(container => {
                resizeObserver.observe(container);
            });
        }
    }
    
    nextSlide() {
        if (this.currentSlide < this.totalSlides - 1) {
            this.goToSlide(this.currentSlide + 1);
        }
    }
    
    previousSlide() {
        if (this.currentSlide > 0) {
            this.goToSlide(this.currentSlide - 1);
        }
    }
    
    goToSlide(index) {
        if (this.isAnimating || index < 0 || index >= this.totalSlides) return;
        
        this.isAnimating = true;
        
        // Disable buttons during transition
        this.updateButtonStates(true);
        
        // Hide current slide
        const currentSlideElement = this.slides[this.currentSlide];
        if (currentSlideElement) {
            currentSlideElement.classList.remove('active');
            currentSlideElement.classList.add('exit');
        }
        
        // Update state
        this.currentSlide = index;
        
        // Show new slide with delay for smooth transition
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const newSlideElement = this.slides[this.currentSlide];
                if (newSlideElement) {
                    newSlideElement.classList.remove('exit');
                    newSlideElement.classList.add('active');
                }
                
                this.updateProgress();
                this.updateSlideCounter();
                this.saveProgress();
                
                // Re-enable buttons after transition
                setTimeout(() => {
                    this.isAnimating = false;
                    this.updateButtonStates();
                    
                    // Focus management for accessibility
                    if (newSlideElement) {
                        newSlideElement.focus();
                    }
                }, 600);
            });
        });
    }
    
    showSlide(index) {
        // Hide all slides
        this.slides.forEach((slide, i) => {
            slide.classList.remove('active', 'exit');
            if (i === index) {
                slide.classList.add('active');
            }
        });
        
        this.currentSlide = index;
        this.updateProgress();
        this.updateSlideCounter();
        this.updateButtonStates();
    }
    
    updateProgress() {
        if (this.progressFill) {
            const percentage = ((this.currentSlide + 1) / this.totalSlides) * 100;
            this.progressFill.style.width = `${percentage}%`;
        }
        
        // Animate progress bars in stat items
        const progressBars = document.querySelectorAll('.stat-progress .progress-bar');
        progressBars.forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.width = width;
            }, 100);
        });
    }
    
    updateSlideCounter() {
        if (this.currentSlideElement) {
            this.currentSlideElement.textContent = this.currentSlide + 1;
        }
        if (this.totalSlidesElement) {
            this.totalSlidesElement.textContent = this.totalSlides;
        }
    }
    
    updateButtonStates(disabled = false) {
        if (this.prevButton) {
            this.prevButton.disabled = disabled || this.currentSlide === 0;
            this.prevButton.classList.toggle('disabled', this.prevButton.disabled);
        }
        if (this.nextButton) {
            this.nextButton.disabled = disabled || this.currentSlide === this.totalSlides - 1;
            this.nextButton.classList.toggle('disabled', this.nextButton.disabled);
        }
    }
    
    initCharts() {
        try {
            // Skills Chart
            const skillsCanvas = document.getElementById('skillsChart');
            if (skillsCanvas && typeof Chart !== 'undefined') {
                const skillsChart = new Chart(skillsCanvas, {
                    type: 'radar',
                    data: {
                        labels: ['Kommunikatsiya', 'Metodologiya', 'Texnologiya', 'Pedagogika', 'Analitika'],
                        datasets: [{
                            label: 'Kompetensiyalar',
                            data: [90, 85, 80, 88, 82],
                            backgroundColor: 'rgba(245, 166, 35, 0.2)',
                            borderColor: 'rgb(245, 166, 35)',
                            pointBackgroundColor: 'rgb(245, 166, 35)',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            r: {
                                angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                pointLabels: { color: 'rgba(255, 255, 255, 0.7)' },
                                beginAtZero: true,
                                max: 100
                            }
                        },
                        plugins: {
                            legend: {
                                labels: { color: 'rgba(255, 255, 255, 0.7)' }
                            }
                        }
                    }
                });
                this.charts.set('skillsChart', skillsChart);
            }
            
            // Progress Charts
            const progressCharts = ['qualificationsChart', 'approachChart', 'methodologyChart', 'serviceChart'];
            progressCharts.forEach(chartId => {
                const canvas = document.getElementById(chartId);
                if (canvas && typeof Chart !== 'undefined') {
                    const chart = new Chart(canvas, {
                        type: 'doughnut',
                        data: {
                            labels: ['Bajarilgan', 'Jarayonda', 'Rejalashtirilgan'],
                            datasets: [{
                                data: [30, 45, 25],
                                backgroundColor: [
                                    'rgba(245, 166, 35, 0.8)',
                                    'rgba(255, 255, 255, 0.2)',
                                    'rgba(255, 255, 255, 0.1)'
                                ],
                                borderWidth: 0
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: { 
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        padding: 10,
                                        font: { size: 12 }
                                    }
                                }
                            }
                        }
                    });
                    this.charts.set(chartId, chart);
                }
            });
            
            // KPI Charts
            this.initKPICharts();
            
            // Tech Radar Chart
            this.initTechRadarChart();
            
            // Tab functionality
            this.initTabs();
            
        } catch (error) {
            console.warn('Chart.js not available or error initializing charts:', error);
        }
    }
    
    initKPICharts() {
        const kpiCharts = [
            { id: 'satisfactionChart', data: [95, 5], label: 'Mijoz Qoniqishi' },
            { id: 'responseTimeChart', data: [85, 15], label: 'Javob Vaqti' },
            { id: 'skillsChart2', data: [85, 15], label: 'Malaka' },
            { id: 'successChart', data: [92, 8], label: 'Muvaffaqiyat' }
        ];
        
        kpiCharts.forEach(({ id, data, label }) => {
            const canvas = document.getElementById(id);
            if (canvas && typeof Chart !== 'undefined') {
                const chart = new Chart(canvas, {
                    type: 'doughnut',
                    data: {
                        labels: [label, 'Qolgan'],
                        datasets: [{
                            data: data,
                            backgroundColor: [
                                'rgba(245, 166, 35, 0.8)',
                                'rgba(255, 255, 255, 0.1)'
                            ],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        }
                    }
                });
                this.charts.set(id, chart);
            }
        });
    }
    
    initTechRadarChart() {
        const techCanvas = document.getElementById('techRadarChart');
        if (techCanvas && typeof Chart !== 'undefined') {
            const techChart = new Chart(techCanvas, {
                type: 'radar',
                data: {
                    labels: ['AI/ML', 'Cloud', 'Mobile', 'Analytics', 'Security', 'Automation'],
                    datasets: [{
                        label: 'Texnologiya Darajasi',
                        data: [75, 90, 85, 70, 80, 65],
                        backgroundColor: 'rgba(245, 166, 35, 0.2)',
                        borderColor: 'rgb(245, 166, 35)',
                        pointBackgroundColor: 'rgb(245, 166, 35)',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            pointLabels: { color: 'rgba(255, 255, 255, 0.7)' },
                            beginAtZero: true,
                            max: 100
                        }
                    },
                    plugins: {
                        legend: {
                            labels: { color: 'rgba(255, 255, 255, 0.7)' }
                        }
                    }
                }
            });
            this.charts.set('techRadarChart', techChart);
        }
    }
    
    initTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked button and corresponding content
                button.classList.add('active');
                const targetContent = document.getElementById(targetTab);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }
    
    saveProgress() {
        try {
            localStorage.setItem('presentationProgress', this.currentSlide.toString());
        } catch (error) {
            console.warn('Could not save progress:', error);
        }
    }
    
    loadProgress() {
        try {
            const saved = localStorage.getItem('presentationProgress');
            if (saved !== null) {
                const savedSlide = parseInt(saved);
                if (!isNaN(savedSlide) && savedSlide >= 0 && savedSlide < this.totalSlides) {
                    this.currentSlide = savedSlide;
                }
            }
        } catch (error) {
            console.warn('Could not load progress:', error);
        }
    }
}

// Initialize presentation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded. Charts will not be available.');
    }
    
    // Initialize presentation controller
    window.presentation = new PresentationController();
    
    // Add loading state management
    const images = document.querySelectorAll('img');
    let loadedImages = 0;
    const totalImages = images.length;
    
    if (totalImages > 0) {
        const updateLoadingProgress = () => {
            loadedImages++;
            if (loadedImages === totalImages) {
                document.body.classList.add('loaded');
            }
        };
        
        images.forEach(img => {
            if (img.complete) {
                updateLoadingProgress();
            } else {
                img.addEventListener('load', updateLoadingProgress);
                img.addEventListener('error', updateLoadingProgress);
            }
        });
    } else {
        document.body.classList.add('loaded');
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Save progress when page becomes hidden
        if (window.presentation) {
            window.presentation.saveProgress();
        }
    }
});

// Handle beforeunload to save progress
window.addEventListener('beforeunload', () => {
    if (window.presentation) {
        window.presentation.saveProgress();
    }
});