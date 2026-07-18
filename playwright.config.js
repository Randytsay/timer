import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './test/e2e',
    // Web Audio 與 WebKit 同時大量啟動時會造成不穩定，序列執行可穩定覆蓋完整矩陣。
    fullyParallel: false,
    workers: 1,
    reporter: 'list',
    use: {
        baseURL: 'http://127.0.0.1:4173',
        trace: 'retain-on-failure'
    },
    projects: [
        { name: 'iphone-se', use: { ...devices['iPhone SE'] } },
        { name: 'iphone-13', use: { ...devices['iPhone 13'] } },
        { name: 'pixel-7', use: { ...devices['Pixel 7'] } },
        { name: 'ipad-mini-portrait', use: { ...devices['iPad Mini'] } },
        { name: 'ipad-portrait', use: { ...devices['iPad Pro 11'] } },
        { name: 'ipad-landscape', use: { ...devices['iPad Pro 11'], isLandscape: true } },
        {
            name: 'desktop-1366',
            use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } }
        },
        {
            name: 'desktop-1920',
            use: { ...devices['Desktop Safari'], viewport: { width: 1920, height: 1080 } }
        }
    ],
    webServer: {
        command: 'python3 -m http.server 4173 --bind 127.0.0.1',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI
    }
});
