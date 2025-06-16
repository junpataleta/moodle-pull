var links = [].slice.apply(document.querySelectorAll('[data-testid$="details-group"] div[data-component-selector="jira-issue-field-heading-field-wrapper"][data-testid*="customfield"]'));

links = links.map(function(element) {
    return element.innerHTML;
});

chrome.runtime.sendMessage(links);
