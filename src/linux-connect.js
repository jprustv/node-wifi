var execFile = require('child_process').execFile;
var env = require('./env');

function _addConnection(ap, callback) {
  // nmcli con add type wifi ifname wlan0 con-name SSID autoconnect yes ssid SSID
  return new Promise((resolve, reject) => {
    var args = ['con', 'add', 'type', 'wifi', 'ifname', 'wlan0', 'con-name', ap.ssid, 'autoconnect', 'yes', 'ssid', ap.ssid];
    execFile('nmcli', args, { env: env }, function(err, resp) {
      // Errors from nmcli came from stdout, we test presence of 'Error: ' string
      if (resp.includes('Error: ')) {
        err = new Error(resp.replace('Error: ', ''));
        callback && callback(err);
        reject(err)
      } else resolve()
    });
  })
}

function _modifyKeyMgmt(ap, callback) {
  // nmcli con modify SSID wifi-sec.key-mgmt wpa-psk
  return new Promise((resolve, reject) => {
    args = ['con', 'modify', ap.ssid, 'wifi-sec.key-mgmt', 'wpa-psk'];
    execFile('nmcli', args, { env: env }, function(err, resp) {
      // Errors from nmcli came from stdout, we test presence of 'Error: ' string
      if (resp.includes('Error: ')) {
        err = new Error(resp.replace('Error: ', ''));
        callback && callback(err);
        reject(err)
      } else resolve()
    });
  })
}

function _modifyPassword(ap, callback) {
  // nmcli con modify SSID wifi-sec.psk "PASSWORD"
  return new Promise((resolve, reject) => {
    args = ['con', 'modify', ap.ssid, 'wifi-sec.psk', ap.password]
    execFile('nmcli', args, { env: env }, function(err, resp) {
      // Errors from nmcli came from stdout, we test presence of 'Error: ' string
      if (resp.includes('Error: ')) {
        err = new Error(resp.replace('Error: ', ''));
        callback && callback(err);
        reject(err)
      } else resolve()
    });
  })
}

function _modifyIpAddress(ap, callback) {
  // nmcli connection modify SSID ipv4.address "STATIC IP ADDRESS"
  return new Promise((resolve, reject) => {
    args = ['con', 'modify', ap.ssid, 'ipv4.address', ap.static_ip]
    execFile('nmcli', args, { env: env }, function(err, resp) {
      // Errors from nmcli came from stdout, we test presence of 'Error: ' string
      if (resp.includes('Error: ')) {
        err = new Error(resp.replace('Error: ', ''));
        callback && callback(err);
        reject(err)
      } else resolve()
    });
  })
}

function _modifyAutoconnectPriority(ap, callback) {
  // nmcli c mod con1 connection.autoconnect-priority 1
  return new Promise((resolve, reject) => {
    args = ['con', 'modify', ap.ssid, 'connection.autoconnect-priority', '1'];
    execFile('nmcli', args, { env: env }, function(err, resp) {
      // Errors from nmcli came from stdout, we test presence of 'Error: ' string
      if (resp.includes('Error: ')) {
        err = new Error(resp.replace('Error: ', ''));
        callback && callback(err);
        reject(err)
      } else resolve()
    });
  })
}

function _postNmcliCommand(ap) {
  // nmcli c mod con1 connection.autoconnect-priority 1
  return new Promise((resolve, reject) => {
    if (ap.postCommand) {
      args = ap.postCommand
      execFile('nmcli', args, { env: env }, function(err, resp) {
        resolve()
      });
    } else {
      resolve()
    }
  })
}

function _startConnection(ap) {
  // nmcli con up SSID
  return new Promise((resolve, reject) => {
    args = ['con', 'up', ap.ssid]
    execFile('nmcli', args, { env: env }, function(err, resp) {
      // Errors from nmcli came from stdout, we test presence of 'Error: ' string
      if (resp.includes('Error: ')) {
        err = new Error(resp.replace('Error: ', ''));
      }
      callback && callback(err);
      resolve()
    });
  })
}

function connectToWifi(config, ap, callback) {
  _addConnection(ap, callback).then(() => {
    _modifyKeyMgmt(ap, callback).then(() => {
      _modifyPassword(ap, callback).then(() => {
        if (ap.static_ip) {
          _modifyIpAddress(ap, callback).then(() => {
            _modifyAutoconnectPriority(ap, callback).then(() => {
              _startConnection(ap, callback)
              _postNmcliCommand(ap)
            })
          })
        } else {
          _modifyAutoconnectPriority(ap, callback).then(() => {
            _startConnection(ap, callback)
            _postNmcliCommand(ap)
          })
        }
      })
    })
  })
}

module.exports = function(config) {
  return function(ap, callback) {
    if (callback) {
      connectToWifi(config, ap, callback);
    } else {
      return new Promise(function(resolve, reject) {
        connectToWifi(config, ap, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  };
};
