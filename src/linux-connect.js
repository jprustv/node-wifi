var execFile = require('child_process').execFile;
var env = require('./env');

function connectToWifi(config, ap, callback) {

  // nmcli con add type wifi ifname wlan0 con-name SSID autoconnect yes ssid SSID
  var args = ['con', 'add', 'type', 'wifi', 'ifname', 'wlan0', 'con-name', ap.ssid, 'autoconnect', 'yes', 'ssid', ap.ssid];

  execFile('nmcli', args, { env: env }, function(err, resp) {
    // Errors from nmcli came from stdout, we test presence of 'Error: ' string
    if (resp.includes('Error: ')) {
      err = new Error(resp.replace('Error: ', ''));
      callback && callback(err);
    } else {
      // nmcli con modify SSID wifi-sec.key-mgmt wpa-psk
      args = ['con', 'modify', ap.ssid, 'wifi-sec.key-mgmt', 'wpa-psk']
      execFile('nmcli', args, { env: env }, function(err, resp) {

        if (resp.includes('Error: ')) {
          err = new Error(resp.replace('Error: ', ''));
          callback && callback(err);
        } else {
          // nmcli con modify SSID wifi-sec.psk "PASSWORD"
          args = ['con', 'modify', ap.ssid, 'wifi-sec.psk', ap.password]

          execFile('nmcli', args, { env: env }, function(err, resp) {

            if (resp.includes('Error: ')) {
              err = new Error(resp.replace('Error: ', ''));
              callback && callback(err);
            } else {

              if (ap.static_ip) {
                // nmcli connection modify SSID ipv4.address "STATIC IP ADDRESS"
                args = ['con', 'modify', ap.ssid, 'ipv4.address', ap.static_ip]
                execFile('nmcli', args, { env: env }, function(err, resp) {
                  if (resp.includes('Error: ')) {
                    err = new Error(resp.replace('Error: ', ''));
                    callback && callback(err);
                  } else {
                    // nmcli con up SSID
                    args = ['con', 'up', ap.ssid]
                    execFile('nmcli', args, { env: env }, function(err, resp) {
                      if (resp.includes('Error: ')) {
                        err = new Error(resp.replace('Error: ', ''));
                      }
                      callback && callback(err);
                    });
                  }
                })
              } else {
                // nmcli con up SSID
                args = ['con', 'up', ap.ssid]
                execFile('nmcli', args, { env: env }, function(err, resp) {
                  if (resp.includes('Error: ')) {
                    err = new Error(resp.replace('Error: ', ''));
                  }
                  callback && callback(err);
                });
              }

            }
          });
        }
      });
    }

  });

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
