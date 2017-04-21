var links = [].slice.apply(document.getElementsByClassName('wrap'));

links = links.map(function(element) {
    return element.innerHTML;
});

chrome.extension.sendRequest(links);
