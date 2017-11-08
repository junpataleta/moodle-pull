var pullBranches = [];
var pullFromRepository = '';

chrome.extension.onRequest.addListener(function(links) {
    for (var index in links) {
        var container = $(links[index]);
        if (container.text().indexOf('Pull') >= 0) {
            if (container.text().indexOf('Diff URL') >= 0) {
                continue;
            }
            if (container.text().indexOf('from Repository') >= 0) {
                pullFromRepository = $(container[2]).text().trim();
            } else {
                var parts = $(container[0]).text().split(" ");
                var version = null;
                for (var i in parts) {
                    if (parts[i].length > 0 && parts[i] !== 'Pull' && parts[i] !== 'Branch:') {
                        version = parts[i].toLowerCase();
                        version = version.replace(".", "");
                    }
                }
                if (version !== null) {
                    pullBranches[version] = $(container[2]).text().trim();
                    // Enable this copy button.
                    $("#copy-" + version).removeAttr('disabled');
                }
            }
        }
    }
});

function generatePullCommand(button) {
    var version = $(button).data('version');
    var branch = $(button).text();
    var result = 'git checkout ' + branch + ' && git pull ' + pullFromRepository + ' ' + pullBranches[version];
    $("#git-command").val(result);
    $("#git-command").focus();
    document.execCommand('SelectAll');
    document.execCommand("Copy", false, null);
    console.log("Git pull command '" + result + "' has been copied to the clipboard.");
    window.close()
}

$(document).ready(function() {
    $('button').click(function(e) {
        e.preventDefault();
        generatePullCommand(this);
    });

    chrome.windows.getCurrent(function (currentWindow) {
        chrome.tabs.query({active: true, windowId: currentWindow.id},
            function(activeTabs) {
                chrome.tabs.executeScript(
                    activeTabs[0].id, {file: 'send_links.js', allFrames: true});
            });
    });
});
