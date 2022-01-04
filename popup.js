const pullBranches = [];
let pullFromRepository = '';

chrome.extension.onRequest.addListener(function(links) {
    // Reverse the links so master comes first, then latest stable down to oldest.
    links.reverse();
    for (const index in links) {
        const container = $(links[index]);
        if (container.text().indexOf('Pull') >= 0) {
            if (container.text().indexOf('Diff URL') >= 0) {
                continue;
            }
            if (container.text().indexOf('from Repository') >= 0) {
                pullFromRepository = $(container[2]).text().trim();
            } else {
                const parts = $(container[0]).text().trim().split(" ");
                let version = null;
                for (const i in parts) {
                    if (parts[i].length > 0 && parts[i] !== 'Pull' && parts[i] !== 'Branch:') {
                        version = parts[i].toLowerCase();
                        version = version.replace(".", "");
                    }
                }
                if (version !== null) {
                    pullBranches[version] = $(container[2]).text().trim();
                    let versionText = version;
                    if (version !== 'master') {
                        versionText = 'MOODLE_' + version + '_STABLE';
                    }
                    const buttonDiv = $('<div class="form-group text-center"/>');
                    const buttonHtml = '<button class="btn btn-default btn-block" id="copy-' + version +
                        '" data-version="' + version + '">' + versionText + '</button>';
                    const button = $(buttonHtml);
                    buttonDiv.html(button);
                    // Append this button to the form.
                    buttonDiv.appendTo('#pull-form');
                    // Add event listener to button.
                    button.click(function(e) {
                        e.preventDefault();
                        generatePullCommand(this);
                    });
                }
            }
        }
    }
});

function generatePullCommand(button) {
    const version = $(button).data('version');
    const branch = $(button).text();
    const commandType = parseInt(document.getElementById('command-type').value);
    let result;
    switch (commandType) {
        case 1:
            result = `git fetch ${pullFromRepository} ${pullBranches[version]}`;
            break;
        case 2:
            result = `${pullFromRepository} ${pullBranches[version]}`
            break;
        default:
            result = `git checkout ${branch} && git pull ${pullFromRepository} ${pullBranches[version]}`;
            break;
    }
    const commandText = $("#git-command");
    commandText.val(result);
    commandText.focus();
    document.execCommand('SelectAll');
    document.execCommand("Copy", false, null);
    console.log("Git pull command '" + result + "' has been copied to the clipboard.");
    window.close();
}

$(document).ready(function() {
    chrome.windows.getCurrent(function (currentWindow) {
        chrome.tabs.query({active: true, windowId: currentWindow.id},
            function(activeTabs) {
                chrome.tabs.executeScript(
                    activeTabs[0].id, {file: 'send_links.js', allFrames: true});
            });
    });
});
