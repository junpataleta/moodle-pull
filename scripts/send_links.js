var links = [].slice.apply(document.querySelectorAll('#customfield-tabs .property-list .item .wrap'));

links = links.map(function(element) {
    return element.innerHTML;
});

chrome.runtime.sendMessage(links);
