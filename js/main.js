// 移动端菜单切换
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    // 点击导航链接后关闭菜单（移动端）
    const navLinkItems = document.querySelectorAll('.nav-links a');
    navLinkItems.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                navLinks.classList.remove('active');
            }
        });
    });

    // 表单提交处理（Formspree）
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            // 检查是否配置了 Formspree ID
            const formAction = contactForm.getAttribute('action');
            if (formAction.includes('YOUR_FORM_ID')) {
                e.preventDefault();
                alert('⚠️ 请先配置 Formspree 表单 ID！\n\n1. 访问 https://formspree.io/ 注册\n2. 创建新表单获取 ID\n3. 在 contact.html 中替换 YOUR_FORM_ID');
                return;
            }

            // 显示提交中状态
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '发送中...';
            submitBtn.disabled = true;

            // Formspree 会处理实际提交
            // 这里只是添加用户体验
        });
    }

    // 平滑滚动（如果有锚点链接）
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // 添加页面加载动画
    const fadeElements = document.querySelectorAll('.feature-card, .product-card, .service-card');
    fadeElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
        
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 100);
    });
});

// 控制台欢迎信息
console.log('%c 欢迎访问公司官网 ', 'background: #007bff; color: white; padding: 10px; font-size: 16px;');
console.log('如有合作意向，请访问联系我们页面 📧');
