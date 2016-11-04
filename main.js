var electron = require('electron')
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;

var mainWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768
    });
    mainWindow.loadURL('file://' + __dirname + '/electron.html');
    mainWindow.on('closed', function() {
        mainWindow = null;
    })
}

app.on('ready', createWindow);

app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
        app.quit();
    }
})

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow()
    }
});
