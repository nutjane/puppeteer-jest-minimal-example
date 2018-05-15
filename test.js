const puppeteer = require('puppeteer');
const SECRET = require('./password');
jest.setTimeout(10000000);
describe('open pr in github repository', () => {
    var browser, page;

    beforeEach(async() => {
        browser = await puppeteer.launch({ headless: false });
        page = await browser.newPage();
    })

    afterEach (() => {
        browser.close()
    })

    test('open pull request', async () => {
        await page.goto('https://github.com/nutjane/puppeteer-jest-minimal-example');
        const title = await page.title();
        expect(title).toBe("GitHub - nutjane/puppeteer-jest-minimal-example")
        
        //go to sign-in page
        const LOGIN_TEXT_LINK = "body > div.position-relative.js-header-wrapper > header > div > div.HeaderMenu.HeaderMenu--bright.d-flex.flex-justify-between.flex-auto > div > span > div > a:nth-child(1)"
        await page.click(LOGIN_TEXT_LINK);
        expect(await page.title()).toBe("Sign in to GitHub · GitHub");

        //sign in
        const LOGIN_USERNAME_SELECTOR = '#login_field';
        const LOGIN_PASSWORD_SELECTOR = '#password';
        const LOGIN_BUTTON_SELECTOR = "#login > form > div.auth-form-body.mt-3 > input.btn.btn-primary.btn-block";
        await page.click(LOGIN_USERNAME_SELECTOR);
        await page.keyboard.type(SECRET.username);
        await page.click(LOGIN_PASSWORD_SELECTOR);
        await page.keyboard.type(SECRET.password);

        await page.click(LOGIN_BUTTON_SELECTOR);
        await page.waitForNavigation();

        //assert file name
        const FILE_SELECTOR = "#f98b4ba045c36506cc583d83ca60fa88-8b137891791fe96927ad78e64b0aad7bded08bdc"
        const fileName = await page.$eval(FILE_SELECTOR, e => e.innerHTML);
        // const fileName = await page.evaluate((sel) => {
        //     return document.querySelector(sel).getAttribute('href');
        // }, FILE_SELECTOR);
        expect(fileName).toContain("guest-book.md")


        //view guest-book file
        await page.click(FILE_SELECTOR)
        await page.waitForNavigation();
        expect(await page.title()).toContain("guest-book.md at master");

        //click pencil icon
        const PENCIL_ICON = "#js-repo-pjax-container > div.container.new-discussion-timeline.experiment-repo-nav > div.repository-content > div.file > div.file-header > div.file-actions > form.inline-form.js-update-url-with-hash > button > svg"
        await page.click(PENCIL_ICON);
        await page.waitForNavigation();

        //edit file
        const TEXTAREA = "#new_blob > div.file.js-code-editor.container-preview.show-code > div.commit-create > div > div.CodeMirror-scroll > div.CodeMirror-sizer > div > div > div"
        await page.waitForSelector(TEXTAREA);
        await page.click(TEXTAREA);
        await page.keyboard.type("hello world!");

        //propose change
        const COMMIT_TITLE_SELECTOR = "#commit-summary-input"
        const COMMIT_DESC_SELECTOR = "#commit-description-textarea"
        const COMMIT_BUTTON_SELECTOR = "#submit-file"
        await page.click(COMMIT_TITLE_SELECTOR);
        await page.keyboard.type("auto commit via puppeteer");
        await page.click(COMMIT_DESC_SELECTOR);
        await page.keyboard.type("more info, check out https://github.com/GoogleChrome/puppeteer");
        await page.click(COMMIT_BUTTON_SELECTOR);
        await page.waitForNavigation();

        //create pull request
        expect(await page.title()).toContain("Comparing");
        const CREATE_PR_BUTTON_SELECTOR = "#js-repo-pjax-container > div.container.new-discussion-timeline.experiment-repo-nav > div.repository-content > div.js-details-container.Details.compare-pr.js-compare-pr > div > button"
        await page.click(CREATE_PR_BUTTON_SELECTOR);
        
        const CREATE_PR_BUTTON_CONFIRM_SELECTOR = "#new_pull_request > div.discussion-timeline > div > div > div.form-actions > button"
        await page.click(CREATE_PR_BUTTON_CONFIRM_SELECTOR);
        await page.waitForNavigation();

        //go to pr page
        await page.goto("https://github.com/nutjane/puppeteer-jest-minimal-example/pulls");
        expect(await page.title()).toContain("Pull Requests");

        //count pr 
        const PRLIST_SELECTOR_CLASS = "js-issue-row"
        let listLength = await page.evaluate((sel) => {
            return document.getElementsByClassName(sel).length;
        }, PRLIST_SELECTOR_CLASS);
        console.log("currently it has: " + listLength + " pull requests");

        const PR_NAME_SELECTOR = "#issue_INDEX > div > div.float-left.col-9.lh-condensed.p-2 > a"

        for (let i=1; i<=listLength; i++) {
            let prNameSelector = PR_NAME_SELECTOR.replace("INDEX", i);
            const prName = await page.$eval(prNameSelector, e => e.innerHTML);
            console.log("> " + prName)
        }
        await page.screenshot({path: 'github-screenshot.png'}); //just take screenshot for no reason

        await page.waitFor(2*1000);
        await browser.close();
    })

});
